# AI-Agent Readability Architecture

**Status:** implemented and validated locally  
**Canonical public origin:** `https://www.aiagents.nexus`  
**API origin:** `https://api.aiagents.nexus`  
**Knowledge format:** Open Knowledge Format v0.2

## Objectives

AI Agents Nexus publishes the same authoritative public knowledge through complementary representations. Human-facing React pages remain the primary interactive experience. Static semantic HTML supports agents and crawlers that do not execute JavaScript. Markdown alternatives provide compact page-level context. `llms.txt` provides curated discovery, and the dedicated `knowledge/` directory provides a portable OKF v0.2 bundle with provenance, trust, lifecycle, and freshness metadata.

The Vercel frontend and Railway backend remain separate. Vercel serves static assets, generated HTML, Markdown alternatives, `llms.txt`, the OKF bundle, and the OpenAPI document. Railway continues to serve tRPC, uploads, feeds, health checks, dynamic sitemap data, and database-backed blog or showcase pages.

## Canonical-host policy

The browser-visible production host redirects the apex domain to `www`. All canonical links, sitemap locations, Open Graph URLs, OKF `resource` fields, and `llms.txt` links therefore use `https://www.aiagents.nexus`. API resources use `https://api.aiagents.nexus`. The apex domain remains a redirect-only entry point.

## OKF bundle taxonomy

The repository-root `knowledge/` directory is the only OKF bundle. Other repository Markdown files are not part of the bundle and do not require OKF frontmatter. The reserved root `knowledge/index.md` declares `okf_version: "0.2"` and provides progressive disclosure. Concept documents are grouped by purpose:

| Directory | Concepts |
|---|---|
| `product/` | Nexus OS product, current release, architecture |
| `guides/` | Installation, configuration, deployment |
| `reference/` | CLI, documentation catalog, REST API, tRPC |
| `governance/` | Trust model, security, legal information |
| `community/` | Blog, showcase, marketplace |

Every non-reserved concept document includes `type`, `title`, `description`, `resource`, and `tags`. Authoritative documents also include `owner`, `generated`, process verification, `status`, `stale_after`, and `sources`. Human verification is not asserted automatically; a future human review may add a `human:` verifier.

## Generated public assets

A deterministic build script generates public artifacts from the canonical TypeScript documentation data and the repository OKF source. The prepare stage writes Markdown alternatives, `llms.txt`, `llms-full.txt`, route inventory, OpenAPI, tRPC reference, robots directives, and a static sitemap seed into `client/public`. The post-build stage injects route-specific metadata, JSON-LD, and semantic static content into built HTML for the homepage, documentation, manual, marketplace, showcase shell, and public legal routes.

Database-backed blog and showcase entries are appended to the sitemap at runtime. Railway injects semantic content and route metadata for those dynamic pages before returning the application HTML.

## Discovery relationships

Each prerendered HTML document links to its Markdown equivalent with `rel="alternate" type="text/markdown"` and to `/llms.txt` with `rel="describedby"`. The server may also emit equivalent HTTP `Link` headers. `robots.txt` points to the canonical `/sitemap.xml`; the sitemap covers all public HTML routes, while `llms.txt` intentionally curates only high-value agent resources.

## Validation contract

Automated tests validate OKF v0.2 minimum conformance, generated Markdown availability, `llms.txt` structure, sitemap coverage, canonical URLs, JSON-LD parseability, semantic prerendered HTML, Apache-2.0 consistency, OpenAPI parseability, and tRPC reference completeness. Production verification checks content types and confirms that agent-document paths no longer fall through to the SPA shell.

## References

[Open Knowledge Format v0.2 specification](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)  
[The llms.txt proposal](https://llmstxt.org/)
