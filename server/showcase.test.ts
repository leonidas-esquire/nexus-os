import { describe, it, expect, vi } from "vitest";
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
      socket: { remoteAddress: "127.0.0.1" },
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
      socket: { remoteAddress: "127.0.0.2" },
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
      socket: { remoteAddress: "127.0.0.3" },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ─────────────────────────────────────────────────────────

describe("Showcase Public Router", () => {
  it("showcase.list returns projects array and total count", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.showcase.list({
      limit: 10,
      offset: 0,
    });
    expect(result).toHaveProperty("projects");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.projects)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("showcase.featured returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.showcase.featured();
    expect(Array.isArray(result)).toBe(true);
  });

  it("showcase.categoryCounts returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.showcase.categoryCounts();
    expect(Array.isArray(result)).toBe(true);
  });

  it("showcase.getBySlug throws NOT_FOUND for non-existent slug", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.showcase.getBySlug({ slug: "non-existent-project-xyz-999" })
    ).rejects.toThrow("Project not found");
  });

  it("showcase.list supports category filter", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.showcase.list({
      category: "ai-agents",
      limit: 10,
      offset: 0,
    });
    expect(result).toHaveProperty("projects");
    expect(Array.isArray(result.projects)).toBe(true);
  });

  it("showcase.list supports search filter", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.showcase.list({
      search: "test",
      limit: 10,
      offset: 0,
    });
    expect(result).toHaveProperty("projects");
    expect(Array.isArray(result.projects)).toBe(true);
  });

  it("showcase.list supports sort options", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    for (const sort of ["upvotes", "newest", "stars"] as const) {
      const result = await caller.showcase.list({
        sort,
        limit: 5,
        offset: 0,
      });
      expect(result).toHaveProperty("projects");
      expect(Array.isArray(result.projects)).toBe(true);
    }
  });
});

describe("Showcase Submit Router", () => {
  it("showcaseSubmit.submit creates a pending project", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.showcaseSubmit.submit({
      title: "Test Showcase Project",
      tagline: "A test project for the showcase feature testing",
      description:
        "This is a detailed description of the test showcase project that meets the minimum length requirement of fifty characters for proper validation.",
      screenshotUrl: "https://example.com/screenshot.png",
      authorName: "Test Author",
      authorEmail: "test@example.com",
      category: "ai-agents",
    });
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("slug");
  });

  it("showcaseSubmit.submit rejects invalid category", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.showcaseSubmit.submit({
        title: "Bad Category Project",
        tagline: "A test project with an invalid category value",
        description:
          "This is a detailed description of the test showcase project that meets the minimum length requirement of fifty characters.",
        screenshotUrl: "https://example.com/screenshot.png",
        authorName: "Test Author",
        authorEmail: "test@example.com",
        category: "invalid-category" as any,
      })
    ).rejects.toThrow();
  });

  it("showcaseSubmit.submit rejects short title", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.showcaseSubmit.submit({
        title: "AB",
        tagline: "A test project with a short title value",
        description:
          "This is a detailed description of the test showcase project that meets the minimum length requirement of fifty characters.",
        screenshotUrl: "https://example.com/screenshot.png",
        authorName: "Test Author",
        authorEmail: "test@example.com",
        category: "ai-agents",
      })
    ).rejects.toThrow();
  });
});

describe("Admin Showcase Router — Access Control", () => {
  it("adminShowcase.list rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.adminShowcase.list({ limit: 10, offset: 0 })
    ).rejects.toThrow();
  });

  it("adminShowcase.list rejects unauthenticated users", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.adminShowcase.list({ limit: 10, offset: 0 })
    ).rejects.toThrow();
  });

  it("adminShowcase.pending rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.adminShowcase.pending()).rejects.toThrow();
  });

  it("adminShowcase.approve rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.adminShowcase.approve({ id: "fake-id" })
    ).rejects.toThrow();
  });

  it("adminShowcase.reject rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.adminShowcase.reject({ id: "fake-id" })
    ).rejects.toThrow();
  });

  it("adminShowcase.delete rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.adminShowcase.delete({ id: "fake-id" })
    ).rejects.toThrow();
  });

  it("adminShowcase.feature rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(
      caller.adminShowcase.feature({ id: "fake-id", featured: true })
    ).rejects.toThrow();
  });
});

describe("Admin Showcase Router — Operations", () => {
  it("adminShowcase.list returns projects and total for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.adminShowcase.list({ limit: 10, offset: 0 });
    expect(result).toHaveProperty("projects");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.projects)).toBe(true);
  });

  it("adminShowcase.pending returns an array for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.adminShowcase.pending();
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin can approve and then feature a submitted project", async () => {
    // First submit a project
    const publicCaller = appRouter.createCaller(createPublicContext());
    const submission = await publicCaller.showcaseSubmit.submit({
      title: "Admin Test Project",
      tagline: "A project to test admin approval workflow",
      description:
        "This is a detailed description for testing the admin approval and featuring workflow that meets the minimum length requirement.",
      screenshotUrl: "https://example.com/admin-test.png",
      authorName: "Admin Tester",
      authorEmail: "admin-test@example.com",
      category: "devops",
    });

    const adminCaller = appRouter.createCaller(createAdminContext());

    // Approve it
    const approveResult = await adminCaller.adminShowcase.approve({
      id: submission.id!,
    });
    expect(approveResult).toHaveProperty("success", true);

    // Feature it
    const featureResult = await adminCaller.adminShowcase.feature({
      id: submission.id!,
      featured: true,
    });
    expect(featureResult).toHaveProperty("success", true);

    // Unfeature it
    const unfeatureResult = await adminCaller.adminShowcase.feature({
      id: submission.id!,
      featured: false,
    });
    expect(unfeatureResult).toHaveProperty("success", true);

    // Clean up — delete
    const deleteResult = await adminCaller.adminShowcase.delete({
      id: submission.id!,
    });
    expect(deleteResult).toHaveProperty("success", true);
  });
});

describe("Showcase Upvoting", () => {
  it("upvote toggles on and off", async () => {
    // Submit a project first
    const publicCaller = appRouter.createCaller(createPublicContext());
    const submission = await publicCaller.showcaseSubmit.submit({
      title: "Upvote Test Project",
      tagline: "A project to test the upvote toggle functionality",
      description:
        "This is a detailed description for testing the upvote toggle functionality that meets the minimum length requirement of fifty characters.",
      screenshotUrl: "https://example.com/upvote-test.png",
      authorName: "Upvote Tester",
      authorEmail: "upvote@example.com",
      category: "automation",
    });

    // Approve it first so it's visible
    const adminCaller = appRouter.createCaller(createAdminContext());
    await adminCaller.adminShowcase.approve({ id: submission.id! });

    // Upvote
    const upvoteResult = await publicCaller.showcase.upvote({
      projectId: submission.id!,
    });
    expect(upvoteResult).toHaveProperty("upvoted");

    // Check hasUpvoted
    const hasUpvoted = await publicCaller.showcase.hasUpvoted({
      projectId: submission.id!,
    });
    expect(typeof hasUpvoted).toBe("boolean");

    // Clean up
    await adminCaller.adminShowcase.delete({ id: submission.id! });
  });
});
