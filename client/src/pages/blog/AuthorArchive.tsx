import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useParams } from "wouter";
import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Clock, ChevronLeft, ChevronRight, Twitter, Linkedin, Link as LinkIcon } from "lucide-react";

function formatDate(d: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function AuthorArchive() {
  const params = useParams<{ author: string }>();
  const [page, setPage] = useState(1);

  const authorQuery = trpc.blog.authors.getBySlug.useQuery({ slug: params.author }, { enabled: !!params.author });
  const postsQuery = trpc.blog.posts.list.useQuery(
    { status: "published", authorSlug: params.author, page, limit: 12 },
    { enabled: !!params.author }
  );

  const author = authorQuery.data;
  const posts = postsQuery.data?.posts ?? [];
  const total = postsQuery.data?.total ?? 0;
  const totalPages = Math.ceil(total / 12);

  useEffect(() => {
    if (author) document.title = `${author.name} — Nexus OS Blog`;
  }, [author]);

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
        {/* Author Header */}
        {author && (
          <div className="flex items-start gap-5 mb-10 p-6 rounded-xl border border-border bg-nexus-surface/20">
            {author.avatar ? (
              <img src={author.avatar} alt={author.name} className="w-20 h-20 rounded-full border border-border shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-nexus-indigo/10 flex items-center justify-center text-nexus-indigo font-mono font-bold text-2xl shrink-0">
                {author.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold mb-1">{author.name}</h1>
              <Badge variant="outline" className="text-xs font-mono mb-2">{author.authorRole}</Badge>
              {author.bio && <p className="text-muted-foreground leading-relaxed mt-2">{author.bio}</p>}
              <div className="flex items-center gap-3 mt-3">
                {author.twitter && (
                  <a href={`https://twitter.com/${author.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-nexus-indigo transition-colors">
                    <Twitter size={16} />
                  </a>
                )}
                {author.github && (
                  <a href={`https://github.com/${author.github}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-nexus-indigo transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  </a>
                )}
                {author.linkedin && (
                  <a href={author.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-nexus-indigo transition-colors">
                    <Linkedin size={16} />
                  </a>
                )}
                {author.website && (
                  <a href={author.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-nexus-indigo transition-colors">
                    <LinkIcon size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground font-mono mb-6">{total} article{total !== 1 ? "s" : ""}</p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <article className="group h-full flex flex-col rounded-lg border border-border bg-nexus-surface/10 hover:border-nexus-indigo/30 transition-all cursor-pointer overflow-hidden">
                {post.coverImage && (
                  <img src={post.coverImage} alt={post.coverImageAlt || post.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags?.slice(0, 3).map(tag => (
                      <Badge key={tag.id} variant="outline" className="text-[10px] font-mono">{tag.name}</Badge>
                    ))}
                  </div>
                  <h3 className="font-semibold text-lg mb-2 group-hover:text-nexus-indigo transition-colors line-clamp-2">{post.title}</h3>
                  {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">{post.excerpt}</p>}
                  <div className="text-xs text-muted-foreground mt-auto pt-3 border-t border-border">
                    {formatDate(post.publishedAt ?? post.createdAt)}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {posts.length === 0 && !postsQuery.isLoading && (
          <div className="text-center py-20">
            <p className="text-muted-foreground font-mono">No articles by this author yet</p>
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
