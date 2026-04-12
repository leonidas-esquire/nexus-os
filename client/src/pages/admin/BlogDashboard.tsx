import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { useState, useMemo } from "react";
import {
  Plus, Search, FileText, Eye, Tag, Users,
  Edit, Trash2, ExternalLink, ArrowLeft, Image as ImageIcon,
  BarChart3, Clock, CheckCircle, Archive, Calendar
} from "lucide-react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  published: "bg-nexus-green/20 text-nexus-green border-nexus-green/30",
  draft: "bg-muted text-muted-foreground border-border",
  scheduled: "bg-nexus-amber/20 text-nexus-amber border-nexus-amber/30",
  archived: "bg-muted text-muted-foreground/60 border-border",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  published: <CheckCircle size={12} />,
  draft: <FileText size={12} />,
  scheduled: <Calendar size={12} />,
  archived: <Archive size={12} />,
};

export default function BlogDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const statsQuery = trpc.blog.stats.overview.useQuery(undefined, { enabled: isAuthenticated && user?.role === "admin" });
  const postsQuery = trpc.blog.posts.list.useQuery(
    {
      status: statusFilter === "all" ? undefined : statusFilter,
      search: search || undefined,
      page,
      limit: 20,
    },
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  const deleteMutation = trpc.blog.posts.delete.useMutation({
    onSuccess: () => {
      postsQuery.refetch();
      statsQuery.refetch();
      toast.success("Post deleted");
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse font-mono text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground font-mono">Admin access required</p>
        <Button asChild variant="outline">
          <a href={getLoginUrl()}>Sign In</a>
        </Button>
      </div>
    );
  }

  const stats = statsQuery.data;
  const posts = postsQuery.data?.posts ?? [];
  const totalPosts = postsQuery.data?.total ?? 0;
  const totalPages = Math.ceil(totalPosts / 20);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-nexus-deep/50 backdrop-blur-md sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="font-mono font-bold text-lg">Blog Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/blog/media">
                <ImageIcon size={14} className="mr-1.5" />
                Media
              </Link>
            </Button>
            <Button size="sm" className="bg-nexus-indigo hover:bg-nexus-indigo/90" asChild>
              <Link href="/admin/blog/new">
                <Plus size={14} className="mr-1.5" />
                New Post
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-nexus-surface/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-nexus-indigo/10 flex items-center justify-center">
                  <FileText size={18} className="text-nexus-indigo" />
                </div>
                <div>
                  <div className="font-mono text-2xl font-bold">{stats?.totalPosts ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Total Posts</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-nexus-surface/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-nexus-green/10 flex items-center justify-center">
                  <CheckCircle size={18} className="text-nexus-green" />
                </div>
                <div>
                  <div className="font-mono text-2xl font-bold">{stats?.publishedCount ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Published</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-nexus-surface/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-nexus-amber/10 flex items-center justify-center">
                  <Eye size={18} className="text-nexus-amber" />
                </div>
                <div>
                  <div className="font-mono text-2xl font-bold">{stats?.totalViews30d ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Views (30d)</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-nexus-surface/50 border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-nexus-cyan/10 flex items-center justify-center">
                  <Tag size={18} className="text-nexus-cyan" />
                </div>
                <div>
                  <div className="font-mono text-2xl font-bold">{stats?.tagCount ?? 0}</div>
                  <div className="text-xs text-muted-foreground">Tags</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-nexus-surface/50 border-border font-mono text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px] bg-nexus-surface/50 border-border font-mono text-sm">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Posts Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-nexus-surface/30 border-b border-border">
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">Title</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground hidden md:table-cell">Status</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Author</th>
                  <th className="text-left px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="text-right px-4 py-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground font-mono text-sm">
                      {postsQuery.isLoading ? "Loading..." : "No posts found. Create your first post!"}
                    </td>
                  </tr>
                )}
                {posts.map(post => (
                  <tr key={post.id} className="border-b border-border hover:bg-nexus-surface/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm truncate max-w-[300px]">{post.title}</span>
                        <span className="text-xs text-muted-foreground font-mono">/blog/{post.slug}</span>
                        <div className="flex gap-1 md:hidden mt-1">
                          <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[post.status]}`}>
                            {STATUS_ICONS[post.status]} {post.status}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="outline" className={`text-xs ${STATUS_COLORS[post.status]}`}>
                        <span className="flex items-center gap-1">
                          {STATUS_ICONS[post.status]} {post.status}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-muted-foreground">{post.author?.name ?? "Unknown"}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-muted-foreground font-mono">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString()
                          : new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/admin/blog/edit/${post.id}`}>
                            <Edit size={14} />
                          </Link>
                        </Button>
                        {post.status === "published" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <Link href={`/blog/${post.slug}`}>
                              <ExternalLink size={14} />
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Delete this post?")) {
                              deleteMutation.mutate({ id: post.id });
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="font-mono text-xs"
            >
              Previous
            </Button>
            <span className="font-mono text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="font-mono text-xs"
            >
              Next
            </Button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button variant="outline" className="justify-start font-mono text-sm" asChild>
            <Link href="/admin/blog/tags">
              <Tag size={14} className="mr-2" />
              Manage Tags
            </Link>
          </Button>
          <Button variant="outline" className="justify-start font-mono text-sm" asChild>
            <Link href="/admin/blog/authors">
              <Users size={14} className="mr-2" />
              Manage Authors
            </Link>
          </Button>
          <Button variant="outline" className="justify-start font-mono text-sm" asChild>
            <Link href="/admin/blog/media">
              <ImageIcon size={14} className="mr-2" />
              Media Library
            </Link>
          </Button>
          <Button variant="outline" className="justify-start font-mono text-sm" asChild>
            <Link href="/blog">
              <ExternalLink size={14} className="mr-2" />
              View Blog
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
