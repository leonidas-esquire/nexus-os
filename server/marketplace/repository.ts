import { and, count, desc, eq, gte, like, or } from "drizzle-orm";
import {
  marketplaceSkills as skills,
  marketplaceVersions as versions,
  marketplaceReviews as reviews,
  users,
  type User,
} from "../../drizzle/schema";
import type { RegistryVersion, SkillManifest } from "../../shared/marketplace";
import { getDb } from "../db";
import { RegistryError } from "./package";

async function database() {
  const db = await getDb();
  if (!db)
    throw new RegistryError(503, "Marketplace database is not configured");
  return db;
}
const selection = {
  release: versions,
  ownerId: skills.ownerId,
  publisher: users.name,
};
function present(row: {
  release: typeof versions.$inferSelect;
  ownerId: number;
  publisher: string | null;
}): RegistryVersion {
  const v = row.release;
  return {
    id: v.id,
    name: v.skillName,
    version: v.version,
    manifest: v.manifest,
    sha256: v.sha256,
    size: v.size,
    status: v.status,
    ownerId: row.ownerId,
    publisher: row.publisher || `Developer ${row.ownerId}`,
    createdAt: v.createdAt.toISOString(),
    reviewReason: v.reviewReason,
  };
}
export async function listReleases(options: {
  query?: string;
  ownerId?: number;
  review?: boolean;
  offset?: number;
}) {
  const db = await database();
  const q = (options.query || "").replace(/[\\%_]/g, "\\$&");
  const conditions = [
    options.ownerId !== undefined
      ? eq(skills.ownerId, options.ownerId)
      : options.review
        ? undefined
        : eq(versions.status, "approved"),
    q ? like(skills.name, `%${q}%`) : undefined,
  ];
  return (
    await db
      .select(selection)
      .from(versions)
      .innerJoin(skills, eq(versions.skillName, skills.name))
      .innerJoin(users, eq(skills.ownerId, users.id))
      .where(and(...conditions))
      .orderBy(desc(versions.id))
      .limit(50)
      .offset(options.offset || 0)
  ).map(present);
}
export async function getRelease(
  name: string,
  version?: string,
  reviewer?: User
) {
  const db = await database();
  const access =
    reviewer?.role === "admin"
      ? undefined
      : reviewer
        ? or(eq(versions.status, "approved"), eq(skills.ownerId, reviewer.id))
        : eq(versions.status, "approved");
  const rows = await db
    .select(selection)
    .from(versions)
    .innerJoin(skills, eq(versions.skillName, skills.name))
    .innerJoin(users, eq(skills.ownerId, users.id))
    .where(
      and(
        eq(skills.name, name),
        version ? eq(versions.version, version) : undefined,
        access
      )
    )
    .orderBy(desc(versions.id))
    .limit(1);
  if (!rows[0]) throw new RegistryError(404, "Skill version not found");
  return present(rows[0]);
}
export async function submitRelease(
  user: User,
  pkg: { manifest: SkillManifest; sha256: string; size: number },
  storePackage: () => Promise<void>
) {
  const db = await database();
  try {
    return await db.transaction(async tx => {
      // Serialize each publisher's submissions to enforce a cross-instance daily quota.
      await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, user.id))
        .for("update");
      const [daily] = await tx
        .select({ total: count() })
        .from(reviews)
        .where(
          and(
            eq(reviews.actorId, user.id),
            eq(reviews.action, "submitted"),
            gte(reviews.createdAt, new Date(Date.now() - 86400000))
          )
        );
      if (daily.total >= 10)
        throw new RegistryError(
          429,
          "Daily limit of 10 package submissions reached"
        );
      // An upsert followed by a row lock serializes competing claims and uploads.
      await tx
        .insert(skills)
        .values({ name: pkg.manifest.name, ownerId: user.id })
        .onDuplicateKeyUpdate({ set: { name: pkg.manifest.name } });
      const [skill] = await tx
        .select()
        .from(skills)
        .where(eq(skills.name, pkg.manifest.name))
        .for("update");
      if (skill.ownerId !== user.id)
        throw new RegistryError(
          403,
          "This skill name belongs to another developer"
        );
      const [existing] = await tx
        .select()
        .from(versions)
        .where(
          and(
            eq(versions.skillName, skill.name),
            eq(versions.version, pkg.manifest.version)
          )
        );
      if (existing)
        throw new RegistryError(
          409,
          "Version already exists. Publish a new version; releases are immutable."
        );
      await storePackage();
      const [created] = await tx
        .insert(versions)
        .values({
          skillName: skill.name,
          version: pkg.manifest.version,
          ...pkg,
        })
        .$returningId();
      await tx
        .insert(reviews)
        .values({
          versionId: created.id,
          actorId: user.id,
          action: "submitted",
        });
      return { id: created.id, status: "pending" as const };
    });
  } catch (error) {
    if (error instanceof RegistryError) throw error;
    if ((error as { cause?: { code?: string } }).cause?.code === "ER_DUP_ENTRY")
      throw new RegistryError(409, "Version already exists");
    throw error;
  }
}
export async function reviewRelease(
  user: User,
  id: number,
  action: "approved" | "rejected" | "revoked",
  reason: string
) {
  if (user.role !== "admin")
    throw new RegistryError(403, "Administrator access required");
  const db = await database();
  await db.transaction(async tx => {
    const [release] = await tx
      .select()
      .from(versions)
      .where(eq(versions.id, id))
      .for("update");
    if (!release) throw new RegistryError(404, "Version not found");
    if (
      (action === "revoked" && release.status !== "approved") ||
      (action !== "revoked" && release.status !== "pending")
    )
      throw new RegistryError(409, "Invalid review transition");
    await tx
      .update(versions)
      .set({ status: action, reviewReason: reason })
      .where(eq(versions.id, id));
    await tx
      .insert(reviews)
      .values({ versionId: id, actorId: user.id, action, reason });
  });
}
