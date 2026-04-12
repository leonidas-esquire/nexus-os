import { Link } from "wouter";
import { useEffect, useState, useMemo, useCallback } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { Network, ChevronRight, Printer, ArrowLeft } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface LegalPageLayoutProps {
  title: string;
  description: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({
  title,
  description,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  // Extract TOC from rendered headings
  useEffect(() => {
    const timer = setTimeout(() => {
      const article = document.querySelector("[data-legal-content]");
      if (!article) return;

      const headings = article.querySelectorAll("h2, h3");
      const items: TocItem[] = [];

      headings.forEach((heading) => {
        const text = heading.textContent || "";
        const id =
          heading.id ||
          text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        heading.id = id;
        items.push({
          id,
          text,
          level: heading.tagName === "H2" ? 2 : 3,
        });
      });

      setTocItems(items);
    }, 100);

    return () => clearTimeout(timer);
  }, [children]);

  // Track active section on scroll
  useEffect(() => {
    if (tocItems.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    tocItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [tocItems]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Set meta tags
  useEffect(() => {
    document.title = `${title} — Nexus OS`;

    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);

    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", "noindex, follow");
  }, [title, description]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header — hidden in print */}
      <header className="border-b border-border bg-nexus-deep/50 backdrop-blur-md sticky top-0 z-40 print:hidden">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-nexus-indigo/20 flex items-center justify-center border border-nexus-indigo/30">
                <Network size={14} className="text-nexus-indigo" />
              </div>
              <span className="font-mono font-bold text-sm">
                nexus<span className="text-nexus-indigo">.</span>os
              </span>
            </Link>
            <Link
              href="/legal"
              className="text-muted-foreground font-mono text-sm hidden sm:inline hover:text-foreground transition-colors"
            >
              /legal
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Print this page"
            >
              <Printer size={16} />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container py-12 max-w-7xl mx-auto">
        <div className="flex gap-12">
          {/* TOC Sidebar — hidden in print and on mobile */}
          <aside className="hidden lg:block w-64 shrink-0 print:hidden">
            <div className="sticky top-24">
              <Link
                href="/legal"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-nexus-indigo transition-colors mb-6"
              >
                <ArrowLeft size={12} />
                All Legal
              </Link>

              <nav className="space-y-1 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-3">
                  On this page
                </p>
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(item.id);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                        history.replaceState(null, "", `#${item.id}`);
                        setActiveId(item.id);
                      }
                    }}
                    className={`block text-sm py-1 transition-colors ${
                      item.level === 3 ? "pl-4" : ""
                    } ${
                      activeId === item.id
                        ? "text-nexus-indigo font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <article className="flex-1 min-w-0 max-w-4xl">
            {/* Back link — mobile only */}
            <Link
              href="/legal"
              className="inline-flex items-center gap-1.5 text-sm font-mono text-muted-foreground hover:text-nexus-indigo transition-colors mb-6 lg:hidden print:hidden"
            >
              <ArrowLeft size={14} />
              Back to Legal
            </Link>

            {/* Print header */}
            <div className="hidden print:block mb-8">
              <p className="text-sm text-gray-500">aiagents.nexus</p>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground mb-8 font-mono">
              Last Updated: {lastUpdated}
            </p>

            <div
              data-legal-content
              className="legal-content prose prose-invert prose-lg max-w-none"
            >
              {children}
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-border print:hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Link
                  href="/legal"
                  className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-nexus-indigo transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back to Legal
                </Link>
                <p className="text-xs text-muted-foreground italic">
                  By using the Service, you acknowledge that you have read and understood this document.
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
