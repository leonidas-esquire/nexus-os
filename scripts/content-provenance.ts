import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
const roots = [
  "knowledge",
  "shared",
  "server",
  "scripts",
  "src",
  "client/src/pages/docs",
  "client/src/pages/legal",
  "client/src/pages/marketplace/Registry.tsx",
];
function files(p: string): string[] {
  if (!existsSync(p)) return [];
  try {
    return readdirSync(p, { withFileTypes: true }).flatMap(e =>
      e.isDirectory() ? files(path.join(p, e.name)) : [path.join(p, e.name)]
    );
  } catch {
    return [p];
  }
}
export function contentProvenance() {
  const sources = [...new Set(roots.flatMap(files))]
    .filter(p => /\.(md|json|tsx?|rs)$/.test(p))
    .sort();
  const hash = createHash("sha256");
  for (const file of sources)
    hash
      .update(file + "\0")
      .update(readFileSync(file))
      .update("\0");
  const git = (args: string[], fallback: string) => {
    try {
      return execFileSync("git", args, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      return fallback;
    }
  };
  return {
    sourceDigest: hash.digest("hex"),
    sourceCommit: git(["rev-parse", "HEAD"], "unavailable"),
    sourceModifiedAt: git(
      ["log", "-1", "--format=%cI", "--", ...roots],
      new Date().toISOString()
    ),
    dirty: !!git(["status", "--porcelain", "--", ...roots], "unknown"),
    sources,
    generationOnly: true,
  };
}

export function artifactDigests() {
  const paths = [
    "knowledge",
    "docs-markdown",
    "api-reference",
    "llms.txt",
    "llms-full.txt",
    "openapi.json",
    "agent-routes.json",
    "sitemap-static.xml",
  ]
    .flatMap(p => files(path.join("client/public", p)))
    .sort();
  return Object.fromEntries(
    paths.map(p => [
      p,
      createHash("sha256").update(readFileSync(p)).digest("hex"),
    ])
  );
}
