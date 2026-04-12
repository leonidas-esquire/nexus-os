import { eq, desc, and, sql, lte } from "drizzle-orm";
import { getDb } from "./db";
import {
  blogPosts,
  blogPreviewDrafts,
  BlogPost,
  InsertBlogPost,
  BlogPreviewDraft,
} from "../drizzle/schema";
import { v4 as uuid } from "uuid";

// ─── Public reads ──────────────────────────────────────────────────

export async function getBlogPosts(
  opts: { featured?: boolean; limit?: number } = {}
): Promise<BlogPost[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(blogPosts.published, true)];
  if (opts.featured) {
    conditions.push(eq(blogPosts.featured, true));
  }

  return db
    .select()
    .from(blogPosts)
    .where(and(...conditions))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(opts.limit ?? 50);
}

export async function getBlogPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.published, true)))
    .limit(1);

  return rows[0] ?? null;
}

// ─── Admin reads ───────────────────────────────────────────────────

export async function getAdminBlogPosts(opts: {
  limit: number;
  offset: number;
}): Promise<{ posts: BlogPost[]; total: number }> {
  const db = await getDb();
  if (!db) return { posts: [], total: 0 };

  const [posts, countResult] = await Promise.all([
    db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.updatedAt))
      .limit(opts.limit)
      .offset(opts.offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(blogPosts),
  ]);

  return { posts, total: countResult[0]?.count ?? 0 };
}

export async function getAdminBlogPostById(
  id: number
): Promise<BlogPost | null> {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, id))
    .limit(1);

  return rows[0] ?? null;
}

// ─── Admin writes ──────────────────────────────────────────────────

export async function upsertBlogPost(
  post: InsertBlogPost & { id?: number }
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (post.id) {
    // Update existing
    const { id, ...data } = post;
    await db.update(blogPosts).set(data).where(eq(blogPosts.id, id));
    return id;
  } else {
    // Create new
    const result = await db.insert(blogPosts).values(post);
    return Number(result[0].insertId);
  }
}

export async function deleteBlogPost(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
}

// ─── Scheduled publishing ──────────────────────────────────────────

export async function publishScheduledPosts(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const now = new Date();
  const result = await db
    .update(blogPosts)
    .set({ published: true })
    .where(
      and(
        eq(blogPosts.published, false),
        lte(blogPosts.scheduledPublishAt, now)
      )
    );

  return result[0].affectedRows ?? 0;
}

// ─── Preview drafts ────────────────────────────────────────────────

export async function createBlogPreviewDraft(
  data: Record<string, unknown>
): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const token = uuid();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await db.insert(blogPreviewDrafts).values({
    token,
    data,
    expiresAt,
  });

  return token;
}

export async function getBlogPreviewDraft(
  token: string
): Promise<BlogPreviewDraft | null> {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(blogPreviewDrafts)
    .where(eq(blogPreviewDrafts.token, token))
    .limit(1);

  const draft = rows[0];
  if (!draft) return null;

  // Check expiry
  if (new Date(draft.expiresAt) < new Date()) {
    return null;
  }

  return draft;
}
