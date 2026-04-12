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
  Loader2,
  AlertTriangle,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  explainer: "Explainer",
  tutorial: "Tutorial",
  opinion: "Opinion",
  "case-study": "Case Study",
  announcement: "Announcement",
  release: "Release",
};

function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function BlogPostPreview() {
  const params = useParams<{ token: string }>();

  const previewQuery = trpc.adminBlog.getPreview.useQuery(
    { token: params.token },
    { enabled: !!params.token, retry: false }
  );

  const data = previewQuery.data as Record<string, any> | undefined;

  useEffect(() => {
    if (data?.title) {
      document.title = `[Preview] ${data.title} — Nexus OS Blog`;
    }
  }, [data?.title]);

  if (previewQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-nexus-indigo" size={32} />
      </div>
    );
  }

  if (previewQuery.error || !data) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
        <AlertTriangle size={32} className="text-nexus-amber" />
        <p className="text-xl font-bold">Preview not found or expired</p>
        <p className="text-muted-foreground text-sm">
          Preview links expire after 30 minutes.
        </p>
        <Link
          href="/blog"
          className="text-nexus-indigo hover:underline font-mono text-sm"
        >
          Go to Blog
        </Link>
      </div>
    );
  }

  const tags = parseTags(data.tags as string | null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Preview Banner */}
      <div className="bg-nexus-amber/20 border-b border-nexus-amber/40 px-4 py-2 text-center">
        <span className="text-sm font-mono text-nexus-amber flex items-center justify-center gap-2">
          <AlertTriangle size={14} />
          Draft Preview — This link expires in 30 minutes
        </span>
      </div>

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
              /preview
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <article className="container py-12 max-w-4xl mx-auto">
        {/* Featured Image */}
        {data.featuredImageUrl && (
          <div className="rounded-xl overflow-hidden mb-8 border border-border">
            <img
              src={data.featuredImageUrl as string}
              alt={(data.featuredImageAlt as string) || (data.title as string)}
              className="w-full h-auto max-h-[480px] object-cover"
            />
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {data.category && (
            <Badge className="bg-nexus-green/10 text-nexus-green border-nexus-green/30 text-xs">
              {CATEGORY_LABELS[data.category as string] || data.category}
            </Badge>
          )}
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-6 leading-tight">
          {data.title as string}
        </h1>

        {/* Author / Reading Time */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground mb-10 pb-8 border-b border-border">
          {data.author && (
            <span className="font-medium text-foreground">
              {data.author as string}
            </span>
          )}
          {data.readingTimeMinutes && (
            <span className="flex items-center gap-1.5">
              <Clock size={13} />
              {data.readingTimeMinutes as number} min read
            </span>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none blog-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {(data.content as string) || ""}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
