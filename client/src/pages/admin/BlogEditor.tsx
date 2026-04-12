import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation, useParams } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft, Settings, Save, Eye, Loader2, Upload,
  Bold, Italic, Heading2, Heading3, Heading4,
  List, ListOrdered, CheckSquare, Quote, Code2, Minus, Table2,
  AlertTriangle, FileCode, ImageIcon, Link2, Highlighter,
  Tag, FolderOpen, Plus, X, ChevronDown
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import Paragraph from "@editorjs/paragraph";
import EditorList from "@editorjs/list";
import Checklist from "@editorjs/checklist";
import QuoteTool from "@editorjs/quote";
import CodeTool from "@editorjs/code";
import InlineCode from "@editorjs/inline-code";
import Marker from "@editorjs/marker";
import Delimiter from "@editorjs/delimiter";
import TableTool from "@editorjs/table";
import Embed from "@editorjs/embed";
import Warning from "@editorjs/warning";
import RawTool from "@editorjs/raw";
import ImageTool from "@editorjs/image";

// ─── Helpers ────────────────────────────────────────────────────

function htmlToEditorBlocks(html: string): any {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const blocks: any[] = [];

  const processNode = (node: Element) => {
    const tag = node.tagName.toLowerCase();
    if (tag.match(/^h[2-4]$/)) {
      blocks.push({ type: "header", data: { text: node.innerHTML, level: parseInt(tag[1]) } });
    } else if (tag === "p") {
      const text = node.innerHTML.trim();
      if (text) blocks.push({ type: "paragraph", data: { text } });
    } else if (tag === "ul" || tag === "ol") {
      const items = Array.from(node.querySelectorAll(":scope > li")).map(li => ({
        content: li.innerHTML, items: [],
      }));
      blocks.push({ type: "list", data: { style: tag === "ol" ? "ordered" : "unordered", items } });
    } else if (tag === "pre") {
      const code = node.querySelector("code");
      blocks.push({ type: "code", data: { code: code ? code.textContent || "" : node.textContent || "" } });
    } else if (tag === "blockquote") {
      const p = node.querySelector("p");
      const cite = node.querySelector("cite");
      blocks.push({ type: "quote", data: { text: p ? p.innerHTML : node.innerHTML, caption: cite ? cite.textContent || "" : "" } });
    } else if (tag === "hr") {
      blocks.push({ type: "delimiter", data: {} });
    } else if (tag === "figure") {
      const img = node.querySelector("img");
      const figcaption = node.querySelector("figcaption");
      if (img) {
        const imgAlt = img.getAttribute("alt") || "";
        const imgCaption = figcaption ? figcaption.textContent || "" : "";
        blocks.push({ type: "image", data: { file: { url: img.getAttribute("src") || "" }, alt: imgAlt, caption: imgCaption || imgAlt, withBorder: false, stretched: false, withBackground: false } });
      }
    } else if (tag === "table") {
      const rows = Array.from(node.querySelectorAll("tr")).map(tr =>
        Array.from(tr.querySelectorAll("td, th")).map(cell => cell.innerHTML)
      );
      blocks.push({ type: "table", data: { content: rows, withHeadings: node.querySelector("th") !== null } });
    } else if (tag === "div" && node.classList.contains("warning")) {
      const strong = node.querySelector("strong");
      const p = node.querySelector("p");
      blocks.push({ type: "warning", data: { title: strong?.textContent || "", message: p?.textContent || "" } });
    }
  };

  Array.from(doc.body.children).forEach(processNode);
  if (blocks.length === 0 && html.trim()) {
    blocks.push({ type: "raw", data: { html } });
  }
  return { time: Date.now(), blocks, version: "2.28.0" };
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 200);
}

function editorBlocksToHtml(blocks: any[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case "header": return `<h${block.data.level}>${block.data.text}</h${block.data.level}>`;
      case "paragraph": return `<p>${block.data.text}</p>`;
      case "list": {
        const t = block.data.style === "ordered" ? "ol" : "ul";
        const items = (block.data.items || []).map((item: any) => `<li>${typeof item === "string" ? item : item.content || ""}</li>`).join("");
        return `<${t}>${items}</${t}>`;
      }
      case "checklist": return `<div class="checklist">${(block.data.items || []).map((item: any) => `<div class="checklist-item"><input type="checkbox" ${item.checked ? "checked" : ""} disabled/> ${item.text}</div>`).join("")}</div>`;
      case "quote": return `<blockquote><p>${block.data.text}</p>${block.data.caption ? `<cite>${block.data.caption}</cite>` : ""}</blockquote>`;
      case "code": return `<pre><code>${block.data.code}</code></pre>`;
      case "delimiter": return `<hr/>`;
      case "table": {
        const rows = (block.data.content || []).map((row: string[], i: number) => {
          const cells = row.map(cell => block.data.withHeadings && i === 0 ? `<th>${cell}</th>` : `<td>${cell}</td>`).join("");
          return `<tr>${cells}</tr>`;
        }).join("");
        return `<table>${rows}</table>`;
      }
      case "image": {
        const url = block.data.file?.url || block.data.url || "";
        const alt = block.data.alt || block.data.caption || "";
        return `<figure><img src="${url}" alt="${alt}" />${block.data.caption ? `<figcaption>${block.data.caption}</figcaption>` : ""}</figure>`;
      }
      case "embed": return `<div class="embed"><iframe src="${block.data.embed}" allowfullscreen></iframe>${block.data.caption ? `<p>${block.data.caption}</p>` : ""}</div>`;
      case "warning": return `<div class="warning"><strong>${block.data.title}</strong><p>${block.data.message}</p></div>`;
      case "raw": return block.data.html || "";
      default: return `<p>${JSON.stringify(block.data)}</p>`;
    }
  }).join("\n");
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

// ─── Toolbar Button ─────────────────────────────────

function ToolbarBtn({ icon: Icon, label, onClick, active = false }: {
  icon: any;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => e.preventDefault()}
      onClick={onClick}
      title={label}
      className={`p-1.5 rounded-md transition-colors hover:bg-white/10 ${active ? "bg-white/15 text-nexus-indigo" : "text-muted-foreground hover:text-foreground"}`}
    >
      <Icon size={16} />
    </button>
  );
}

// ─── Image Upload Component ─────────────────────────────────────

function ImageUploadField({ label, value, onChange, uploadMutation, altText, onAltTextChange }: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  uploadMutation: any;
  altText?: string;
  onAltTextChange?: (alt: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 100MB.");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(",")[1];
          const result = await uploadMutation.mutateAsync({
            base64,
            filename: file.name,
            mimeType: file.type,
          });
          onChange(result.url);
          toast.success("Image uploaded");
        } catch (err: any) {
          toast.error(err.message || "Upload failed");
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => { toast.error("Failed to read file"); setUploading(false); };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="font-mono text-xs uppercase tracking-widest">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="bg-nexus-surface/50 border-border flex-1"
          placeholder="https://..."
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="shrink-0"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        </Button>
      </div>
      {value && (
        <div className="relative group">
          <img src={value} alt={altText || "Preview"} className="w-full h-32 object-cover rounded-md border border-border" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 p-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={12} className="text-white" />
          </button>
        </div>
      )}
      {value && onAltTextChange && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Alt Text (for accessibility &amp; SEO)</Label>
          <Input
            value={altText || ""}
            onChange={e => onAltTextChange(e.target.value)}
            className="bg-nexus-surface/50 border-border text-sm"
            placeholder="Describe the image for screen readers..."
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Editor Component ──────────────────────────────────────

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
  const [ogImageAlt, setOgImageAlt] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "published" | "scheduled" | "archived">("draft");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [metaRobots, setMetaRobots] = useState("index,follow");
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const authorsQuery = trpc.blog.authors.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const tagsQuery = trpc.blog.tags.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const categoriesQuery = trpc.blog.categories.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const postQuery = trpc.blog.posts.getById.useQuery(
    { id: params.id! },
    { enabled: isEditing && isAuthenticated && user?.role === "admin" }
  );

  const createMutation = trpc.blog.posts.create.useMutation();
  const updateMutation = trpc.blog.posts.update.useMutation();
  const imageUploadMutation = trpc.blog.images.upload.useMutation();
  const categoryUpsertMutation = trpc.blog.categories.upsert.useMutation();
  const utils = trpc.useUtils();

  // Initialize editor
  useEffect(() => {
    if (!editorContainerRef.current || editorInitialized.current) return;
    if (isEditing && !postQuery.data) return;

    let initialData: any = undefined;
    if (isEditing && postQuery.data) {
      if (postQuery.data.contentJson) {
        try { initialData = JSON.parse(postQuery.data.contentJson); } catch {}
      }
      if (!initialData && postQuery.data.content) {
        initialData = htmlToEditorBlocks(postQuery.data.content);
      }
    }

    const editor = new EditorJS({
      holder: editorContainerRef.current,
      placeholder: "Start writing your article...",
      tools: {
        header: {
          class: Header as any,
          config: { levels: [2, 3, 4], defaultLevel: 2 },
          inlineToolbar: true,
        },
        paragraph: { class: Paragraph as any, inlineToolbar: true },
        list: { class: EditorList as any, inlineToolbar: true },
        checklist: { class: Checklist as any, inlineToolbar: true },
        quote: { class: QuoteTool as any, inlineToolbar: true },
        code: { class: CodeTool as any },
        inlineCode: { class: InlineCode as any },
        marker: { class: Marker as any },
        delimiter: { class: Delimiter as any },
        table: { class: TableTool as any, inlineToolbar: true },
        embed: { class: Embed as any },
        warning: { class: Warning as any, inlineToolbar: true },
        raw: { class: RawTool as any },
        image: {
          class: ImageTool as any,
          config: {
            captionPlaceholder: "Image caption",
            features: {
              caption: "optional",
              border: true,
              background: true,
              stretched: true,
            },
            actions: [
              {
                name: "alt",
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="currentColor" stroke="none">alt</text></svg>',
                title: "Set Alt Text",
                toggle: false,
                action: async (name: string, blockAPI: any) => {
                  try {
                    // Get current block index and data
                    const idx = editorRef.current?.blocks.getCurrentBlockIndex() ?? -1;
                    if (idx < 0) return;
                    const savedData = await editorRef.current?.save();
                    const blockData = savedData?.blocks[idx];
                    const currentAlt = blockData?.data?.alt || blockData?.data?.caption || "";
                    const alt = prompt("Enter alt text for this image:", currentAlt);
                    if (alt !== null) {
                      // Store alt in block tunes data - we'll read it on save
                      if (blockData) {
                        blockData.data.alt = alt;
                        // Update the block by removing and re-inserting
                        editorRef.current?.blocks.delete(idx);
                        editorRef.current?.blocks.insert(
                          blockData.type,
                          { ...blockData.data, alt },
                          undefined,
                          idx,
                          true
                        );
                      }
                      toast.success(`Alt text set: "${alt}"`);
                    }
                  } catch (err) {
                    console.warn("Failed to set alt text:", err);
                    // Fallback: just prompt
                    const alt = prompt("Enter alt text for this image:");
                    if (alt !== null) {
                      toast.success(`Alt text set: "${alt}"`);
                    }
                  }
                },
              },
            ],
            uploader: {
              async uploadByFile(file: File) {
                if (file.size > MAX_FILE_SIZE) {
                  toast.error("File too large. Maximum size is 100MB.");
                  return { success: 0 };
                }
                return new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onload = async () => {
                    try {
                      const base64 = (reader.result as string).split(",")[1];
                      const result = await imageUploadMutation.mutateAsync({
                        base64,
                        filename: file.name,
                        mimeType: file.type,
                      });
                      resolve({ success: 1, file: { url: result.url } });
                    } catch (err) { reject(err); }
                  };
                  reader.onerror = () => reject(new Error("Failed to read file"));
                  reader.readAsDataURL(file);
                });
              },
              async uploadByUrl(url: string) {
                return { success: 1, file: { url } };
              },
            },
          },
        },
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
    setOgImageAlt((post as any).ogImageAlt ?? "");
    setAuthorId(post.authorId);
    setCategoryId(post.categoryId ?? null);
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

  // ─── Toolbar actions ──────────────────────────────────────────

  const insertBlock = useCallback(async (type: string, data: any = {}) => {
    if (!editorRef.current) return;
    try {
      const idx = await editorRef.current.blocks.getCurrentBlockIndex();
      await editorRef.current.blocks.insert(type, data, undefined, idx + 1, true);
    } catch {
      await editorRef.current.blocks.insert(type, data);
    }
  }, []);

  // Convert current block to heading or toggle back to paragraph
  const convertToHeading = useCallback(async (level: number) => {
    if (!editorRef.current) return;
    try {
      const currentIdx = editorRef.current.blocks.getCurrentBlockIndex();
      if (currentIdx < 0) {
        await insertBlock("header", { text: "", level });
        return;
      }
      const currentBlock = editorRef.current.blocks.getBlockByIndex(currentIdx);
      if (!currentBlock) {
        await insertBlock("header", { text: "", level });
        return;
      }

      const blockId = currentBlock.id;
      const blockName = currentBlock.name;

      // If already a header at this level, convert back to paragraph
      if (blockName === "header") {
        // Check if it's the same level by reading saved data
        const savedData = await editorRef.current.save();
        const blockData = savedData.blocks[currentIdx];
        if (blockData && blockData.data.level === level) {
          await editorRef.current.blocks.convert(blockId, "paragraph");
          return;
        }
      }

      // Convert to header using the native API
      if (blockName === "paragraph" || blockName === "header") {
        await editorRef.current.blocks.convert(blockId, "header", { level });
      } else {
        // For non-text blocks, insert a new header after
        await editorRef.current.blocks.insert("header", { text: "", level }, undefined, currentIdx + 1, true);
      }
    } catch (err) {
      console.warn("convertToHeading fallback:", err);
      await insertBlock("header", { text: "", level });
    }
  }, [insertBlock]);

  const applyInlineStyle = useCallback((style: string) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      toast.info("Select some text first to apply formatting");
      return;
    }
    // execCommand works within contenteditable elements (which Editor.js uses)
    if (style === "bold") {
      document.execCommand("bold", false);
    } else if (style === "italic") {
      document.execCommand("italic", false);
    } else if (style === "highlight") {
      document.execCommand("hiliteColor", false, "#fef08a");
    } else if (style === "createLink") {
      const url = prompt("Enter URL:");
      if (url) document.execCommand("createLink", false, url);
    }
  }, []);

  // ─── Create custom category ──────────────────────────────────

  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      const result = await categoryUpsertMutation.mutateAsync({
        name: newCategoryName.trim(),
        slug: slugify(newCategoryName.trim()),
      });
      setCategoryId(result.id);
      setNewCategoryName("");
      setShowCategoryDropdown(false);
      utils.blog.categories.list.invalidate();
      toast.success(`Category "${newCategoryName.trim()}" created`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create category");
    } finally {
      setCreatingCategory(false);
    }
  }, [newCategoryName]);

  // ─── Save ─────────────────────────────────────────────────────

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
          title, subtitle: subtitle || undefined, excerpt: excerpt || undefined,
          content: htmlContent, contentJson,
          coverImage: coverImage || undefined, coverImageAlt: coverImageAlt || undefined,
          ogTitle: ogTitle || undefined, ogDescription: ogDescription || undefined,
          ogImage: ogImage || undefined, ogImageAlt: ogImageAlt || undefined,
          authorId, categoryId,
          status, tagIds: selectedTagIds,
          canonicalUrl: canonicalUrl || undefined, metaRobots: metaRobots || undefined, slug,
        });
        toast.success("Post updated");
      } else {
        const result = await createMutation.mutateAsync({
          title, subtitle: subtitle || undefined, excerpt: excerpt || undefined,
          content: htmlContent, contentJson,
          coverImage: coverImage || undefined, coverImageAlt: coverImageAlt || undefined,
          ogTitle: ogTitle || undefined, ogDescription: ogDescription || undefined,
          ogImage: ogImage || undefined, ogImageAlt: ogImageAlt || undefined,
          authorId, categoryId,
          status, tagIds: selectedTagIds,
          canonicalUrl: canonicalUrl || undefined, metaRobots: metaRobots || undefined, slug,
        });
        toast.success("Post created");
        navigate(`/admin/blog/edit/${result.id}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [title, slug, subtitle, excerpt, coverImage, coverImageAlt, ogTitle, ogDescription, ogImage, ogImageAlt, authorId, categoryId, status, selectedTagIds, canonicalUrl, metaRobots, isEditing, params.id]);

  // ─── Auth guard ───────────────────────────────────────────────

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
  const categories = categoriesQuery.data ?? [];
  const selectedCategory = categories.find(c => c.id === categoryId);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Header ─────────────────────────────────────────────── */}
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
              <SheetContent className="overflow-y-auto bg-background border-border w-[400px] sm:w-[440px]">
                <SheetHeader>
                  <SheetTitle className="font-mono">Post Settings</SheetTitle>
                </SheetHeader>

                <Tabs defaultValue="general" className="mt-4">
                  <TabsList className="w-full grid grid-cols-3 bg-nexus-surface/50">
                    <TabsTrigger value="general" className="text-xs font-mono">General</TabsTrigger>
                    <TabsTrigger value="media" className="text-xs font-mono">Media</TabsTrigger>
                    <TabsTrigger value="seo" className="text-xs font-mono">SEO</TabsTrigger>
                  </TabsList>

                  {/* ─── General Tab ─────────────────────────────── */}
                  <TabsContent value="general" className="space-y-5 mt-4">
                    {/* Status */}
                    <div className="space-y-2">
                      <Label className="font-mono text-xs uppercase tracking-widest">Status</Label>
                      <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                        <SelectTrigger className="bg-nexus-surface/50 border-border w-full"><SelectValue /></SelectTrigger>
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
                        <SelectTrigger className="bg-nexus-surface/50 border-border w-full"><SelectValue placeholder="Select author" /></SelectTrigger>
                        <SelectContent>
                          {authors.map(a => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label className="font-mono text-xs uppercase tracking-widest flex items-center gap-1.5">
                        <FolderOpen size={12} /> Category
                      </Label>
                      <Select value={categoryId ?? "none"} onValueChange={(v) => setCategoryId(v === "none" ? null : v)}>
                        <SelectTrigger className="bg-nexus-surface/50 border-border w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No category</SelectItem>
                          {categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Create custom category */}
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={newCategoryName}
                          onChange={e => setNewCategoryName(e.target.value)}
                          placeholder="New category name..."
                          className="bg-nexus-surface/50 border-border text-sm flex-1"
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCreateCategory(); } }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleCreateCategory}
                          disabled={creatingCategory || !newCategoryName.trim()}
                          className="shrink-0"
                        >
                          {creatingCategory ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                        </Button>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <Label className="font-mono text-xs uppercase tracking-widest flex items-center gap-1.5">
                        <Tag size={12} /> Tags
                      </Label>
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
                          <span className="text-xs text-muted-foreground">No tags created yet. <Link href="/admin/blog/tags" className="text-nexus-indigo hover:underline">Create tags</Link></span>
                        )}
                      </div>
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
                  </TabsContent>

                  {/* ─── Media Tab ──────────────────────────────── */}
                  <TabsContent value="media" className="space-y-5 mt-4">
                    <ImageUploadField
                      label="Cover Image"
                      value={coverImage}
                      onChange={setCoverImage}
                      uploadMutation={imageUploadMutation}
                      altText={coverImageAlt}
                      onAltTextChange={setCoverImageAlt}
                    />

                    <div className="border-t border-border pt-4">
                      <ImageUploadField
                        label="Open Graph Image"
                        value={ogImage}
                        onChange={setOgImage}
                        uploadMutation={imageUploadMutation}
                        altText={ogImageAlt}
                        onAltTextChange={setOgImageAlt}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Recommended: 1200x630px. Used when sharing on social media. Falls back to cover image if not set.
                      </p>
                    </div>
                  </TabsContent>

                  {/* ─── SEO Tab ────────────────────────────────── */}
                  <TabsContent value="seo" className="space-y-5 mt-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-mono uppercase tracking-widest">OG Title</Label>
                      <Input value={ogTitle} onChange={e => setOgTitle(e.target.value)} className="bg-nexus-surface/50 border-border" placeholder={title || "Defaults to post title"} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-mono uppercase tracking-widest">OG Description</Label>
                      <Textarea value={ogDescription} onChange={e => setOgDescription(e.target.value)} className="bg-nexus-surface/50 border-border" rows={2} placeholder={excerpt || "Defaults to excerpt"} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-mono uppercase tracking-widest">Canonical URL</Label>
                      <Input value={canonicalUrl} onChange={e => setCanonicalUrl(e.target.value)} className="bg-nexus-surface/50 border-border" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-mono uppercase tracking-widest">Meta Robots</Label>
                      <Input value={metaRobots} onChange={e => setMetaRobots(e.target.value)} className="bg-nexus-surface/50 border-border" />
                    </div>

                    {/* SEO Preview */}
                    <div className="border-t border-border pt-4">
                      <Label className="text-xs font-mono uppercase tracking-widest text-nexus-indigo mb-3 block">Search Preview</Label>
                      <div className="bg-white rounded-lg p-4 space-y-1">
                        <div className="text-blue-700 text-lg font-medium truncate">
                          {ogTitle || title || "Post Title"}
                        </div>
                        <div className="text-green-700 text-sm font-mono truncate">
                          aiagents.nexus/blog/{slug || "..."}
                        </div>
                        <div className="text-gray-600 text-sm line-clamp-2">
                          {ogDescription || excerpt || "Post description will appear here..."}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
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

      {/* ─── Formatting Toolbar ─────────────────────────────────── */}
      <div className="border-b border-border bg-nexus-deep/30 backdrop-blur-sm sticky top-14 z-30">
        <div className="container max-w-4xl">
          <div className="flex items-center gap-0.5 py-1.5 overflow-x-auto scrollbar-none">
            {/* Inline formatting */}
            <ToolbarBtn icon={Bold} label="Bold (Ctrl+B)" onClick={() => applyInlineStyle("bold")} />
            <ToolbarBtn icon={Italic} label="Italic (Ctrl+I)" onClick={() => applyInlineStyle("italic")} />
            <ToolbarBtn
              icon={Highlighter}
              label="Highlight"
              onClick={() => applyInlineStyle("highlight")}
            />
            <ToolbarBtn
              icon={Link2}
              label="Link"
              onClick={() => applyInlineStyle("createLink")}
            />

            <div className="w-px h-5 bg-border mx-1" />

            {/* Headings — convert current block */}
            <ToolbarBtn icon={Heading2} label="Heading 2 (converts current block)" onClick={() => convertToHeading(2)} />
            <ToolbarBtn icon={Heading3} label="Heading 3 (converts current block)" onClick={() => convertToHeading(3)} />
            <ToolbarBtn icon={Heading4} label="Heading 4 (converts current block)" onClick={() => convertToHeading(4)} />

            <div className="w-px h-5 bg-border mx-1" />

            <ToolbarBtn icon={List} label="Bullet List" onClick={() => insertBlock("list", { style: "unordered", items: [{ content: "", items: [] }] })} />
            <ToolbarBtn icon={ListOrdered} label="Numbered List" onClick={() => insertBlock("list", { style: "ordered", items: [{ content: "", items: [] }] })} />
            <ToolbarBtn icon={CheckSquare} label="Checklist" onClick={() => insertBlock("checklist", { items: [{ text: "", checked: false }] })} />

            <div className="w-px h-5 bg-border mx-1" />

            <ToolbarBtn icon={Quote} label="Quote" onClick={() => insertBlock("quote", { text: "", caption: "" })} />
            <ToolbarBtn icon={Code2} label="Code Block" onClick={() => insertBlock("code", { code: "" })} />
            <ToolbarBtn icon={Table2} label="Table" onClick={() => insertBlock("table", { content: [["", ""], ["", ""]], withHeadings: true })} />
            <ToolbarBtn icon={Minus} label="Divider" onClick={() => insertBlock("delimiter", {})} />

            <div className="w-px h-5 bg-border mx-1" />

            <ToolbarBtn icon={ImageIcon} label="Image" onClick={() => insertBlock("image", { file: { url: "" }, caption: "", withBorder: false, stretched: false, withBackground: false })} />
            <ToolbarBtn icon={AlertTriangle} label="Warning/Callout" onClick={() => insertBlock("warning", { title: "", message: "" })} />
            <ToolbarBtn icon={FileCode} label="Raw HTML" onClick={() => insertBlock("raw", { html: "" })} />
          </div>
        </div>
      </div>

      {/* ─── Editor Area ────────────────────────────────────────── */}
      <main className="container max-w-4xl py-8">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Post title..."
          className="w-full text-3xl sm:text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40 mb-2"
        />

        {/* Meta bar: slug, category, tags */}
        <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-border/50">
          <span className="text-sm font-mono text-muted-foreground">/blog/{slug || "..."}</span>

          <div className="w-px h-4 bg-border mx-1" />

          {/* Category selector — always visible */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md border transition-colors ${
                selectedCategory
                  ? "border-nexus-indigo/40 bg-nexus-indigo/10 text-nexus-indigo"
                  : "border-border bg-nexus-surface/30 text-muted-foreground hover:text-foreground hover:border-nexus-indigo/30"
              }`}
            >
              <FolderOpen size={12} />
              {selectedCategory ? selectedCategory.name : "Add category"}
              <ChevronDown size={12} />
            </button>

            {showCategoryDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowCategoryDropdown(false)} />
                <div className="absolute top-full left-0 mt-1 z-50 bg-background border border-border rounded-lg shadow-xl min-w-[220px] py-1 max-h-[300px] overflow-y-auto">
                  <button
                    type="button"
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-nexus-surface/50 transition-colors ${!categoryId ? "text-nexus-indigo font-medium" : "text-muted-foreground"}`}
                    onClick={() => { setCategoryId(null); setShowCategoryDropdown(false); }}
                  >
                    No category
                  </button>
                  {categories.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-nexus-surface/50 transition-colors flex items-center gap-2 ${categoryId === c.id ? "text-nexus-indigo font-medium" : "text-foreground"}`}
                      onClick={() => { setCategoryId(c.id); setShowCategoryDropdown(false); }}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </button>
                  ))}
                  <div className="border-t border-border mt-1 pt-1 px-2 pb-1">
                    <div className="flex gap-1.5">
                      <Input
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        placeholder="New category..."
                        className="bg-nexus-surface/50 border-border text-xs h-8 flex-1"
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleCreateCategory(); } }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2"
                        onClick={handleCreateCategory}
                        disabled={creatingCategory || !newCategoryName.trim()}
                      >
                        {creatingCategory ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Tags display */}
          {selectedTagIds.length > 0 && (
            <div className="flex gap-1">
              {selectedTagIds.slice(0, 4).map(tid => {
                const tag = tags.find(t => t.id === tid);
                return tag ? (
                  <Badge key={tid} variant="secondary" className="text-xs">{tag.name}</Badge>
                ) : null;
              })}
              {selectedTagIds.length > 4 && (
                <Badge variant="secondary" className="text-xs">+{selectedTagIds.length - 4}</Badge>
              )}
            </div>
          )}
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
