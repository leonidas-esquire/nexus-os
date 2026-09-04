import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { config as vercelConfig } from "../vercel";

describe("external deployment configuration", () => {
  it("builds the Vercel frontend into the configured public directory", () => {
    expect(vercelConfig.framework).toBeNull();
    expect(vercelConfig.buildCommand).toBe("pnpm build:vercel");
    expect(vercelConfig.outputDirectory).toBe("public");
  });

  it("routes dynamic Vercel requests through the Railway backend", () => {
    const rewrites = JSON.stringify(vercelConfig.rewrites);

    expect(rewrites).toContain("RAILWAY_BACKEND_URL");
    expect(rewrites).toContain("/api/(.*)");
    expect(rewrites).toContain("/install.sh");
    expect(rewrites).toContain("/blog/(.*)");
    expect(rewrites).toContain("/index.html");
  });

  it("defines a Railway service with production build, start, and healthcheck commands", () => {
    const railwaySource = readFileSync(
      new URL("../.railway/railway.ts", import.meta.url),
      "utf8"
    );

    expect(railwaySource).toContain('build: "pnpm build"');
    expect(railwaySource).toContain('start: "pnpm start"');
    expect(railwaySource).toContain('healthcheck: "/api/health"');
    expect(railwaySource).toContain('github("leonidas-esquire/nexus-os"');
  });
});
