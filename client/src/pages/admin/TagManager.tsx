import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Link } from "wouter";
import { useState } from "react";
import { ArrowLeft, Plus, Edit, Trash2, Tag, Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function TagManager() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [editingTag, setEditingTag] = useState<any>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#00ff88");
  const [dialogOpen, setDialogOpen] = useState(false);

  const tagsQuery = trpc.blog.tags.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const upsertMutation = trpc.blog.tags.upsert.useMutation({
    onSuccess: () => {
      tagsQuery.refetch();
      resetForm();
      setDialogOpen(false);
      toast.success(editingTag ? "Tag updated" : "Tag created");
    },
  });
  const deleteMutation = trpc.blog.tags.delete.useMutation({
    onSuccess: () => {
      tagsQuery.refetch();
      toast.success("Tag deleted");
    },
  });

  function resetForm() {
    setEditingTag(null);
    setName("");
    setSlug("");
    setDescription("");
    setColor("#00ff88");
  }

  function openEdit(tag: any) {
    setEditingTag(tag);
    setName(tag.name);
    setSlug(tag.slug);
    setDescription(tag.description ?? "");
    setColor(tag.color ?? "#00ff88");
    setDialogOpen(true);
  }

  function openNew() {
    resetForm();
    setDialogOpen(true);
  }

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-nexus-indigo" size={24} /></div>;
  }
  if (!isAuthenticated || user?.role !== "admin") {
    return <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"><p className="text-muted-foreground font-mono">Admin access required</p><Button asChild variant="outline"><a href={getLoginUrl()}>Sign In</a></Button></div>;
  }

  const tags = tagsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-nexus-deep/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/admin/blog" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={18} /></Link>
            <h1 className="font-mono font-bold text-lg">Tags</h1>
          </div>
          <Button size="sm" className="bg-nexus-indigo hover:bg-nexus-indigo/90" onClick={openNew}>
            <Plus size={14} className="mr-1.5" />New Tag
          </Button>
        </div>
      </header>

      <main className="container max-w-3xl py-8">
        <div className="space-y-3">
          {tags.map(tag => (
            <Card key={tag.id} className="bg-nexus-surface/30 border-border hover:border-nexus-indigo/30 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: tag.color }} />
                  <div>
                    <span className="font-medium text-sm">{tag.name}</span>
                    <span className="text-xs text-muted-foreground font-mono ml-2">/{tag.slug}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{tag.postCount} posts</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(tag)}><Edit size={14} /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { if (confirm("Delete this tag?")) deleteMutation.mutate({ id: tag.id }); }}><Trash2 size={14} /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {tags.length === 0 && (
            <div className="text-center py-16">
              <Tag size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-mono">No tags created yet</p>
            </div>
          )}
        </div>
      </main>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="font-mono">{editingTag ? "Edit Tag" : "New Tag"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-mono">Name</Label>
              <Input value={name} onChange={e => { setName(e.target.value); if (!editingTag) setSlug(slugify(e.target.value)); }} className="bg-nexus-surface/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono">Slug</Label>
              <Input value={slug} onChange={e => setSlug(e.target.value)} className="bg-nexus-surface/50 border-border font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono">Description</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} className="bg-nexus-surface/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono">Color</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 rounded border border-border cursor-pointer" />
                <Input value={color} onChange={e => setColor(e.target.value)} className="bg-nexus-surface/50 border-border font-mono flex-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button
              className="bg-nexus-indigo hover:bg-nexus-indigo/90"
              disabled={!name || !slug}
              onClick={() => upsertMutation.mutate({ id: editingTag?.id, name, slug, description, color })}
            >
              {editingTag ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
