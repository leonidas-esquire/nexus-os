import { describe, expect, it } from "vitest";
import { clerkUserToInsert } from "./_core/clerkAuth";

const baseClerkUser = {
  id: "user_nexus_owner",
  fullName: "Leonidas Esquire Williamson",
  firstName: "Leonidas",
  lastName: "Williamson",
  primaryEmailAddress: {
    emailAddress: "owner@aiagents.nexus",
  },
  emailAddresses: [
    {
      emailAddress: "owner@aiagents.nexus",
    },
  ],
  publicMetadata: {},
} as any;

describe("Clerk user synchronization", () => {
  it("maps the stable Clerk user ID to the existing external identity column", () => {
    const signedInAt = new Date("2026-09-05T12:00:00.000Z");

    expect(clerkUserToInsert(baseClerkUser, signedInAt)).toMatchObject({
      openId: "user_nexus_owner",
      name: "Leonidas Esquire Williamson",
      email: "owner@aiagents.nexus",
      loginMethod: "clerk",
      lastSignedIn: signedInAt,
    });
  });

  it("preserves application admin authorization from Clerk public metadata", () => {
    const mapped = clerkUserToInsert({
      ...baseClerkUser,
      publicMetadata: { role: "admin" },
    });

    expect(mapped.role).toBe("admin");
  });

  it("does not promote ordinary Clerk users", () => {
    const mapped = clerkUserToInsert({
      ...baseClerkUser,
      id: "user_community_member",
      primaryEmailAddress: { emailAddress: "member@example.com" },
      emailAddresses: [{ emailAddress: "member@example.com" }],
    });

    expect(mapped.role).toBeUndefined();
  });
});
