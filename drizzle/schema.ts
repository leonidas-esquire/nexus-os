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

// ─── Showcase Projects ──────────────────────────────────────────────
export const showcaseProjects = mysqlTable("showcase_projects", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  title: varchar("title", { length: 256 }).notNull(),
  tagline: varchar("tagline", { length: 512 }).notNull(),
  description: text("description").notNull(), // Markdown
  screenshotUrl: varchar("screenshotUrl", { length: 2048 }).notNull(),
  screenshots: json("screenshots"), // JSON array of additional screenshot URLs
  demoUrl: varchar("demoUrl", { length: 2048 }),
  repoUrl: varchar("repoUrl", { length: 2048 }),
  websiteUrl: varchar("websiteUrl", { length: 2048 }),
  videoUrl: varchar("videoUrl", { length: 2048 }),
  authorName: varchar("authorName", { length: 256 }).notNull(),
  authorHandle: varchar("authorHandle", { length: 128 }),
  authorEmail: varchar("authorEmail", { length: 320 }).notNull(),
  authorAvatar: varchar("authorAvatar", { length: 2048 }),
  authorTwitter: varchar("authorTwitter", { length: 128 }),
  authorGithub: varchar("authorGithub", { length: 128 }),
  featuresUsed: json("featuresUsed"), // JSON array e.g. ["Supervisor","Pool"]
  category: mysqlEnum("showcase_category", [
    "ai-agents",
    "automation",
    "devops",
    "research",
    "trading",
    "other",
  ]).notNull().default("other"),
  status: mysqlEnum("showcase_status", [
    "pending",
    "approved",
    "featured",
    "rejected",
  ]).notNull().default("pending"),
  featured: boolean("featured").notNull().default(false),
  featuredOrder: int("featuredOrder").default(0),
  githubStars: int("githubStars").default(0),
  upvotes: int("upvotes").notNull().default(0),
  views: int("views").notNull().default(0),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShowcaseProject = typeof showcaseProjects.$inferSelect;
export type InsertShowcaseProject = typeof showcaseProjects.$inferInsert;

// ─── Showcase Upvotes ───────────────────────────────────────────────
export const showcaseUpvotes = mysqlTable("showcase_upvotes", {
  id: int("id").autoincrement().primaryKey(),
  projectId: varchar("projectId", { length: 36 }).notNull(),
  userIpHash: varchar("userIpHash", { length: 128 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShowcaseUpvote = typeof showcaseUpvotes.$inferSelect;
export type InsertShowcaseUpvote = typeof showcaseUpvotes.$inferInsert;
