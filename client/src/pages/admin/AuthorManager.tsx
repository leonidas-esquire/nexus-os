import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Link } from "wouter";
import { useState } from "react";
import { ArrowLeft, Plus, Edit, Trash2, Users, Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function AuthorManager() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [editingAuthor, setEditingAuthor] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [authorRole, setAuthorRole] = useState<"contributor" | "editor" | "admin">("contributor");

  const authorsQuery = trpc.blog.authors.list.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const upsertMutation = trpc.blog.authors.upsert.useMutation({
    onSuccess: () => {
      authorsQuery.refetch();
      resetForm();
      setDialogOpen(false);
      toast.success(editingAuthor ? "Author updated" : "Author created");
    },
  });
  const deleteMutation = trpc.blog.authors.delete.useMutation({
    onSuccess: () => {
      authorsQuery.refetch();
      toast.success("Author deleted");
    },
  });

  function resetForm() {
    setEditingAuthor(null);
    setName(""); setSlug(""); setEmail(""); setBio(""); setAvatar("");
    setTwitter(""); setGithub(""); setLinkedin(""); setWebsite("");
    setAuthorRole("contributor");
  }

  function openEdit(a: any) {
    setEditingAuthor(a);
    setName(a.name); setSlug(a.slug); setEmail(a.email ?? ""); setBio(a.bio ?? "");
    setAvatar(a.avatar ?? ""); setTwitter(a.twitter ?? ""); setGithub(a.github ?? "");
    setLinkedin(a.linkedin ?? ""); setWebsite(a.website ?? "");
    setAuthorRole(a.authorRole ?? "contributor");
    setDialogOpen(true);
  }

  function openNew() { resetForm(); setDialogOpen(true); }

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-nexus-indigo" size={24} /></div>;
  }
  if (!isAuthenticated || user?.role !== "admin") {
    return <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"><p className="text-muted-foreground font-mono">Admin access required</p><Button asChild variant="outline"><a href={getLoginUrl()}>Sign In</a></Button></div>;
  }

  const authors = authorsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-nexus-deep/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/admin/blog" className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={18} /></Link>
            <h1 className="font-mono font-bold text-lg">Authors</h1>
          </div>
          <Button size="sm" className="bg-nexus-indigo hover:bg-nexus-indigo/90" onClick={openNew}>
            <Plus size={14} className="mr-1.5" />New Author
          </Button>
        </div>
      </header>

      <main className="container max-w-3xl py-8">
        <div className="space-y-3">
          {authors.map(a => (
            <Card key={a.id} className="bg-nexus-surface/30 border-border hover:border-nexus-indigo/30 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {a.avatar ? (
                    <img src={a.avatar} alt={a.name} className="w-10 h-10 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-nexus-indigo/10 flex items-center justify-center text-nexus-indigo font-mono font-bold text-sm">
                      {a.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-sm">{a.name}</span>
                    <span className="text-xs text-muted-foreground font-mono ml-2">{a.authorRole}</span>
                    {a.email && <div className="text-xs text-muted-foreground">{a.email}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}><Edit size={14} /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { if (confirm("Delete this author?")) deleteMutation.mutate({ id: a.id }); }}><Trash2 size={14} /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {authors.length === 0 && (
            <div className="text-center py-16">
              <Users size={48} className="mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-mono">No authors created yet</p>
            </div>
          )}
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-background border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono">{editingAuthor ? "Edit Author" : "New Author"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-mono">Name *</Label>
                <Input value={name} onChange={e => { setName(e.target.value); if (!editingAuthor) setSlug(slugify(e.target.value)); }} className="bg-nexus-surface/50 border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono">Slug *</Label>
                <Input value={slug} onChange={e => setSlug(e.target.value)} className="bg-nexus-surface/50 border-border font-mono" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono">Email</Label>
              <Input value={email} onChange={e => setEmail(e.target.value)} className="bg-nexus-surface/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono">Bio</Label>
              <Textarea value={bio} onChange={e => setBio(e.target.value)} className="bg-nexus-surface/50 border-border" rows={3} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono">Avatar URL</Label>
              <Input value={avatar} onChange={e => setAvatar(e.target.value)} className="bg-nexus-surface/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono">Role</Label>
              <Select value={authorRole} onValueChange={(v: any) => setAuthorRole(v)}>
                <SelectTrigger className="bg-nexus-surface/50 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contributor">Contributor</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-mono">Twitter</Label>
                <Input value={twitter} onChange={e => setTwitter(e.target.value)} className="bg-nexus-surface/50 border-border" placeholder="@handle" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono">GitHub</Label>
                <Input value={github} onChange={e => setGithub(e.target.value)} className="bg-nexus-surface/50 border-border" placeholder="username" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono">LinkedIn</Label>
              <Input value={linkedin} onChange={e => setLinkedin(e.target.value)} className="bg-nexus-surface/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-mono">Website</Label>
              <Input value={website} onChange={e => setWebsite(e.target.value)} className="bg-nexus-surface/50 border-border" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button
              className="bg-nexus-indigo hover:bg-nexus-indigo/90"
              disabled={!name || !slug}
              onClick={() => upsertMutation.mutate({
                id: editingAuthor?.id, name, slug, email: email || undefined,
                bio: bio || undefined, avatar: avatar || undefined, twitter: twitter || undefined,
                github: github || undefined, linkedin: linkedin || undefined, website: website || undefined,
                authorRole,
              })}
            >
              {editingAuthor ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
