import { z } from "zod";
const nullableText = z.string().nullable();
const date = z.date();
export const userOutput = z.object({
  id: z.number().int(),
  openId: z.string(),
  name: nullableText,
  email: nullableText,
  loginMethod: nullableText,
  role: z.enum(["user", "admin"]),
  createdAt: date,
  updatedAt: date,
  lastSignedIn: date,
});
export const blogOutput = z.object({
  id: z.number().int(),
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  author: z.string(),
  category: z.enum([
    "explainer",
    "tutorial",
    "opinion",
    "case-study",
    "announcement",
    "release",
  ]),
  tags: nullableText,
  readingTimeMinutes: z.number().int(),
  featuredImageUrl: nullableText,
  featuredImageAlt: nullableText,
  ogImageOverride: nullableText,
  featured: z.boolean(),
  published: z.boolean(),
  publishedAt: date,
  scheduledPublishAt: date.nullable(),
  createdAt: date,
  updatedAt: date,
});
const stringArray = z.preprocess(
  value => value,
  z.union([z.array(z.string()), z.string()]).nullable()
);
export const showcaseOutput = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  tagline: z.string(),
  description: z.string(),
  screenshotUrl: z.string(),
  screenshots: stringArray,
  demoUrl: nullableText,
  repoUrl: nullableText,
  websiteUrl: nullableText,
  videoUrl: nullableText,
  authorName: z.string(),
  authorHandle: nullableText,
  authorEmail: z.string(),
  authorAvatar: nullableText,
  authorTwitter: nullableText,
  authorGithub: nullableText,
  featuresUsed: stringArray,
  category: z.enum([
    "ai-agents",
    "automation",
    "devops",
    "research",
    "trading",
    "other",
  ]),
  status: z.enum(["pending", "approved", "featured", "rejected"]),
  featured: z.boolean(),
  featuredOrder: z.number().int().nullable(),
  githubStars: z.number().int().nullable(),
  upvotes: z.number().int(),
  views: z.number().int(),
  submittedAt: date,
  approvedAt: date.nullable(),
  createdAt: date,
  updatedAt: date,
});
export const previewOutput = blogOutput
  .pick({ title: true, excerpt: true, content: true })
  .extend({
    author: z.string().optional(),
    category: blogOutput.shape.category.optional(),
    tags: nullableText.optional(),
    readingTimeMinutes: z.number().optional(),
    featuredImageUrl: nullableText.optional(),
    featuredImageAlt: nullableText.optional(),
  });
const success = z.object({ success: z.boolean() });
const projects = z.object({
  projects: z.array(showcaseOutput),
  total: z.number(),
});
export const apiOutputs = {
  "system.health": z.object({ ok: z.boolean() }),
  "system.notifyOwner": success,
  "auth.me": userOutput.nullable(),
  "auth.logout": success,
  "blog.list": z.array(blogOutput),
  "blog.featured": blogOutput.nullable(),
  "blog.getBySlug": blogOutput,
  "adminBlog.list": z.object({ posts: z.array(blogOutput), total: z.number() }),
  "adminBlog.getById": blogOutput,
  "adminBlog.upsert": z.object({ id: z.number(), slug: z.string() }),
  "adminBlog.delete": success,
  "adminBlog.previewToken": z.object({ token: z.string() }),
  "adminBlog.getPreview": previewOutput,
  "showcase.list": projects,
  "showcase.featured": z.array(showcaseOutput),
  "showcase.getBySlug": showcaseOutput,
  "showcase.categoryCounts": z.array(
    z.object({ category: z.string(), count: z.number() })
  ),
  "showcase.related": z.array(showcaseOutput),
  "showcase.upvote": z.object({ upvoted: z.boolean(), upvotes: z.number() }),
  "showcase.hasUpvoted": z.boolean(),
  "showcaseSubmit.submit": z.object({
    success: z.boolean(),
    id: z.string(),
    slug: z.string(),
  }),
  "adminShowcase.list": projects,
  "adminShowcase.pending": z.array(showcaseOutput),
  "adminShowcase.approve": success,
  "adminShowcase.feature": success,
  "adminShowcase.reject": success,
  "adminShowcase.delete": success,
  "adminShowcase.update": success,
};
