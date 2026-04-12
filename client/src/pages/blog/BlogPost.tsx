import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useParams } from "wouter";
import { useEffect } from "react";
import {
  ArrowLeft, Calendar, Clock, Eye, Share2, Twitter,
  Linkedin, Link as LinkIcon, Copy, Check, Rss, Folder
} from "lucide-react";
import { useState, useCallback } from "react";
import { toast } from "sonner";

function formatDate(d: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogPost() {
  const params = useParams<{ slug: string }>();
  const [copied, setCopied] = useState(false);

  const postQuery = trpc.blog.posts.getBySlug.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );
  const trackViewMutation = trpc.blog.posts.trackView.useMutation();

  const post = postQuery.data;

  // Track view on mount
  useEffect(() => {
    if (post?.id) {
      trackViewMutation.mutate({
        postId: post.id,
        referrer: document.referrer || undefined,
      });
    }
  }, [post?.id]);

  // Set document title and meta
  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} — Nexus OS Blog`;

    // Set meta tags
    setMeta("description", post.excerpt || post.ogDescription || "");
    setMeta("og:title", post.ogTitle || post.title);
    setMeta("og:description", post.ogDescription || post.excerpt || "");
    setMeta("og:image", post.ogImage || post.coverImage || "");
    setMeta("og:url", `https://aiagents.nexus/blog/${post.slug}`);
    setMeta("og:type", "article");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", post.ogTitle || post.title);
    setMeta("twitter:description", post.ogDescription || post.excerpt || "");
    setMeta("twitter:image", post.ogImage || post.coverImage || "");
    setMeta("article:published_time", post.publishedAt ? new Date(post.publishedAt).toISOString() : "");
    setMeta("article:modified_time", new Date(post.updatedAt).toISOString());

    // Set canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = post.canonicalUrl || `https://aiagents.nexus/blog/${post.slug}`;

    // JSON-LD
    let jsonLd = document.getElementById("json-ld-blog") as HTMLScriptElement;
    if (!jsonLd) {
      jsonLd = document.createElement("script");
      jsonLd.id = "json-ld-blog";
      jsonLd.type = "application/ld+json";
      document.head.appendChild(jsonLd);
    }
    jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt || "",
      image: post.coverImage || undefined,
      datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
      dateModified: new Date(post.updatedAt).toISOString(),
      author: post.author ? {
        "@type": "Person",
        name: post.author.name,
        url: post.author.website || undefined,
      } : undefined,
      publisher: {
        "@type": "Organization",
        name: "Nexus OS",
        url: "https://aiagents.nexus",
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": `https://aiagents.nexus/blog/${post.slug}`,
      },
      wordCount: post.wordCount || undefined,
    });

    return () => {
      document.title = "Nexus OS";
      const jsonLdEl = document.getElementById("json-ld-blog");
      if (jsonLdEl) jsonLdEl.remove();
    };
  }, [post]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied");
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  if (postQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse font-mono text-muted-foreground">Loading article...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground font-mono text-lg">Article not found</p>
        <Button asChild variant="outline"><Link href="/blog">Back to Blog</Link></Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-nexus-deep/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <Link href="/blog" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
            <span className="font-mono text-sm">Blog</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyLink}>
              {copied ? <Check size={14} className="text-nexus-green" /> : <Copy size={14} />}
            </Button>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <Twitter size={14} />
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <Linkedin size={14} />
            </a>
          </div>
        </div>
      </header>

      <article className="container max-w-3xl py-12">
        {/* Cover Image */}
        {post.coverImage && (
          <div className="mb-8 rounded-xl overflow-hidden border border-border">
            <img
              src={post.coverImage}
              alt={post.coverImageAlt || post.title}
              className="w-full h-auto max-h-[500px] object-cover"
            />
          </div>
        )}

        {/* Category + Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.category && (
            <Badge className="bg-nexus-green/10 text-nexus-green border-nexus-green/30 text-xs font-mono">
              <Folder size={10} className="mr-1" />{post.category.name}
            </Badge>
          )}
          {post.tags?.map(tag => (
            <Link key={tag.id} href={`/blog/tag/${tag.slug}`}>
              <Badge variant="outline" className="cursor-pointer hover:border-nexus-indigo/40 text-xs font-mono">
                {tag.name}
              </Badge>
            </Link>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4">
          {post.title}
        </h1>

        {post.subtitle && (
          <p className="text-xl text-muted-foreground mb-6">{post.subtitle}</p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
          {post.author && (
            <Link href={`/blog/author/${post.author.slug}`} className="flex items-center gap-2 hover:text-foreground transition-colors">
              {post.author.avatar ? (
                <img src={post.author.avatar} alt={post.author.name} className="w-8 h-8 rounded-full border border-border" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-nexus-indigo/10 flex items-center justify-center text-nexus-indigo font-mono font-bold text-xs">
                  {post.author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-medium">{post.author.name}</span>
            </Link>
          )}
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {formatDate(post.publishedAt ?? post.createdAt)}
          </span>
          {post.readingTime && (
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {post.readingTime} min read
            </span>
          )}
          {post.viewCount !== undefined && (
            <span className="flex items-center gap-1">
              <Eye size={14} />
              {post.viewCount} views
            </span>
          )}
        </div>

        {/* Content */}
        <div
          className="prose prose-invert max-w-none
            prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:leading-relaxed prose-p:text-foreground/90
            prose-a:text-nexus-indigo prose-a:no-underline hover:prose-a:underline
            prose-code:text-nexus-indigo prose-code:bg-nexus-indigo/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-nexus-deep prose-pre:border prose-pre:border-border prose-pre:rounded-lg
            prose-blockquote:border-nexus-indigo/40 prose-blockquote:bg-nexus-surface/20 prose-blockquote:rounded-r-lg prose-blockquote:py-1
            prose-img:rounded-lg prose-img:border prose-img:border-border
            prose-table:border prose-table:border-border
            prose-th:bg-nexus-surface/30 prose-th:px-4 prose-th:py-2
            prose-td:px-4 prose-td:py-2 prose-td:border prose-td:border-border
            prose-hr:border-border
            prose-li:text-foreground/90
          "
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Author Bio Card */}
        {post.author && (
          <div className="mt-12 p-6 rounded-xl border border-border bg-nexus-surface/20">
            <div className="flex items-start gap-4">
              {post.author.avatar ? (
                <img src={post.author.avatar} alt={post.author.name} className="w-16 h-16 rounded-full border border-border shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-nexus-indigo/10 flex items-center justify-center text-nexus-indigo font-mono font-bold text-xl shrink-0">
                  {post.author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <Link href={`/blog/author/${post.author.slug}`} className="font-semibold text-lg hover:text-nexus-indigo transition-colors">
                  {post.author.name}
                </Link>
                {post.author.bio && (
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{post.author.bio}</p>
                )}
                <div className="flex items-center gap-3 mt-3">
                  {post.author.twitter && (
                    <a href={`https://twitter.com/${post.author.twitter.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-nexus-indigo transition-colors">
                      <Twitter size={14} />
                    </a>
                  )}
                  {post.author.github && (
                    <a href={`https://github.com/${post.author.github}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-nexus-indigo transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    </a>
                  )}
                  {post.author.linkedin && (
                    <a href={post.author.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-nexus-indigo transition-colors">
                      <Linkedin size={14} />
                    </a>
                  )}
                  {post.author.website && (
                    <a href={post.author.website} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-nexus-indigo transition-colors">
                      <LinkIcon size={14} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Related Posts */}
        {post.relatedPosts && post.relatedPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="font-mono text-sm uppercase tracking-widest text-nexus-indigo mb-6">Related Articles</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {post.relatedPosts.map(rp => (
                <Link key={rp.id} href={`/blog/${rp.slug}`}>
                  <div className="group p-4 rounded-lg border border-border hover:border-nexus-indigo/30 transition-colors cursor-pointer">
                    <h3 className="font-semibold mb-1 group-hover:text-nexus-indigo transition-colors line-clamp-2">
                      {rp.title}
                    </h3>
                    {rp.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{rp.excerpt}</p>
                    )}
                    <div className="text-xs text-muted-foreground mt-2">
                      {rp.author?.name} · {formatDate(rp.publishedAt ?? rp.createdAt)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Share */}
        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
          <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            <ArrowLeft size={14} />
            Back to Blog
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground mr-2">Share:</span>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border hover:border-nexus-indigo/40 transition-colors text-muted-foreground hover:text-foreground"
            >
              <Twitter size={14} />
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border hover:border-nexus-indigo/40 transition-colors text-muted-foreground hover:text-foreground"
            >
              <Linkedin size={14} />
            </a>
            <button
              onClick={copyLink}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border hover:border-nexus-indigo/40 transition-colors text-muted-foreground hover:text-foreground"
            >
              {copied ? <Check size={14} className="text-nexus-green" /> : <LinkIcon size={14} />}
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

function setMeta(name: string, content: string) {
  if (!content) return;
  const isOg = name.startsWith("og:") || name.startsWith("article:");
  const isTwitter = name.startsWith("twitter:");
  const attr = isOg || isTwitter ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}
