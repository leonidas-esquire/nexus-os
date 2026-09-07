import { type Express, type NextFunction, type Request, type Response } from "express";
import * as showcaseDb from "./showcaseDb";

const CANONICAL_ORIGIN = "https://www.aiagents.nexus";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function showcaseMeta(input: {
  title: string;
  description: string;
  route: string;
  markdownPath: string;
  image?: string | null;
  jsonLd: object | object[];
}): string {
  const canonical = `${CANONICAL_ORIGIN}${input.route}`;
  const image = input.image || `${CANONICAL_ORIGIN}/favicon.ico`;
  return [
    `<title>${escapeHtml(input.title)}</title>`,
    `<meta name="description" content="${escapeHtml(input.description)}" />`,
    `<meta name="robots" content="index,follow" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<link rel="alternate" type="text/markdown" href="${CANONICAL_ORIGIN}${input.markdownPath}" />`,
    `<link rel="describedby" type="text/markdown" href="${CANONICAL_ORIGIN}/llms.txt" />`,
    `<meta property="og:title" content="${escapeHtml(input.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(input.description)}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:image" content="${escapeHtml(image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(input.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(input.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(image)}" />`,
    `<script type="application/ld+json">${JSON.stringify(input.jsonLd).replace(/</g, "\\u003c")}</script>`,
  ].join("\n    ");
}

export function registerShowcaseSsrMiddleware(app: Express) {
  app.get("/showcase/:slug", async (req: Request, res: Response, next: NextFunction) => {
    if (req.params.slug === "submit") return next();
    try {
      const project = await showcaseDb.getShowcaseProjectBySlug(req.params.slug);
      if (!project || (project.status !== "approved" && project.status !== "featured")) {
        return next();
      }

      const description = project.tagline || project.description.slice(0, 220);
      const features = parseJsonArray(
        typeof project.featuresUsed === "string" ? project.featuresUsed : null
      );
      const route = `/showcase/${project.slug}`;
      const canonical = `${CANONICAL_ORIGIN}${route}`;
      res.locals.blogMeta = showcaseMeta({
        title: `${project.title} — Nexus OS Showcase`,
        description,
        route,
        markdownPath: `/docs-markdown/showcase/${project.slug}.md`,
        image: project.screenshotUrl,
        jsonLd: [
          {
            "@context": "https://schema.org",
            "@type": "SoftwareSourceCode",
            name: project.title,
            description,
            url: canonical,
            creator: { "@type": "Person", name: project.authorName },
            keywords: features,
            dateModified: new Date(project.updatedAt).toISOString(),
            isPartOf: {
              "@type": "CollectionPage",
              name: "Nexus OS Community Showcase",
              url: `${CANONICAL_ORIGIN}/showcase`,
            },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${CANONICAL_ORIGIN}/` },
              { "@type": "ListItem", position: 2, name: "Showcase", item: `${CANONICAL_ORIGIN}/showcase` },
              { "@type": "ListItem", position: 3, name: project.title, item: canonical },
            ],
          },
        ],
      });

      res.locals.agentBody = `<main id="agent-readable-content" data-server-rendered="true">
  <nav aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/showcase">Showcase</a></nav>
  <article>
    <h1>${escapeHtml(project.title)}</h1>
    <p>${escapeHtml(description)}</p>
    <p><strong>Author:</strong> ${escapeHtml(project.authorName)}</p>
    ${features.length > 0 ? `<h2>Nexus OS features used</h2><ul>${features.map(feature => `<li>${escapeHtml(feature)}</li>`).join("")}</ul>` : ""}
    <h2>Project description</h2>
    <p>${escapeHtml(project.description)}</p>
    <p><a href="/docs-markdown/site/showcase.md">Markdown showcase guide</a></p>
  </article>
</main>`;
      next();
    } catch (error) {
      console.error("[Showcase SSR] failed", error);
      next();
    }
  });
}
