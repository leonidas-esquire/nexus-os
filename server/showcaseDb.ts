import { eq, desc, and, sql, or, like, asc, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  showcaseProjects,
  showcaseUpvotes,
  ShowcaseProject,
  InsertShowcaseProject,
} from "../drizzle/schema";
import { v4 as uuid } from "uuid";
import { createHash } from "crypto";

const UPVOTE_SALT = "nexus-showcase-upvote-salt-v1";

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip + UPVOTE_SALT).digest("hex");
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

// ─── Public reads ──────────────────────────────────────────────────

export async function getShowcaseProjects(opts: {
  category?: string;
  search?: string;
  sort?: "upvotes" | "newest" | "stars";
  limit?: number;
  offset?: number;
}): Promise<{ projects: ShowcaseProject[]; total: number }> {
  const db = await getDb();
  if (!db) return { projects: [], total: 0 };

  const conditions: any[] = [
    or(
      eq(showcaseProjects.status, "approved"),
      eq(showcaseProjects.status, "featured")
    ),
  ];

  if (opts.category && opts.category !== "all") {
    conditions.push(eq(showcaseProjects.category, opts.category as any));
  }

  if (opts.search) {
    const term = `%${opts.search}%`;
    conditions.push(
      or(
        like(showcaseProjects.title, term),
        like(showcaseProjects.tagline, term),
        like(showcaseProjects.description, term)
      )
    );
  }

  const where = and(...conditions);

  let orderBy;
  switch (opts.sort) {
    case "stars":
      orderBy = desc(showcaseProjects.githubStars);
      break;
    case "newest":
      orderBy = desc(showcaseProjects.approvedAt);
      break;
    case "upvotes":
    default:
      orderBy = desc(showcaseProjects.upvotes);
      break;
  }

  const [projects, countResult] = await Promise.all([
    db
      .select()
      .from(showcaseProjects)
      .where(where)
      .orderBy(orderBy)
      .limit(opts.limit ?? 20)
      .offset(opts.offset ?? 0),
    db
      .select({ count: sql<number>`count(*)` })
      .from(showcaseProjects)
      .where(where),
  ]);

  return { projects, total: countResult[0]?.count ?? 0 };
}

export async function getFeaturedProjects(): Promise<ShowcaseProject[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(showcaseProjects)
    .where(
      and(
        eq(showcaseProjects.featured, true),
        or(
          eq(showcaseProjects.status, "approved"),
          eq(showcaseProjects.status, "featured")
        )
      )
    )
    .orderBy(asc(showcaseProjects.featuredOrder), desc(showcaseProjects.upvotes))
    .limit(6);
}

export async function getShowcaseProjectBySlug(
  slug: string
): Promise<ShowcaseProject | null> {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(showcaseProjects)
    .where(eq(showcaseProjects.slug, slug))
    .limit(1);

  return rows[0] ?? null;
}

export async function getCategoryCounts(): Promise<
  { category: string; count: number }[]
> {
  const db = await getDb();
  if (!db) return [];

  const results = await db
    .select({
      category: showcaseProjects.category,
      count: sql<number>`count(*)`,
    })
    .from(showcaseProjects)
    .where(
      or(
        eq(showcaseProjects.status, "approved"),
        eq(showcaseProjects.status, "featured")
      )
    )
    .groupBy(showcaseProjects.category);

  return results;
}

export async function incrementViews(id: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(showcaseProjects)
    .set({ views: sql`${showcaseProjects.views} + 1` })
    .where(eq(showcaseProjects.id, id));
}

// ─── Upvoting ──────────────────────────────────────────────────────

export async function toggleUpvote(
  projectId: string,
  ipAddress: string
): Promise<{ upvoted: boolean; upvotes: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const ipHash = hashIp(ipAddress);

  // Check existing upvote
  const existing = await db
    .select()
    .from(showcaseUpvotes)
    .where(
      and(
        eq(showcaseUpvotes.projectId, projectId),
        eq(showcaseUpvotes.userIpHash, ipHash)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Remove upvote
    await db
      .delete(showcaseUpvotes)
      .where(eq(showcaseUpvotes.id, existing[0].id));
    await db
      .update(showcaseProjects)
      .set({ upvotes: sql`GREATEST(${showcaseProjects.upvotes} - 1, 0)` })
      .where(eq(showcaseProjects.id, projectId));

    const updated = await db
      .select({ upvotes: showcaseProjects.upvotes })
      .from(showcaseProjects)
      .where(eq(showcaseProjects.id, projectId))
      .limit(1);

    return { upvoted: false, upvotes: updated[0]?.upvotes ?? 0 };
  } else {
    // Add upvote
    await db.insert(showcaseUpvotes).values({
      projectId,
      userIpHash: ipHash,
    });
    await db
      .update(showcaseProjects)
      .set({ upvotes: sql`${showcaseProjects.upvotes} + 1` })
      .where(eq(showcaseProjects.id, projectId));

    const updated = await db
      .select({ upvotes: showcaseProjects.upvotes })
      .from(showcaseProjects)
      .where(eq(showcaseProjects.id, projectId))
      .limit(1);

    return { upvoted: true, upvotes: updated[0]?.upvotes ?? 0 };
  }
}

export async function hasUpvoted(
  projectId: string,
  ipAddress: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const ipHash = hashIp(ipAddress);
  const rows = await db
    .select()
    .from(showcaseUpvotes)
    .where(
      and(
        eq(showcaseUpvotes.projectId, projectId),
        eq(showcaseUpvotes.userIpHash, ipHash)
      )
    )
    .limit(1);

  return rows.length > 0;
}

// ─── Submission ────────────────────────────────────────────────────

export async function submitShowcaseProject(
  data: Omit<InsertShowcaseProject, "id" | "slug" | "status" | "createdAt" | "updatedAt" | "submittedAt" | "upvotes" | "views" | "githubStars" | "featured" | "featuredOrder" | "approvedAt">
): Promise<{ id: string; slug: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = uuid();
  let slug = slugify(data.title);

  // Ensure slug uniqueness
  const existing = await db
    .select({ slug: showcaseProjects.slug })
    .from(showcaseProjects)
    .where(eq(showcaseProjects.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  await db.insert(showcaseProjects).values({
    id,
    slug,
    ...data,
    status: "pending",
    featured: false,
    featuredOrder: 0,
    upvotes: 0,
    views: 0,
    githubStars: 0,
  });

  return { id, slug };
}

// ─── Admin reads ───────────────────────────────────────────────────

export async function getAdminShowcaseProjects(opts: {
  status?: string;
  search?: string;
  limit: number;
  offset: number;
}): Promise<{ projects: ShowcaseProject[]; total: number }> {
  const db = await getDb();
  if (!db) return { projects: [], total: 0 };

  const conditions: any[] = [];

  if (opts.status && opts.status !== "all") {
    conditions.push(eq(showcaseProjects.status, opts.status as any));
  }

  if (opts.search) {
    const term = `%${opts.search}%`;
    conditions.push(
      or(
        like(showcaseProjects.title, term),
        like(showcaseProjects.authorName, term),
        like(showcaseProjects.authorHandle, term)
      )
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [projects, countResult] = await Promise.all([
    db
      .select()
      .from(showcaseProjects)
      .where(where)
      .orderBy(desc(showcaseProjects.submittedAt))
      .limit(opts.limit)
      .offset(opts.offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(showcaseProjects)
      .where(where),
  ]);

  return { projects, total: countResult[0]?.count ?? 0 };
}

export async function getPendingProjects(): Promise<ShowcaseProject[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(showcaseProjects)
    .where(eq(showcaseProjects.status, "pending"))
    .orderBy(asc(showcaseProjects.submittedAt));
}

// ─── Admin writes ──────────────────────────────────────────────────

export async function updateShowcaseProject(
  id: string,
  data: Partial<InsertShowcaseProject>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { id: _id, ...updateData } = data as any;
  await db
    .update(showcaseProjects)
    .set(updateData)
    .where(eq(showcaseProjects.id, id));
}

export async function approveProject(id: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(showcaseProjects)
    .set({ status: "approved", approvedAt: new Date() })
    .where(eq(showcaseProjects.id, id));
}

export async function featureProject(
  id: string,
  featured: boolean
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(showcaseProjects)
    .set({
      featured,
      status: featured ? "featured" : "approved",
      featuredOrder: featured ? 0 : 0,
    })
    .where(eq(showcaseProjects.id, id));
}

export async function rejectProject(id: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(showcaseProjects)
    .set({ status: "rejected" })
    .where(eq(showcaseProjects.id, id));
}

export async function deleteShowcaseProject(id: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Delete upvotes first
  await db
    .delete(showcaseUpvotes)
    .where(eq(showcaseUpvotes.projectId, id));
  // Then delete the project
  await db
    .delete(showcaseProjects)
    .where(eq(showcaseProjects.id, id));
}

// ─── Related projects ──────────────────────────────────────────────

export async function getRelatedProjects(
  projectId: string,
  category: string,
  limit: number = 3
): Promise<ShowcaseProject[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(showcaseProjects)
    .where(
      and(
        eq(showcaseProjects.category, category as any),
        or(
          eq(showcaseProjects.status, "approved"),
          eq(showcaseProjects.status, "featured")
        ),
        sql`${showcaseProjects.id} != ${projectId}`
      )
    )
    .orderBy(desc(showcaseProjects.upvotes))
    .limit(limit);
}
