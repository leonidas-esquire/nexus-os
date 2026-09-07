import { describe, it, expect, vi, afterEach } from "vitest";
import { z } from "zod";
import { createTRPCUntypedClient, httpBatchLink } from "@trpc/client";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import superjson from "superjson";
import express from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { readFileSync } from "node:fs";
import { appRouter } from "./routers";
import {
  procedureContracts,
  buildOpenApiDocument,
} from "../scripts/agent-api-reference";
import { evaluateFreshness } from "../scripts/check-freshness";
import { legalMarkdown } from "../scripts/legal-markdown";
import {
  createMarketplaceDocuments,
  releaseMarkdown,
} from "./marketplace/documents";
import { RegistryError, validatePackage } from "./marketplace/package";
import { manifest, wasm } from "./marketplace/testFixtures";
import type { RegistryVersion } from "../shared/marketplace";
import type * as repository from "./marketplace/repository";

const servers: Server[] = [];
async function start(app: ReturnType<typeof express>) {
  const s = await new Promise<Server>(resolve => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
  });
  servers.push(s);
  return `http://127.0.0.1:${(s.address() as AddressInfo).port}`;
}
afterEach(async () => {
  for (const s of servers.splice(0)) {
    s.closeAllConnections();
    await new Promise<void>(resolve => s.close(() => resolve()));
  }
});

describe("executable API documentation", () => {
  it("extracts constraints and output schemas from every registered procedure", () => {
    const contracts = procedureContracts();
    expect(contracts.map(p => p.name).sort()).toEqual(
      Object.keys(appRouter._def.procedures).sort()
    );
    const upsert = contracts.find(p => p.name === "adminBlog.upsert")!;
    expect(upsert.inputSchema.properties?.title).toMatchObject({
      type: "string",
      minLength: 1,
    });
    expect(upsert.inputSchema.properties?.publishedAt).toMatchObject({
      type: "string",
      format: "date-time",
      "x-superjson-type": "Date",
    });
    const list = contracts.find(p => p.name === "adminBlog.list")!;
    expect(list.outputSchema.properties).toHaveProperty("posts");
    expect(list.outputSchema.properties).toHaveProperty("total");
    for (const p of contracts) {
      expect(p.inputSchema).toHaveProperty("$schema");
      expect(p.outputSchema).toHaveProperty("$schema");
    }
  });
  it("runs documented tRPC examples over real HTTP and rejects invalid inputs", async () => {
    const app = express();
    app.use(
      "/api/trpc",
      createExpressMiddleware({
        router: appRouter,
        createContext: ({ req, res }) => ({ req, res, user: null }),
      })
    );
    const base = await start(app);
    const client = createTRPCUntypedClient({
      links: [
        httpBatchLink({ url: base + "/api/trpc", transformer: superjson }),
      ],
    });
    expect(
      await client.query("system.health", { timestamp: Date.now() })
    ).toEqual({ ok: true });
    await expect(
      client.query("system.health", { timestamp: -1 })
    ).rejects.toThrow();
    await expect(
      client.query("adminBlog.list", { limit: 20, offset: 0 })
    ).rejects.toThrow();
  });
  it("publishes marketplace operations, actual manifest constraints, auth and error contracts", () => {
    const api = JSON.parse(
      buildOpenApiDocument({
        canonicalOrigin: "https://www.aiagents.nexus",
        apiOrigin: "https://api.aiagents.nexus",
        generatedAt: new Date().toISOString(),
      })
    );
    expect(api.info.license.url).toBeUndefined();
    expect(api.paths["/api/marketplace/publish"].post.security).toEqual([
      { ClerkBearer: [] },
    ]);
    expect(
      api.paths["/api/marketplace/review/{id}"].post.responses
    ).toHaveProperty("409");
    expect(api.components.schemas.SkillManifest.required).toEqual(
      expect.arrayContaining(["inputs", "outputs", "examples"])
    );
    expect(
      api.components.schemas.RegistryVersion.properties.sha256.pattern
    ).toBe("^[a-f0-9]{64}$");
  });
});

describe("approved content parity", () => {
  it("serves complete version-specific Markdown/HTML and removes both on revocation", async () => {
    const pkg = await validatePackage(
      {
        ...manifest,
        readme:
          'Parse a record. <script>alert("x")</script>\nAll required usage details.',
      },
      wasm
    );
    let release: RegistryVersion = {
      ...pkg,
      id: 1,
      name: manifest.name,
      version: manifest.version,
      status: "approved",
      ownerId: 1,
      publisher: "A <publisher>",
      createdAt: new Date().toISOString(),
      reviewReason: null,
    };
    const repo = {
      getRelease: vi.fn(async () => {
        if (release.status !== "approved")
          throw new RegistryError(404, "Skill version not found");
        return release;
      }),
      listReleases: vi.fn(async () =>
        release.status === "approved" ? [release] : []
      ),
    };
    const template =
      '<html><head><title>Home</title></head><body><div id="root"></div>\n<script src="/app.js"></script></body></html>';
    const app = express();
    app.use(
      createMarketplaceDocuments(
        repo as unknown as typeof repository,
        async () => template
      )
    );
    const base = await start(app);
    const md = await fetch(
      base + "/docs-markdown/marketplace/test-skill/1.0.0.md"
    );
    const text = await md.text();
    expect(md.status).toBe(200);
    expect(text).toBe(releaseMarkdown(release));
    expect(text).toContain(pkg.sha256);
    expect(text).toContain(manifest.inputs);
    expect(text).toContain(manifest.outputs);
    expect(text).toContain("50 million fuel");
    const html = await (
      await fetch(base + "/marketplace/test-skill/versions/1.0.0")
    ).text();
    expect(html).toContain(
      'rel="canonical" href="https://www.aiagents.nexus/marketplace/test-skill/versions/1.0.0"'
    );
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert");
    expect(html).toContain(pkg.sha256);
    release = { ...release, status: "revoked" };
    expect(
      (await fetch(base + "/docs-markdown/marketplace/test-skill/1.0.0.md"))
        .status
    ).toBe(404);
    expect(
      (await fetch(base + "/marketplace/test-skill/versions/1.0.0")).status
    ).toBe(404);
    expect(
      await (await fetch(base + "/docs-markdown/site/marketplace.md")).text()
    ).toContain("No approved releases");
  });
  it("preserves the complete legal policy rather than a discovery summary", () => {
    const text = legalMarkdown(
      "client/src/pages/legal/TermsOfService.tsx",
      "Terms of Service"
    );
    expect(text.length).toBeGreaterThan(10000);
    expect(text).toContain("Account Registration");
    expect(text).toContain("Governing Law");
    expect(text).not.toContain("This Markdown representation provides");
  });
});

describe("freshness gates", () => {
  const baseline = {
    now: new Date("2026-09-08"),
    expectedDigest: "a".repeat(64),
    actualDigest: "a".repeat(64),
    release: "v0.3.1",
    latestRelease: "v0.3.1",
    policy: {
      intervalDays: 90,
      initialReviewDue: "2026-12-06T00:00:00Z",
      reviews: [],
    },
  };
  it("does not invent human review and fails stale sources, releases and deadlines", () => {
    expect(evaluateFreshness(baseline)).toMatchObject({
      ok: true,
      humanReview: null,
      humanReviewCoversCurrentSources: false,
    });
    expect(
      evaluateFreshness({ ...baseline, actualDigest: "b".repeat(64) }).ok
    ).toBe(false);
    expect(evaluateFreshness({ ...baseline, latestRelease: "v0.4.0" }).ok).toBe(
      false
    );
    expect(
      evaluateFreshness({ ...baseline, now: new Date("2027-01-01") }).ok
    ).toBe(false);
  });
  it("requires evidence and binds human review to the reviewed source digest", () => {
    const reviewed = {
      ...baseline,
      policy: {
        ...baseline.policy,
        reviews: [
          {
            reviewer: "human:reviewer",
            reviewedAt: "2026-09-07T00:00:00Z",
            sourceDigest: baseline.actualDigest,
            evidenceUrl: "https://github.com/leonidas-esquire/nexus-os/pull/18",
          },
        ],
      },
    };
    expect(evaluateFreshness(reviewed)).toMatchObject({
      ok: true,
      humanReviewCoversCurrentSources: true,
    });
    expect(
      evaluateFreshness({
        ...reviewed,
        actualDigest: "b".repeat(64),
        expectedDigest: "b".repeat(64),
      }).humanReviewCoversCurrentSources
    ).toBe(false);
  });
});
