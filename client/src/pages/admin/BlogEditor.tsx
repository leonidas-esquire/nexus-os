import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Link, useLocation, useParams } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Settings, Save, Eye, Loader2, X, Plus, Image as ImageIcon } from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import Paragraph from "@editorjs/paragraph";
import EditorList from "@editorjs/list";
import Checklist from "@editorjs/checklist";
import Quote from "@editorjs/quote";
import Code from "@editorjs/code";
import InlineCode from "@editorjs/inline-code";
import Marker from "@editorjs/marker";
import Delimiter from "@editorjs/delimiter";
import Table from "@editorjs/table";
import Embed from "@editorjs/embed";
import Warning from "@editorjs/warning";
import RawTool from "@editorjs/raw";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

function editorBlocksToHtml(blocks: any[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case "header":
        return `<h${block.data.level}>${block.data.text}</h${block.data.level}>`;
      case "paragraph":
        return `<p>${block.data.text}</p>`;
      case "list":
        const tag = block.data.style === "ordered" ? "ol" : "ul";
        const items = (block.data.items || []).map((item: any) => {
          const content = typeof item === "string" ? item : item.content || "";
          return `<li>${content}</li>`;
        }).join("");
        return `<${tag}>${items}</${tag}>`;
      case "checklist":
        const checks = (block.data.items || []).map((item: any) =>
          `<div class="checklist-item"><input type="checkbox" ${item.checked ? "checked" : ""} disabled/> ${item.text}</div>`
        ).join("");
        return `<div class="checklist">${checks}</div>`;
      case "quote":
        return `<blockquote><p>${block.data.text}</p>${block.data.caption ? `<cite>${block.data.caption}</cite>` : ""}</blockquote>`;
      case "code":
        return `<pre><code>${block.data.code}</code></pre>`;
      case "delimiter":
        return `<hr/>`;
      case "table":
        const rows = (block.data.content || []).map((row: string[], i: number) => {
          const cells = row.map(cell => block.data.withHeadings && i === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`).join("");
          return `<tr>${cells}</tr>`;
        }).join("");
        return `<table>${rows}</table>`;
      case "image":
        return `<figure><img src="${block.data.file?.url || block.data.url}" alt="${block.data.caption || ""}" />${block.data.caption ? `<figcaption>${block.data.caption}</figcaption>` : ""}</figure>`;
      case "embed":
        return `<div class="embed"><iframe src="${block.data.embed}" allowfullscreen></iframe>${block.data.caption ? `<p>${block.data.caption}</p>` : ""}</div>`;
      case "warning":
        return `<div class="warning"><strong>${block.data.title}</strong><p>${block.data.message}</p></div>`;
      case "raw":
        return block.data.html || "";
      default:
        return `<p>${JSON.stringify(block.data)}</p>`;
    }
  }).join("\n");
}

export default function BlogEditor() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ id?: string }>();
  const isEditing = !!params.id;

  const editorRef = useRef<EditorJS | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorInitialized = useRef(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverImageAlt, setCoverImageAlt] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "scheduled" | "archived">("draft");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [metaRobots, setMetaRobots] = useState("index,follow");
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const authorsQuery = trpc.blog.authors.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const tagsQuery = trpc.blog.tags.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const postQuery = trpc.blog.posts.getById.useQuery(
    { id: params.id! },
    { enabled: isEditing && isAuthenticated && user?.role === "admin" }
  );

  const createMutation = trpc.blog.posts.create.useMutation();
  const updateMutation = trpc.blog.posts.update.useMutation();

  // Initialize editor
  useEffect(() => {
    if (!editorContainerRef.current || editorInitialized.current) return;
    if (isEditing && !postQuery.data) return;

    let initialData: any = undefined;
    if (isEditing && postQuery.data?.contentJson) {
      try {
        initialData = JSON.parse(postQuery.data.contentJson);
      } catch {}
    }

    const editor = new EditorJS({
      holder: editorContainerRef.current,
      placeholder: "Start writing your article...",
      tools: {
        header: { class: Header as any, config: { levels: [2, 3, 4], defaultLevel: 2 } },
        paragraph: { class: Paragraph as any },
        list: { class: EditorList as any },
        checklist: { class: Checklist as any },
        quote: { class: Quote as any },
        code: { class: Code as any },
        inlineCode: { class: InlineCode as any },
        marker: { class: Marker as any },
        delimiter: { class: Delimiter as any },
        table: { class: Table as any },
        embed: { class: Embed as any },
        warning: { class: Warning as any },
        raw: { class: RawTool as any },
      },
      data: initialData,
      minHeight: 300,
    });

    editorRef.current = editor;
    editorInitialized.current = true;

    return () => {
      if (editorRef.current && typeof editorRef.current.destroy === "function") {
        editorRef.current.destroy();
        editorRef.current = null;
        editorInitialized.current = false;
      }
    };
  }, [isEditing, postQuery.data]);

  // Load existing post data
  useEffect(() => {
    if (!isEditing || !postQuery.data) return;
    const post = postQuery.data;
    setTitle(post.title);
    setSlug(post.slug);
    setSubtitle(post.subtitle ?? "");
    setExcerpt(post.excerpt ?? "");
    setCoverImage(post.coverImage ?? "");
    setCoverImageAlt(post.coverImageAlt ?? "");
    setOgTitle(post.ogTitle ?? "");
    setOgDescription(post.ogDescription ?? "");
    setOgImage(post.ogImage ?? "");
    setAuthorId(post.authorId);
    setStatus(post.status as any);
    setSelectedTagIds(post.tagIds ?? []);
    setCanonicalUrl(post.canonicalUrl ?? "");
    setMetaRobots(post.metaRobots ?? "index,follow");
    setSlugManuallyEdited(true);
  }, [isEditing, postQuery.data]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManuallyEdited]);

  const handleSave = useCallback(async () => {
    if (!editorRef.current) return;
    setSaving(true);
    try {
      const outputData = await editorRef.current.save();
      const htmlContent = editorBlocksToHtml(outputData.blocks);
      const contentJson = JSON.stringify(outputData);

      if (isEditing) {
        await updateMutation.mutateAsync({
          id: params.id!,
          title,
          subtitle: subtitle || undefined,
          excerpt: excerpt || undefined,
          content: htmlContent,
          contentJson,
          coverImage: coverImage || undefined,
          coverImageAlt: coverImageAlt || undefined,
          ogTitle: ogTitle || undefined,
          ogDescription: ogDescription || undefined,
          ogImage: ogImage || undefined,
          authorId,
          status,
          tagIds: selectedTagIds,
          canonicalUrl: canonicalUrl || undefined,
          metaRobots: metaRobots || undefined,
          slug,
        });
        toast.success("Post updated");
      } else {
        const result = await createMutation.mutateAsync({
          title,
          subtitle: subtitle || undefined,
          excerpt: excerpt || undefined,
          content: htmlContent,
          contentJson,
          coverImage: coverImage || undefined,
          coverImageAlt: coverImageAlt || undefined,
          ogTitle: ogTitle || undefined,
          ogDescription: ogDescription || undefined,
          ogImage: ogImage || undefined,
          authorId,
          status,
          tagIds: selectedTagIds,
          canonicalUrl: canonicalUrl || undefined,
          metaRobots: metaRobots || undefined,
          slug,
        });
        toast.success("Post created");
        navigate(`/admin/blog/edit/${result.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [title, slug, subtitle, excerpt, coverImage, coverImageAlt, ogTitle, ogDescription, ogImage, authorId, status, selectedTagIds, canonicalUrl, metaRobots, isEditing, params.id]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-nexus-indigo" size={24} />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground font-mono">Admin access required</p>
        <Button asChild variant="outline"><a href={getLoginUrl()}>Sign In</a></Button>
      </div>
    );
  }

  const authors = authorsQuery.data ?? [];
  const tags = tagsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-nexus-deep/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/admin/blog" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <span className="font-mono text-sm text-muted-foreground">
              {isEditing ? "Edit Post" : "New Post"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && status === "published" && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/blog/${slug}`}>
                  <Eye size={14} className="mr-1.5" />
                  Preview
                </Link>
              </Button>
            )}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings size={14} className="mr-1.5" />
                  Settings
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto bg-background border-border">
                <SheetHeader>
                  <SheetTitle className="font-mono">Post Settings</SheetTitle>
                </SheetHeader>
                <div className="space-y-5 mt-6">
                  {/* Status */}
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest">Status</Label>
                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                      <SelectTrigger className="bg-nexus-surface/50 border-border"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Author */}
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest">Author</Label>
                    <Select value={authorId} onValueChange={setAuthorId}>
                      <SelectTrigger className="bg-nexus-surface/50 border-border"><SelectValue placeholder="Select author" /></SelectTrigger>
                      <SelectContent>
                        {authors.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Slug */}
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest">Slug</Label>
                    <Input
                      value={slug}
                      onChange={e => { setSlug(e.target.value); setSlugManuallyEdited(true); }}
                      className="bg-nexus-surface/50 border-border font-mono text-sm"
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest">Subtitle</Label>
                    <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} className="bg-nexus-surface/50 border-border" />
                  </div>

                  {/* Excerpt */}
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest">Excerpt</Label>
                    <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} className="bg-nexus-surface/50 border-border" rows={3} />
                  </div>

                  {/* Cover Image */}
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest">Cover Image URL</Label>
                    <Input value={coverImage} onChange={e => setCoverImage(e.target.value)} className="bg-nexus-surface/50 border-border" placeholder="https://..." />
                    {coverImage && (
                      <img src={coverImage} alt="Cover preview" className="w-full h-32 object-cover rounded-md border border-border mt-2" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest">Cover Image Alt</Label>
                    <Input value={coverImageAlt} onChange={e => setCoverImageAlt(e.target.value)} className="bg-nexus-surface/50 border-border" />
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-widest">Tags</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map(tag => {
                        const selected = selectedTagIds.includes(tag.id);
                        return (
                          <Badge
                            key={tag.id}
                            variant={selected ? "default" : "outline"}
                            className={`cursor-pointer text-xs transition-colors ${selected ? "bg-nexus-indigo hover:bg-nexus-indigo/80" : "hover:bg-nexus-surface"}`}
                            onClick={() => {
                              setSelectedTagIds(prev =>
                                selected ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                              );
                            }}
                          >
                            {tag.name}
                          </Badge>
                        );
                      })}
                      {tags.length === 0 && (
                        <span className="text-xs text-muted-foreground">No tags created yet</span>
                      )}
                    </div>
                  </div>

                  {/* SEO */}
                  <div className="border-t border-border pt-4 space-y-4">
                    <h4 className="font-mono text-xs uppercase tracking-widest text-nexus-indigo">SEO Settings</h4>
                    <div className="space-y-2">
                      <Label className="text-xs">OG Title</Label>
                      <Input value={ogTitle} onChange={e => setOgTitle(e.target.value)} className="bg-nexus-surface/50 border-border" placeholder={title} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">OG Description</Label>
                      <Textarea value={ogDescription} onChange={e => setOgDescription(e.target.value)} className="bg-nexus-surface/50 border-border" rows={2} placeholder={excerpt} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">OG Image URL</Label>
                      <Input value={ogImage} onChange={e => setOgImage(e.target.value)} className="bg-nexus-surface/50 border-border" placeholder={coverImage || "https://..."} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Canonical URL</Label>
                      <Input value={canonicalUrl} onChange={e => setCanonicalUrl(e.target.value)} className="bg-nexus-surface/50 border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Meta Robots</Label>
                      <Input value={metaRobots} onChange={e => setMetaRobots(e.target.value)} className="bg-nexus-surface/50 border-border" />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Button
              size="sm"
              className="bg-nexus-indigo hover:bg-nexus-indigo/90"
              onClick={handleSave}
              disabled={saving || !title || !authorId}
            >
              {saving ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Save size={14} className="mr-1.5" />}
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-8">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Post title..."
          className="w-full text-3xl sm:text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40 mb-2"
        />
        <div className="text-sm font-mono text-muted-foreground mb-8">
          /blog/{slug || "..."}
        </div>

        {/* Editor */}
        <div
          ref={editorContainerRef}
          className="prose prose-invert max-w-none min-h-[400px] [&_.ce-block__content]:max-w-none [&_.ce-toolbar__content]:max-w-none"
        />
      </main>
    </div>
  );
}
