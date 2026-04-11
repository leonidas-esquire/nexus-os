import React, { useState, useCallback, useMemo } from "react";
import { Check, Copy } from "lucide-react";

// Simple markdown-to-JSX renderer for documentation pages
// Supports: headings, code blocks, inline code, tables, lists, bold, links, paragraphs, horizontal rules

interface MarkdownRendererProps {
  content: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
      title="Copy code"
    >
      {copied ? <Check className="w-4 h-4 text-nexus-green" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

interface ParsedBlock {
  type: "heading" | "code" | "table" | "paragraph" | "list" | "hr";
  level?: number;
  lang?: string;
  text?: string;
  rows?: string[][];
  items?: string[];
  ordered?: boolean;
  id?: string;
}

function parseMarkdown(content: string): ParsedBlock[] {
  const lines = content.split("\n");
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      blocks.push({ type: "heading", level, text, id });
      i++;
      continue;
    }

    // Code block
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: "code", lang: lang || undefined, text: codeLines.join("\n") });
      continue;
    }

    // Table
    if (line.includes("|") && i + 1 < lines.length && lines[i + 1].match(/^\|?\s*[-:]+/)) {
      const rows: string[][] = [];
      // Header row
      rows.push(
        line
          .split("|")
          .map((c) => c.trim())
          .filter((c) => c !== "")
      );
      i++; // skip separator
      i++;
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(
          lines[i]
            .split("|")
            .map((c) => c.trim())
            .filter((c) => c !== "")
        );
        i++;
      }
      blocks.push({ type: "table", rows });
      continue;
    }

    // Unordered list
    if (line.match(/^\s*[-*]\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*[-*]\s+/)) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", items, ordered: false });
      continue;
    }

    // Ordered list
    if (line.match(/^\s*\d+\.\s+/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].match(/^\s*\d+\.\s+/)) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", items, ordered: true });
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph (collect consecutive non-empty lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].match(/^#{1,6}\s/) &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].match(/^\s*[-*]\s+/) &&
      !lines[i].match(/^\s*\d+\.\s+/) &&
      !(lines[i].includes("|") && i + 1 < lines.length && lines[i + 1]?.match(/^\|?\s*[-:]+/))
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", text: paraLines.join(" ") });
    }
  }

  return blocks;
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Process inline elements: bold, inline code, links
  const regex = /(\*\*(.+?)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[1]) {
      // Bold
      parts.push(
        <strong key={key++} className="font-semibold text-foreground">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // Inline code
      parts.push(
        <code
          key={key++}
          className="px-1.5 py-0.5 rounded bg-nexus-surface text-nexus-green font-mono text-[0.85em]"
        >
          {match[4]}
        </code>
      );
    } else if (match[5]) {
      // Link
      parts.push(
        <a
          key={key++}
          href={match[7]}
          className="text-nexus-indigo hover:text-nexus-indigo/80 underline underline-offset-2"
        >
          {match[6]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className="docs-content space-y-5">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "heading": {
            const level = block.level || 1;
            const sizeClasses: Record<number, string> = {
              1: "text-3xl font-bold mt-0 mb-6 pb-3 border-b border-border",
              2: "text-2xl font-bold mt-10 mb-4",
              3: "text-xl font-semibold mt-8 mb-3",
              4: "text-lg font-semibold mt-6 mb-2",
              5: "text-base font-semibold mt-4 mb-2",
              6: "text-sm font-semibold mt-4 mb-2 uppercase tracking-wider text-muted-foreground",
            };
            const className = `${sizeClasses[level]} scroll-mt-20`;
            const children = renderInlineMarkdown(block.text || "");
            return React.createElement(
              `h${level}`,
              { key: idx, id: block.id, className },
              ...children
            );
          }

          case "code":
            return (
              <div key={idx} className="relative group">
                {block.lang && (
                  <div className="absolute top-0 left-0 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-nexus-surface/50 rounded-tl-lg rounded-br-md">
                    {block.lang}
                  </div>
                )}
                <CopyButton text={block.text || ""} />
                <pre className="bg-nexus-deep border border-border rounded-lg p-4 pt-8 overflow-x-auto">
                  <code className="text-sm font-mono text-nexus-green/90 leading-relaxed">
                    {block.text}
                  </code>
                </pre>
              </div>
            );

          case "table":
            return (
              <div key={idx} className="overflow-x-auto my-4">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      {block.rows?.[0]?.map((cell, ci) => (
                        <th
                          key={ci}
                          className="text-left py-2.5 px-3 font-semibold text-foreground bg-nexus-surface/30"
                        >
                          {renderInlineMarkdown(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows?.slice(1).map((row, ri) => (
                      <tr key={ri} className="border-b border-border/50 hover:bg-nexus-surface/20 transition-colors">
                        {row.map((cell, ci) => (
                          <td key={ci} className="py-2.5 px-3 text-muted-foreground">
                            {renderInlineMarkdown(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );

          case "list":
            if (block.ordered) {
              return (
                <ol key={idx} className="list-decimal list-inside space-y-1.5 text-muted-foreground ml-1">
                  {block.items?.map((item, li) => (
                    <li key={li} className="leading-relaxed">
                      {renderInlineMarkdown(item)}
                    </li>
                  ))}
                </ol>
              );
            }
            return (
              <ul key={idx} className="list-disc list-inside space-y-1.5 text-muted-foreground ml-1">
                {block.items?.map((item, li) => (
                  <li key={li} className="leading-relaxed">
                    {renderInlineMarkdown(item)}
                  </li>
                ))}
              </ul>
            );

          case "hr":
            return <hr key={idx} className="border-border my-8" />;

          case "paragraph":
            return (
              <p key={idx} className="text-muted-foreground leading-relaxed">
                {renderInlineMarkdown(block.text || "")}
              </p>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

// Extract headings for table of contents
export function extractHeadings(content: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/^(#{2,4})\s+(.+)/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/\*\*/g, ""); // strip bold markers
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      headings.push({ id, text, level });
    }
  }
  return headings;
}
