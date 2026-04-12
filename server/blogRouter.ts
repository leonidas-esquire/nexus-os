import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "./_core/trpc";
import * as blogDb from "./blogDb";
import { TRPCError } from "@trpc/server";

const CATEGORIES = [
  "explainer",
  "tutorial",
  "opinion",
  "case-study",
  "announcement",
  "release",
] as const;

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

function estimateReadingTime(markdown: string): number {
  const text = markdown.replace(/[#*`>\[\]()!_~-]/g, "").replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 250));
}

// ─── Public blog router ────────────────────────────────────────────

export const blogPublicRouter = router({
  list: publicProcedure.query(async () => {
    return blogDb.getBlogPosts({ limit: 50 });
  }),

  featured: publicProcedure.query(async () => {
    const posts = await blogDb.getBlogPosts({ featured: true, limit: 1 });
    return posts[0] ?? null;
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const post = await blogDb.getBlogPostBySlug(input.slug);
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }
      return post;
    }),
});

// ─── Admin blog router ─────────────────────────────────────────────

export const adminBlogRouter = router({
  list: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return blogDb.getAdminBlogPosts(input);
    }),

  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const post = await blogDb.getAdminBlogPostById(input.id);
      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }
      return post;
    }),

  upsert: adminProcedure
    .input(
      z.object({
        id: z.number().optional(),
        slug: z.string().optional(),
        title: z.string().min(1),
        excerpt: z.string().min(1),
        content: z.string(),
        author: z.string().default("Leonidas Esquire Williamson"),
        category: z.enum(CATEGORIES).default("explainer"),
        tags: z.string().nullable().optional(), // JSON string
        readingTimeMinutes: z.number().optional(),
        featuredImageUrl: z.string().nullable().optional(),
        featuredImageAlt: z.string().nullable().optional(),
        ogImageOverride: z.string().nullable().optional(),
        featured: z.boolean().default(false),
        published: z.boolean().default(false),
        publishedAt: z.date().optional(),
        scheduledPublishAt: z.date().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const slug = input.slug || slugify(input.title);
      const readingTimeMinutes =
        input.readingTimeMinutes ?? estimateReadingTime(input.content);

      const id = await blogDb.upsertBlogPost({
        ...input,
        slug,
        readingTimeMinutes,
        publishedAt: input.publishedAt ?? new Date(),
        tags: input.tags ?? null,
        featuredImageUrl: input.featuredImageUrl ?? null,
        featuredImageAlt: input.featuredImageAlt ?? null,
        ogImageOverride: input.ogImageOverride ?? null,
        scheduledPublishAt: input.scheduledPublishAt ?? null,
      });

      return { id, slug };
    }),

  delete: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      console.log(
        `[Blog] Admin deleted post id=${input.id}${input.title ? ` title="${input.title}"` : ""}`
      );
      await blogDb.deleteBlogPost(input.id);
      return { success: true };
    }),

  previewToken: adminProcedure
    .input(
      z.object({
        title: z.string(),
        excerpt: z.string(),
        content: z.string(),
        author: z.string().optional(),
        category: z.enum(CATEGORIES).optional(),
        tags: z.string().nullable().optional(),
        readingTimeMinutes: z.number().optional(),
        featuredImageUrl: z.string().nullable().optional(),
        featuredImageAlt: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const token = await blogDb.createBlogPreviewDraft(input);
      return { token };
    }),

  getPreview: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const draft = await blogDb.getBlogPreviewDraft(input.token);
      if (!draft) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Preview not found or expired",
        });
      }
      return draft.data as Record<string, unknown>;
    }),
});
