import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { blogPublicRouter, adminBlogRouter } from "./blogRouter";
import { showcasePublicRouter, showcaseSubmitRouter, adminShowcaseRouter } from "./showcaseRouter";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(() => {
      return {
        success: true,
      } as const;
    }),
  }),

  blog: blogPublicRouter,
  adminBlog: adminBlogRouter,

  showcase: showcasePublicRouter,
  showcaseSubmit: showcaseSubmitRouter,
  adminShowcase: adminShowcaseRouter,
});

export type AppRouter = typeof appRouter;
