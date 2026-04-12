import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  ArrowLeft,
  Save,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Quote,
  Code,
  Link as LinkIcon,
  Image,
  Minus,
  List,
  ListOrdered,
  Upload,
  Loader2,
  Network,
  X,
  FileText,
  SquareCode,
} from "lucide-react";

const CATEGORIES = [
  { value: "explainer", label: "Explainer" },
  { value: "tutorial", label: "Tutorial" },
  { value: "opinion", label: "Opinion" },
  { value: "case-study", label: "Case Study" },
  { value: "announcement", label: "Announcement" },
  { value: "release", label: "Release" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

function estimateReadingTime(markdown: string): number {
  const text = markdown
    .replace(/[#*`>\[\]()!_~-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  const words = text.split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 250));
}

function formatDate(d: Date | string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Post List View ────────────────────────────────────────────────

function PostListView({ onEdit }: { onEdit: (id: number) => void }) {
  const [, navigate] = useLocation();
  const postsQuery = trpc.adminBlog.list.useQuery({ limit: 100, offset: 0 });
  const deleteMutation = trpc.adminBlog.delete.useMutation();
  const utils = trpc.useUtils();

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync({ id, title });
      utils.adminBlog.list.invalidate();
      toast.success("Post deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  const posts = postsQuery.data?.posts ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {postsQuery.data?.total ?? 0} total posts
          </p>
        </div>
        <Button
          onClick={() => onEdit(-1)}
          className="bg-nexus-indigo hover:bg-nexus-indigo/90"
        >
          <Plus size={16} className="mr-2" />
          New Post
        </Button>
      </div>

      {postsQuery.isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-nexus-indigo" size={24} />
        </div>
      )}

      <div className="space-y-3">
        {posts.map((post) => (
          <div
            key={post.id}
            className="flex items-center gap-4 p-4 rounded-lg border border-border bg-nexus-surface/10 hover:border-nexus-indigo/20 transition-colors"
          >
            {/* Thumbnail */}
            {post.featuredImageUrl ? (
              <img
                src={post.featuredImageUrl}
                alt=""
                className="w-16 h-12 rounded object-cover shrink-0 border border-border"
              />
            ) : (
              <div className="w-16 h-12 rounded bg-nexus-surface/30 border border-border flex items-center justify-center shrink-0">
                <FileText size={16} className="text-muted-foreground" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm truncate">
                  {post.title}
                </span>
                <Badge
                  variant={post.published ? "default" : "outline"}
                  className={`text-xs shrink-0 ${
                    post.published
                      ? "bg-nexus-green/20 text-nexus-green border-nexus-green/30"
                      : ""
                  }`}
                >
                  {post.published ? "Published" : "Draft"}
                </Badge>
                {post.featured && (
                  <Badge className="bg-nexus-indigo/20 text-nexus-indigo border-nexus-indigo/30 text-xs shrink-0">
                    Featured
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>
                  {CATEGORIES.find((c) => c.value === post.category)?.label ||
                    post.category}
                </span>
                <span>{formatDate(post.updatedAt)}</span>
                <span>{post.readingTimeMinutes} min</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {post.published && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => window.open(`/blog/${post.slug}`, "_blank")}
                  title="View public"
                >
                  <ExternalLink size={14} />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(post.id)}
                title="Edit"
              >
                <Edit size={14} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-400 hover:text-red-300"
                onClick={() => handleDelete(post.id, post.title)}
                title="Delete"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!postsQuery.isLoading && posts.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <FileText size={40} className="mx-auto mb-4 opacity-40" />
          <p className="font-mono">No posts yet</p>
          <Button
            onClick={() => onEdit(-1)}
            className="mt-4 bg-nexus-indigo hover:bg-nexus-indigo/90"
          >
            Create your first post
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Post Editor View ──────────────────────────────────────────────

function PostEditorView({
  postId,
  onBack,
}: {
  postId: number | null;
  onBack: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  // Load existing post if editing
  const postQuery = trpc.adminBlog.getById.useQuery(
    { id: postId! },
    { enabled: postId !== null && postId > 0 }
  );

  const upsertMutation = trpc.adminBlog.upsert.useMutation();
  const previewMutation = trpc.adminBlog.previewToken.useMutation();

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("Leonidas Esquire Williamson");
  const [category, setCategory] = useState("explainer");
  const [tagsInput, setTagsInput] = useState("");
  const [readingTime, setReadingTime] = useState(5);
  const [featuredImageUrl, setFeaturedImageUrl] = useState("");
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [ogImageOverride, setOgImageOverride] = useState("");
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState("");
  const [scheduledPublishAt, setScheduledPublishAt] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load post data
  useEffect(() => {
    if (postQuery.data && !loaded) {
      const p = postQuery.data;
      setTitle(p.title);
      setSlug(p.slug);
      setSlugManual(true);
      setExcerpt(p.excerpt);
      setContent(p.content);
      setAuthor(p.author);
      setCategory(p.category);
      setReadingTime(p.readingTimeMinutes);
      setFeaturedImageUrl(p.featuredImageUrl || "");
      setFeaturedImageAlt(p.featuredImageAlt || "");
      setOgImageOverride(p.ogImageOverride || "");
      setFeatured(p.featured);
      setPublished(p.published);
      if (p.publishedAt) {
        setPublishedAt(toLocalDatetimeStr(new Date(p.publishedAt)));
      }
      if (p.scheduledPublishAt) {
        setScheduledPublishAt(
          toLocalDatetimeStr(new Date(p.scheduledPublishAt))
        );
      }
      // Parse tags
      try {
        const tags = JSON.parse(p.tags || "[]");
        setTagsInput(Array.isArray(tags) ? tags.join(", ") : "");
      } catch {
        setTagsInput("");
      }
      setLoaded(true);
    }
  }, [postQuery.data, loaded]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManual && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManual]);

  // Auto-estimate reading time
  useEffect(() => {
    if (content) {
      setReadingTime(estimateReadingTime(content));
    }
  }, [content]);

  function toLocalDatetimeStr(d: Date): string {
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  // ─── Toolbar Actions ────────────────────────────────────────────

  const insertAtCursor = useCallback(
    (before: string, after: string = "", placeholder: string = "") => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = content.slice(start, end);
      const text = selected || placeholder;
      const newContent =
        content.slice(0, start) + before + text + after + content.slice(end);
      setContent(newContent);
      // Set cursor after insertion
      requestAnimationFrame(() => {
        const cursorPos = start + before.length + text.length + after.length;
        ta.setSelectionRange(
          start + before.length,
          start + before.length + text.length
        );
        ta.focus();
      });
    },
    [content]
  );

  const toolbarActions = useMemo(
    () => [
      {
        icon: Bold,
        label: "Bold",
        action: () => insertAtCursor("**", "**", "bold text"),
      },
      {
        icon: Italic,
        label: "Italic",
        action: () => insertAtCursor("*", "*", "italic text"),
      },
      {
        icon: Heading2,
        label: "H2",
        action: () => insertAtCursor("## ", "", "Heading"),
      },
      {
        icon: Heading3,
        label: "H3",
        action: () => insertAtCursor("### ", "", "Heading"),
      },
      {
        icon: Quote,
        label: "Quote",
        action: () => insertAtCursor("> ", "", "quote"),
      },
      {
        icon: SquareCode,
        label: "Code Block",
        action: () => insertAtCursor("```\n", "\n```", "code"),
      },
      {
        icon: Code,
        label: "Inline Code",
        action: () => insertAtCursor("`", "`", "code"),
      },
      {
        icon: LinkIcon,
        label: "Link",
        action: () => insertAtCursor("[", "](url)", "link text"),
      },
      {
        icon: Image,
        label: "Image",
        action: () => insertAtCursor("![", "](url)", "alt text"),
      },
      {
        icon: Minus,
        label: "Horizontal Rule",
        action: () => insertAtCursor("\n---\n"),
      },
      {
        icon: List,
        label: "Bullet List",
        action: () => insertAtCursor("- ", "", "item"),
      },
      {
        icon: ListOrdered,
        label: "Numbered List",
        action: () => insertAtCursor("1. ", "", "item"),
      },
    ],
    [insertAtCursor]
  );

  // ─── Image Upload ───────────────────────────────────────────────

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/blog/upload-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error || "Upload failed");
      }
      const { url } = await res.json();
      setFeaturedImageUrl(url);
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file);
    }
  };

  // ─── Save ───────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!excerpt.trim()) {
      toast.error("Excerpt is required");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await upsertMutation.mutateAsync({
        id: postId && postId > 0 ? postId : undefined,
        slug: slug || slugify(title),
        title: title.trim(),
        excerpt: excerpt.trim(),
        content,
        author,
        category: category as any,
        tags: tags.length > 0 ? JSON.stringify(tags) : null,
        readingTimeMinutes: readingTime,
        featuredImageUrl: featuredImageUrl || null,
        featuredImageAlt: featuredImageAlt || null,
        ogImageOverride: ogImageOverride || null,
        featured,
        published,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        scheduledPublishAt: scheduledPublishAt
          ? new Date(scheduledPublishAt)
          : null,
      });
      utils.adminBlog.list.invalidate();
      toast.success(postId && postId > 0 ? "Post updated" : "Post created");
      onBack();
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
  };

  // ─── Preview Token ──────────────────────────────────────────────

  const handlePreviewInNewTab = async () => {
    try {
      const { token } = await previewMutation.mutateAsync({
        title: title.trim(),
        excerpt: excerpt.trim(),
        content,
        author,
        category: category as any,
        tags: tagsInput
          ? JSON.stringify(
              tagsInput
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            )
          : null,
        readingTimeMinutes: readingTime,
        featuredImageUrl: featuredImageUrl || null,
        featuredImageAlt: featuredImageAlt || null,
      });
      window.open(`/blog/preview/${token}`, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to create preview");
    }
  };

  if (postId && postId > 0 && postQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-nexus-indigo" size={24} />
      </div>
    );
  }

  return (
    <div>
      {/* Editor Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Posts
        </button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviewInNewTab}
            disabled={!title || !excerpt || previewMutation.isPending}
          >
            <Eye size={14} className="mr-1" />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={upsertMutation.isPending}
            className="bg-nexus-indigo hover:bg-nexus-indigo/90"
          >
            {upsertMutation.isPending ? (
              <Loader2 size={14} className="mr-1 animate-spin" />
            ) : (
              <Save size={14} className="mr-1" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Editor (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          <Input
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold bg-transparent border-border h-14"
          />

          {/* Slug */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground shrink-0">
              /blog/
            </span>
            <Input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugManual(true);
              }}
              className="text-sm font-mono bg-transparent border-border"
              placeholder="post-slug"
            />
          </div>

          {/* Excerpt */}
          <textarea
            placeholder="Excerpt — shown in listings and meta description"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-nexus-indigo/50"
          />

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-1 p-2 rounded-md border border-border bg-nexus-surface/20">
            {toolbarActions.map((action) => (
              <button
                key={action.label}
                onClick={action.action}
                title={action.label}
                className="p-1.5 rounded hover:bg-nexus-indigo/20 text-muted-foreground hover:text-foreground transition-colors"
              >
                <action.icon size={16} />
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                showPreview
                  ? "bg-nexus-indigo text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {showPreview ? "Editor" : "Preview"}
            </button>
          </div>

          {/* Content Editor / Preview */}
          {showPreview ? (
            <div className="rounded-md border border-border bg-nexus-surface/10 p-6 min-h-[500px] prose prose-invert prose-lg max-w-none blog-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || "*No content yet*"}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post in Markdown..."
              className="w-full rounded-md border border-border bg-transparent px-4 py-3 font-mono text-sm leading-relaxed resize-y min-h-[500px] focus:outline-none focus:ring-2 focus:ring-nexus-indigo/50"
            />
          )}
        </div>

        {/* Sidebar (1 col) */}
        <div className="space-y-5">
          {/* Publish Settings */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Publish Settings
            </h3>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm">Published</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm">Featured</span>
            </label>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Publish Date
              </label>
              <Input
                type="datetime-local"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="text-sm bg-transparent border-border"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Scheduled Publish
              </label>
              <Input
                type="datetime-local"
                value={scheduledPublishAt}
                onChange={(e) => setScheduledPublishAt(e.target.value)}
                className="text-sm bg-transparent border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-publishes at this time
              </p>
            </div>
          </div>

          {/* Category & Tags */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Taxonomy
            </h3>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Category
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-transparent border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Tags (comma-separated)
              </label>
              <Input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="ai, trust, seo"
                className="text-sm bg-transparent border-border"
              />
            </div>
          </div>

          {/* Author & Reading Time */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Meta
            </h3>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Author
              </label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="text-sm bg-transparent border-border"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Reading Time (min)
              </label>
              <Input
                type="number"
                min={1}
                value={readingTime}
                onChange={(e) => setReadingTime(Number(e.target.value) || 1)}
                className="text-sm bg-transparent border-border"
              />
            </div>
          </div>

          {/* Featured Image */}
          <div className="rounded-lg border border-border p-4 space-y-4">
            <h3 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Featured Image
            </h3>

            {featuredImageUrl ? (
              <div className="relative">
                <img
                  src={featuredImageUrl}
                  alt={featuredImageAlt || "Featured"}
                  className="w-full rounded-md border border-border"
                />
                <button
                  onClick={() => setFeaturedImageUrl("")}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-nexus-indigo/40 transition-colors"
              >
                {uploading ? (
                  <Loader2
                    size={24}
                    className="mx-auto animate-spin text-nexus-indigo"
                  />
                ) : (
                  <>
                    <Upload
                      size={24}
                      className="mx-auto mb-2 text-muted-foreground"
                    />
                    <p className="text-sm text-muted-foreground">
                      Drop image or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPEG, PNG, WebP, GIF, AVIF (max 100 MB)
                    </p>
                  </>
                )}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
                e.target.value = "";
              }}
            />

            {featuredImageUrl && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Alt Text
                </label>
                <Input
                  value={featuredImageAlt}
                  onChange={(e) => setFeaturedImageAlt(e.target.value)}
                  placeholder="Describe the image"
                  className="text-sm bg-transparent border-border"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                OG Image Override (URL)
              </label>
              <Input
                value={ogImageOverride}
                onChange={(e) => setOgImageOverride(e.target.value)}
                placeholder="https://..."
                className="text-sm bg-transparent border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Overrides featured image for social sharing only
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Blog Page ──────────────────────────────────────────

export default function AdminBlog() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [editingPostId, setEditingPostId] = useState<number | null>(null);

  // Redirect non-admin
  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-nexus-indigo" size={32} />
      </div>
    );
  }

  if (!user || user.role !== "admin") return null;

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
              /admin/blog
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/blog"
              className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              View Blog
            </Link>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-5xl mx-auto">
        {editingPostId !== null ? (
          <PostEditorView
            postId={editingPostId === -1 ? null : editingPostId}
            onBack={() => setEditingPostId(null)}
          />
        ) : (
          <PostListView onEdit={setEditingPostId} />
        )}
      </main>
    </div>
  );
}
