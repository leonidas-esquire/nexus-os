import { readFileSync } from "node:fs";
// Legal pages are static JSX. Keep the complete policy text rather than substituting a summary.
export function legalMarkdown(file: string, title: string) {
  const source = readFileSync(file, "utf8");
  const body = source.match(
    /<LegalPageLayout[\s\S]*?>\s*([\s\S]*?)<\/LegalPageLayout>/
  )?.[1];
  if (!body) throw new Error(`Cannot extract legal policy: ${file}`);
  const entities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ldquo: "“",
    rdquo: "”",
    lsquo: "‘",
    rsquo: "’",
    mdash: "—",
    ndash: "–",
    copy: "©",
  };
  const text = body
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\{" "\}/g, " ")
    .replace(/<h([1-6])[^>]*>/g, (_, n) => "\n\n" + "#".repeat(Number(n)) + " ")
    .replace(/<\/h[1-6]>/g, "\n\n")
    .replace(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g, "[$2]($1)")
    .replace(/<li[^>]*>/g, "\n- ")
    .replace(/<\/(?:p|ul|ol|section|div)>/g, "\n\n")
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&([a-z]+);/g, (all, key) => entities[key] ?? all)
    .replace(/[ \t]+/g, " ")
    .replace(/\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return `# ${title}\n\n${text}\n`;
}
