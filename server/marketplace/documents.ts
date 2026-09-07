import { Router } from "express";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  skillName,
  skillVersion,
  type RegistryVersion,
} from "../../shared/marketplace";
import { RegistryError } from "./package";
import * as repository from "./repository";
const origin = "https://www.aiagents.nexus";
export const releasePath = (v: Pick<RegistryVersion, "name" | "version">) =>
  `/marketplace/${v.name}/versions/${v.version}`;
export const markdownPath = (v: Pick<RegistryVersion, "name" | "version">) =>
  `/docs-markdown/marketplace/${v.name}/${v.version}.md`;
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!
  );
export function releaseMarkdown(v: RegistryVersion) {
  return `---\ntitle: ${JSON.stringify(`${v.name}@${v.version}`)}\nresource: ${origin}${releasePath(v)}\nstatus: approved\npackage_sha256: ${v.sha256}\nmetadata_source: ${origin}/api/marketplace/skills/${v.name}/${v.version}\n---\n\n# ${v.name}@${v.version}\n\n${v.manifest.description}\n\n## Package identity\n\nPublisher: ${v.publisher}\nLicense: ${v.manifest.license}\nCategory: ${v.manifest.category}\nSize: ${v.size} bytes\nSHA-256: ${v.sha256}\nSubmitted: ${v.createdAt}\nPricing: free\nRuntime: WASIp1 command; exports memory and _start\n\n## Inputs\n\n${v.manifest.inputs}\n\n## Outputs\n\n${v.manifest.outputs}\n\n## Examples (publisher supplied; review before relying on them)\n\n${v.manifest.examples.map((e, i) => `### Example ${i + 1}\n\nInput:\n\n${JSON.stringify(e.input)}\n\nExpected output:\n\n${JSON.stringify(e.output)}`).join("\n\n")}\n\n## Usage and behavior\n\n${v.manifest.readme}\n\n## Installation\n\n\`naos marketplace install ${v.name}@${v.version}\`\n\nUse the package path printed by installation with \`naos create ${v.name} --source PATH\`, then \`naos run ${v.name} --input FILE\`. Use a CLI containing the registry implementation. Installing a file does not execute it.\n\n[WASM package](${origin}/api/marketplace/skills/${v.name}/${v.version}/package) · [Manifest](${origin}/api/marketplace/skills/${v.name}/${v.version}/manifest)\n\n## Execution limits\n\nNexus runner defaults: 64 MiB memory, 30 seconds, 50 million fuel, 1 MiB input and output. No inherited filesystem, network, or environment. CLI flags can adjust supported limits. LLM-independent execution applies to deterministic code implemented in the package.\n\n## Trust and freshness\n\nThis document is generated on request from the approved release record. Approval is a publication review, not certification of every publisher claim. Download integrity is checked separately using SHA-256. Public metadata and downloads become unavailable after revocation; already installed offline copies remain. No usage, earnings, ratings, or security score is inferred.\n`;
}
export function documentHtml(
  template: string,
  title: string,
  canonical: string,
  markdownUrl: string,
  markdown: string,
  entity: object
) {
  const tags = `<title>${escape(title)}</title><link rel="canonical" href="${escape(canonical)}"/><link rel="alternate" type="text/markdown" href="${escape(markdownUrl)}"/><meta name="robots" content="index,follow"/><script type="application/ld+json">${JSON.stringify(entity).replace(/</g, "\\u003c")}</script>`;
  const content = `<main id="agent-readable-content"><article><h1>${escape(title)}</h1><pre style="white-space:pre-wrap">${escape(markdown)}</pre></article></main>`;
  return template
    .replace(
      /<title>[\s\S]*?<\/title>|<meta\s+(?:property="og:|name="twitter:|name="description"|name="robots"|name="dcterms\.|name="nexus:)[^>]*>|<link\s+rel="(?:canonical|alternate|describedby)"[^>]*>|<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/g,
      ""
    )
    .replace("<head>", `<head>${tags}`)
    .replace(
      /<div id="root">[\s\S]*<\/div>\s*(?=<script)/,
      `<div id="root">${content}</div>\n`
    );
}
export function createMarketplaceDocuments(
  repo = repository,
  template = () =>
    readFile(
      path.resolve(
        process.env.NODE_ENV === "production"
          ? path.join(import.meta.dirname, "public/index.html")
          : "client/index.html"
      ),
      "utf8"
    )
) {
  const router = Router();
  const handle =
    (fn: (req: any, res: any) => Promise<void>) =>
    (req: any, res: any, next: any) => {
      void fn(req, res).catch(next);
    };
  router.get(
    ["/marketplace", "/docs-markdown/site/marketplace.md"],
    handle(async (req, res) => {
      const offset = z.coerce
        .number()
        .int()
        .min(0)
        .max(100000)
        .parse(req.query.offset || 0);
      const items = await repo.listReleases({ offset });
      const markdown = `# Approved Nexus OS releases\n\nFree WASIp1 skills submitted by developers and approved for publication. Paid sales and payouts are not enabled.\n\n${items.length ? items.map(v => `* [${v.name}@${v.version}](${origin}${releasePath(v)}) — ${JSON.stringify(v.manifest.description)} · [Markdown](${origin}${markdownPath(v)})`).join("\n") : "No approved releases are available."}\n\n${items.length === 50 ? `[Next page](${origin}/docs-markdown/site/marketplace.md?offset=${offset + 50})` : ""}\n\n[Publish a skill](${origin}/marketplace/developer) · [API reference](${origin}/openapi.json)\n`;
      res.set("Cache-Control", "no-store");
      if (req.path.endsWith(".md")) {
        res.type("text/markdown").send(markdown);
        return;
      }
      res
        .type("html")
        .send(
          documentHtml(
            await template(),
            "Nexus OS skill marketplace",
            origin + "/marketplace",
            origin + "/docs-markdown/site/marketplace.md",
            markdown,
            {
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "Approved Nexus OS releases",
              url: origin + "/marketplace",
            }
          )
        );
    })
  );
  router.get(
    [
      "/marketplace/:name/versions/:version",
      "/marketplace/:name",
      "/docs-markdown/marketplace/:name/:version.md",
    ],
    handle(async (req, res) => {
      if (
        [
          "developer",
          "admin",
          "compare",
          "dependencies",
          "watchlist",
          "leaderboard",
        ].includes(req.params.name)
      ) {
        res
          .set("Cache-Control", "no-store")
          .type("html")
          .send(await template());
        return;
      }
      const name = skillName.parse(req.params.name);
      const version = req.params.version || req.query.version;
      const v = await repo.getRelease(
        name,
        version ? skillVersion.parse(version) : undefined
      );
      res.set({
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        Link: `<${origin}${markdownPath(v)}>; rel="alternate"; type="text/markdown"`,
      });
      const markdown = releaseMarkdown(v);
      if (req.path.endsWith(".md")) {
        res.type("text/markdown").send(markdown);
        return;
      }
      res
        .type("html")
        .send(
          documentHtml(
            await template(),
            `${v.name}@${v.version}`,
            origin + releasePath(v),
            origin + markdownPath(v),
            markdown,
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: v.name,
              softwareVersion: v.version,
              description: v.manifest.description,
              license: v.manifest.license,
              url: origin + releasePath(v),
              downloadUrl: `${origin}/api/marketplace/skills/${v.name}/${v.version}/package`,
            }
          )
        );
    })
  );
  router.use((error: unknown, _req: any, res: any, _next: any) => {
    res
      .status(
        error instanceof RegistryError
          ? error.status
          : error instanceof z.ZodError
            ? 400
            : 503
      )
      .set("Cache-Control", "no-store")
      .json({
        error:
          error instanceof RegistryError
            ? error.message
            : "Marketplace document unavailable",
      });
  });
  return router;
}
