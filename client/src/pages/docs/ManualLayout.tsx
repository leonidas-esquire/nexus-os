import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ArrowLeft,
  Rocket,
  Bot,
  Network,
  DollarSign,
  Shield,
  Route,
  Globe,
  Cloud,
  LayoutDashboard,
  Terminal,
  Wrench,
  HelpCircle,
  BookOpen,
  Menu,
  X,
  Search,
  FileText,
  Settings,
  Layers,
  GitBranch,
  Workflow,
  Download,
} from "lucide-react";
import {
  ALL_MANUAL_SECTIONS,
  getFlatManualPages,
  type ManualSection,
  type FlatManualPage,
} from "./manualData";
import ThemeToggle from "../../components/ThemeToggle";
import { MarkdownRenderer, extractHeadings } from "./MarkdownRenderer";
import Fuse from "fuse.js";

// ─── Icon Map ──────────────────────────────────────────
const ICON_MAP: Record<string, React.ReactNode> = {
  rocket: <Rocket className="w-4 h-4" />,
  bot: <Bot className="w-4 h-4" />,
  network: <Network className="w-4 h-4" />,
  "dollar-sign": <DollarSign className="w-4 h-4" />,
  shield: <Shield className="w-4 h-4" />,
  route: <Route className="w-4 h-4" />,
  globe: <Globe className="w-4 h-4" />,
  cloud: <Cloud className="w-4 h-4" />,
  "layout-dashboard": <LayoutDashboard className="w-4 h-4" />,
  terminal: <Terminal className="w-4 h-4" />,
  wrench: <Wrench className="w-4 h-4" />,
  "help-circle": <HelpCircle className="w-4 h-4" />,
  "book-open": <BookOpen className="w-4 h-4" />,
  settings: <Settings className="w-4 h-4" />,
  layers: <Layers className="w-4 h-4" />,
  "git-branch": <GitBranch className="w-4 h-4" />,
  workflow: <Workflow className="w-4 h-4" />,
  download: <Download className="w-4 h-4" />,
};

// ─── Helpers ──────────────────────────────────────────
function getPageByPath(
  sectionSlug: string,
  pageSlug: string
): FlatManualPage | undefined {
  return getFlatManualPages().find(
    (p) => p.sectionSlug === sectionSlug && p.pageSlug === pageSlug
  );
}

function getAdjacentPages(
  sectionSlug: string,
  pageSlug: string
): {
  prev: (FlatManualPage & { path: string }) | null;
  next: (FlatManualPage & { path: string }) | null;
} {
  const flat = getFlatManualPages();
  const idx = flat.findIndex(
    (p) => p.sectionSlug === sectionSlug && p.pageSlug === pageSlug
  );
  const prev =
    idx > 0
      ? {
          ...flat[idx - 1],
          path: `/docs/manual/${flat[idx - 1].sectionSlug}/${flat[idx - 1].pageSlug}`,
        }
      : null;
  const next =
    idx < flat.length - 1
      ? {
          ...flat[idx + 1],
          path: `/docs/manual/${flat[idx + 1].sectionSlug}/${flat[idx + 1].pageSlug}`,
        }
      : null;
  return { prev, next };
}

// ─── Manual Search ──────────────────────────────────────────
interface SearchItem {
  title: string;
  section: string;
  sectionSlug: string;
  pageSlug: string;
  path: string;
  content: string;
}

function buildSearchIndex(): SearchItem[] {
  const items: SearchItem[] = [];
  for (const section of ALL_MANUAL_SECTIONS) {
    for (const page of section.pages) {
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
        path: `/docs/manual/${section.slug}/${page.slug}`,
        content: plainContent,
      });
    }
  }
  return items;
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const regex = new RegExp(
    `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
    "gi"
  );
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark
        key={i}
        className="bg-nexus-indigo/30 text-nexus-indigo rounded-sm px-0.5"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function getSnippetAround(
  content: string,
  query: string,
  radius = 60
): string {
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

function ManualSearch({ onNavigate }: { onNavigate?: () => void }) {
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

  useEffect(() => {
    if (resultsRef.current) {
      const selected = resultsRef.current.children[selectedIdx] as HTMLElement;
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIdx]);

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground border border-border hover:border-nexus-indigo/30 hover:bg-nexus-surface/30 transition-colors mb-4"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">Search manual...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-nexus-surface text-[10px] font-mono text-muted-foreground border border-border">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100]"
          onClick={() => {
            setIsOpen(false);
            setQuery("");
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative max-w-xl mx-auto mt-[15vh] px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-background border border-border rounded-lg shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 border-b border-border">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search user manual..."
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

              <div ref={resultsRef} className="max-h-[50vh] overflow-y-auto">
                {query.length < 2 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Type at least 2 characters to search across {searchItems.length} pages
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
                          {highlightMatch(
                            getSnippetAround(result.item.content, query),
                            query
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {results.length > 0 && (
                <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-nexus-surface border border-border font-mono">
                      ↑↓
                    </kbd>
                    navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-nexus-surface border border-border font-mono">
                      ↵
                    </kbd>
                    select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1 py-0.5 rounded bg-nexus-surface border border-border font-mono">
                      esc
                    </kbd>
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

// ─── Sidebar ──────────────────────────────────────────
function ManualSidebar({
  currentSection,
  currentPage,
  onNavigate,
}: {
  currentSection: string;
  currentPage: string;
  onNavigate?: () => void;
}) {
  const [expandedSections, setExpandedSections] = useState<string[]>([
    currentSection,
  ]);

  useEffect(() => {
    setExpandedSections((prev) =>
      prev.includes(currentSection) ? prev : [...prev, currentSection]
    );
  }, [currentSection]);

  const toggleSection = (slug: string) => {
    setExpandedSections((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      } else {
        return [...prev, slug];
      }
    });
  };

  return (
    <nav className="space-y-1">
      <ManualSearch onNavigate={onNavigate} />

      {/* Link back to API docs */}
      <Link href="/docs">
        <span className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-nexus-surface/30 transition-colors mb-2">
          <ArrowLeft className="w-3 h-3" />
          Back to API Docs
        </span>
      </Link>

      <div className="border-b border-border/50 mb-2 pb-2">
        <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          User Manual
        </span>
      </div>

      {ALL_MANUAL_SECTIONS.map((section) => {
        const isExpanded = expandedSections.includes(section.slug);
        const isCurrent = section.slug === currentSection;

        return (
          <div key={section.slug}>
            <button
              onClick={() => toggleSection(section.slug)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isCurrent
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-nexus-surface/50"
              }`}
            >
              <span
                className={
                  isCurrent
                    ? "text-nexus-indigo"
                    : "text-muted-foreground"
                }
              >
                {ICON_MAP[section.icon] || (
                  <BookOpen className="w-4 h-4" />
                )}
              </span>
              <span className="flex-1 text-left">{section.title}</span>
              <span className="text-[10px] text-muted-foreground/60 mr-1">
                {section.pages.length}
              </span>
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </button>

            {isExpanded && (
              <div className="ml-4 pl-3 border-l border-border/50 space-y-0.5 mt-0.5 mb-1">
                {section.pages.map((page) => {
                  const isActive =
                    section.slug === currentSection &&
                    page.slug === currentPage;
                  return (
                    <Link
                      key={page.slug}
                      href={`/docs/manual/${section.slug}/${page.slug}`}
                      onClick={onNavigate}
                    >
                      <span
                        className={`block px-3 py-1.5 rounded-md text-sm transition-colors ${
                          isActive
                            ? "text-nexus-indigo bg-nexus-indigo/10 font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-nexus-surface/30"
                        }`}
                      >
                        {page.title}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ─── Table of Contents ──────────────────────────────────────────
function TableOfContents({ content }: { content: string }) {
  const headings = useMemo(() => extractHeadings(content), [content]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -80% 0px" }
    );

    headings.forEach((h: { id: string; text: string; level: number }) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        On this page
      </h4>
      <nav className="space-y-0.5">
        {headings.map((h: { id: string; text: string; level: number }) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            className={`block text-[13px] py-1 transition-colors ${
              h.level === 3 ? "pl-3" : h.level === 4 ? "pl-6" : ""
            } ${
              activeId === h.id
                ? "text-nexus-indigo font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {h.text}
          </a>
        ))}
      </nav>
    </div>
  );
}

// ─── Main Layout ──────────────────────────────────────────
export default function ManualLayout() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Parse: /docs/manual/:section/:page
  const pathParts = location
    .replace("/docs/manual", "")
    .split("/")
    .filter(Boolean);
  const sectionSlug = pathParts[0] || "introduction";
  const pageSlug = pathParts[1] || "what-is-nexus";

  const page = getPageByPath(sectionSlug, pageSlug);
  const { prev, next } = getAdjacentPages(sectionSlug, pageSlug);

  const flat = getFlatManualPages();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [sectionSlug, pageSlug]);

  const displayPage = page || flat[0];
  const displaySection = page
    ? sectionSlug
    : flat[0]?.sectionSlug || "introduction";
  const displayPageSlug = page
    ? pageSlug
    : flat[0]?.pageSlug || "what-is-nexus";

  // Count total pages
  const totalPages = flat.length;
  const currentPageNum =
    flat.findIndex(
      (p) =>
        p.sectionSlug === displaySection && p.pageSlug === displayPageSlug
    ) + 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-14 gap-4">
          <Link href="/">
            <span className="flex items-center gap-2 text-foreground hover:text-nexus-indigo transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-mono font-bold text-sm tracking-tight">
                NEXUS OS
              </span>
            </span>
          </Link>
          <span className="text-border">/</span>
          <Link href="/docs/manual">
            <span className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors">
              manual
            </span>
          </Link>
          <span className="text-[11px] text-muted-foreground hidden sm:block">
            {currentPageNum} / {totalPages} pages
          </span>
          <div className="flex-1" />
          <Link href="/docs">
            <span className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              API Docs
            </span>
          </Link>
          <Link href="/">
            <span className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Home
            </span>
          </Link>
          <a
            href="https://github.com/leonidas-esquire/nexus-os"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            GitHub
          </a>
          <ThemeToggle />
          <button
            className="lg:hidden p-1.5 rounded-md hover:bg-nexus-surface/50 text-muted-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto flex">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-6 px-4">
          <ManualSidebar
            currentSection={displaySection}
            currentPage={displayPageSlug}
          />
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="absolute left-0 top-14 bottom-0 w-72 bg-background border-r border-border overflow-y-auto py-6 px-4">
              <ManualSidebar
                currentSection={displaySection}
                currentPage={displayPageSlug}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 px-6 sm:px-8 lg:px-12 py-8 max-w-3xl">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
            <Link href="/docs/manual">
              <span className="hover:text-foreground transition-colors">
                Manual
              </span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href={`/docs/manual/${displaySection}/${
                ALL_MANUAL_SECTIONS.find((s) => s.slug === displaySection)
                  ?.pages[0]?.slug || ""
              }`}
            >
              <span className="hover:text-foreground transition-colors">
                {displayPage?.sectionTitle}
              </span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">
              {displayPage?.pageTitle}
            </span>
          </nav>

          {/* Page content */}
          {displayPage && <MarkdownRenderer content={displayPage.content} />}

          {/* Prev / Next navigation */}
          <div className="flex items-stretch gap-4 mt-12 pt-8 border-t border-border">
            {prev ? (
              <Link href={prev.path} className="flex-1">
                <div className="group terminal-border rounded-lg p-4 hover:border-nexus-indigo/30 transition-colors h-full">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <ChevronLeft className="w-3 h-3" />
                    Previous
                  </div>
                  <div className="text-sm font-medium text-foreground group-hover:text-nexus-indigo transition-colors">
                    {prev.pageTitle}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {next ? (
              <Link href={next.path} className="flex-1">
                <div className="group terminal-border rounded-lg p-4 hover:border-nexus-indigo/30 transition-colors text-right h-full">
                  <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground mb-1">
                    Next
                    <ChevronRight className="w-3 h-3" />
                  </div>
                  <div className="text-sm font-medium text-foreground group-hover:text-nexus-indigo transition-colors">
                    {next.pageTitle}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </main>

        {/* Right sidebar — Table of Contents */}
        <aside className="hidden xl:block w-56 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-8 pr-4">
          {displayPage && <TableOfContents content={displayPage.content} />}
        </aside>
      </div>
    </div>
  );
}
