import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Search, FileText, X } from "lucide-react";
import Fuse from "fuse.js";
import { DOC_SECTIONS } from "./docsData";

interface SearchItem {
  title: string;
  section: string;
  sectionSlug: string;
  pageSlug: string;
  path: string;
  content: string;
  snippet: string;
}

function buildSearchIndex(): SearchItem[] {
  const items: SearchItem[] = [];
  for (const section of DOC_SECTIONS) {
    for (const page of section.pages) {
      // Strip markdown formatting for cleaner search
      const plainContent = page.content
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/#{1,6}\s/g, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[|>-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      items.push({
        title: page.title,
        section: section.title,
        sectionSlug: section.slug,
        pageSlug: page.slug,
        path: `/docs/${section.slug}/${page.slug}`,
        content: plainContent,
        snippet: plainContent.slice(0, 200),
      });
    }
  }
  return items;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-nexus-indigo/30 text-nexus-indigo rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function getSnippetAround(content: string, query: string, radius = 60): string {
  const lower = content.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return content.slice(0, 120) + "...";
  const start = Math.max(0, idx - radius);
  const end = Math.min(content.length, idx + query.length + radius);
  let snippet = content.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < content.length) snippet = snippet + "...";
  return snippet;
}

export default function DocSearch({ onNavigate }: { onNavigate?: () => void }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const searchItems = useMemo(() => buildSearchIndex(), []);

  const fuse = useMemo(
    () =>
      new Fuse(searchItems, {
        keys: [
          { name: "title", weight: 3 },
          { name: "section", weight: 1.5 },
          { name: "content", weight: 1 },
        ],
        threshold: 0.35,
        includeScore: true,
        minMatchCharLength: 2,
      }),
    [searchItems]
  );

  const results = useMemo(() => {
    if (query.length < 2) return [];
    return fuse.search(query).slice(0, 8);
  }, [fuse, query]);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIdx(0);
  }, [results]);

  const handleSelect = useCallback(
    (path: string) => {
      navigate(path);
      setIsOpen(false);
      setQuery("");
      onNavigate?.();
    },
    [navigate, onNavigate]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIdx]) {
      handleSelect(results[selectedIdx].item.path);
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selected = resultsRef.current.children[selectedIdx] as HTMLElement;
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIdx]);

  return (
    <div className="relative">
      {/* Search trigger button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground border border-border hover:border-nexus-indigo/30 hover:bg-nexus-surface/30 transition-colors mb-4"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">Search docs...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-nexus-surface text-[10px] font-mono text-muted-foreground border border-border">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100]" onClick={() => { setIsOpen(false); setQuery(""); }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative max-w-xl mx-auto mt-[15vh] px-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-background border border-border rounded-lg shadow-2xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 border-b border-border">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search documentation..."
                  className="flex-1 py-3.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  autoComplete="off"
                  spellCheck={false}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="p-1 rounded hover:bg-nexus-surface/50 text-muted-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <kbd className="px-1.5 py-0.5 rounded bg-nexus-surface text-[10px] font-mono text-muted-foreground border border-border">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={resultsRef} className="max-h-[50vh] overflow-y-auto">
                {query.length < 2 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Type at least 2 characters to search
                  </div>
                ) : results.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No results found for "{query}"
                  </div>
                ) : (
                  results.map((result, idx) => (
                    <button
                      key={result.item.path}
                      onClick={() => handleSelect(result.item.path)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                        idx === selectedIdx
                          ? "bg-nexus-indigo/10 border-l-2 border-nexus-indigo"
                          : "hover:bg-nexus-surface/30 border-l-2 border-transparent"
                      }`}
                    >
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          {highlightMatch(result.item.title, query)}
                        </div>
                        <div className="text-xs text-nexus-indigo/70 mt-0.5">
                          {result.item.section}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {highlightMatch(getSnippetAround(result.item.content, query), query)}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              {results.length > 0 && (
                <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-nexus-surface border border-border font-mono">↑↓</kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-nexus-surface border border-border font-mono">↵</kbd>
                    select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-nexus-surface border border-border font-mono">esc</kbd>
                    close
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
