import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";
import { DOC_SECTIONS, getFlatPages } from "../client/src/pages/docs/docsData";
import { ALL_MANUAL_SECTIONS, getFlatManualPages } from "../client/src/pages/docs/manualData";
import { SKILLS } from "../client/src/pages/marketplace/marketplaceData";
import {
  buildOpenApiDocument,
  buildTrpcProceduresDocument,
  buildTrpcReferenceMarkdown,
} from "./agent-api-reference";

const ROOT = process.cwd();
const CLIENT_PUBLIC = path.join(ROOT, "client", "public");
const CANONICAL_ORIGIN = "https://www.aiagents.nexus";
const API_ORIGIN = "https://api.aiagents.nexus";
const GENERATED_AT = "2026-09-07T09:13:03Z";
const DEFAULT_OG_IMAGE =
  "https://d2xsxph8kpxj0f.cloudfront.net/310419663030909471/NRmiWdZq2JgxyAQQ5B7Zs7/nexus-og-image-o46qyMzfRYT4aVx7XCV5ub.png";

type SchemaType =
  | "WebPage"
  | "TechArticle"
  | "CollectionPage"
  | "SoftwareApplication";

export type AgentRoute = {
  route: string;
  title: string;
  description: string;
  markdownPath: string;
  markdown: string;
  schemaType: SchemaType;
  noindex?: boolean;
};

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function cleanDescription(markdown: string, fallback: string): string {
  const cleaned = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^#{1,6}\s+.+$/gm, " ")
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    .replace(/[|>*_`~\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return (cleaned || fallback).slice(0, 220);
}

function markdownDocument(input: {
  title: string;
  description: string;
  canonicalRoute: string;
  body: string;
}): string {
  return `---
title: ${yamlString(input.title)}
description: ${yamlString(input.description)}
resource: ${CANONICAL_ORIGIN}${input.canonicalRoute}
generated: { by: "process:nexus-agent-assets", at: ${GENERATED_AT} }
status: stable
---

${input.body.trim()}
`;
}

const homeMarkdown = markdownDocument({
  title: "Nexus OS — AI Agent Orchestration Platform",
  description:
    "Open-source Rust CLI and web platform for supervising, coordinating, observing, and governing AI-agent systems.",
  canonicalRoute: "/",
  body: `# Nexus OS

Nexus OS is the orchestration layer for AI agents. It provides a Rust CLI for agent lifecycle management, supervisors, sagas, workflows, pools, cost controls, trust verification, broker routing, audit trails, dashboards, and edge-deployment workflows.

## Current release

The current stable release is **v0.3.1**. Nexus OS is licensed under the **Apache License 2.0**.

## Install

\`\`\`bash
cargo install --git https://github.com/leonidas-esquire/nexus-os.git
naos --version
\`\`\`

## Primary resources

| Resource | URL |
|---|---|
| Documentation | ${CANONICAL_ORIGIN}/docs |
| User manual | ${CANONICAL_ORIGIN}/docs/manual |
| OKF knowledge bundle | ${CANONICAL_ORIGIN}/knowledge/index.md |
| GitHub repository | https://github.com/leonidas-esquire/nexus-os |
| REST API description | ${API_ORIGIN}/openapi.json |
| tRPC reference | ${CANONICAL_ORIGIN}/api-reference/trpc.md |
`,
});

const legalIndexMarkdown = markdownDocument({
  title: "Legal — Nexus OS",
  description: "Legal documents and policies for Nexus OS and AI Agents Nexus.",
  canonicalRoute: "/legal",
  body: `# Legal

Nexus OS is licensed under the Apache License 2.0. The public website provides separate Terms of Service and Privacy Policy documents.

## Documents

* [Terms of Service](${CANONICAL_ORIGIN}/legal/terms)
* [Privacy Policy](${CANONICAL_ORIGIN}/legal/privacy)
* [Apache License 2.0](https://github.com/leonidas-esquire/nexus-os/blob/main/LICENSE)
`,
});

const termsMarkdown = markdownDocument({
  title: "Terms of Service — Nexus OS",
  description: "Terms governing use of the Nexus OS website and related services.",
  canonicalRoute: "/legal/terms",
  body: `# Terms of Service

The authoritative Terms of Service are presented on the corresponding public HTML page. This Markdown representation provides a stable agent-discovery endpoint and links to that canonical resource.

[Read the Terms of Service](${CANONICAL_ORIGIN}/legal/terms)
`,
});

const privacyMarkdown = markdownDocument({
  title: "Privacy Policy — Nexus OS",
  description: "Privacy practices for the Nexus OS website and related services.",
  canonicalRoute: "/legal/privacy",
  body: `# Privacy Policy

The authoritative Privacy Policy is presented on the corresponding public HTML page. This Markdown representation provides a stable agent-discovery endpoint and links to that canonical resource.

[Read the Privacy Policy](${CANONICAL_ORIGIN}/legal/privacy)
`,
});

const marketplaceMarkdown = markdownDocument({
  title: "Nexus OS Skill Marketplace",
  description: "Discover and publish WASM skills for Nexus OS agent workflows.",
  canonicalRoute: "/marketplace",
  body: `# Nexus OS Skill Marketplace

The marketplace provides skill discovery and developer publishing workflows for Nexus OS WASM skills. Publisher-supplied descriptions and metrics are claims from the corresponding publisher and should not be interpreted as independent verification by AI Agents Nexus.

* [Marketplace](${CANONICAL_ORIGIN}/marketplace)
* [Developer portal](${CANONICAL_ORIGIN}/marketplace/developer)
* [Dependency explorer](${CANONICAL_ORIGIN}/marketplace/dependencies)
`,
});

const showcaseMarkdown = markdownDocument({
  title: "Nexus OS Community Showcase",
  description: "Approved community projects built with Nexus OS.",
  canonicalRoute: "/showcase",
  body: `# Community Showcase

The showcase presents approved projects submitted by the Nexus OS community. Project detail pages contain author-provided descriptions, declared features, external links, and screenshots when available.

* [Browse the showcase](${CANONICAL_ORIGIN}/showcase)
* [Submit a project](${CANONICAL_ORIGIN}/showcase/submit)
`,
});

const blogMarkdown = markdownDocument({
  title: "Nexus OS Blog",
  description: "Articles, tutorials, announcements, and engineering updates from AI Agents Nexus.",
  canonicalRoute: "/blog",
  body: `# Nexus OS Blog

The blog publishes public articles about AI-agent orchestration and Nexus OS. Discover current entries through the canonical sitemap and Atom feed.

* [Blog](${CANONICAL_ORIGIN}/blog)
* [Atom feed](${CANONICAL_ORIGIN}/api/blog/feed.xml)
`,
});

export function createRoutes(): AgentRoute[] {
  const routes: AgentRoute[] = [
    {
      route: "/",
      title: "Nexus OS — AI Agent Orchestration Platform",
      description:
        "Open-source Rust CLI and web platform for supervising, coordinating, observing, and governing AI-agent systems.",
      markdownPath: "/docs-markdown/site/home.md",
      markdown: homeMarkdown,
      schemaType: "SoftwareApplication",
    },
  ];

  const docs = getFlatPages();
  const defaultDoc = docs[0];
  if (defaultDoc) {
    const description = cleanDescription(defaultDoc.content, defaultDoc.pageTitle);
    const markdownPath = `/docs-markdown/docs/${defaultDoc.sectionSlug}/${defaultDoc.pageSlug}.md`;
    routes.push({
      route: "/docs",
      title: `${defaultDoc.pageTitle} — Nexus OS Documentation`,
      description,
      markdownPath,
      markdown: markdownDocument({
        title: defaultDoc.pageTitle,
        description,
        canonicalRoute: "/docs",
        body: defaultDoc.content,
      }),
      schemaType: "TechArticle",
    });
  }

  for (const page of docs) {
    const route = `/docs/${page.sectionSlug}/${page.pageSlug}`;
    const description = cleanDescription(page.content, page.pageTitle);
    routes.push({
      route,
      title: `${page.pageTitle} — Nexus OS Documentation`,
      description,
      markdownPath: `/docs-markdown/docs/${page.sectionSlug}/${page.pageSlug}.md`,
      markdown: markdownDocument({
        title: page.pageTitle,
        description,
        canonicalRoute: route,
        body: page.content,
      }),
      schemaType: "TechArticle",
    });
  }

  const manual = getFlatManualPages();
  const defaultManual = manual[0];
  if (defaultManual) {
    const description = cleanDescription(defaultManual.content, defaultManual.pageTitle);
    const markdownPath = `/docs-markdown/manual/${defaultManual.sectionSlug}/${defaultManual.pageSlug}.md`;
    routes.push({
      route: "/docs/manual",
      title: `${defaultManual.pageTitle} — Nexus OS User Manual`,
      description,
      markdownPath,
      markdown: markdownDocument({
        title: defaultManual.pageTitle,
        description,
        canonicalRoute: "/docs/manual",
        body: defaultManual.content,
      }),
      schemaType: "TechArticle",
    });
  }

  for (const page of manual) {
    const route = `/docs/manual/${page.sectionSlug}/${page.pageSlug}`;
    const description = cleanDescription(page.content, page.pageTitle);
    routes.push({
      route,
      title: `${page.pageTitle} — Nexus OS User Manual`,
      description,
      markdownPath: `/docs-markdown/manual/${page.sectionSlug}/${page.pageSlug}.md`,
      markdown: markdownDocument({
        title: page.pageTitle,
        description,
        canonicalRoute: route,
        body: page.content,
      }),
      schemaType: "TechArticle",
    });
  }

  const staticPages: Array<Omit<AgentRoute, "markdownPath"> & { markdownPath: string }> = [
    {
      route: "/marketplace",
      title: "Nexus OS Skill Marketplace",
      description: "Discover and publish WASM skills for Nexus OS agent workflows.",
      markdownPath: "/docs-markdown/site/marketplace.md",
      markdown: marketplaceMarkdown,
      schemaType: "CollectionPage",
    },
    {
      route: "/showcase",
      title: "Nexus OS Community Showcase",
      description: "Approved community projects built with Nexus OS.",
      markdownPath: "/docs-markdown/site/showcase.md",
      markdown: showcaseMarkdown,
      schemaType: "CollectionPage",
    },
    {
      route: "/showcase/submit",
      title: "Submit a Nexus OS Project",
      description: "Submit a Nexus OS community project for review.",
      markdownPath: "/docs-markdown/site/showcase.md",
      markdown: showcaseMarkdown,
      schemaType: "WebPage",
    },
    {
      route: "/blog",
      title: "Nexus OS Blog",
      description: "Articles, tutorials, announcements, and engineering updates from AI Agents Nexus.",
      markdownPath: "/docs-markdown/site/blog.md",
      markdown: blogMarkdown,
      schemaType: "CollectionPage",
    },
    {
      route: "/legal",
      title: "Legal — Nexus OS",
      description: "Legal documents and policies for Nexus OS and AI Agents Nexus.",
      markdownPath: "/docs-markdown/site/legal.md",
      markdown: legalIndexMarkdown,
      schemaType: "WebPage",
      noindex: true,
    },
    {
      route: "/legal/terms",
      title: "Terms of Service — Nexus OS",
      description: "Terms governing use of the Nexus OS website and related services.",
      markdownPath: "/docs-markdown/site/terms.md",
      markdown: termsMarkdown,
      schemaType: "WebPage",
      noindex: true,
    },
    {
      route: "/legal/privacy",
      title: "Privacy Policy — Nexus OS",
      description: "Privacy practices for the Nexus OS website and related services.",
      markdownPath: "/docs-markdown/site/privacy.md",
      markdown: privacyMarkdown,
      schemaType: "WebPage",
      noindex: true,
    },
  ];

  routes.push(...staticPages);

  const marketplaceUtilityPages: Array<Pick<AgentRoute, "route" | "title" | "description">> = [
    {
      route: "/marketplace/compare",
      title: "Compare Nexus OS Skills",
      description: "Compare declared capabilities and package metadata for Nexus OS WASM skills.",
    },
    {
      route: "/marketplace/developer",
      title: "Nexus OS Marketplace Developer Portal",
      description: "Developer publishing guidance and tooling for Nexus OS WASM skills.",
    },
    {
      route: "/marketplace/dependencies",
      title: "Nexus OS Skill Dependencies",
      description: "Explore declared dependency relationships among Nexus OS skills.",
    },
    {
      route: "/marketplace/leaderboard",
      title: "Nexus OS Marketplace Directory",
      description: "Browse the public Nexus OS skill directory without unverified review claims.",
    },
  ];

  for (const utility of marketplaceUtilityPages) {
    routes.push({
      ...utility,
      markdownPath: "/docs-markdown/site/marketplace.md",
      markdown: marketplaceMarkdown,
      schemaType: "WebPage",
    });
  }

  for (const skill of SKILLS) {
    routes.push({
      route: `/marketplace/${skill.name}`,
      title: `${skill.name} — Nexus OS Skill`,
      description: skill.description,
      markdownPath: "/docs-markdown/site/marketplace.md",
      markdown: marketplaceMarkdown,
      schemaType: "WebPage",
    });
  }

  const publisherHandles = Array.from(
    new Set(SKILLS.map(skill => skill.publisher.handle.replace(/^@/, "")))
  );
  for (const handle of publisherHandles) {
    routes.push({
      route: `/marketplace/publisher/${handle}`,
      title: `${handle} — Nexus OS Marketplace Publisher`,
      description: "Publisher profile and declared Nexus OS skill packages.",
      markdownPath: "/docs-markdown/site/marketplace.md",
      markdown: marketplaceMarkdown,
      schemaType: "WebPage",
    });
  }
  return routes;
}

function docsIndexMarkdown(): string {
  const docs = DOC_SECTIONS.map(
    section =>
      `## ${section.title}\n\n${section.pages
        .map(
          page =>
            `* [${page.title}](${CANONICAL_ORIGIN}/docs-markdown/docs/${section.slug}/${page.slug}.md) - ${cleanDescription(page.content, page.title)}`
        )
        .join("\n")}`
  ).join("\n\n");

  const manual = ALL_MANUAL_SECTIONS.map(
    section =>
      `## Manual: ${section.title}\n\n${section.pages
        .map(
          page =>
            `* [${page.title}](${CANONICAL_ORIGIN}/docs-markdown/manual/${section.slug}/${page.slug}.md) - ${cleanDescription(page.content, page.title)}`
        )
        .join("\n")}`
  ).join("\n\n");

  return `# Nexus OS Markdown Documentation\n\n> Clean Markdown alternatives for every public documentation and manual page.\n\n${docs}\n\n${manual}\n`;
}

function llmsText(): string {
  return `# AI Agents Nexus / Nexus OS

> Nexus OS is an open-source Rust CLI and web platform for supervising, coordinating, observing, and governing AI-agent systems. The canonical website is ${CANONICAL_ORIGIN}, the source repository is https://github.com/leonidas-esquire/nexus-os, and the software license is Apache-2.0.

Use the OKF bundle for structured knowledge and provenance. Use the Markdown documentation catalog for task-specific technical detail. Public website content is authoritative only at the canonical \`www\` origin; API resources are authoritative at ${API_ORIGIN}.

## Start here

* [OKF v0.2 knowledge bundle](${CANONICAL_ORIGIN}/knowledge/index.md) : Structured concepts with provenance, verification, lifecycle, and freshness metadata.
* [Markdown documentation catalog](${CANONICAL_ORIGIN}/docs-markdown/index.md) : Every public documentation and manual page in clean Markdown.
* [Full agent context](${CANONICAL_ORIGIN}/llms-full.txt) : Consolidated product, documentation, and manual content for large-context consumers.
* [Repository README](https://github.com/leonidas-esquire/nexus-os/blob/main/README.md) : Product overview, installation, architecture, roadmap, and contributor entry point.

## Product

* [Product concept](${CANONICAL_ORIGIN}/knowledge/product/nexus-os.md) : Identity, capabilities, license, and canonical resources.
* [Architecture concept](${CANONICAL_ORIGIN}/knowledge/product/architecture.md) : Architectural layers and deployment boundaries.
* [Current release](${CANONICAL_ORIGIN}/knowledge/product/release.md) : Stable release and binary channel.
* [Installation guide](${CANONICAL_ORIGIN}/docs-markdown/docs/getting-started/installation.md) : Cargo, binary, and source installation.

## APIs

* [OpenAPI document](${API_ORIGIN}/openapi.json) : Machine-readable REST API contract.
* [tRPC procedure reference](${CANONICAL_ORIGIN}/api-reference/trpc.md) : Procedure names, access levels, inputs, and outputs.
* [API health](${API_ORIGIN}/api/health) : Railway backend liveness.

## Community and policies

* [Blog](${CANONICAL_ORIGIN}/blog) : Articles and engineering updates.
* [Atom feed](${CANONICAL_ORIGIN}/api/blog/feed.xml) : Machine-readable blog feed.
* [Community showcase](${CANONICAL_ORIGIN}/showcase) : Approved community projects.
* [Skill marketplace](${CANONICAL_ORIGIN}/marketplace) : WASM skill discovery and publishing.
* [Security policy](https://github.com/leonidas-esquire/nexus-os/blob/main/SECURITY.md) : Private vulnerability-reporting guidance.

## Optional

* [Deployment guide](https://github.com/leonidas-esquire/nexus-os/blob/main/DEPLOYMENT.md) : Vercel, Railway, Clerk, MySQL, and environment guidance.
* [GitHub Discussions](https://github.com/leonidas-esquire/nexus-os/discussions) : Community questions and design discussion.
`;
}

function llmsFullText(routes: AgentRoute[]): string {
  const included = routes.filter(
    page =>
      page.route === "/" ||
      page.route.startsWith("/docs") ||
      page.route === "/marketplace" ||
      page.route === "/showcase" ||
      page.route === "/legal"
  );
  return `# AI Agents Nexus / Nexus OS — Full Agent Context

> Consolidated Markdown context generated from the canonical public product documentation and manual. For structured provenance and freshness metadata, begin with ${CANONICAL_ORIGIN}/knowledge/index.md.

${included
  .map(page => {
    const body = matter(page.markdown).content.trim();
    return `---\n\nSource: ${CANONICAL_ORIGIN}${page.route}\nMarkdown: ${CANONICAL_ORIGIN}${page.markdownPath}\n\n${body}`;
  })
  .join("\n\n")}
`;
}

async function writePublic(relativePath: string, content: string): Promise<void> {
  const destination = path.join(CLIENT_PUBLIC, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, content, "utf8");
}

function sitemapXml(routes: AgentRoute[]): string {
  const uniqueRoutes = [...new Set(routes.map(page => page.route))];
  const entries = uniqueRoutes
    .map(
      route => `  <url>
    <loc>${CANONICAL_ORIGIN}${route}</loc>
    <lastmod>2026-09-07</lastmod>
  </url>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

async function prepare(): Promise<void> {
  const routes = createRoutes();
  await rm(path.join(CLIENT_PUBLIC, "knowledge"), { recursive: true, force: true });
  await rm(path.join(CLIENT_PUBLIC, "docs-markdown"), { recursive: true, force: true });
  await cp(path.join(ROOT, "knowledge"), path.join(CLIENT_PUBLIC, "knowledge"), {
    recursive: true,
  });

  for (const page of routes) {
    await writePublic(page.markdownPath.replace(/^\//, ""), page.markdown);
  }

  await writePublic("docs-markdown/index.md", docsIndexMarkdown());
  await writePublic("llms.txt", llmsText());
  await writePublic("llms-full.txt", llmsFullText(routes));
  await writePublic("sitemap-static.xml", sitemapXml(routes));
  const referenceOptions = {
    canonicalOrigin: CANONICAL_ORIGIN,
    apiOrigin: API_ORIGIN,
    generatedAt: GENERATED_AT,
  };
  await writePublic("openapi.json", buildOpenApiDocument(referenceOptions));
  await writePublic(
    "api-reference/trpc.md",
    buildTrpcReferenceMarkdown(referenceOptions)
  );
  await writePublic(
    "api-reference/trpc-procedures.json",
    buildTrpcProceduresDocument(referenceOptions)
  );
  await writePublic(
    "agent-routes.json",
    `${JSON.stringify(
      routes.map(({ markdown, ...page }) => page),
      null,
      2
    )}\n`
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function breadcrumbJsonLd(page: AgentRoute) {
  const segments = page.route.split("/").filter(Boolean);
  const items = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${CANONICAL_ORIGIN}/`,
    },
  ];
  let route = "";
  segments.forEach((segment, index) => {
    route += `/${segment}`;
    items.push({
      "@type": "ListItem",
      position: index + 2,
      name: segment.replace(/-/g, " "),
      item: `${CANONICAL_ORIGIN}${route}`,
    });
  });
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items };
}

function pageJsonLd(page: AgentRoute) {
  if (page.route === "/") {
    return [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "AI Agents Nexus",
        url: CANONICAL_ORIGIN,
        sameAs: ["https://github.com/leonidas-esquire/nexus-os"],
      },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Nexus OS",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "macOS, Linux, Windows via WSL",
        softwareVersion: "0.3.1",
        license: "https://www.apache.org/licenses/LICENSE-2.0",
        url: CANONICAL_ORIGIN,
        codeRepository: "https://github.com/leonidas-esquire/nexus-os",
        description: page.description,
      },
    ];
  }
  return [
    {
      "@context": "https://schema.org",
      "@type": page.schemaType,
      name: page.title,
      headline: page.title,
      description: page.description,
      url: `${CANONICAL_ORIGIN}${page.route}`,
      dateModified: GENERATED_AT,
      isPartOf: {
        "@type": "WebSite",
        name: "AI Agents Nexus",
        url: CANONICAL_ORIGIN,
      },
      about: {
        "@type": "SoftwareApplication",
        name: "Nexus OS",
        softwareVersion: "0.3.1",
      },
    },
    breadcrumbJsonLd(page),
  ];
}

export function injectHead(template: string, page: AgentRoute): string {
  const canonical = `${CANONICAL_ORIGIN}${page.route}`;
  let html = template
    .replace(/<title>[^<]*<\/title>/, "")
    .replace(/<meta\s+(?:property="og:|name="twitter:|name="description"|name="robots")[^>]*\/?\s*>/g, "")
    .replace(/<link\s+rel="(?:canonical|alternate|describedby)"[^>]*\/?\s*>/g, "")
    .replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/g, "");

  const tags = [
    `<title>${escapeHtml(page.title)}</title>`,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
    `<meta name="robots" content="${page.noindex ? "noindex,follow" : "index,follow"}" />`,
    `<meta name="author" content="AI Agents Nexus" />`,
    `<meta name="dcterms.modified" content="${GENERATED_AT}" />`,
    `<meta name="dcterms.source" content="https://github.com/leonidas-esquire/nexus-os" />`,
    `<meta name="nexus:verified-by" content="process:documentation-regression-tests" />`,
    `<meta name="nexus:freshness-date" content="2026-12-06T09:13:03Z" />`,
    `<link rel="canonical" href="${canonical}" />`,
    `<link rel="author" href="https://github.com/leonidas-esquire" />`,
    `<link rel="alternate" type="text/markdown" href="${CANONICAL_ORIGIN}${page.markdownPath}" />`,
    `<link rel="describedby" type="text/markdown" href="${CANONICAL_ORIGIN}/llms.txt" />`,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${DEFAULT_OG_IMAGE}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
    `<meta name="twitter:image" content="${DEFAULT_OG_IMAGE}" />`,
    `<script type="application/ld+json">${JSON.stringify(pageJsonLd(page)).replace(/</g, "\\u003c")}</script>`,
  ];
  return html.replace(/<head>/, `<head>\n    ${tags.join("\n    ")}`);
}

export async function semanticBody(page: AgentRoute): Promise<string> {
  const parsed = matter(page.markdown);
  const content = await marked.parse(parsed.content, { gfm: true });
  return `<main id="agent-readable-content" data-prerendered="true">
  <nav aria-label="Agent resources">
    <a href="${CANONICAL_ORIGIN}/">Home</a>
    <a href="${CANONICAL_ORIGIN}/docs">Documentation</a>
    <a href="${CANONICAL_ORIGIN}/knowledge/index.md">OKF knowledge</a>
    <a href="${CANONICAL_ORIGIN}/llms.txt">LLM index</a>
  </nav>
  <article>${content}</article>
</main>`;
}

export async function prerender(outputDirectory: string): Promise<void> {
  const routes = createRoutes();
  const baseTemplate = await readFile(path.join(outputDirectory, "index.html"), "utf8");
  for (const page of routes) {
    let html = injectHead(baseTemplate, page);
    html = html.replace('<div id="root"></div>', `<div id="root">${await semanticBody(page)}</div>`);
    const destination =
      page.route === "/"
        ? path.join(outputDirectory, "index.html")
        : path.join(outputDirectory, page.route.replace(/^\//, ""), "index.html");
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, html, "utf8");
  }
}

async function main() {
  const mode = process.argv[2] ?? "prepare";
  if (mode === "prepare") {
    await prepare();
    return;
  }
  if (mode === "prerender") {
    const outputArg = process.argv.slice(3).find(arg => arg !== "--") ?? "dist/public";
    const outputDirectory = path.resolve(ROOT, outputArg);
    await prerender(outputDirectory);
    return;
  }
  throw new Error(`Unknown generator mode: ${mode}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
