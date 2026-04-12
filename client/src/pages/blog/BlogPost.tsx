import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Link, useParams } from "wouter";
import { useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Network,
  Rss,
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

function setMeta(name: string, content: string) {
  const isOg = name.startsWith("og:") || name.startsWith("twitter:");
  const attr = isOg ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export default function BlogPost() {
  const params = useParams<{ slug: string }>();

  const postQuery = trpc.blog.getBySlug.useQuery(
    { slug: params.slug },
    { enabled: !!params.slug }
  );

  const post = postQuery.data;

  // Set document title and meta
  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} — Nexus OS Blog`;

    setMeta("description", (post.excerpt || "").slice(0, 160));
    setMeta("og:title", post.title);
    setMeta("og:description", post.excerpt || "");
    setMeta(
      "og:image",
      post.ogImageOverride || post.featuredImageUrl || ""
    );
    setMeta("og:url", `https://aiagents.nexus/blog/${post.slug}`);
    setMeta("og:type", "article");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", post.title);
    setMeta("twitter:description", post.excerpt || "");
    setMeta(
      "twitter:image",
      post.ogImageOverride || post.featuredImageUrl || ""
    );
    setMeta(
      "article:published_time",
      post.publishedAt ? new Date(post.publishedAt).toISOString() : ""
    );
    setCanonical(`https://aiagents.nexus/blog/${post.slug}`);
  }, [post]);

  if (postQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-nexus-indigo" size={32} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
        <p className="text-2xl font-bold mb-4">Post not found</p>
        <Link
          href="/blog"
          className="text-nexus-indigo hover:underline font-mono"
        >
          Back to Blog
        </Link>
      </div>
    );
  }

  const tags = parseTags(post.tags);

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
              href="/blog"
              className="text-muted-foreground font-mono text-sm hidden sm:inline hover:text-foreground transition-colors"
            >
              /blog
            </Link>
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

      <article className="container py-12 max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-nexus-indigo transition-colors mb-8"
        >
          <ArrowLeft size={14} />
          Back to Blog
        </Link>

        {/* Featured Image */}
        {post.featuredImageUrl && (
          <div className="rounded-xl overflow-hidden mb-8 border border-border">
            <img
              src={post.featuredImageUrl}
              alt={post.featuredImageAlt || post.title}
              className="w-full h-auto max-h-[480px] object-cover"
            />
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Badge className="bg-nexus-green/10 text-nexus-green border-nexus-green/30 text-xs">
            {CATEGORY_LABELS[post.category] || post.category}
          </Badge>
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 leading-tight">
          {post.title}
        </h1>

        {/* Author / Date / Reading Time */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-10 pb-8 border-b border-border">
          <span className="font-medium text-foreground">{post.author}</span>
          <span className="flex items-center gap-1.5">
            <Calendar size={13} />
            {formatDate(post.publishedAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} />
            {post.readingTimeMinutes} min read
          </span>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none blog-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-border">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-nexus-indigo transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Blog
          </Link>
        </div>
      </article>
    </div>
  );
}
