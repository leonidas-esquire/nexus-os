export const ENV = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? "",
  clerkAuthorizedParties: (process.env.CLERK_AUTHORIZED_PARTIES ?? "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean),
  clerkAdminUserIds: (process.env.CLERK_ADMIN_USER_IDS ?? "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean),
  clerkAdminEmails: (process.env.CLERK_ADMIN_EMAILS ?? "")
    .split(",")
    .map(value => value.trim())
    .filter(Boolean),
};
