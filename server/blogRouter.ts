import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "./_core/trpc";
import * as blogDb from "./blogDb";
import { storagePut } from "./storage";
import { v4 as uuid } from "uuid";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

function calculateReadingTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 250));
}

function countWords(content: string): number {
  const text = content.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return text.split(" ").filter(Boolean).length;
}

export const blogRouter = router({
  // ─── Authors ────────────────────────────────────────────────
  authors: router({
    list: publicProcedure.query(() => blogDb.listAuthors()),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => blogDb.getAuthorBySlug(input.slug)),
    upsert: adminProcedure
      .input(z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        slug: z.string().min(1),
        email: z.string().optional(),
        bio: z.string().optional(),
        avatar: z.string().optional(),
        twitter: z.string().optional(),
        github: z.string().optional(),
        linkedin: z.string().optional(),
        website: z.string().optional(),
        authorRole: z.enum(["contributor", "editor", "admin"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await blogDb.upsertAuthor({
          id: input.id || uuid(),
          name: input.name,
          slug: input.slug,
          email: input.email ?? null,
          bio: input.bio ?? null,
          avatar: input.avatar ?? null,
          twitter: input.twitter ?? null,
          github: input.github ?? null,
          linkedin: input.linkedin ?? null,
          website: input.website ?? null,
          authorRole: input.authorRole ?? "contributor",
        });
        return { id };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await blogDb.deleteAuthor(input.id);
        return { success: true };
      }),
  }),

  // ─── Tags ──────────────────────────────────────────────────
  tags: router({
    list: publicProcedure.query(() => blogDb.listTags()),
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(({ input }) => blogDb.getTagBySlug(input.slug)),
    upsert: adminProcedure
      .input(z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await blogDb.upsertTag({
          id: input.id || uuid(),
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          color: input.color ?? "#00ff88",
        });
        return { id };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await blogDb.deleteTag(input.id);
        return { success: true };
      }),
  }),

  // ─── Posts ─────────────────────────────────────────────────
  posts: router({
    list: publicProcedure
      .input(z.object({
        status: z.string().optional(),
        tagSlug: z.string().optional(),
        authorSlug: z.string().optional(),
        search: z.string().optional(),
        page: z.number().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(async ({ input }) => {
        const { posts, total } = await blogDb.listPosts(input ?? {});
        const enriched = await blogDb.enrichPostsWithRelations(posts);
        return { posts: enriched, total };
      }),

    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const post = await blogDb.getPostBySlug(input.slug);
        if (!post) return null;
        const enriched = await blogDb.enrichPostWithRelations(post);
        const relatedPosts = await blogDb.getRelatedPosts(post.id);
        const enrichedRelated = await blogDb.enrichPostsWithRelations(relatedPosts);
        const viewCount = await blogDb.getPostViewCount(post.id);
        return { ...enriched, relatedPosts: enrichedRelated, viewCount };
      }),

    getById: adminProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const post = await blogDb.getPostById(input.id);
        if (!post) return null;
        const enriched = await blogDb.enrichPostWithRelations(post);
        const tags = await blogDb.getPostTags(post.id);
        return { ...enriched, tagIds: tags.map(t => t.id) };
      }),

    create: adminProcedure
      .input(z.object({
        title: z.string().min(1),
        subtitle: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string(),
        contentJson: z.string().optional(),
        coverImage: z.string().optional(),
        coverImageAlt: z.string().optional(),
        ogImage: z.string().optional(),
        ogTitle: z.string().optional(),
        ogDescription: z.string().optional(),
        authorId: z.string(),
        status: z.enum(["draft", "published", "scheduled", "archived"]).optional(),
        publishedAt: z.date().optional(),
        scheduledFor: z.date().optional(),
        canonicalUrl: z.string().optional(),
        metaRobots: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
        slug: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const slug = input.slug || slugify(input.title);
        const readingTime = calculateReadingTime(input.content);
        const wordCount = countWords(input.content);
        const id = await blogDb.createPost({
          id: uuid(),
          slug,
          title: input.title,
          subtitle: input.subtitle ?? null,
          excerpt: input.excerpt ?? null,
          content: input.content,
          contentJson: input.contentJson ?? null,
          coverImage: input.coverImage ?? null,
          coverImageAlt: input.coverImageAlt ?? null,
          ogImage: input.ogImage ?? null,
          ogTitle: input.ogTitle ?? null,
          ogDescription: input.ogDescription ?? null,
          authorId: input.authorId,
          status: input.status ?? "draft",
          publishedAt: input.status === "published" ? (input.publishedAt ?? new Date()) : (input.publishedAt ?? null),
          scheduledFor: input.scheduledFor ?? null,
          readingTime,
          wordCount,
          canonicalUrl: input.canonicalUrl ?? null,
          metaRobots: input.metaRobots ?? "index,follow",
        });
        if (input.tagIds && input.tagIds.length > 0) {
          await blogDb.setPostTags(id, input.tagIds);
        }
        return { id, slug };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.string(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        excerpt: z.string().optional(),
        content: z.string().optional(),
        contentJson: z.string().optional(),
        coverImage: z.string().optional(),
        coverImageAlt: z.string().optional(),
        ogImage: z.string().optional(),
        ogTitle: z.string().optional(),
        ogDescription: z.string().optional(),
        authorId: z.string().optional(),
        status: z.enum(["draft", "published", "scheduled", "archived"]).optional(),
        publishedAt: z.date().optional(),
        scheduledFor: z.date().optional(),
        canonicalUrl: z.string().optional(),
        metaRobots: z.string().optional(),
        tagIds: z.array(z.string()).optional(),
        slug: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, tagIds, ...data } = input;
        if (data.content) {
          (data as any).readingTime = calculateReadingTime(data.content);
          (data as any).wordCount = countWords(data.content);
        }
        if (data.status === "published") {
          const existing = await blogDb.getPostById(id);
          if (existing && !existing.publishedAt && !data.publishedAt) {
            (data as any).publishedAt = new Date();
          }
        }
        await blogDb.updatePost(id, data);
        if (tagIds !== undefined) {
          await blogDb.setPostTags(id, tagIds);
        }
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await blogDb.deletePost(input.id);
        return { success: true };
      }),

    trackView: publicProcedure
      .input(z.object({
        postId: z.string(),
        referrer: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const userAgent = ctx.req.headers["user-agent"] ?? undefined;
        await blogDb.trackView(input.postId, input.referrer, userAgent);
        return { success: true };
      }),
  }),

  // ─── Related Posts ─────────────────────────────────────────
  relatedPosts: router({
    get: publicProcedure
      .input(z.object({ postId: z.string() }))
      .query(async ({ input }) => {
        const posts = await blogDb.getRelatedPosts(input.postId);
        return blogDb.enrichPostsWithRelations(posts);
      }),
    set: adminProcedure
      .input(z.object({
        postId: z.string(),
        relatedIds: z.array(z.string()),
      }))
      .mutation(async ({ input }) => {
        await blogDb.setRelatedPosts(input.postId, input.relatedIds);
        return { success: true };
      }),
  }),

  // ─── Images ────────────────────────────────────────────────
  images: router({
    list: adminProcedure
      .input(z.object({
        page: z.number().optional(),
        limit: z.number().optional(),
      }).optional())
      .query(({ input }) => blogDb.listImages(input ?? {})),

    upload: adminProcedure
      .input(z.object({
        base64: z.string(),
        filename: z.string(),
        mimeType: z.string(),
        altText: z.string().optional(),
        caption: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const ext = input.filename.split(".").pop() || "bin";
        const key = `blog/images/${uuid()}-${slugify(input.filename.replace(`.${ext}`, ""))}.${ext}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        const id = await blogDb.createImage({
          id: uuid(),
          filename: key.split("/").pop()!,
          originalName: input.filename,
          url,
          sizeBytes: buffer.length,
          mimeType: input.mimeType,
          altText: input.altText ?? null,
          caption: input.caption ?? null,
          uploadedBy: ctx.user?.id?.toString() ?? null,
        });
        return { id, url, filename: key.split("/").pop()! };
      }),

    update: adminProcedure
      .input(z.object({
        id: z.string(),
        altText: z.string().optional(),
        caption: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await blogDb.updateImage(input.id, {
          altText: input.altText ?? null,
          caption: input.caption ?? null,
        });
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await blogDb.deleteImage(input.id);
        return { success: true };
      }),
  }),

  // ─── Stats ─────────────────────────────────────────────────
  stats: router({
    overview: adminProcedure.query(async () => {
      const [
        { posts: allPosts, total: totalPosts },
        { posts: publishedPosts },
        { posts: draftPosts },
        viewStats,
        tags,
        authors,
      ] = await Promise.all([
        blogDb.listPosts({ limit: 1 }),
        blogDb.listPosts({ status: "published", limit: 1 }),
        blogDb.listPosts({ status: "draft", limit: 1 }),
        blogDb.getViewStats(30),
        blogDb.listTags(),
        blogDb.listAuthors(),
      ]);
      return {
        totalPosts,
        publishedCount: publishedPosts.length > 0 ? (await blogDb.listPosts({ status: "published", limit: 9999 })).total : 0,
        draftCount: draftPosts.length > 0 ? (await blogDb.listPosts({ status: "draft", limit: 9999 })).total : 0,
        totalViews30d: viewStats.totalViews,
        tagCount: tags.length,
        authorCount: authors.length,
      };
    }),
  }),

  // ─── RSS / Sitemap (data only, rendered by Express) ────────
  feed: router({
    rss: publicProcedure.query(async () => {
      const { posts } = await blogDb.listPosts({ status: "published", limit: 50 });
      return blogDb.enrichPostsWithRelations(posts);
    }),
    sitemap: publicProcedure.query(async () => {
      const { posts } = await blogDb.listPosts({ status: "published", limit: 9999 });
      const tags = await blogDb.listTags();
      return { posts, tags };
    }),
  }),
});
