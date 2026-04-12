import { useState, useEffect, useMemo } from "react";
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
  LayoutDashboard,
  Terminal,
  Menu,
  X,
  History,
  BookOpen,
} from "lucide-react";
import { DOC_SECTIONS, getFlatPages, getPageByPath, getAdjacentPages } from "./docsData";
import DocSearch from "./DocSearch";
import ThemeToggle from "../../components/ThemeToggle";
import { MarkdownRenderer, extractHeadings } from "./MarkdownRenderer";

const ICON_MAP: Record<string, React.ReactNode> = {
  rocket: <Rocket className="w-4 h-4" />,
  bot: <Bot className="w-4 h-4" />,
  network: <Network className="w-4 h-4" />,
  dollar: <DollarSign className="w-4 h-4" />,
  shield: <Shield className="w-4 h-4" />,
  route: <Route className="w-4 h-4" />,
  globe: <Globe className="w-4 h-4" />,
  layout: <LayoutDashboard className="w-4 h-4" />,
  terminal: <Terminal className="w-4 h-4" />,
  history: <History className="w-4 h-4" />,
};

function Sidebar({
  currentSection,
  currentPage,
  onNavigate,
}: {
  currentSection: string;
  currentPage: string;
  onNavigate?: () => void;
}) {
  const [expandedSections, setExpandedSections] = useState<string[]>(
    [currentSection]
  );

  useEffect(() => {
    setExpandedSections((prev) => prev.includes(currentSection) ? prev : [...prev, currentSection]);
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
      <DocSearch onNavigate={onNavigate} />
      {DOC_SECTIONS.map((section) => {
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
              <span className={isCurrent ? "text-nexus-indigo" : "text-muted-foreground"}>
                {ICON_MAP[section.icon]}
              </span>
              <span className="flex-1 text-left">{section.title}</span>
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
                    section.slug === currentSection && page.slug === currentPage;
                  return (
                    <Link
                      key={page.slug}
                      href={`/docs/${section.slug}/${page.slug}`}
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

      {/* Link to User Manual */}
      <div className="border-t border-border/50 mt-4 pt-4">
        <Link href="/docs/manual">
          <span className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-nexus-indigo hover:bg-nexus-indigo/10 transition-colors font-medium">
            <BookOpen className="w-4 h-4" />
            User Manual
            <span className="text-[10px] text-muted-foreground/60 ml-auto">101 pages</span>
          </span>
        </Link>
      </div>
    </nav>
  );
}

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

export default function DocsLayout() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Parse the current path
  const pathParts = location.replace("/docs", "").split("/").filter(Boolean);
  const sectionSlug = pathParts[0] || "getting-started";
  const pageSlug = pathParts[1] || "installation";

  // Get the current page data
  const page = getPageByPath(sectionSlug, pageSlug);
  const { prev, next } = getAdjacentPages(sectionSlug, pageSlug);

  // Redirect to first page if at /docs root
  const flat = getFlatPages();

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [sectionSlug, pageSlug]);

  // If page not found, show first page
  const displayPage = page || flat[0];
  const displaySection = page ? sectionSlug : flat[0]?.sectionSlug || "getting-started";
  const displayPageSlug = page ? pageSlug : flat[0]?.pageSlug || "installation";

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-14 gap-4">
          <Link href="/">
            <span className="flex items-center gap-2 text-foreground hover:text-nexus-indigo transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="font-mono font-bold text-sm tracking-tight">NEXUS OS</span>
            </span>
          </Link>
          <span className="text-border">/</span>
          <span className="font-mono text-sm text-muted-foreground">docs</span>
          <div className="flex-1" />
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
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <div className="max-w-[1440px] mx-auto flex">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-border sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto py-6 px-4">
          <Sidebar currentSection={displaySection} currentPage={displayPageSlug} />
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="absolute left-0 top-14 bottom-0 w-72 bg-background border-r border-border overflow-y-auto py-6 px-4">
              <Sidebar
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
            <Link href="/docs">
              <span className="hover:text-foreground transition-colors">Docs</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href={`/docs/${displaySection}/${DOC_SECTIONS.find(s => s.slug === displaySection)?.pages[0]?.slug || ""}`}>
              <span className="hover:text-foreground transition-colors">
                {displayPage?.sectionTitle}
              </span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">{displayPage?.pageTitle}</span>
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
