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

## Integrated registry and content contracts

PR #18 incorporates the PR #19 readability work. The authoritative marketplace routes now query approved database releases at request time. No build imports `marketplaceData.ts`. Public release HTML, Markdown, JSON metadata and manifests share the same version record. Revocation returns 404 for release documents and manifests and removes the release from the live catalog/sitemap. Responses disable caching. A migration/storage outage is a 503, not an empty success claim.

Public paths:

- `/marketplace/NAME/versions/VERSION`: version-specific HTML, canonical URL and JSON-LD.
- `/docs-markdown/marketplace/NAME/VERSION.md`: complete manifest description, inputs, outputs, examples, README, runtime limits, download links and trust boundaries.
- `/docs-markdown/site/marketplace.md?offset=0`: live approved catalog, 50 results per page.
- `/api/marketplace/skills/NAME/VERSION/manifest`: original immutable manifest as JSON.
- `/docs-markdown/showcase/SLUG.md`: full approved showcase description.
- `/docs-markdown/blog/SLUG.md`: full published blog content; the existing `/api/blog/SLUG.md` is also available.

Legal Markdown is generated from the complete static legal page text. This does not constitute a new legal review or approval of existing policy language.

All 28 tRPC procedures now have runtime output validators. JSON Schemas are extracted from each actual procedure's input and output schemas, with coverage checks that fail for unlisted procedures. Date schemas explicitly document SuperJSON Date semantics. Read-only client examples are exercised against a real HTTP tRPC server. REST OpenAPI includes marketplace paths, ownership/admin permissions, multipart upload shape, pagination, version selection, and error statuses. The manifest's IO descriptions and examples are required publisher disclosures; approval does not silently upgrade them to independently proven behavior.

### Freshness and evidence

`content-provenance.json` records the source SHA-256 digest, Git commit, source modification time, and whether the source tree was dirty. It explicitly states that it describes generation only. Historical process-check timestamps in the knowledge sources are not presented as current human verification.

`pnpm agent:freshness` detects stale generated source digests and overdue human review. Add `--remote` to compare the documented release with the GitHub release API. Failed remote lookup fails the check; it does not silently report freshness. CI runs on PRs, main changes, published releases, Mondays, and manual dispatch. The full contract/test suite runs against disposable MySQL. Reports and provenance are retained as CI artifacts for 90 days. Release publication causes a checkout of main so a tagged source snapshot cannot hide stale current documentation.

Human review is supplemental. `docs/reviews/content-policy.json` records a 90-day interval and an initial deadline of December 6, 2026. Its empty review list deliberately claims no completed human review. After a real review, add an append-only record containing `reviewer: human:...`, `reviewedAt`, the reviewed content's `sourceDigest`, and a durable `evidenceUrl`. A rebuild never advances this deadline. Review records are excluded from the content hash to avoid a self-referential digest. Changed content is explicitly reported as outside the last review's coverage, even before its calendar deadline.

To update a release: verify the release artifacts and notes, change the documented release in `knowledge/product/release.md`, regenerate and run the full checks. Do not automatically claim all source features exist in that release's binaries. The capability-status document preserves this distinction.
