import { beforeAll, afterAll, describe, expect, it } from "vitest";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { eq } from "drizzle-orm";
import { users, marketplaceReviews as reviews } from "../../drizzle/schema";
import type { User } from "../../drizzle/schema";
import { validatePackage } from "./package";
import {
  submitRelease,
  listReleases,
  getRelease,
  reviewRelease,
} from "./repository";
import { wasm, manifest } from "./testFixtures";

// Only run against an explicitly supplied disposable database. Never use production DATABASE_URL.
describe.skipIf(!process.env.TEST_MARKETPLACE_DATABASE_URL)(
  "MySQL registry persistence",
  () => {
    let pool: mysql.Pool;
    let owner: User;
    let other: User;
    let admin: User;
    const put = async () => {};
    beforeAll(async () => {
      process.env.DATABASE_URL = process.env.TEST_MARKETPLACE_DATABASE_URL;
      pool = mysql.createPool(process.env.TEST_MARKETPLACE_DATABASE_URL!);
      const db = drizzle(pool);
      await migrate(db, { migrationsFolder: "drizzle" });
      for (const [openId, role] of [
        ["registry-owner", "user"],
        ["registry-other", "user"],
        ["registry-admin", "admin"],
      ] as const) {
        await db
          .insert(users)
          .values({ openId, role })
          .onDuplicateKeyUpdate({ set: { role } });
      }
      [owner] = await db
        .select()
        .from(users)
        .where(eq(users.openId, "registry-owner"));
      [other] = await db
        .select()
        .from(users)
        .where(eq(users.openId, "registry-other"));
      [admin] = await db
        .select()
        .from(users)
        .where(eq(users.openId, "registry-admin"));
    });
    afterAll(async () => {
      await pool?.end();
    });
    it("persists ownership, immutable versions, reviews, approval and revocation", async () => {
      const pkg = await validatePackage(manifest, wasm);
      const release = await submitRelease(owner, pkg, put);
      expect(await listReleases({})).toEqual([]);
      expect((await listReleases({ ownerId: owner.id }))[0].sha256).toBe(
        pkg.sha256
      );
      await expect(getRelease(manifest.name, manifest.version)).rejects.toThrow(
        "not found"
      );
      await expect(
        submitRelease(
          other,
          { ...pkg, manifest: { ...pkg.manifest, version: "2.0.0" } },
          put
        )
      ).rejects.toThrow("another developer");
      await expect(submitRelease(owner, pkg, put)).rejects.toThrow("immutable");
      await expect(
        reviewRelease(owner, release.id, "approved", "Ready for publication")
      ).rejects.toThrow("Administrator");
      await reviewRelease(
        admin,
        release.id,
        "approved",
        "Verified command in sandbox"
      );
      expect((await getRelease(manifest.name, manifest.version)).status).toBe(
        "approved"
      );
      await expect(
        reviewRelease(admin, release.id, "approved", "Duplicate decision")
      ).rejects.toThrow("transition");
      await reviewRelease(admin, release.id, "revoked", "Removed after review");
      await expect(getRelease(manifest.name, manifest.version)).rejects.toThrow(
        "not found"
      );
      expect(
        (
          await drizzle(pool)
            .select()
            .from(reviews)
            .where(eq(reviews.versionId, release.id))
        ).map(r => r.action)
      ).toEqual(["submitted", "approved", "revoked"]);
    });
    it("rolls back ownership and metadata when storage fails", async () => {
      const pkg = await validatePackage(
        { ...manifest, name: "storage-failure" },
        wasm
      );
      await expect(
        submitRelease(owner, pkg, async () => {
          throw new Error("Storage unavailable");
        })
      ).rejects.toThrow("Storage unavailable");
      expect(
        (await listReleases({ ownerId: owner.id })).some(
          v => v.name === "storage-failure"
        )
      ).toBe(false);
      await expect(submitRelease(other, pkg, put)).resolves.toMatchObject({
        status: "pending",
      });
    });
    it("serializes racing version submissions", async () => {
      const pkg = await validatePackage(
        { ...manifest, name: "concurrent-skill" },
        wasm
      );
      const results = await Promise.allSettled([
        submitRelease(owner, pkg, put),
        submitRelease(owner, pkg, put),
      ]);
      expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
      expect(results.filter(r => r.status === "rejected")).toHaveLength(1);
    });
    it("enforces the persisted daily submission quota before storage writes", async () => {
      const pkg = await validatePackage(
        { ...manifest, name: "quota-skill" },
        wasm
      );
      for (let i = 0; i < 8; i++)
        await submitRelease(
          owner,
          { ...pkg, manifest: { ...pkg.manifest, version: `1.0.${i}` } },
          put
        );
      let writes = 0;
      await expect(
        submitRelease(
          owner,
          { ...pkg, manifest: { ...pkg.manifest, version: "2.0.0" } },
          async () => {
            writes++;
          }
        )
      ).rejects.toThrow("Daily limit");
      expect(writes).toBe(0);
    });
  }
);
