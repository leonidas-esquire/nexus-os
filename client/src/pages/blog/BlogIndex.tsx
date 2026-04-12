import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useState, useMemo, useEffect } from "react";
import { Search, ArrowRight, Clock, Calendar, Tag, ChevronLeft, ChevronRight, Rss } from "lucide-react";

function formatDate(d: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogIndex() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const postsQuery = trpc.blog.posts.list.useQuery({
    status: "published",
    search: search || undefined,
    page,
    limit: 12,
  });
  const tagsQuery = trpc.blog.tags.list.useQuery();

  const posts = postsQuery.data?.posts ?? [];
  const total = postsQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / 12);
  const tags = tagsQuery.data ?? [];

  // Featured post = first post
  const [featured, ...rest] = posts;

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
                <span className="text-nexus-indigo font-mono font-bold text-xs">N</span>
              </div>
              <span className="font-mono font-bold text-sm">nexus<span className="text-nexus-indigo">.</span>os</span>
            </Link>
            <span className="text-muted-foreground font-mono text-sm hidden sm:inline">/blog</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/blog/feed.xml" className="text-muted-foreground hover:text-nexus-indigo transition-colors" title="RSS Feed">
              <Rss size={16} />
            </a>
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
            News, tutorials, deep dives, and engineering insights about AI agent orchestration.
          </p>
        </div>

        {/* Search + Tags */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-nexus-surface/50 border-border font-mono text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 8).map(tag => (
              <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
                <Badge variant="outline" className="cursor-pointer hover:border-nexus-indigo/40 hover:bg-nexus-indigo/5 transition-colors font-mono text-xs">
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Featured Post */}
        {featured && page === 1 && !search && (
          <Link href={`/blog/${featured.slug}`}>
            <article className="group mb-12 grid lg:grid-cols-2 gap-6 p-6 rounded-xl border border-border bg-nexus-surface/20 hover:border-nexus-indigo/30 transition-all cursor-pointer">
              {featured.coverImage && (
                <div className="overflow-hidden rounded-lg">
                  <img
                    src={featured.coverImage}
                    alt={featured.coverImageAlt || featured.title}
                    className="w-full h-64 lg:h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                </div>
              )}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-nexus-indigo/20 text-nexus-indigo border-nexus-indigo/30 text-xs">Featured</Badge>
                  {featured.tags?.slice(0, 2).map(tag => (
                    <Badge key={tag.id} variant="outline" className="text-xs">{tag.name}</Badge>
                  ))}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 group-hover:text-nexus-indigo transition-colors">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="text-muted-foreground leading-relaxed mb-4 line-clamp-3">{featured.excerpt}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {featured.author && (
                    <span className="flex items-center gap-1.5">
                      {featured.author.avatar ? (
                        <img src={featured.author.avatar} alt={featured.author.name} className="w-5 h-5 rounded-full" />
                      ) : null}
                      {featured.author.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(featured.publishedAt ?? featured.createdAt)}
                  </span>
                  {featured.readingTime && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {featured.readingTime} min read
                    </span>
                  )}
                </div>
              </div>
            </article>
          </Link>
        )}

        {/* Post Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(page === 1 && !search ? rest : posts).map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <article className="group h-full flex flex-col rounded-lg border border-border bg-nexus-surface/10 hover:border-nexus-indigo/30 transition-all cursor-pointer overflow-hidden">
                {post.coverImage && (
                  <div className="overflow-hidden">
                    <img
                      src={post.coverImage}
                      alt={post.coverImageAlt || post.title}
                      className="w-full h-48 object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags?.slice(0, 3).map(tag => (
                      <Badge key={tag.id} variant="outline" className="text-[10px] font-mono">{tag.name}</Badge>
                    ))}
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-nexus-indigo transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{post.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t border-border">
                    <span>{post.author?.name ?? "Unknown"}</span>
                    <div className="flex items-center gap-3">
                      <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
                      {post.readingTime && <span>{post.readingTime}m</span>}
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {posts.length === 0 && !postsQuery.isLoading && (
          <div className="text-center py-20">
            <p className="text-muted-foreground font-mono text-lg mb-2">No articles found</p>
            <p className="text-muted-foreground/60 text-sm">
              {search ? "Try a different search term" : "Check back soon for new content"}
            </p>
          </div>
        )}

        {postsQuery.isLoading && (
          <div className="text-center py-20">
            <div className="animate-pulse font-mono text-muted-foreground">Loading articles...</div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-12">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="font-mono text-xs"
            >
              <ChevronLeft size={14} className="mr-1" />
              Previous
            </Button>
            <span className="font-mono text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="font-mono text-xs"
            >
              Next
              <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="container flex items-center justify-between text-xs text-muted-foreground font-mono">
          <span>aiagents.nexus — Nexus OS Blog</span>
          <a href="/blog/feed.xml" className="hover:text-nexus-indigo transition-colors flex items-center gap-1">
            <Rss size={12} /> RSS Feed
          </a>
        </div>
      </footer>
    </div>
  );
}
