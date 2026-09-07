import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { config as vercelConfig } from "../vercel";
import {
  createRoutes,
  injectHead,
  semanticBody,
} from "../scripts/generate-agent-assets";
import { injectAgentBody, isAgentResourceRequest } from "./_core/vite";

const ROOT = path.resolve(import.meta.dirname, "..");

function read(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), "utf8");
}

function markdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const item = path.join(directory, entry.name);
    if (entry.isDirectory()) return markdownFiles(item);
    return entry.isFile() && entry.name.endsWith(".md") ? [item] : [];
  });
}

describe("OKF v0.2 knowledge bundle", () => {
  it("declares the bundle version at the dedicated root", () => {
    const root = matter(read("knowledge/index.md"));
    expect(String(root.data.okf_version)).toBe("0.2");
    expect(root.content).toContain("# AI Agents Nexus Knowledge Bundle");
  });

  it("gives every concept type, identity, provenance, verification, lifecycle, and freshness metadata", () => {
    const files = markdownFiles(path.join(ROOT, "knowledge")).filter(
      file => file !== path.join(ROOT, "knowledge", "index.md")
    );
    expect(files.length).toBeGreaterThanOrEqual(15);

    for (const file of files) {
      const parsed = matter(readFileSync(file, "utf8"));
      const data = parsed.data;
      expect(data.type, file).toEqual(expect.any(String));
      expect(data.title, file).toEqual(expect.any(String));
      expect(data.description, file).toEqual(expect.any(String));
      expect(data.resource, file).toMatch(/^https:\/\//);
      expect(data.tags, file).toEqual(expect.any(Array));
      expect(data.owner, file).toMatch(/^(human|process):/);
      expect(data.generated?.by, file).toMatch(/^process:/);
      expect(new Date(data.generated?.at).toString(), file).not.toBe("Invalid Date");
      expect(data.verified?.by, file).toMatch(/^process:/);
      expect(new Date(data.verified?.at).toString(), file).not.toBe("Invalid Date");
      expect(data.status, file).toEqual(expect.any(String));
      expect(new Date(data.stale_after).toString(), file).not.toBe("Invalid Date");
      expect(data.sources, file).toEqual(expect.any(Array));
      expect(data.sources.length, file).toBeGreaterThan(0);
      expect(parsed.content.trim(), file).toMatch(/^# /);
    }
  });
});

describe("AI discovery and Markdown alternatives", () => {
  it("publishes substantive llms discovery files", () => {
    const llms = read("client/public/llms.txt");
    const full = read("client/public/llms-full.txt");
    expect(llms).toMatch(/^# AI Agents Nexus/);
    expect(llms).toContain("/knowledge/index.md");
    expect(llms).toContain("/docs-markdown/index.md");
    expect(llms).toContain("api.aiagents.nexus/openapi.json");
    expect(llms).toContain("/api-reference/trpc.md");
    expect(full.length).toBeGreaterThan(50_000);
    expect(full).toContain("# AI Agents Nexus / Nexus OS — Full Agent Context");
  });

  it("publishes a Markdown file for every route in the agent manifest", () => {
    const manifest = JSON.parse(read("client/public/agent-routes.json")) as Array<{
      route: string;
      markdownPath: string;
    }>;
    expect(manifest.length).toBeGreaterThan(50);
    for (const page of manifest) {
      const file = path.join(ROOT, "client", "public", page.markdownPath.replace(/^\//, ""));
      expect(existsSync(file), `${page.route} -> ${page.markdownPath}`).toBe(true);
      expect(readFileSync(file, "utf8"), page.markdownPath).toMatch(/\n# /);
    }
  });

  it("includes every declared public route in the static sitemap seed", () => {
    const manifest = JSON.parse(read("client/public/agent-routes.json")) as Array<{ route: string }>;
    const sitemap = read("client/public/sitemap-static.xml");
    for (const page of manifest) {
      expect(sitemap, page.route).toContain(
        `<loc>https://www.aiagents.nexus${page.route}</loc>`
      );
    }
    expect(sitemap).toContain("/legal/terms");
    expect(sitemap).toContain("/legal/privacy");
    expect(sitemap).toContain("/marketplace");
    expect(sitemap).toContain("/showcase");
  });
});

describe("semantic prerendering and route metadata", () => {
  it("injects canonical, Markdown discovery, provenance, and parseable JSON-LD", async () => {
    const page = createRoutes().find(
      item => item.route === "/docs/getting-started/installation"
    );
    expect(page).toBeDefined();
    const template = read("client/index.html");
    const head = injectHead(template, page!);
    const body = await semanticBody(page!);
    const html = head.replace('<div id="root"></div>', `<div id="root">${body}</div>`);

    expect(html).toContain(
      '<link rel="canonical" href="https://www.aiagents.nexus/docs/getting-started/installation"'
    );
    expect(html).toContain('rel="alternate" type="text/markdown"');
    expect(html).toContain('rel="describedby" type="text/markdown"');
    expect(html).toContain('name="dcterms.source"');
    expect(html).toContain('name="nexus:verified-by"');
    expect(html).toContain('<main id="agent-readable-content"');
    expect(html).toContain("<article>");
    expect(html).toContain("<h1>");
    expect(html).toContain("<pre><code");

    const jsonLd = html.match(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
    );
    expect(jsonLd).not.toBeNull();
    const entities = JSON.parse(jsonLd![1]) as Array<{ "@type": string }>;
    expect(entities.map(entity => entity["@type"])).toEqual([
      "TechArticle",
      "BreadcrumbList",
    ]);
  });

  it("replaces prerendered fallback content with dynamic route semantic content", () => {
    const template = `<html><body><div id="root"><main id="agent-readable-content"><article><h1>Nexus OS</h1></article></main></div>
    <script defer src="https://analytics.example/script.js"></script></body></html>`;
    const dynamicBody = `<main id="agent-readable-content" data-server-rendered="true"><article><h1>Dynamic Project</h1></article></main>`;
    const html = injectAgentBody(template, dynamicBody);

    expect(html).toContain('data-server-rendered="true"');
    expect(html).toContain("<h1>Dynamic Project</h1>");
    expect(html).not.toContain("<h1>Nexus OS</h1>");
    expect(html).toContain("analytics.example/script.js");
  });
});

describe("machine-readable API references", () => {
  it("publishes OpenAPI 3.1 for the conventional REST surface", () => {
    const openapi = JSON.parse(read("client/public/openapi.json"));
    expect(openapi.openapi).toBe("3.1.0");
    expect(openapi.servers[0].url).toBe("https://api.aiagents.nexus");
    expect(Object.keys(openapi.paths)).toEqual(
      expect.arrayContaining([
        "/api/health",
        "/api/sitemap.xml",
        "/api/blog/feed.xml",
        "/api/blog/upload-image",
        "/api/showcase/upload-image",
        "/install.sh",
      ])
    );
    expect(openapi.paths["/api/trpc"]).toBeUndefined();
    expect(openapi.externalDocs.url).toContain("/api-reference/trpc.md");
  });

  it("publishes human-readable and machine-readable tRPC procedure catalogs", () => {
    const markdown = read("client/public/api-reference/trpc.md");
    const schema = JSON.parse(
      read("client/public/api-reference/trpc-procedures.json")
    );
    expect(markdown).toContain("tRPC 11");
    expect(markdown).toContain("SuperJSON");
    expect(schema.endpoint).toBe("https://api.aiagents.nexus/api/trpc");
    expect(schema.procedures.length).toBe(28);
    expect(schema.procedures.map((item: { name: string }) => item.name)).toEqual(
      expect.arrayContaining([
        "system.health",
        "blog.getBySlug",
        "showcaseSubmit.submit",
        "adminShowcase.update",
      ])
    );
  });
});

describe("trustworthy fallbacks and public facts", () => {
  it("classifies missing machine-readable paths for explicit 404 responses", () => {
    expect(isAgentResourceRequest("/.well-known/agent.json")).toBe(true);
    expect(isAgentResourceRequest("/unknown-openapi.yaml")).toBe(true);
    expect(isAgentResourceRequest("/missing.md?format=raw")).toBe(true);
    expect(isAgentResourceRequest("/docs/getting-started")).toBe(false);
  });

  it("routes machine-readable Vercel requests through the Railway 404-aware server", () => {
    const rewrites = JSON.stringify(vercelConfig.rewrites);
    expect(rewrites).toContain("/.well-known/(.*)");
    expect(rewrites).toContain("(json|xml|yaml|yml|md|txt)");
  });

  it("routes public Vercel knowledge pages to route-specific prerendered HTML", () => {
    const rewrites = JSON.stringify(vercelConfig.rewrites);
    expect(rewrites).toContain("/docs/$1/index.html");
    expect(rewrites).toContain("/marketplace/$1/index.html");
    expect(rewrites).toContain("/legal/$1/index.html");
  });

  it("keeps current release and project-license statements consistent", () => {
    const home = read("client/src/pages/Home.tsx");
    const packageJson = JSON.parse(read("package.json"));
    expect(home).toContain("v0.3.1 — Current Stable Release");
    expect(home).toContain("Apache-2.0 licensed");
    expect(home).not.toContain("Nexus OS is MIT licensed");
    expect(packageJson.license).toBe("Apache-2.0");
  });

  it("does not ship fabricated marketplace customer reviews or star ratings", () => {
    const marketplace = read("client/src/pages/marketplace/marketplaceData.ts");
    const detail = read("client/src/pages/marketplace/SkillDetailPage.tsx");
    expect(marketplace).not.toMatch(/REVIEW_POOL|getReviewsForSkill|stats\.rating|stats\.reviews/);
    expect(detail).not.toMatch(/Write a Review|Submit Review|StarRating/);
    expect(detail).toContain("No verified user feedback has been collected");
  });
});
