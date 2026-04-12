import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useState, useEffect, useMemo, useCallback } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronUp,
  Eye,
  Github,
  Globe,
  Loader2,
  Network,
  Plus,
  Search,
  Star,
  Trophy,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  "ai-agents": "AI Agents",
  automation: "Automation",
  devops: "DevOps",
  research: "Research",
  trading: "Trading",
  other: "Other",
};

const SORT_OPTIONS = [
  { value: "upvotes", label: "Most Upvoted" },
  { value: "newest", label: "Newest" },
  { value: "stars", label: "Most Stars" },
] as const;

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
}

export default function ShowcaseIndex() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sort, setSort] = useState<"upvotes" | "newest" | "stars">("upvotes");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset offset when filters change
  useEffect(() => {
    setOffset(0);
  }, [activeCategory, sort, debouncedSearch]);

  const projectsQuery = trpc.showcase.list.useQuery({
    category: activeCategory,
    search: debouncedSearch || undefined,
    sort,
    limit: LIMIT,
    offset,
  });

  const featuredQuery = trpc.showcase.featured.useQuery();
  const categoryCountsQuery = trpc.showcase.categoryCounts.useQuery();

  const projects = projectsQuery.data?.projects ?? [];
  const total = projectsQuery.data?.total ?? 0;
  const featured = featuredQuery.data ?? [];
  const categoryCounts = categoryCountsQuery.data ?? [];

  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  const totalCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    categoryCounts.forEach((c) => {
      map[c.category] = c.count;
    });
    return map;
  }, [categoryCounts]);

  const totalAll = useMemo(
    () => categoryCounts.reduce((sum, c) => sum + c.count, 0),
    [categoryCounts]
  );

  useEffect(() => {
    document.title = "Showcase — Nexus OS";
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-nexus-deep/50 backdrop-blur-md sticky top-0 z-40">
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
            <span className="text-muted-foreground font-mono text-sm hidden sm:inline">
              /showcase
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/showcase/submit">
              <Button
                size="sm"
                className="bg-nexus-indigo hover:bg-nexus-indigo/90 text-white font-mono text-xs gap-1.5"
              >
                <Plus size={14} />
                Submit Project
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container py-12">
        {/* Hero */}
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            <span className="text-foreground">Community</span>{" "}
            <span className="text-nexus-indigo">Showcase</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Discover what developers are building with Nexus OS. From autonomous
            research agents to production trading bots — explore real-world
            projects and get inspired.
          </p>
        </div>

        {/* Featured Projects */}
        {featured.length > 0 &&
          !debouncedSearch &&
          activeCategory === "all" && (
            <section className="mb-14">
              <div className="flex items-center gap-2 mb-6">
                <Trophy size={18} className="text-yellow-500" />
                <h2 className="text-lg font-bold font-mono">
                  Featured Projects
                </h2>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {featured.map((project) => (
                  <FeaturedCard key={project.id} project={project} />
                ))}
              </div>
            </section>
          )}

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-nexus-surface/30 border-border font-mono text-sm"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all border ${
                  sort === opt.value
                    ? "bg-nexus-indigo/20 text-nexus-indigo border-nexus-indigo/30"
                    : "bg-transparent text-muted-foreground border-border hover:border-nexus-indigo/30"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-mono transition-all border ${
              activeCategory === "all"
                ? "bg-nexus-indigo text-white border-nexus-indigo"
                : "bg-transparent text-muted-foreground border-border hover:border-nexus-indigo/40 hover:text-foreground"
            }`}
          >
            All{" "}
            <span className="text-xs opacity-70 ml-1">{totalAll || ""}</span>
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() =>
                setActiveCategory(activeCategory === key ? "all" : key)
              }
              className={`px-4 py-1.5 rounded-full text-sm font-mono transition-all border ${
                activeCategory === key
                  ? "bg-nexus-indigo text-white border-nexus-indigo"
                  : "bg-transparent text-muted-foreground border-border hover:border-nexus-indigo/40 hover:text-foreground"
              }`}
            >
              {label}{" "}
              <span className="text-xs opacity-70 ml-1">
                {totalCountMap[key] || ""}
              </span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {projectsQuery.isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-nexus-indigo" size={32} />
          </div>
        )}

        {/* Project Grid */}
        {!projectsQuery.isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!projectsQuery.isLoading && projects.length === 0 && (
          <div className="text-center py-24">
            <p className="text-muted-foreground font-mono text-lg mb-2">
              No projects found
            </p>
            {(debouncedSearch || activeCategory !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setActiveCategory("all");
                }}
                className="text-nexus-indigo hover:underline text-sm font-mono"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !projectsQuery.isLoading && (
          <div className="flex items-center justify-center gap-3 mt-12">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              className="font-mono text-xs"
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setOffset(offset + LIMIT)}
              className="font-mono text-xs"
            >
              Next
            </Button>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center border-t border-border pt-12">
          <h3 className="text-xl font-bold mb-3">
            Built something with Nexus OS?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Share your project with the community. Submissions are reviewed and
            featured on the showcase.
          </p>
          <Link href="/showcase/submit">
            <Button className="bg-nexus-indigo hover:bg-nexus-indigo/90 text-white font-mono gap-2">
              <Plus size={16} />
              Submit Your Project
            </Button>
          </Link>
        </div>

        {/* Back to Home */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-nexus-indigo transition-colors"
          >
            <ArrowRight size={14} className="rotate-180" />
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}

// ─── Featured Card ─────────────────────────────────────────────────

function FeaturedCard({ project }: { project: any }) {
  return (
    <Link href={`/showcase/${project.slug}`}>
      <article className="group relative h-full flex flex-col rounded-xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent hover:border-yellow-500/40 transition-all cursor-pointer overflow-hidden">
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs gap-1">
            <Star size={10} className="fill-yellow-500" />
            Featured
          </Badge>
        </div>
        <div className="overflow-hidden">
          <img
            src={project.screenshotUrl}
            alt={project.title}
            className="w-full h-44 object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        </div>
        <div className="p-5 flex flex-col flex-1">
          <Badge className="w-fit mb-2 bg-nexus-indigo/10 text-nexus-indigo border-nexus-indigo/20 text-xs">
            {CATEGORY_LABELS[project.category] || project.category}
          </Badge>
          <h3 className="text-lg font-bold mb-1.5 group-hover:text-nexus-indigo transition-colors line-clamp-1">
            {project.title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
            {project.tagline}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t border-border">
            <span className="flex items-center gap-1">
              <ChevronUp size={12} />
              {formatNumber(project.upvotes)}
            </span>
            <span className="flex items-center gap-1">
              <Eye size={12} />
              {formatNumber(project.views)}
            </span>
            {project.githubStars > 0 && (
              <span className="flex items-center gap-1">
                <Star size={12} />
                {formatNumber(project.githubStars)}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

// ─── Project Card ──────────────────────────────────────────────────

function ProjectCard({ project }: { project: any }) {
  const upvoteMutation = trpc.showcase.upvote.useMutation();
  const utils = trpc.useUtils();

  const handleUpvote = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      upvoteMutation.mutate(
        { projectId: project.id },
        {
          onSuccess: () => {
            utils.showcase.list.invalidate();
            utils.showcase.featured.invalidate();
          },
        }
      );
    },
    [project.id, upvoteMutation, utils]
  );

  return (
    <Link href={`/showcase/${project.slug}`}>
      <article className="group h-full flex flex-col rounded-lg border border-border bg-nexus-surface/10 hover:border-nexus-indigo/30 transition-all cursor-pointer overflow-hidden">
        <div className="overflow-hidden relative">
          <img
            src={project.screenshotUrl}
            alt={project.title}
            className="w-full h-48 object-cover group-hover:scale-[1.02] transition-transform duration-500"
          />
          {/* Upvote button overlay */}
          <button
            onClick={handleUpvote}
            className="absolute top-3 right-3 flex flex-col items-center gap-0.5 bg-nexus-deep/80 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1.5 hover:border-nexus-indigo/50 hover:bg-nexus-deep/90 transition-all"
          >
            <ChevronUp size={14} className="text-nexus-indigo" />
            <span className="text-xs font-mono font-bold text-foreground">
              {formatNumber(project.upvotes)}
            </span>
          </button>
        </div>
        <div className="p-5 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className="bg-nexus-indigo/10 text-nexus-indigo border-nexus-indigo/20 text-xs">
              {CATEGORY_LABELS[project.category] || project.category}
            </Badge>
            {project.featured && (
              <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs gap-0.5">
                <Star size={8} className="fill-yellow-500" />
                Featured
              </Badge>
            )}
          </div>
          <h3 className="text-lg font-bold mb-1.5 group-hover:text-nexus-indigo transition-colors line-clamp-1">
            {project.title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
            {project.tagline}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t border-border">
            <div className="flex items-center gap-1">
              {project.authorAvatar ? (
                <img
                  src={project.authorAvatar}
                  alt=""
                  className="w-4 h-4 rounded-full"
                />
              ) : null}
              <span>{project.authorName}</span>
            </div>
            <div className="flex items-center gap-3">
              {project.repoUrl && (
                <Github size={12} className="text-muted-foreground" />
              )}
              {project.websiteUrl && (
                <Globe size={12} className="text-muted-foreground" />
              )}
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {formatNumber(project.views)}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
