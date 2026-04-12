import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useState, useEffect, useMemo } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import {
  ArrowRight,
  Clock,
  Calendar,
  Rss,
  Network,
  Loader2,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  explainer: "Explainer",
  tutorial: "Tutorial",
  opinion: "Opinion",
  "case-study": "Case Study",
  announcement: "Announcement",
  release: "Release",
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);

function formatDate(d: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function BlogIndex() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const postsQuery = trpc.blog.list.useQuery();
  const featuredQuery = trpc.blog.featured.useQuery();

  const allPosts = postsQuery.data ?? [];
  const featuredPost = featuredQuery.data;

  const filteredPosts = useMemo(() => {
    if (!activeCategory) return allPosts;
    return allPosts.filter((p) => p.category === activeCategory);
  }, [allPosts, activeCategory]);

  // Separate featured from grid (only when no filter active)
  const gridPosts = useMemo(() => {
    if (!activeCategory && featuredPost) {
      return filteredPosts.filter((p) => p.id !== featuredPost.id);
    }
    return filteredPosts;
  }, [filteredPosts, featuredPost, activeCategory]);

  useEffect(() => {
    document.title = "Blog — Nexus OS";
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
              /blog
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/blog/feed.xml"
              className="text-muted-foreground hover:text-nexus-indigo transition-colors"
              title="Atom Feed"
            >
              <Rss size={16} />
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container py-12">
        {/* Hero */}
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            <span className="text-foreground">Nexus OS</span>{" "}
            <span className="text-nexus-indigo">Blog</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            News, tutorials, deep dives, and engineering insights about AI agent
            orchestration.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          <button
            onClick={() => setActiveCategory(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-mono transition-all border ${
              activeCategory === null
                ? "bg-nexus-indigo text-white border-nexus-indigo"
                : "bg-transparent text-muted-foreground border-border hover:border-nexus-indigo/40 hover:text-foreground"
            }`}
          >
            All
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() =>
                setActiveCategory(activeCategory === cat ? null : cat)
              }
              className={`px-4 py-1.5 rounded-full text-sm font-mono transition-all border ${
                activeCategory === cat
                  ? "bg-nexus-indigo text-white border-nexus-indigo"
                  : "bg-transparent text-muted-foreground border-border hover:border-nexus-indigo/40 hover:text-foreground"
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Loading */}
        {postsQuery.isLoading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="animate-spin text-nexus-indigo" size={32} />
          </div>
        )}

        {/* Featured Post */}
        {!activeCategory && featuredPost && !postsQuery.isLoading && (
          <Link href={`/blog/${featuredPost.slug}`}>
            <article className="group mb-12 grid lg:grid-cols-2 gap-6 p-6 rounded-xl border border-border bg-nexus-surface/20 hover:border-nexus-indigo/30 transition-all cursor-pointer">
              {featuredPost.featuredImageUrl && (
                <div className="overflow-hidden rounded-lg">
                  <img
                    src={featuredPost.featuredImageUrl}
                    alt={featuredPost.featuredImageAlt || featuredPost.title}
                    className="w-full h-64 lg:h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
              )}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge className="bg-nexus-indigo/20 text-nexus-indigo border-nexus-indigo/30 text-xs">
                    Featured
                  </Badge>
                  <Badge className="bg-nexus-green/10 text-nexus-green border-nexus-green/30 text-xs">
                    {CATEGORY_LABELS[featuredPost.category] ||
                      featuredPost.category}
                  </Badge>
                  {parseTags(featuredPost.tags)
                    .slice(0, 2)
                    .map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 group-hover:text-nexus-indigo transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                  {featuredPost.excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{featuredPost.author}</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(featuredPost.publishedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {featuredPost.readingTimeMinutes} min read
                  </span>
                </div>
              </div>
            </article>
          </Link>
        )}

        {/* Post Grid */}
        {!postsQuery.isLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <article className="group h-full flex flex-col rounded-lg border border-border bg-nexus-surface/10 hover:border-nexus-indigo/30 transition-all cursor-pointer overflow-hidden">
                  {post.featuredImageUrl && (
                    <div className="overflow-hidden">
                      <img
                        src={post.featuredImageUrl}
                        alt={post.featuredImageAlt || post.title}
                        className="w-full h-48 object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge className="bg-nexus-green/10 text-nexus-green border-nexus-green/30 text-xs">
                        {CATEGORY_LABELS[post.category] || post.category}
                      </Badge>
                      {parseTags(post.tags)
                        .slice(0, 2)
                        .map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-nexus-indigo transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t border-border">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {formatDate(post.publishedAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {post.readingTimeMinutes} min
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!postsQuery.isLoading && filteredPosts.length === 0 && (
          <div className="text-center py-24">
            <p className="text-muted-foreground font-mono text-lg mb-2">
              No posts found
            </p>
            {activeCategory && (
              <button
                onClick={() => setActiveCategory(null)}
                className="text-nexus-indigo hover:underline text-sm font-mono"
              >
                Clear filter
              </button>
            )}
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-16 text-center">
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
