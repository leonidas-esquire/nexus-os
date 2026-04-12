import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, primaryKey, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Blog Authors ───────────────────────────────────────────────
export const blogAuthors = mysqlTable("blog_authors", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 320 }),
  bio: text("bio"),
  avatar: text("avatar"),
  twitter: varchar("twitter", { length: 100 }),
  github: varchar("github", { length: 100 }),
  linkedin: text("linkedin"),
  website: text("website"),
  authorRole: mysqlEnum("authorRole", ["contributor", "editor", "admin"]).default("contributor").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogAuthor = typeof blogAuthors.$inferSelect;
export type InsertBlogAuthor = typeof blogAuthors.$inferInsert;

// ─── Blog Tags ──────────────────────────────────────────────────
export const blogTags = mysqlTable("blog_tags", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 20 }).default("#00ff88").notNull(),
  postCount: int("postCount").default(0).notNull(),
});

export type BlogTag = typeof blogTags.$inferSelect;
export type InsertBlogTag = typeof blogTags.$inferInsert;

// ─── Blog Categories ───────────────────────────────────────────
export const blogCategories = mysqlTable("blog_categories", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 200 }).notNull().unique(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 20 }).default("#6366f1").notNull(),
  icon: varchar("icon", { length: 50 }),
  position: int("position").default(0).notNull(),
  postCount: int("postCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = typeof blogCategories.$inferInsert;

// ─── Blog Posts ─────────────────────────────────────────────────
export const blogPosts = mysqlTable("blog_posts", {
  id: varchar("id", { length: 36 }).primaryKey(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  subtitle: text("subtitle"),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  contentJson: text("contentJson"),
  coverImage: text("coverImage"),
  coverImageAlt: text("coverImageAlt"),
  ogImage: text("ogImage"),
  ogImageAlt: text("ogImageAlt"),
  ogTitle: text("ogTitle"),
  ogDescription: text("ogDescription"),
  authorId: varchar("authorId", { length: 36 }).notNull(),
  categoryId: varchar("categoryId", { length: 36 }),
  status: mysqlEnum("status", ["draft", "published", "scheduled", "archived"]).default("draft").notNull(),
  publishedAt: timestamp("publishedAt"),
  scheduledFor: timestamp("scheduledFor"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  readingTime: int("readingTime"),
  wordCount: int("wordCount"),
  canonicalUrl: text("canonicalUrl"),
  metaRobots: varchar("metaRobots", { length: 100 }).default("index,follow").notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

// ─── Blog Post Tags (junction) ─────────────────────────────────
export const blogPostTags = mysqlTable("blog_post_tags", {
  postId: varchar("postId", { length: 36 }).notNull(),
  tagId: varchar("tagId", { length: 36 }).notNull(),
}, (table) => [
  primaryKey({ columns: [table.postId, table.tagId] }),
]);

export type BlogPostTag = typeof blogPostTags.$inferSelect;

// ─── Blog Images (media library) ───────────────────────────────
export const blogImages = mysqlTable("blog_images", {
  id: varchar("id", { length: 36 }).primaryKey(),
  filename: varchar("filename", { length: 500 }).notNull(),
  originalName: varchar("originalName", { length: 500 }).notNull(),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnailUrl"),
  width: int("width"),
  height: int("height"),
  sizeBytes: int("sizeBytes"),
  mimeType: varchar("mimeType", { length: 100 }),
  altText: text("altText"),
  caption: text("caption"),
  uploadedBy: varchar("uploadedBy", { length: 36 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlogImage = typeof blogImages.$inferSelect;
export type InsertBlogImage = typeof blogImages.$inferInsert;

// ─── Blog Related Posts ─────────────────────────────────────────
export const blogRelatedPosts = mysqlTable("blog_related_posts", {
  postId: varchar("postId", { length: 36 }).notNull(),
  relatedPostId: varchar("relatedPostId", { length: 36 }).notNull(),
  position: int("position").default(0).notNull(),
}, (table) => [
  primaryKey({ columns: [table.postId, table.relatedPostId] }),
]);

export type BlogRelatedPost = typeof blogRelatedPosts.$inferSelect;

// ─── Blog Post Views ────────────────────────────────────────────
export const blogPostViews = mysqlTable("blog_post_views", {
  id: varchar("id", { length: 36 }).primaryKey(),
  postId: varchar("postId", { length: 36 }).notNull(),
  viewedAt: timestamp("viewedAt").defaultNow().notNull(),
  referrer: text("referrer"),
  userAgent: text("userAgent"),
  country: varchar("country", { length: 10 }),
});

export type BlogPostView = typeof blogPostViews.$inferSelect;
export type InsertBlogPostView = typeof blogPostViews.$inferInsert;
