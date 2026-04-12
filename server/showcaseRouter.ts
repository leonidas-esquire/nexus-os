import { z } from "zod";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "./_core/trpc";
import * as showcaseDb from "./showcaseDb";
import { TRPCError } from "@trpc/server";

const CATEGORIES = [
  "ai-agents",
  "automation",
  "devops",
  "research",
  "trading",
  "other",
] as const;

const NEXUS_FEATURES = [
  "Supervisor",
  "Saga",
  "Workflow",
  "Pool",
  "Cost Controller",
  "AXIS Trust",
  "Broker",
  "WASM Sandbox",
  "Edge Deploy",
] as const;

// ─── Public showcase router ────────────────────────────────────────

export const showcasePublicRouter = router({
  list: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        sort: z.enum(["upvotes", "newest", "stars"]).optional(),
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return showcaseDb.getShowcaseProjects(input);
    }),

  featured: publicProcedure.query(async () => {
    return showcaseDb.getFeaturedProjects();
  }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const project = await showcaseDb.getShowcaseProjectBySlug(input.slug);
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      // Only show approved/featured projects publicly
      if (project.status !== "approved" && project.status !== "featured") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      // Increment views asynchronously
      showcaseDb.incrementViews(project.id).catch(() => {});
      return project;
    }),

  categoryCounts: publicProcedure.query(async () => {
    return showcaseDb.getCategoryCounts();
  }),

  related: publicProcedure
    .input(z.object({ projectId: z.string(), category: z.string() }))
    .query(async ({ input }) => {
      return showcaseDb.getRelatedProjects(input.projectId, input.category);
    }),

  upvote: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const ip =
        (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        ctx.req.socket.remoteAddress ||
        "unknown";
      return showcaseDb.toggleUpvote(input.projectId, ip);
    }),

  hasUpvoted: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const ip =
        (ctx.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        ctx.req.socket.remoteAddress ||
        "unknown";
      return showcaseDb.hasUpvoted(input.projectId, ip);
    }),
});

// ─── Submission router (public, no auth required) ──────────────────

export const showcaseSubmitRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        title: z.string().min(3).max(100),
        tagline: z.string().min(10).max(200),
        description: z.string().min(50).max(10000),
        screenshotUrl: z.string().url(),
        screenshots: z.array(z.string().url()).max(5).optional(),
        demoUrl: z.string().url().optional().or(z.literal("")),
        repoUrl: z.string().url().optional().or(z.literal("")),
        websiteUrl: z.string().url().optional().or(z.literal("")),
        videoUrl: z.string().url().optional().or(z.literal("")),
        authorName: z.string().min(1).max(100),
        authorHandle: z.string().max(50).optional().or(z.literal("")),
        authorEmail: z.string().email(),
        authorAvatar: z.string().url().optional().or(z.literal("")),
        authorTwitter: z.string().max(50).optional().or(z.literal("")),
        authorGithub: z.string().max(50).optional().or(z.literal("")),
        featuresUsed: z.array(z.string()).max(10).optional(),
        category: z.enum(CATEGORIES),
      })
    )
    .mutation(async ({ input }) => {
      // Clean empty strings to null
      const cleaned = {
        ...input,
        screenshots: input.screenshots?.length ? input.screenshots : null,
        demoUrl: input.demoUrl || null,
        repoUrl: input.repoUrl || null,
        websiteUrl: input.websiteUrl || null,
        videoUrl: input.videoUrl || null,
        authorHandle: input.authorHandle || null,
        authorAvatar: input.authorAvatar || null,
        authorTwitter: input.authorTwitter || null,
        authorGithub: input.authorGithub || null,
        featuresUsed: input.featuresUsed?.length ? input.featuresUsed : null,
      };

      const result = await showcaseDb.submitShowcaseProject(cleaned);
      return { success: true, ...result };
    }),
});

// ─── Admin showcase router ─────────────────────────────────────────

export const adminShowcaseRouter = router({
  list: adminProcedure
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      return showcaseDb.getAdminShowcaseProjects(input);
    }),

  pending: adminProcedure.query(async () => {
    return showcaseDb.getPendingProjects();
  }),

  approve: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await showcaseDb.approveProject(input.id);
      return { success: true };
    }),

  feature: adminProcedure
    .input(z.object({ id: z.string(), featured: z.boolean() }))
    .mutation(async ({ input }) => {
      await showcaseDb.featureProject(input.id, input.featured);
      return { success: true };
    }),

  reject: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await showcaseDb.rejectProject(input.id);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await showcaseDb.deleteShowcaseProject(input.id);
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        tagline: z.string().optional(),
        description: z.string().optional(),
        screenshotUrl: z.string().optional(),
        screenshots: z.array(z.string()).optional(),
        demoUrl: z.string().nullable().optional(),
        repoUrl: z.string().nullable().optional(),
        websiteUrl: z.string().nullable().optional(),
        videoUrl: z.string().nullable().optional(),
        authorName: z.string().optional(),
        category: z.enum(CATEGORIES).optional(),
        featuresUsed: z.array(z.string()).optional(),
        featured: z.boolean().optional(),
        featuredOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await showcaseDb.updateShowcaseProject(id, data);
      return { success: true };
    }),
});
