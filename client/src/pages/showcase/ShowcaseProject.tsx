import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useParams } from "wouter";
import { useState, useEffect, useCallback } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  ExternalLink,
  Github,
  Globe,
  Loader2,
  Network,
  Play,
  Star,
  Twitter,
  User,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  "ai-agents": "AI Agents",
  automation: "Automation",
  devops: "DevOps",
  research: "Research",
  trading: "Trading",
  other: "Other",
};

function formatNumber(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toString();
}

function formatDate(d: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function parseJsonArray(val: string | null): string[] {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ShowcaseProject() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  const projectQuery = trpc.showcase.getBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );
  const project = projectQuery.data;

  const relatedQuery = trpc.showcase.related.useQuery(
    { projectId: project?.id ?? "", category: project?.category ?? "" },
    { enabled: !!project }
  );
  const related = relatedQuery.data ?? [];

  const hasUpvotedQuery = trpc.showcase.hasUpvoted.useQuery(
    { projectId: project?.id ?? "" },
    { enabled: !!project }
  );

  const upvoteMutation = trpc.showcase.upvote.useMutation();
  const utils = trpc.useUtils();

  const [activeScreenshot, setActiveScreenshot] = useState(0);

  useEffect(() => {
    if (project) {
      document.title = `${project.title} — Nexus OS Showcase`;
    }
  }, [project]);

  const allScreenshots = project
    ? [
        project.screenshotUrl,
        ...parseJsonArray(project.screenshots as any),
      ].filter(Boolean)
    : [];

  const featuresUsed = project ? parseJsonArray(project.featuresUsed as any) : [];
  const tags = project ? parseJsonArray(project.tags as any) : [];

  const handleUpvote = useCallback(() => {
    if (!project) return;
    upvoteMutation.mutate(
      { projectId: project.id },
      {
        onSuccess: () => {
          utils.showcase.getBySlug.invalidate({ slug });
          utils.showcase.hasUpvoted.invalidate({ projectId: project.id });
        },
      }
    );
  }, [project, upvoteMutation, utils, slug]);

  if (projectQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="animate-spin text-nexus-indigo" size={32} />
      </div>
    );
  }

  if (projectQuery.error || !project) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-2">Project Not Found</p>
          <p className="text-muted-foreground mb-6">
            This project may have been removed or is still pending review.
          </p>
          <Link href="/showcase">
            <Button variant="outline" className="font-mono text-sm gap-2">
              <ArrowRight size={14} className="rotate-180" />
              Back to Showcase
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
            <Link
              href="/showcase"
              className="text-muted-foreground font-mono text-sm hidden sm:inline hover:text-foreground transition-colors"
            >
              /showcase
            </Link>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container py-10">
        {/* Back link */}
        <Link
          href="/showcase"
          className="inline-flex items-center gap-1.5 text-sm font-mono text-muted-foreground hover:text-nexus-indigo transition-colors mb-8"
        >
          <ArrowRight size={14} className="rotate-180" />
          Back to Showcase
        </Link>

        <div className="grid lg:grid-cols-[1fr_320px] gap-10">
          {/* ─── Main Content ──────────────────────────────── */}
          <div>
            {/* Title + Meta */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge className="bg-nexus-indigo/10 text-nexus-indigo border-nexus-indigo/20 text-xs">
                  {CATEGORY_LABELS[project.category] || project.category}
                </Badge>
                {project.featured && (
                  <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 text-xs gap-0.5">
                    <Star size={8} className="fill-yellow-500" />
                    Featured
                  </Badge>
                )}
                {tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                {project.title}
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {project.tagline}
              </p>
            </div>

            {/* Screenshot Gallery */}
            {allScreenshots.length > 0 && (
              <div className="mb-10">
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img
                    src={allScreenshots[activeScreenshot]}
                    alt={`${project.title} screenshot ${activeScreenshot + 1}`}
                    className="w-full h-auto max-h-[500px] object-contain bg-nexus-deep"
                  />
                  {allScreenshots.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setActiveScreenshot(
                            (prev) =>
                              (prev - 1 + allScreenshots.length) %
                              allScreenshots.length
                          )
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-nexus-deep/80 backdrop-blur-sm rounded-full p-2 hover:bg-nexus-deep transition-colors border border-border"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button
                        onClick={() =>
                          setActiveScreenshot(
                            (prev) => (prev + 1) % allScreenshots.length
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-nexus-deep/80 backdrop-blur-sm rounded-full p-2 hover:bg-nexus-deep transition-colors border border-border"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                </div>
                {allScreenshots.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {allScreenshots.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveScreenshot(i)}
                        className={`shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                          i === activeScreenshot
                            ? "border-nexus-indigo"
                            : "border-border opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Thumbnail ${i + 1}`}
                          className="w-20 h-14 object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description (Markdown) */}
            <div className="blog-content prose prose-invert max-w-none mb-10">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {project.description}
              </ReactMarkdown>
            </div>

            {/* Features Used */}
            {featuresUsed.length > 0 && (
              <div className="mb-10">
                <h3 className="text-sm font-mono font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  Nexus Features Used
                </h3>
                <div className="flex flex-wrap gap-2">
                  {featuresUsed.map((feature) => (
                    <Badge
                      key={feature}
                      className="bg-nexus-indigo/10 text-nexus-indigo border-nexus-indigo/20"
                    >
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── Sidebar ───────────────────────────────────── */}
          <aside className="space-y-6">
            {/* Stats + Upvote */}
            <div className="rounded-xl border border-border p-5 bg-nexus-surface/10">
              <button
                onClick={handleUpvote}
                disabled={upvoteMutation.isPending}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg border font-mono text-sm font-bold transition-all mb-5 ${
                  hasUpvotedQuery.data === true
                    ? "bg-nexus-indigo/20 text-nexus-indigo border-nexus-indigo/40"
                    : "bg-transparent text-foreground border-border hover:border-nexus-indigo/40 hover:bg-nexus-indigo/5"
                }`}
              >
                <ChevronUp size={18} />
                Upvote · {formatNumber(project.upvotes)}
              </button>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold font-mono text-foreground">
                    {formatNumber(project.views)}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Eye size={11} />
                    Views
                  </div>
                </div>
                {project.githubStars > 0 && (
                  <div>
                    <div className="text-2xl font-bold font-mono text-foreground">
                      {formatNumber(project.githubStars)}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Star size={11} />
                      Stars
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Links */}
            <div className="rounded-xl border border-border p-5 bg-nexus-surface/10 space-y-3">
              <h3 className="text-sm font-mono font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Links
              </h3>
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm hover:text-nexus-indigo transition-colors group"
                >
                  <Github size={16} className="text-muted-foreground group-hover:text-nexus-indigo" />
                  <span className="flex-1 truncate">GitHub Repository</span>
                  <ArrowUpRight size={12} className="text-muted-foreground" />
                </a>
              )}
              {project.websiteUrl && (
                <a
                  href={project.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm hover:text-nexus-indigo transition-colors group"
                >
                  <Globe size={16} className="text-muted-foreground group-hover:text-nexus-indigo" />
                  <span className="flex-1 truncate">Website</span>
                  <ArrowUpRight size={12} className="text-muted-foreground" />
                </a>
              )}
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm hover:text-nexus-indigo transition-colors group"
                >
                  <ExternalLink size={16} className="text-muted-foreground group-hover:text-nexus-indigo" />
                  <span className="flex-1 truncate">Live Demo</span>
                  <ArrowUpRight size={12} className="text-muted-foreground" />
                </a>
              )}
              {project.videoUrl && (
                <a
                  href={project.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm hover:text-nexus-indigo transition-colors group"
                >
                  <Play size={16} className="text-muted-foreground group-hover:text-nexus-indigo" />
                  <span className="flex-1 truncate">Video Demo</span>
                  <ArrowUpRight size={12} className="text-muted-foreground" />
                </a>
              )}
              {!project.repoUrl &&
                !project.websiteUrl &&
                !project.demoUrl &&
                !project.videoUrl && (
                  <p className="text-sm text-muted-foreground">
                    No links provided
                  </p>
                )}
            </div>

            {/* Author */}
            <div className="rounded-xl border border-border p-5 bg-nexus-surface/10">
              <h3 className="text-sm font-mono font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Author
              </h3>
              <div className="flex items-center gap-3 mb-3">
                {project.authorAvatar ? (
                  <img
                    src={project.authorAvatar}
                    alt={project.authorName}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-nexus-indigo/20 flex items-center justify-center">
                    <User size={18} className="text-nexus-indigo" />
                  </div>
                )}
                <div>
                  <div className="font-bold text-sm">{project.authorName}</div>
                  {project.authorHandle && (
                    <div className="text-xs text-muted-foreground">
                      {project.authorHandle}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                {project.authorGithub && (
                  <a
                    href={`https://github.com/${project.authorGithub}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Github size={16} />
                  </a>
                )}
                {project.authorTwitter && (
                  <a
                    href={`https://twitter.com/${project.authorTwitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Twitter size={16} />
                  </a>
                )}
              </div>
            </div>

            {/* Submitted date */}
            <div className="text-xs text-muted-foreground text-center">
              Submitted {formatDate(project.submittedAt)}
            </div>
          </aside>
        </div>

        {/* Related Projects */}
        {related.length > 0 && (
          <section className="mt-16 border-t border-border pt-10">
            <h2 className="text-xl font-bold font-mono mb-6">
              Related Projects
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((rp) => (
                <Link key={rp.id} href={`/showcase/${rp.slug}`}>
                  <article className="group h-full flex flex-col rounded-lg border border-border bg-nexus-surface/10 hover:border-nexus-indigo/30 transition-all cursor-pointer overflow-hidden">
                    <div className="overflow-hidden">
                      <img
                        src={rp.screenshotUrl}
                        alt={rp.title}
                        className="w-full h-40 object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <Badge className="w-fit mb-2 bg-nexus-indigo/10 text-nexus-indigo border-nexus-indigo/20 text-xs">
                        {CATEGORY_LABELS[rp.category] || rp.category}
                      </Badge>
                      <h3 className="font-bold mb-1 group-hover:text-nexus-indigo transition-colors line-clamp-1">
                        {rp.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 flex-1">
                        {rp.tagline}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3 pt-2 border-t border-border">
                        <span className="flex items-center gap-1">
                          <ChevronUp size={12} />
                          {formatNumber(rp.upvotes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {formatNumber(rp.views)}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
