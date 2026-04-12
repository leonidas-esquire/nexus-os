import { eq, desc, asc, and, sql, inArray, like, or, count } from "drizzle-orm";
import { getDb } from "./db";
import {
  blogPosts, blogTags, blogPostTags, blogAuthors,
  blogImages, blogRelatedPosts, blogPostViews, blogCategories,
  InsertBlogPost, InsertBlogTag, InsertBlogAuthor, InsertBlogImage, InsertBlogCategory,
  BlogPost, BlogTag, BlogAuthor, BlogCategory,
} from "../drizzle/schema";
import { v4 as uuid } from "uuid";

// ─── Authors ────────────────────────────────────────────────────

export async function listAuthors() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogAuthors).orderBy(asc(blogAuthors.name));
}

export async function getAuthorById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(blogAuthors).where(eq(blogAuthors.id, id)).limit(1);
  return rows[0];
}

export async function getAuthorBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(blogAuthors).where(eq(blogAuthors.slug, slug)).limit(1);
  return rows[0];
}

export async function upsertAuthor(data: InsertBlogAuthor) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!data.id) data.id = uuid();
  await db.insert(blogAuthors).values(data).onDuplicateKeyUpdate({
    set: {
      name: data.name,
      slug: data.slug,
      email: data.email ?? null,
      bio: data.bio ?? null,
      avatar: data.avatar ?? null,
      twitter: data.twitter ?? null,
      github: data.github ?? null,
      linkedin: data.linkedin ?? null,
      website: data.website ?? null,
      authorRole: data.authorRole ?? "contributor",
    },
  });
  return data.id;
}

export async function deleteAuthor(id: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(blogAuthors).where(eq(blogAuthors.id, id));
}

// ─── Tags ───────────────────────────────────────────────────────

export async function listTags() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogTags).orderBy(asc(blogTags.name));
}

export async function getTagBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(blogTags).where(eq(blogTags.slug, slug)).limit(1);
  return rows[0];
}

export async function upsertTag(data: InsertBlogTag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!data.id) data.id = uuid();
  await db.insert(blogTags).values(data).onDuplicateKeyUpdate({
    set: {
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      color: data.color ?? "#00ff88",
    },
  });
  return data.id;
}

export async function deleteTag(id: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(blogPostTags).where(eq(blogPostTags.tagId, id));
  await db.delete(blogTags).where(eq(blogTags.id, id));
}

// ─── Categories ─────────────────────────────────────────────

export async function listCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(blogCategories).orderBy(asc(blogCategories.position), asc(blogCategories.name));
}

export async function getCategoryById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(blogCategories).where(eq(blogCategories.id, id)).limit(1);
  return rows[0];
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(blogCategories).where(eq(blogCategories.slug, slug)).limit(1);
  return rows[0];
}

export async function upsertCategory(data: InsertBlogCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!data.id) data.id = uuid();
  await db.insert(blogCategories).values(data).onDuplicateKeyUpdate({
    set: {
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      color: data.color ?? "#6366f1",
      icon: data.icon ?? null,
      position: data.position ?? 0,
    },
  });
  return data.id;
}

export async function deleteCategory(id: string) {
  const db = await getDb();
  if (!db) return;
  // Unset categoryId on posts that reference this category
  await db.update(blogPosts).set({ categoryId: null }).where(eq(blogPosts.categoryId, id));
  await db.delete(blogCategories).where(eq(blogCategories.id, id));
}

export async function recalcCategoryCounts() {
  const db = await getDb();
  if (!db) return;
  const categories = await db.select().from(blogCategories);
  for (const cat of categories) {
    const [row] = await db.select({ count: count() }).from(blogPosts)
      .where(and(eq(blogPosts.categoryId, cat.id), eq(blogPosts.status, "published")));
    await db.update(blogCategories).set({ postCount: row?.count ?? 0 }).where(eq(blogCategories.id, cat.id));
  }
}

// ─── Posts ──────────────────────────────────────────────────────

export async function listPosts(opts: {
  status?: string;
  tagSlug?: string;
  authorSlug?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  const db = await getDb();
  if (!db) return { posts: [], total: 0 };

  const pageSize = opts.limit ?? 12;
  const offset = ((opts.page ?? 1) - 1) * pageSize;

  const conditions: any[] = [];

  if (opts.status) {
    conditions.push(eq(blogPosts.status, opts.status as any));
  }
  if (opts.search) {
    conditions.push(
      or(
        like(blogPosts.title, `%${opts.search}%`),
        like(blogPosts.excerpt, `%${opts.search}%`)
      )
    );
  }

  // If filtering by tag, get post IDs first
  let tagPostIds: string[] | undefined;
  if (opts.tagSlug) {
    const tag = await getTagBySlug(opts.tagSlug);
    if (!tag) return { posts: [], total: 0 };
    const ptRows = await db.select({ postId: blogPostTags.postId })
      .from(blogPostTags)
      .where(eq(blogPostTags.tagId, tag.id));
    tagPostIds = ptRows.map(r => r.postId);
    if (tagPostIds.length === 0) return { posts: [], total: 0 };
    conditions.push(inArray(blogPosts.id, tagPostIds));
  }

  // If filtering by author slug
  if (opts.authorSlug) {
    const author = await getAuthorBySlug(opts.authorSlug);
    if (!author) return { posts: [], total: 0 };
    conditions.push(eq(blogPosts.authorId, author.id));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRows, posts] = await Promise.all([
    db.select({ count: count() }).from(blogPosts).where(where),
    db.select().from(blogPosts).where(where)
      .orderBy(desc(blogPosts.createdAt))
      .limit(pageSize)
      .offset(offset),
  ]);

  return {
    posts,
    total: totalRows[0]?.count ?? 0,
  };
}

export async function getPostBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).limit(1);
  return rows[0];
}

export async function getPostById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1);
  return rows[0];
}

export async function createPost(data: InsertBlogPost): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!data.id) data.id = uuid();
  await db.insert(blogPosts).values(data);
  return data.id;
}

export async function updatePost(id: string, data: Partial<InsertBlogPost>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(blogPosts).set(data).where(eq(blogPosts.id, id));
}

export async function deletePost(id: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(blogPostTags).where(eq(blogPostTags.postId, id));
  await db.delete(blogRelatedPosts).where(
    or(eq(blogRelatedPosts.postId, id), eq(blogRelatedPosts.relatedPostId, id))
  );
  await db.delete(blogPostViews).where(eq(blogPostViews.postId, id));
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
}

// ─── Post Tags ──────────────────────────────────────────────────

export async function getPostTags(postId: string): Promise<BlogTag[]> {
  const db = await getDb();
  if (!db) return [];
  const ptRows = await db.select().from(blogPostTags).where(eq(blogPostTags.postId, postId));
  if (ptRows.length === 0) return [];
  const tagIds = ptRows.map(r => r.tagId);
  return db.select().from(blogTags).where(inArray(blogTags.id, tagIds));
}

export async function setPostTags(postId: string, tagIds: string[]) {
  const db = await getDb();
  if (!db) return;
  await db.delete(blogPostTags).where(eq(blogPostTags.postId, postId));
  if (tagIds.length > 0) {
    await db.insert(blogPostTags).values(tagIds.map(tagId => ({ postId, tagId })));
  }
  // Recalculate tag post counts
  await recalcTagCounts();
}

async function recalcTagCounts() {
  const db = await getDb();
  if (!db) return;
  const tags = await db.select().from(blogTags);
  for (const tag of tags) {
    const [row] = await db.select({ count: count() }).from(blogPostTags).where(eq(blogPostTags.tagId, tag.id));
    await db.update(blogTags).set({ postCount: row?.count ?? 0 }).where(eq(blogTags.id, tag.id));
  }
}

// ─── Related Posts ──────────────────────────────────────────────

export async function getRelatedPosts(postId: string) {
  const db = await getDb();
  if (!db) return [];
  const rels = await db.select().from(blogRelatedPosts)
    .where(eq(blogRelatedPosts.postId, postId))
    .orderBy(asc(blogRelatedPosts.position));
  if (rels.length === 0) return [];
  const ids = rels.map(r => r.relatedPostId);
  return db.select().from(blogPosts).where(inArray(blogPosts.id, ids));
}

export async function setRelatedPosts(postId: string, relatedIds: string[]) {
  const db = await getDb();
  if (!db) return;
  await db.delete(blogRelatedPosts).where(eq(blogRelatedPosts.postId, postId));
  if (relatedIds.length > 0) {
    await db.insert(blogRelatedPosts).values(
      relatedIds.map((relatedPostId, i) => ({ postId, relatedPostId, position: i }))
    );
  }
}

// ─── Images ─────────────────────────────────────────────────────

export async function listImages(opts: { page?: number; limit?: number } = {}) {
  const db = await getDb();
  if (!db) return { images: [], total: 0 };
  const pageSize = opts.limit ?? 20;
  const offset = ((opts.page ?? 1) - 1) * pageSize;
  const [totalRows, images] = await Promise.all([
    db.select({ count: count() }).from(blogImages),
    db.select().from(blogImages).orderBy(desc(blogImages.createdAt)).limit(pageSize).offset(offset),
  ]);
  return { images, total: totalRows[0]?.count ?? 0 };
}

export async function createImage(data: InsertBlogImage): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (!data.id) data.id = uuid();
  await db.insert(blogImages).values(data);
  return data.id;
}

export async function updateImage(id: string, data: Partial<InsertBlogImage>) {
  const db = await getDb();
  if (!db) return;
  await db.update(blogImages).set(data).where(eq(blogImages.id, id));
}

export async function deleteImage(id: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(blogImages).where(eq(blogImages.id, id));
}

// ─── Post Views ─────────────────────────────────────────────────

export async function trackView(postId: string, referrer?: string, userAgent?: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(blogPostViews).values({
    id: uuid(),
    postId,
    referrer: referrer ?? null,
    userAgent: userAgent ?? null,
  });
}

export async function getPostViewCount(postId: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db.select({ count: count() }).from(blogPostViews).where(eq(blogPostViews.postId, postId));
  return row?.count ?? 0;
}

export async function getViewStats(days: number = 30) {
  const db = await getDb();
  if (!db) return { totalViews: 0, postViews: [] };
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [totalRow] = await db.select({ count: count() }).from(blogPostViews)
    .where(sql`${blogPostViews.viewedAt} >= ${since}`);

  // Per-post view counts
  const postViews = await db
    .select({
      postId: blogPostViews.postId,
      views: count(),
    })
    .from(blogPostViews)
    .where(sql`${blogPostViews.viewedAt} >= ${since}`)
    .groupBy(blogPostViews.postId)
    .orderBy(desc(count()));

  return {
    totalViews: totalRow?.count ?? 0,
    postViews,
  };
}

// ─── Enrichment helpers ─────────────────────────────────────────

export async function enrichPostWithRelations(post: BlogPost) {
  const [author, tags, category] = await Promise.all([
    getAuthorById(post.authorId),
    getPostTags(post.id),
    post.categoryId ? getCategoryById(post.categoryId) : Promise.resolve(undefined),
  ]);
  return { ...post, author, tags, category };
}

export async function enrichPostsWithRelations(posts: BlogPost[]) {
  return Promise.all(posts.map(enrichPostWithRelations));
}
