import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createMarketplaceRouter } from "./routes";
import { RegistryError, validatePackage } from "./package";
import { packageStore, verifiedPackage } from "./storage";
import type * as repository from "./repository";
import type { RegistryVersion } from "../../shared/marketplace";
import type { User } from "../../drizzle/schema";

import { wasm, manifest } from "./testFixtures";
const user = { id: 1, role: "user" } as User;
const admin = { id: 2, role: "admin" } as User;

describe("package validation and storage", () => {
  it("validates real WASM without executing it", async () => {
    expect((await validatePackage(manifest, wasm)).size).toBe(wasm.length);
  });
  it("rejects invalid code, unsupported ABI, traversal and paid submissions", async () => {
    await expect(
      validatePackage(manifest, Buffer.from("notwasm!!"))
    ).rejects.toThrow("Invalid WASM");
    await expect(
      validatePackage(manifest, Buffer.from("0061736d01000000", "hex"))
    ).rejects.toThrow("Export _start");
    await expect(
      validatePackage({ ...manifest, name: "../escape" }, wasm)
    ).rejects.toThrow();
    await expect(
      validatePackage({ ...manifest, pricing: "per-call" }, wasm)
    ).rejects.toThrow();
    await expect(
      validatePackage({ ...manifest, version: "01.0.0" }, wasm)
    ).rejects.toThrow();
    await expect(
      validatePackage(manifest, Buffer.alloc(16 * 1024 * 1024 + 1))
    ).rejects.toThrow("at most");
  });
  it("round-trips content-addressed storage and rejects tampering", async () => {
    const dir = await mkdtemp(join(tmpdir(), "nexus-registry-"));
    const previous = process.env.MARKETPLACE_LOCAL_STORAGE;
    process.env.MARKETPLACE_LOCAL_STORAGE = dir;
    try {
      const pkg = await validatePackage(manifest, wasm);
      const store = packageStore();
      await store.put(pkg.sha256, wasm);
      await store.put(pkg.sha256, wasm);
      expect(await verifiedPackage(store, pkg.sha256, pkg.size)).toEqual(wasm);
      await expect(
        verifiedPackage(store, pkg.sha256, pkg.size + 1)
      ).rejects.toThrow("integrity");
      await expect(store.get("../escape")).rejects.toThrow("digest");
    } finally {
      if (previous === undefined) delete process.env.MARKETPLACE_LOCAL_STORAGE;
      else process.env.MARKETPLACE_LOCAL_STORAGE = previous;
      await rm(dir, { recursive: true });
    }
  });
  it("fails closed without production object storage", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MARKETPLACE_S3_BUCKET", "");
    try {
      expect(() => packageStore()).toThrow("not configured");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});

describe("registry HTTP boundary", () => {
  let server: Server;
  let base: string;
  let release: RegistryVersion;
  const repo = {
    listReleases: vi.fn(async () => [release]),
    getRelease: vi.fn(
      async (_name: string, _version?: string, reviewer?: User) => {
        if (release.status !== "approved" && reviewer?.role !== "admin")
          throw new RegistryError(404, "Skill version not found");
        return release;
      }
    ),
    submitRelease: vi.fn(
      async (_user: User, _pkg: unknown, put: () => Promise<void>) => {
        await put();
        return { id: 1, status: "pending" as const };
      }
    ),
    reviewRelease: vi.fn(async () => {}),
  };
  beforeAll(async () => {
    const pkg = await validatePackage(manifest, wasm);
    release = {
      ...pkg,
      id: 1,
      name: manifest.name,
      version: manifest.version,
      status: "pending",
      ownerId: 1,
      publisher: "Test",
      createdAt: new Date().toISOString(),
      reviewReason: null,
    };
    const app = express();
    app.use(express.json());
    app.use(
      createMarketplaceRouter(
        async req => {
          if (req.headers.authorization === "Bearer user") return user;
          if (req.headers.authorization === "Bearer admin") return admin;
          throw new Error("Unauthenticated");
        },
        repo as typeof repository,
        () => ({ put: async () => {}, get: async () => wasm })
      )
    );
    server = await new Promise<Server>(resolve => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/marketplace`;
  });
  afterAll(
    () =>
      new Promise<void>(resolve => {
        server.close(() => resolve());
        server.closeAllConnections();
      })
  );
  it("rejects unauthenticated upload and non-admin review before processing", async () => {
    expect((await fetch(`${base}/publish`, { method: "POST" })).status).toBe(
      401
    );
    expect(
      (
        await fetch(`${base}/review`, {
          headers: { Authorization: "Bearer user" },
        })
      ).status
    ).toBe(403);
    expect(
      (
        await fetch(`${base}/review/1`, {
          method: "POST",
          headers: { Authorization: "Bearer user" },
        })
      ).status
    ).toBe(403);
    expect(repo.submitRelease).not.toHaveBeenCalled();
  });
  it("accepts multipart packages into pending review", async () => {
    const body = new FormData();
    body.append("manifest", JSON.stringify(manifest));
    body.append("wasm", new Blob([new Uint8Array(wasm)]), "skill.wasm");
    const response = await fetch(`${base}/publish`, {
      method: "POST",
      headers: { Authorization: "Bearer user" },
      body,
    });
    const data = await response.json();
    expect(response.status, JSON.stringify(data)).toBe(201);
    expect(data).toMatchObject({ status: "pending", name: "test-skill" });
  });
  it("blocks pending and revoked downloads; serves exact approved bytes", async () => {
    const url = `${base}/skills/test-skill/1.0.0/package`;
    expect((await fetch(url)).status).toBe(404);
    const review = await fetch(`${base}/review/test-skill/1.0.0/package`, {
      headers: { Authorization: "Bearer admin" },
    });
    expect(review.status).toBe(200);
    release.status = "approved";
    const response = await fetch(url);
    expect(response.status).toBe(200);
    expect(Buffer.from(await response.arrayBuffer())).toEqual(wasm);
    expect(response.headers.get("cache-control")).toBe("no-store");
    release.status = "revoked";
    expect((await fetch(url)).status).toBe(404);
  });
  it("rejects invalid review transitions at the API input boundary", async () => {
    const response = await fetch(`${base}/review/1`, {
      method: "POST",
      headers: {
        Authorization: "Bearer admin",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "paid", reason: "Unsupported action" }),
    });
    expect(response.status).toBe(400);
    expect(repo.reviewRelease).not.toHaveBeenCalled();
  });
});
