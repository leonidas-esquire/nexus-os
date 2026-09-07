import { Router } from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import * as blogDb from "./blogDb";
import { listApprovedReleaseIdentities } from "./marketplace/repository";
import * as showcaseDb from "./showcaseDb";

const CANONICAL_ORIGIN = "https://www.aiagents.nexus";

type AgentRouteManifestEntry = {
  route: string;
  title: string;
  description: string;
  markdownPath: string;
  schemaType: string;
  noindex?: boolean;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function publicAssetPath(file: string): string {
  const root =
    process.env.NODE_ENV === "production"
      ? path.resolve(import.meta.dirname, "public")
      : path.resolve(import.meta.dirname, "..", "client", "public");
  return path.join(root, file);
}

async function readRouteManifest(): Promise<AgentRouteManifestEntry[]> {
  const raw = await readFile(publicAssetPath("agent-routes.json"), "utf8");
  return JSON.parse(raw) as AgentRouteManifestEntry[];
}

function sitemapEntry(input: {
  route: string;
  lastModified?: Date | string | null;
  changeFrequency?: "daily" | "weekly" | "monthly";
  priority?: number;
}): string {
  const lastModified = input.lastModified
    ? `\n    <lastmod>${new Date(input.lastModified).toISOString()}</lastmod>`
    : "";
  const changeFrequency = input.changeFrequency
    ? `\n    <changefreq>${input.changeFrequency}</changefreq>`
    : "";
  const priority =
    input.priority !== undefined
      ? `\n    <priority>${input.priority.toFixed(1)}</priority>`
      : "";
  return `  <url>\n    <loc>${escapeXml(`${CANONICAL_ORIGIN}${input.route}`)}</loc>${lastModified}${changeFrequency}${priority}\n  </url>`;
}

export const agentDiscoveryRouter = Router();

agentDiscoveryRouter.get("/api/sitemap.xml", async (_req, res) => {
  try {
    const [manifest, blogResult, showcaseResult, releases, provenance] = await Promise.all([
      readRouteManifest(),
      blogDb.getBlogPosts({ limit: 9999 }),
      showcaseDb.getShowcaseProjects({ limit: 9999, sort: "newest" }),
      listApprovedReleaseIdentities(),
      readFile(publicAssetPath("content-provenance.json"),"utf8").then(JSON.parse),
    ]);

    const entries = new Map<string, string>();
    for (const page of manifest) {
      entries.set(
        page.route,
        sitemapEntry({
          route: page.route,
          lastModified: provenance.sourceModifiedAt,
          changeFrequency: page.route.startsWith("/docs") ? "weekly" : "monthly",
          priority: page.route === "/" ? 1 : page.route.startsWith("/docs") ? 0.8 : 0.6,
        })
      );
    }

    for (const release of releases) {
      const route=`/marketplace/${release.name}/versions/${release.version}`;
      entries.set(route,sitemapEntry({route,lastModified:release.createdAt,priority:0.6}));
    }
    for (const post of blogResult) {
      const route = `/blog/${post.slug}`;
      entries.set(
        route,
        sitemapEntry({
          route,
          lastModified: post.updatedAt ?? post.publishedAt,
          changeFrequency: "weekly",
          priority: 0.7,
        })
      );
    }

    for (const project of showcaseResult.projects) {
      const route = `/showcase/${project.slug}`;
      entries.set(
        route,
        sitemapEntry({
          route,
          lastModified: project.updatedAt ?? project.approvedAt,
          changeFrequency: "weekly",
          priority: 0.6,
        })
      );
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Array.from(entries.values()).join("\n")}\n</urlset>\n`;
    res
      .status(200)
      .set({
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      })
      .send(xml);
  } catch (error) {
    console.error("[Agent Discovery] sitemap generation failed", error);
    res.status(500).type("text/plain").send("Unable to generate sitemap");
  }
});

agentDiscoveryRouter.get("/openapi.json", async (_req, res) => {
  try {
    const document = await readFile(publicAssetPath("openapi.json"), "utf8");
    res
      .status(200)
      .set({
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      })
      .send(document);
  } catch (error) {
    console.error("[Agent Discovery] OpenAPI document unavailable", error);
    res.status(404).json({ error: "OpenAPI document not found" });
  }
});

agentDiscoveryRouter.get("/.well-known/ai-plugin.json", (_req, res) => {
  res.status(404).json({
    error: "No AI plugin manifest is published",
    guidance: `${CANONICAL_ORIGIN}/llms.txt`,
  });
});
