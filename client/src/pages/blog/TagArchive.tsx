import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useParams } from "wouter";
import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Clock, ChevronLeft, ChevronRight, Tag } from "lucide-react";

function formatDate(d: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function TagArchive() {
  const params = useParams<{ tag: string }>();
  const [page, setPage] = useState(1);

  const tagQuery = trpc.blog.tags.getBySlug.useQuery({ slug: params.tag }, { enabled: !!params.tag });
  const postsQuery = trpc.blog.posts.list.useQuery(
    { status: "published", tagSlug: params.tag, page, limit: 12 },
    { enabled: !!params.tag }
  );

  const tag = tagQuery.data;
  const posts = postsQuery.data?.posts ?? [];
  const total = postsQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / 12);

  useEffect(() => {
    if (tag) document.title = `${tag.name} — Nexus OS Blog`;
  }, [tag]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-nexus-deep/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center h-14">
          <Link href="/blog" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
            <span className="font-mono text-sm">Blog</span>
          </Link>
        </div>
      </header>

      <main className="container py-12">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Tag size={20} className="text-nexus-indigo" />
            <h1 className="text-3xl font-bold">{tag?.name ?? params.tag}</h1>
          </div>
          {tag?.description && (
            <p className="text-muted-foreground text-lg">{tag.description}</p>
          )}
          <p className="text-sm text-muted-foreground font-mono mt-2">{total} article{total !== 1 ? "s" : ""}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <article className="group h-full flex flex-col rounded-lg border border-border bg-nexus-surface/10 hover:border-nexus-indigo/30 transition-all cursor-pointer overflow-hidden">
                {post.coverImage && (
                  <img src={post.coverImage} alt={post.coverImageAlt || post.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-nexus-indigo transition-colors line-clamp-2">{post.title}</h3>
                  {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{post.excerpt}</p>}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-3 border-t border-border">
                    <span>{post.author?.name ?? "Unknown"}</span>
                    <span>{formatDate(post.publishedAt ?? post.createdAt)}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {posts.length === 0 && !postsQuery.isLoading && (
          <div className="text-center py-20">
            <p className="text-muted-foreground font-mono">No articles with this tag yet</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-12">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="font-mono text-xs">
              <ChevronLeft size={14} className="mr-1" /> Previous
            </Button>
            <span className="font-mono text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="font-mono text-xs">
              Next <ChevronRight size={14} className="ml-1" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
