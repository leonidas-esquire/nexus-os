import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Check,
  ChevronUp,
  Eye,
  Loader2,
  Search,
  Star,
  StarOff,
  Trash2,
  X,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  approved: "bg-nexus-green/20 text-nexus-green border-nexus-green/30",
  featured: "bg-nexus-indigo/20 text-nexus-indigo border-nexus-indigo/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
};

const CATEGORY_LABELS: Record<string, string> = {
  "ai-agents": "AI Agents",
  automation: "Automation",
  devops: "DevOps",
  research: "Research",
  trading: "Trading",
  other: "Other",
};

function formatDate(d: Date | string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminShowcase() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    document.title = "Showcase Admin — Nexus OS";
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const utils = trpc.useUtils();

  const pendingQuery = trpc.adminShowcase.pending.useQuery();
  const pendingCount = pendingQuery.data?.length ?? 0;

  const listQuery = trpc.adminShowcase.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    search: debouncedSearch || undefined,
    limit: 50,
    offset: 0,
  });

  const approveMutation = trpc.adminShowcase.approve.useMutation({
    onSuccess: () => {
      toast.success("Project approved");
      utils.adminShowcase.list.invalidate();
      utils.adminShowcase.pending.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const rejectMutation = trpc.adminShowcase.reject.useMutation({
    onSuccess: () => {
      toast.success("Project rejected");
      utils.adminShowcase.list.invalidate();
      utils.adminShowcase.pending.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const featureMutation = trpc.adminShowcase.feature.useMutation({
    onSuccess: () => {
      toast.success("Feature status updated");
      utils.adminShowcase.list.invalidate();
      utils.adminShowcase.pending.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = trpc.adminShowcase.delete.useMutation({
    onSuccess: () => {
      toast.success("Project deleted");
      utils.adminShowcase.list.invalidate();
      utils.adminShowcase.pending.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const projects = listQuery.data?.projects ?? [];
  const total = listQuery.data?.total ?? 0;

  const statusTabs = [
    { value: "all", label: "All" },
    { value: "pending", label: `Pending (${pendingCount})` },
    { value: "approved", label: "Approved" },
    { value: "featured", label: "Featured" },
    { value: "rejected", label: "Rejected" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Showcase Admin</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review, approve, and manage community project submissions.
        </p>
      </div>

      {/* Pending Alert */}
      {pendingCount > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
            <span className="text-yellow-400 font-bold text-sm">{pendingCount}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-yellow-400">
              {pendingCount} project{pendingCount > 1 ? "s" : ""} awaiting review
            </p>
            <p className="text-xs text-muted-foreground">
              Click "Pending" tab to review submissions.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex gap-1 bg-nexus-surface/20 rounded-lg p-1 border border-border">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all ${
                statusFilter === tab.value
                  ? "bg-nexus-indigo text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="pl-9 bg-nexus-surface/30 border-border text-sm h-9"
          />
        </div>
      </div>

      {/* Project Table */}
      {listQuery.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-nexus-indigo" size={24} />
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-1">No projects found</p>
          <p className="text-sm">
            {statusFilter !== "all"
              ? `No ${statusFilter} projects.`
              : "No projects have been submitted yet."}
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-nexus-surface/20 border-b border-border">
                  <th className="text-left px-4 py-3 font-mono text-xs text-muted-foreground uppercase tracking-wider">
                    Project
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-xs text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-xs text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    Author
                  </th>
                  <th className="text-center px-4 py-3 font-mono text-xs text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 font-mono text-xs text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                    Stats
                  </th>
                  <th className="text-left px-4 py-3 font-mono text-xs text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                    Submitted
                  </th>
                  <th className="text-right px-4 py-3 font-mono text-xs text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((project: any) => (
                  <tr key={project.id} className="hover:bg-nexus-surface/10 transition-colors">
                    {/* Project */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {project.screenshotUrl && (
                          <img
                            src={project.screenshotUrl}
                            alt=""
                            className="w-12 h-8 rounded object-cover border border-border shrink-0 hidden sm:block"
                          />
                        )}
                        <div className="min-w-0">
                          <div className="font-medium truncate max-w-[200px]">
                            {project.title}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {project.tagline}
                          </div>
                        </div>
                      </div>
                    </td>
                    {/* Category */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_LABELS[project.category] || project.category}
                      </Badge>
                    </td>
                    {/* Author */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm">{project.authorName}</span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <Badge className={`text-xs ${STATUS_COLORS[project.status] || ""}`}>
                        {project.status}
                      </Badge>
                    </td>
                    {/* Stats */}
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ChevronUp size={12} />
                          {project.upvotes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {project.views}
                        </span>
                      </div>
                    </td>
                    {/* Submitted */}
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                      {formatDate(project.submittedAt)}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {/* Approve */}
                        {(project.status === "pending" || project.status === "rejected") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => approveMutation.mutate({ id: project.id })}
                            disabled={approveMutation.isPending}
                            className="h-7 w-7 p-0 text-nexus-green hover:text-nexus-green hover:bg-nexus-green/10"
                            title="Approve"
                          >
                            <Check size={14} />
                          </Button>
                        )}
                        {/* Reject */}
                        {project.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => rejectMutation.mutate({ id: project.id })}
                            disabled={rejectMutation.isPending}
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-400 hover:bg-red-400/10"
                            title="Reject"
                          >
                            <X size={14} />
                          </Button>
                        )}
                        {/* Feature / Unfeature */}
                        {(project.status === "approved" || project.status === "featured") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              featureMutation.mutate({
                                id: project.id,
                                featured: project.status !== "featured",
                              })
                            }
                            disabled={featureMutation.isPending}
                            className={`h-7 w-7 p-0 ${
                              project.status === "featured"
                                ? "text-yellow-400 hover:text-yellow-400 hover:bg-yellow-400/10"
                                : "text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/10"
                            }`}
                            title={project.status === "featured" ? "Unfeature" : "Feature"}
                          >
                            {project.status === "featured" ? (
                              <StarOff size={14} />
                            ) : (
                              <Star size={14} />
                            )}
                          </Button>
                        )}
                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete "${project.title}"? This cannot be undone.`)) {
                              deleteMutation.mutate({ id: project.id });
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-400/10"
                          title="Delete"
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
      )}
    </div>
  );
}
