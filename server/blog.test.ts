import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Blog system integration tests.
 * These test the tRPC procedures through the router caller.
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-test-user",
    email: "admin@nexus.test",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: {
      protocol: "https",
      headers: { "user-agent": "vitest" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: { "user-agent": "vitest" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("blog.authors", () => {
  const adminCaller = appRouter.createCaller(createAdminContext());
  const publicCaller = appRouter.createCaller(createPublicContext());
  let authorId: string;

  it("creates an author via admin procedure", async () => {
    const result = await adminCaller.blog.authors.upsert({
      name: "Test Author",
      slug: "test-author",
      email: "test@nexus.test",
      bio: "A test author for vitest",
      authorRole: "contributor",
    });
    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("string");
    authorId = result.id;
  });

  it("lists authors (public)", async () => {
    const authors = await publicCaller.blog.authors.list();
    expect(Array.isArray(authors)).toBe(true);
    const found = authors.find((a: any) => a.slug === "test-author");
    expect(found).toBeTruthy();
    expect(found?.name).toBe("Test Author");
  });

  it("gets author by slug (public)", async () => {
    const author = await publicCaller.blog.authors.getBySlug({ slug: "test-author" });
    expect(author).toBeTruthy();
    expect(author?.name).toBe("Test Author");
  });

  it("updates an author", async () => {
    const result = await adminCaller.blog.authors.upsert({
      id: authorId,
      name: "Updated Author",
      slug: "test-author",
      bio: "Updated bio",
      authorRole: "editor",
    });
    expect(result.id).toBe(authorId);

    const author = await publicCaller.blog.authors.getBySlug({ slug: "test-author" });
    expect(author?.name).toBe("Updated Author");
    expect(author?.authorRole).toBe("editor");
  });

  it("rejects unauthenticated author creation", async () => {
    await expect(
      publicCaller.blog.authors.upsert({
        name: "Hacker",
        slug: "hacker",
      })
    ).rejects.toThrow();
  });
});

describe("blog.tags", () => {
  const adminCaller = appRouter.createCaller(createAdminContext());
  const publicCaller = appRouter.createCaller(createPublicContext());
  let tagId: string;

  it("creates a tag", async () => {
    const result = await adminCaller.blog.tags.upsert({
      name: "Testing",
      slug: "testing",
      description: "Test tag",
      color: "#ff0000",
    });
    expect(result).toHaveProperty("id");
    tagId = result.id;
  });

  it("lists tags (public)", async () => {
    const tags = await publicCaller.blog.tags.list();
    expect(Array.isArray(tags)).toBe(true);
    const found = tags.find((t: any) => t.slug === "testing");
    expect(found).toBeTruthy();
    expect(found?.color).toBe("#ff0000");
  });

  it("gets tag by slug", async () => {
    const tag = await publicCaller.blog.tags.getBySlug({ slug: "testing" });
    expect(tag).toBeTruthy();
    expect(tag?.name).toBe("Testing");
  });
});

describe("blog.posts", () => {
  const adminCaller = appRouter.createCaller(createAdminContext());
  const publicCaller = appRouter.createCaller(createPublicContext());
  let postId: string;
  let postSlug: string;
  let authorId: string;
  let tagId: string;

  beforeAll(async () => {
    // Ensure we have an author and tag
    const authorResult = await adminCaller.blog.authors.upsert({
      name: "Post Author",
      slug: "post-author",
      email: "postauthor@nexus.test",
      authorRole: "admin",
    });
    authorId = authorResult.id;

    const tagResult = await adminCaller.blog.tags.upsert({
      name: "Integration",
      slug: "integration",
      color: "#0000ff",
    });
    tagId = tagResult.id;
  });

  it("creates a draft post", async () => {
    const result = await adminCaller.blog.posts.create({
      title: "Test Blog Post",
      content: "<p>This is a test blog post with enough words to calculate reading time properly.</p>",
      authorId,
      status: "draft",
      tagIds: [tagId],
      excerpt: "A test blog post",
    });
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("slug");
    expect(result.slug).toBe("test-blog-post");
    postId = result.id;
    postSlug = result.slug;
  });

  it("lists posts with status filter", async () => {
    const { posts, total } = await publicCaller.blog.posts.list({ status: "draft" });
    expect(total).toBeGreaterThanOrEqual(1);
    const found = posts.find((p: any) => p.id === postId);
    expect(found).toBeTruthy();
    expect(found?.title).toBe("Test Blog Post");
  });

  it("gets post by slug", async () => {
    const post = await publicCaller.blog.posts.getBySlug({ slug: postSlug });
    expect(post).toBeTruthy();
    expect(post?.title).toBe("Test Blog Post");
    expect(post?.author).toBeTruthy();
    expect(post?.author?.name).toBe("Post Author");
    expect(post?.tags).toBeTruthy();
    expect(post?.tags?.length).toBeGreaterThanOrEqual(1);
  });

  it("gets post by id (admin)", async () => {
    const post = await adminCaller.blog.posts.getById({ id: postId });
    expect(post).toBeTruthy();
    expect(post?.title).toBe("Test Blog Post");
    expect(post?.tagIds).toContain(tagId);
  });

  it("updates a post", async () => {
    const result = await adminCaller.blog.posts.update({
      id: postId,
      title: "Updated Blog Post",
      status: "published",
    });
    expect(result.success).toBe(true);

    const post = await publicCaller.blog.posts.getBySlug({ slug: postSlug });
    expect(post?.title).toBe("Updated Blog Post");
    expect(post?.publishedAt).toBeTruthy();
  });

  it("tracks a view", async () => {
    const result = await publicCaller.blog.posts.trackView({
      postId,
      referrer: "https://google.com",
    });
    expect(result.success).toBe(true);

    // Verify view count
    const post = await publicCaller.blog.posts.getBySlug({ slug: postSlug });
    expect(post?.viewCount).toBeGreaterThanOrEqual(1);
  });

  it("searches posts", async () => {
    const { posts } = await publicCaller.blog.posts.list({
      search: "Updated Blog",
    });
    const found = posts.find((p: any) => p.id === postId);
    expect(found).toBeTruthy();
  });

  it("filters by tag slug", async () => {
    const { posts } = await publicCaller.blog.posts.list({
      tagSlug: "integration",
    });
    const found = posts.find((p: any) => p.id === postId);
    expect(found).toBeTruthy();
  });

  it("filters by author slug", async () => {
    const { posts } = await publicCaller.blog.posts.list({
      authorSlug: "post-author",
    });
    const found = posts.find((p: any) => p.id === postId);
    expect(found).toBeTruthy();
  });

  it("rejects unauthenticated post creation", async () => {
    await expect(
      publicCaller.blog.posts.create({
        title: "Hacked Post",
        content: "<p>bad</p>",
        authorId: "fake",
      })
    ).rejects.toThrow();
  });
});

describe("blog.stats", () => {
  const adminCaller = appRouter.createCaller(createAdminContext());
  const publicCaller = appRouter.createCaller(createPublicContext());

  it("returns overview stats for admin", async () => {
    const stats = await adminCaller.blog.stats.overview();
    expect(stats).toHaveProperty("totalPosts");
    expect(stats).toHaveProperty("publishedCount");
    expect(stats).toHaveProperty("draftCount");
    expect(stats).toHaveProperty("totalViews30d");
    expect(stats).toHaveProperty("tagCount");
    expect(stats).toHaveProperty("authorCount");
    expect(typeof stats.totalPosts).toBe("number");
  });

  it("rejects unauthenticated stats access", async () => {
    await expect(publicCaller.blog.stats.overview()).rejects.toThrow();
  });
});

describe("blog.relatedPosts", () => {
  const adminCaller = appRouter.createCaller(createAdminContext());
  const publicCaller = appRouter.createCaller(createPublicContext());

  it("sets and gets related posts", async () => {
    // Create two posts
    const authors = await publicCaller.blog.authors.list();
    const authorId = authors[0]?.id;
    if (!authorId) return; // Skip if no author

    const post1 = await adminCaller.blog.posts.create({
      title: "Related Post 1",
      content: "<p>First related post</p>",
      authorId,
      status: "published",
    });
    const post2 = await adminCaller.blog.posts.create({
      title: "Related Post 2",
      content: "<p>Second related post</p>",
      authorId,
      status: "published",
    });

    // Set related
    await adminCaller.blog.relatedPosts.set({
      postId: post1.id,
      relatedIds: [post2.id],
    });

    // Get related
    const related = await publicCaller.blog.relatedPosts.get({ postId: post1.id });
    expect(related.length).toBe(1);
    expect(related[0]?.id).toBe(post2.id);
  });
});

describe("blog.feed", () => {
  const publicCaller = appRouter.createCaller(createPublicContext());

  it("returns RSS data", async () => {
    const posts = await publicCaller.blog.feed.rss();
    expect(Array.isArray(posts)).toBe(true);
  });

  it("returns sitemap data", async () => {
    const data = await publicCaller.blog.feed.sitemap();
    expect(data).toHaveProperty("posts");
    expect(data).toHaveProperty("tags");
    expect(Array.isArray(data.posts)).toBe(true);
    expect(Array.isArray(data.tags)).toBe(true);
  });
});

// Cleanup
afterAll(async () => {
  const adminCaller = appRouter.createCaller(createAdminContext());
  const publicCaller = appRouter.createCaller(createPublicContext());

  // Clean up test posts
  try {
    const { posts } = await publicCaller.blog.posts.list({ limit: 100 });
    for (const post of posts) {
      if (post.title.includes("Test") || post.title.includes("Updated") || post.title.includes("Related")) {
        await adminCaller.blog.posts.delete({ id: post.id });
      }
    }
  } catch {}

  // Clean up test tags
  try {
    const tags = await publicCaller.blog.tags.list();
    for (const tag of tags) {
      if (tag.slug === "testing" || tag.slug === "integration") {
        await adminCaller.blog.tags.delete({ id: tag.id });
      }
    }
  } catch {}

  // Clean up test authors
  try {
    const authors = await publicCaller.blog.authors.list();
    for (const author of authors) {
      if (author.slug === "test-author" || author.slug === "post-author") {
        await adminCaller.blog.authors.delete({ id: author.id });
      }
    }
  } catch {}
});
