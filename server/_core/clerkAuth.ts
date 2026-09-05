import { ForbiddenError } from "@shared/_core/errors";
import {
  createClerkClient,
  getAuth,
  type User as ClerkUser,
} from "@clerk/express";
import type { Request } from "express";
import type { InsertUser, User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

const clerkClient = createClerkClient({ secretKey: ENV.clerkSecretKey });

const normalizedSet = (values: string[]) =>
  new Set(values.map(value => value.trim().toLowerCase()).filter(Boolean));

const adminUserIds = normalizedSet(ENV.clerkAdminUserIds);
const adminEmails = normalizedSet(ENV.clerkAdminEmails);

function isConfiguredAdmin(userId: string, email?: string | null) {
  return (
    adminUserIds.has(userId.toLowerCase()) ||
    Boolean(email && adminEmails.has(email.toLowerCase()))
  );
}

export function clerkUserToInsert(
  clerkUser: Pick<
    ClerkUser,
    | "id"
    | "fullName"
    | "firstName"
    | "lastName"
    | "primaryEmailAddress"
    | "emailAddresses"
    | "publicMetadata"
  >,
  signedInAt = new Date()
): InsertUser {
  const email =
    clerkUser.primaryEmailAddress?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    null;
  const fallbackName = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(" ");
  const metadataRole = clerkUser.publicMetadata?.role;
  const isAdmin =
    metadataRole === "admin" ||
    isConfiguredAdmin(clerkUser.id, email);

  return {
    openId: clerkUser.id,
    name: clerkUser.fullName || fallbackName || email,
    email,
    loginMethod: "clerk",
    lastSignedIn: signedInAt,
    ...(isAdmin ? { role: "admin" as const } : {}),
  };
}

export async function authenticateClerkRequest(req: Request): Promise<User> {
  const auth = getAuth(req);
  if (!auth.isAuthenticated || !auth.userId) {
    throw ForbiddenError("Invalid Clerk session");
  }

  const signedInAt = new Date();
  let user = await db.getUserByOpenId(auth.userId);

  if (!user) {
    const clerkUser = await clerkClient.users.getUser(auth.userId);
    await db.upsertUser(clerkUserToInsert(clerkUser, signedInAt));
    user = await db.getUserByOpenId(auth.userId);
  } else {
    const shouldPromote =
      user.role !== "admin" && isConfiguredAdmin(user.openId, user.email);
    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt,
      ...(shouldPromote ? { role: "admin" as const } : {}),
    });
    if (shouldPromote) {
      user = await db.getUserByOpenId(auth.userId);
    }
  }

  if (!user) {
    throw ForbiddenError("Clerk user could not be synchronized");
  }

  return user;
}
