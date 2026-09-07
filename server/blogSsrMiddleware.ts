/**
 * SSR Middleware — Injects Open Graph / Twitter meta tags into the HTML
 * template for blog pages so that social crawlers (which do not execute JS)
 * see the correct per-post metadata.
 *
 * Intercepts:
 *   GET /blog              → blog index meta
 *   GET /blog/:slug        → individual post meta
 *   GET /blog/preview/:token → preview draft meta
 */

import { type Express, type Request, type Response, type NextFunction } from "express";
import * as blogDb from "./blogDb";

const SITE_NAME = "Nexus OS";
const CANONICAL_BASE = "https://www.aiagents.nexus";
const DEFAULT_OG_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663030909471/NRmiWdZq2JgxyAQQ5B7Zs7/nexus-og-image-o46qyMzfRYT4aVx7XCV5ub.png";

function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[>*_`~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildMetaTags(meta: {
  title: string;
  description: string;
  url: string;
  image: string;
  imageAlt?: string;
  type?: string;
  publishedTime?: string;
  author?: string;
  markdownPath?: string;
  robots?: string;
  jsonLd?: object | object[];
}): string {
  const tags: string[] = [];
  const e = escapeHtml;

  // Primary
  tags.push(`<meta property="og:title" content="${e(meta.title)}" />`);
  tags.push(`<meta property="og:description" content="${e(meta.description)}" />`);
  tags.push(`<meta property="og:url" content="${e(meta.url)}" />`);
  tags.push(`<meta property="og:image" content="${e(meta.image)}" />`);
  tags.push(`<meta property="og:type" content="${meta.type ?? "article"}" />`);
  tags.push(`<meta property="og:site_name" content="${e(SITE_NAME)}" />`);

  if (meta.imageAlt) {
    tags.push(`<meta property="og:image:alt" content="${e(meta.imageAlt)}" />`);
  }
  if (meta.publishedTime) {
    tags.push(`<meta property="article:published_time" content="${e(meta.publishedTime)}" />`);
  }
  if (meta.author) {
    tags.push(`<meta property="article:author" content="${e(meta.author)}" />`);
  }

  // Twitter
  tags.push(`<meta name="twitter:card" content="summary_large_image" />`);
  tags.push(`<meta name="twitter:title" content="${e(meta.title)}" />`);
  tags.push(`<meta name="twitter:description" content="${e(meta.description)}" />`);
  tags.push(`<meta name="twitter:image" content="${e(meta.image)}" />`);

  // Description
  tags.push(`<meta name="description" content="${e(meta.description)}" />`);
  tags.push(`<meta name="robots" content="${e(meta.robots ?? "index,follow")}" />`);
  tags.push(`<link rel="canonical" href="${e(meta.url)}" />`);
  tags.push(
    `<link rel="alternate" type="text/markdown" href="${e(CANONICAL_BASE + (meta.markdownPath ?? "/docs-markdown/site/blog.md"))}" />`
  );
  tags.push(
    `<link rel="describedby" type="text/markdown" href="${CANONICAL_BASE}/llms.txt" />`
  );
  if (meta.jsonLd) {
    tags.push(
      `<script type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c")}</script>`
    );
  }

  // Title
  tags.push(`<title>${e(meta.title)}</title>`);

  return tags.join("\n    ");
}

function injectMetaIntoHtml(html: string, metaTags: string): string {
  // Replace existing <title>...</title> and default OG tags in the <head>
  // Strategy: insert our tags right after <head> and remove the defaults
  let result = html;

  // Remove existing title tag
  result = result.replace(/<title>[^<]*<\/title>/, "");

  // Remove existing og: and twitter: meta tags
  result = result.replace(/<meta\s+(?:property="og:|name="twitter:|name="description")[^>]*\/?\s*>/g, "");

  // Insert new meta tags after <head>
  result = result.replace(/<head>/, `<head>\n    ${metaTags}`);

  return result;
}

/**
 * Register SSR middleware on the Express app.
 * MUST be called BEFORE the Vite/static catch-all handler.
 */
export function registerBlogSsrMiddleware(app: Express) {
  // Blog index page
  app.get("/blog", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const meta = buildMetaTags({
        title: `Blog — ${SITE_NAME}`,
        description:
          "News, tutorials, deep dives, and engineering insights about AI agent orchestration.",
        url: `${CANONICAL_BASE}/blog`,
        image: DEFAULT_OG_IMAGE,
        type: "website",
        markdownPath: "/docs-markdown/site/blog.md",
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Nexus OS Blog",
          description: "News, tutorials, deep dives, and engineering insights about AI agent orchestration.",
          url: `${CANONICAL_BASE}/blog`,
        },
      });

      // Store meta in res.locals so the Vite/static handler can inject it
      res.locals.blogMeta = meta;
      res.locals.agentBody = `<main id="agent-readable-content" data-server-rendered="true"><article><h1>Nexus OS Blog</h1><p>News, tutorials, deep dives, and engineering insights about AI agent orchestration.</p><p><a href="/api/blog/feed.xml">Atom feed</a> · <a href="/docs-markdown/site/blog.md">Markdown overview</a></p></article></main>`;
      next();
    } catch {
      next();
    }
  });

  // Blog post page
  app.get("/blog/:slug", async (req: Request, res: Response, next: NextFunction) => {
    const { slug } = req.params;

    // Skip feed.xml, sitemap.xml, and preview routes
    if (slug === "feed.xml" || slug === "sitemap.xml" || slug === "preview" || slug === "api") {
      return next();
    }

    try {
      const post = await blogDb.getBlogPostBySlug(slug);
      if (!post) return next();

      const ogImage = post.ogImageOverride || post.featuredImageUrl || DEFAULT_OG_IMAGE;

      const meta = buildMetaTags({
        title: `${post.title} — ${SITE_NAME}`,
        description: post.excerpt,
        url: `${CANONICAL_BASE}/blog/${post.slug}`,
        image: ogImage,
        imageAlt: post.featuredImageAlt ?? undefined,
        type: "article",
        publishedTime: post.publishedAt
          ? new Date(post.publishedAt).toISOString()
          : undefined,
        author: post.author,
        markdownPath: `/api/blog/${post.slug}.md`,
        jsonLd: [
          {
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: post.title,
            description: post.excerpt,
            url: `${CANONICAL_BASE}/blog/${post.slug}`,
            image: ogImage,
            author: { "@type": "Person", name: post.author },
            datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
            dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
            isPartOf: { "@type": "Blog", name: "Nexus OS Blog", url: `${CANONICAL_BASE}/blog` },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: `${CANONICAL_BASE}/` },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${CANONICAL_BASE}/blog` },
              { "@type": "ListItem", position: 3, name: post.title, item: `${CANONICAL_BASE}/blog/${post.slug}` },
            ],
          },
        ],
      });

      res.locals.blogMeta = meta;
      res.locals.agentBody = `<main id="agent-readable-content" data-server-rendered="true"><article><h1>${escapeHtml(post.title)}</h1><p>${escapeHtml(post.excerpt)}</p><p><strong>Author:</strong> ${escapeHtml(post.author)}</p><p>${escapeHtml(markdownToPlainText(post.content))}</p><p><a href="/api/blog/${escapeHtml(post.slug)}.md">Markdown version</a></p></article></main>`;
      next();
    } catch {
      next();
    }
  });

  // Preview page
  app.get(
    "/blog/preview/:token",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const draft = await blogDb.getBlogPreviewDraft(req.params.token);
        if (!draft) return next();

        const data = draft.data as Record<string, string>;

        const meta = buildMetaTags({
          title: `Preview: ${data.title || "Untitled"} — ${SITE_NAME}`,
          description: data.excerpt || "Draft preview",
          url: `${CANONICAL_BASE}/blog/preview/${req.params.token}`,
          image: data.featuredImageUrl || DEFAULT_OG_IMAGE,
          type: "article",
          robots: "noindex,nofollow",
        });

        res.locals.blogMeta = meta;
        next();
      } catch {
        next();
      }
    }
  );
}
