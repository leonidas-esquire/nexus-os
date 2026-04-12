import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Test Helpers ──────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@nexus.os",
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
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@nexus.os",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ─────────────────────────────────────────────────────────

describe("Blog Public Router", () => {
  it("blog.list returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const posts = await caller.blog.list();
    expect(Array.isArray(posts)).toBe(true);
  });

  it("blog.featured returns null or a post object", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const featured = await caller.blog.featured();
    // Either null or an object with an id
    if (featured !== null) {
      expect(featured).toHaveProperty("id");
      expect(featured).toHaveProperty("title");
      expect(featured).toHaveProperty("slug");
    }
  });

  it("blog.getBySlug returns NOT_FOUND for non-existent slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.blog.getBySlug({ slug: "this-slug-does-not-exist-xyz-123" })
    ).rejects.toThrow("Post not found");
  });
});

describe("Admin Blog Router — Access Control", () => {
  it("adminBlog.list rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.adminBlog.list({ limit: 10, offset: 0 })
    ).rejects.toThrow();
  });

  it("adminBlog.list rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.adminBlog.list({ limit: 10, offset: 0 })
    ).rejects.toThrow();
  });

  it("adminBlog.upsert rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.adminBlog.upsert({
        title: "Test Post",
        excerpt: "Test excerpt",
        content: "# Hello",
      })
    ).rejects.toThrow();
  });

  it("adminBlog.delete rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.adminBlog.delete({ id: 999 })
    ).rejects.toThrow();
  });
});

describe("Admin Blog Router — CRUD", () => {
  const adminCaller = appRouter.createCaller(createAdminContext());
  let createdPostId: number;
  let createdSlug: string;

  it("adminBlog.upsert creates a new post", async () => {
    const result = await adminCaller.adminBlog.upsert({
      title: "Test Blog Post",
      excerpt: "This is a test excerpt for the blog post.",
      content: "## Introduction\n\nThis is the body of the test post.\n\n### Section One\n\nSome content here.",
      author: "Test Author",
      category: "tutorial",
      tags: JSON.stringify(["test", "vitest"]),
      readingTimeMinutes: 3,
      featured: false,
      published: true,
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("slug");
    expect(typeof result.id).toBe("number");
    expect(result.slug).toBe("test-blog-post");
    createdPostId = result.id;
    createdSlug = result.slug;
  });

  it("adminBlog.getById returns the created post", async () => {
    const post = await adminCaller.adminBlog.getById({ id: createdPostId });
    expect(post).not.toBeNull();
    expect(post!.title).toBe("Test Blog Post");
    expect(post!.excerpt).toBe("This is a test excerpt for the blog post.");
    expect(post!.category).toBe("tutorial");
    expect(post!.author).toBe("Test Author");
    expect(post!.published).toBe(true);
    expect(post!.readingTimeMinutes).toBe(3);
  });

  it("blog.getBySlug returns the published post", async () => {
    const publicCaller = appRouter.createCaller(createPublicContext());
    const post = await publicCaller.blog.getBySlug({ slug: createdSlug });
    expect(post.title).toBe("Test Blog Post");
    expect(post.slug).toBe(createdSlug);
  });

  it("adminBlog.upsert updates an existing post", async () => {
    const result = await adminCaller.adminBlog.upsert({
      id: createdPostId,
      title: "Updated Blog Post",
      slug: createdSlug,
      excerpt: "Updated excerpt.",
      content: "## Updated Content\n\nNew body.",
      author: "Test Author",
      category: "explainer",
      featured: true,
      published: true,
    });

    expect(result.id).toBe(createdPostId);

    const post = await adminCaller.adminBlog.getById({ id: createdPostId });
    expect(post!.title).toBe("Updated Blog Post");
    expect(post!.category).toBe("explainer");
    expect(post!.featured).toBe(true);
  });

  it("adminBlog.list returns posts with total count", async () => {
    const result = await adminCaller.adminBlog.list({ limit: 10, offset: 0 });
    expect(result).toHaveProperty("posts");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.posts)).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(1);
  });

  it("blog.getBySlug returns NOT_FOUND for unpublished post", async () => {
    // Make post unpublished
    await adminCaller.adminBlog.upsert({
      id: createdPostId,
      title: "Updated Blog Post",
      slug: createdSlug,
      excerpt: "Updated excerpt.",
      content: "## Updated Content\n\nNew body.",
      published: false,
    });

    const publicCaller = appRouter.createCaller(createPublicContext());
    await expect(
      publicCaller.blog.getBySlug({ slug: createdSlug })
    ).rejects.toThrow("Post not found");

    // Re-publish for cleanup
    await adminCaller.adminBlog.upsert({
      id: createdPostId,
      title: "Updated Blog Post",
      slug: createdSlug,
      excerpt: "Updated excerpt.",
      content: "## Updated Content\n\nNew body.",
      published: true,
    });
  });

  it("adminBlog.delete removes the post", async () => {
    const result = await adminCaller.adminBlog.delete({
      id: createdPostId,
      title: "Updated Blog Post",
    });
    expect(result).toEqual({ success: true });

    // Verify it's gone
    await expect(
      adminCaller.adminBlog.getById({ id: createdPostId })
    ).rejects.toThrow("Post not found");
  });
});

describe("Admin Blog Router — Preview Token", () => {
  const adminCaller = appRouter.createCaller(createAdminContext());

  it("previewToken creates a token and getPreview retrieves the draft", async () => {
    const { token } = await adminCaller.adminBlog.previewToken({
      title: "Preview Test Post",
      excerpt: "Preview excerpt",
      content: "## Preview Content\n\nThis is a preview.",
      author: "Preview Author",
      category: "opinion",
      tags: JSON.stringify(["preview"]),
      readingTimeMinutes: 2,
      featuredImageUrl: null,
      featuredImageAlt: null,
    });

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);

    // Retrieve the preview (public procedure)
    const publicCaller = appRouter.createCaller(createPublicContext());
    const preview = await publicCaller.adminBlog.getPreview({ token });
    expect(preview).toHaveProperty("title", "Preview Test Post");
    expect(preview).toHaveProperty("content");
    expect(preview).toHaveProperty("category", "opinion");
  });

  it("getPreview returns NOT_FOUND for invalid token", async () => {
    const publicCaller = appRouter.createCaller(createPublicContext());
    await expect(
      publicCaller.adminBlog.getPreview({ token: "invalid-token-xyz" })
    ).rejects.toThrow("Preview not found or expired");
  });
});

describe("Admin Blog Router — Category Validation", () => {
  const adminCaller = appRouter.createCaller(createAdminContext());

  it("rejects invalid category values", async () => {
    await expect(
      adminCaller.adminBlog.upsert({
        title: "Invalid Category Post",
        excerpt: "Test",
        content: "Test",
        category: "invalid-category" as any,
      })
    ).rejects.toThrow();
  });

  it("accepts all valid categories", async () => {
    const validCategories = [
      "explainer",
      "tutorial",
      "opinion",
      "case-study",
      "announcement",
      "release",
    ] as const;

    for (const category of validCategories) {
      const result = await adminCaller.adminBlog.upsert({
        title: `Category Test: ${category}`,
        excerpt: "Testing category",
        content: "Content",
        category,
        published: false,
      });
      expect(result).toHaveProperty("id");
      // Clean up
      await adminCaller.adminBlog.delete({ id: result.id });
    }
  });
});

describe("Admin Blog Router — Featured Image and Alt Text", () => {
  const adminCaller = appRouter.createCaller(createAdminContext());

  it("stores and retrieves featuredImageUrl and featuredImageAlt", async () => {
    const result = await adminCaller.adminBlog.upsert({
      title: "Image Test Post",
      excerpt: "Testing image fields",
      content: "Content with image",
      featuredImageUrl: "https://example.com/image.jpg",
      featuredImageAlt: "A descriptive alt text",
      ogImageOverride: "https://example.com/og-image.jpg",
      published: true,
    });

    const post = await adminCaller.adminBlog.getById({ id: result.id });
    expect(post!.featuredImageUrl).toBe("https://example.com/image.jpg");
    expect(post!.featuredImageAlt).toBe("A descriptive alt text");
    expect(post!.ogImageOverride).toBe("https://example.com/og-image.jpg");

    // Clean up
    await adminCaller.adminBlog.delete({ id: result.id });
  });
});

describe("Admin Blog Router — Scheduled Publishing", () => {
  const adminCaller = appRouter.createCaller(createAdminContext());

  it("stores scheduledPublishAt field", async () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // tomorrow
    const result = await adminCaller.adminBlog.upsert({
      title: "Scheduled Post",
      excerpt: "This post is scheduled",
      content: "Content",
      published: false,
      scheduledPublishAt: futureDate,
    });

    const post = await adminCaller.adminBlog.getById({ id: result.id });
    expect(post!.published).toBe(false);
    expect(post!.scheduledPublishAt).not.toBeNull();

    // Clean up
    await adminCaller.adminBlog.delete({ id: result.id });
  });
});
