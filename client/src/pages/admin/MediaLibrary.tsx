import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useState, useRef, useCallback } from "react";
import { ArrowLeft, Upload, Trash2, Copy, Check, Loader2, Image as ImageIcon, X } from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function MediaLibrary() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imagesQuery = trpc.blog.images.list.useQuery({ page, limit: 24 }, { enabled: isAuthenticated && user?.role === "admin" });
  const uploadMutation = trpc.blog.images.upload.useMutation({
    onSuccess: () => {
      imagesQuery.refetch();
      toast.success("Image uploaded");
    },
  });
  const deleteMutation = trpc.blog.images.delete.useMutation({
    onSuccess: () => {
      imagesQuery.refetch();
      toast.success("Image deleted");
    },
  });

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        await uploadMutation.mutateAsync({
          base64,
          filename: file.name,
          mimeType: file.type,
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, []);

  const copyUrl = useCallback((id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("URL copied");
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

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

  const images = imagesQuery.data?.images ?? [];
  const totalImages = imagesQuery.data?.total ?? 0;
  const totalPages = Math.ceil(totalImages / 24);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-nexus-deep/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/admin/blog" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="font-mono font-bold text-lg">Media Library</h1>
            <span className="text-sm text-muted-foreground font-mono">{totalImages} images</span>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handleFileUpload(e.target.files)}
            />
            <Button
              size="sm"
              className="bg-nexus-indigo hover:bg-nexus-indigo/90"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Upload size={14} className="mr-1.5" />}
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-border rounded-lg p-8 mb-8 text-center hover:border-nexus-indigo/40 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("border-nexus-indigo/60"); }}
          onDragLeave={e => { e.currentTarget.classList.remove("border-nexus-indigo/60"); }}
          onDrop={e => {
            e.preventDefault();
            e.currentTarget.classList.remove("border-nexus-indigo/60");
            handleFileUpload(e.dataTransfer.files);
          }}
        >
          <ImageIcon size={32} className="mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground font-mono text-sm">
            Drop images here or click to upload
          </p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Supports JPG, PNG, GIF, WebP
          </p>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {images.map(img => (
            <Card key={img.id} className="group relative overflow-hidden border-border bg-nexus-surface/30 hover:border-nexus-indigo/40 transition-colors">
              <div className="aspect-square relative">
                <img
                  src={img.url}
                  alt={img.altText || img.originalName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => copyUrl(img.id, img.url)}
                  >
                    {copiedId === img.id ? <Check size={14} /> : <Copy size={14} />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-400 hover:bg-red-400/20"
                    onClick={() => {
                      if (confirm("Delete this image?")) {
                        deleteMutation.mutate({ id: img.id });
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
              <div className="p-2">
                <p className="text-xs text-muted-foreground truncate font-mono">{img.originalName}</p>
                {img.sizeBytes && (
                  <p className="text-[10px] text-muted-foreground/60">
                    {(img.sizeBytes / 1024).toFixed(0)} KB
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>

        {images.length === 0 && !imagesQuery.isLoading && (
          <div className="text-center py-16">
            <ImageIcon size={48} className="mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-mono">No images uploaded yet</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="font-mono text-xs">
              Previous
            </Button>
            <span className="font-mono text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="font-mono text-xs">
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
