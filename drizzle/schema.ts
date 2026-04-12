import { boolean, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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

// ─── Blog Posts (v2 — Markdown-based, single-author) ──────────────
export const blogPosts = mysqlTable("blog_posts_v2", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  title: varchar("title", { length: 512 }).notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  author: varchar("author", { length: 256 }).notNull().default("Leonidas Esquire Williamson"),
  category: mysqlEnum("category", [
    "explainer",
    "tutorial",
    "opinion",
    "case-study",
    "announcement",
    "release",
  ]).notNull().default("explainer"),
  tags: text("tags"), // JSON-encoded string array, e.g. '["ai","trust"]'
  readingTimeMinutes: int("readingTimeMinutes").notNull().default(5),
  featuredImageUrl: varchar("featuredImageUrl", { length: 2048 }),
  featuredImageAlt: varchar("featuredImageAlt", { length: 512 }),
  ogImageOverride: varchar("ogImageOverride", { length: 2048 }),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  scheduledPublishAt: timestamp("scheduledPublishAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = typeof blogPosts.$inferInsert;

// ─── Blog Preview Drafts (ephemeral, token-gated) ─────────────────
export const blogPreviewDrafts = mysqlTable("blog_preview_drafts", {
  token: varchar("token", { length: 36 }).primaryKey(),
  data: json("data").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BlogPreviewDraft = typeof blogPreviewDrafts.$inferSelect;
export type InsertBlogPreviewDraft = typeof blogPreviewDrafts.$inferInsert;
