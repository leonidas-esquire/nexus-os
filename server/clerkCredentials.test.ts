import { describe, expect, it } from "vitest";

describe("Clerk credentials", () => {
  it.skipIf(process.env.CLERK_CREDENTIAL_TEST !== "1")(
    "authenticates with the configured Clerk backend secret",
    async () => {
    const secretKey = process.env.CLERK_SECRET_KEY;
    expect(secretKey).toMatch(/^sk_(test|live)_/);

    const response = await fetch("https://api.clerk.com/v1/users?limit=1", {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
      signal: AbortSignal.timeout(10_000),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(expect.any(Array));
    },
    15_000
  );
});
