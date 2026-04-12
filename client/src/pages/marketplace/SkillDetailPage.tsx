/*
 * SkillDetailPage — /marketplace/:skillName
 * Full skill detail view: metadata, trust info, pricing, stats, patterns,
 * install command, and publisher info.
 */
import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import {
  ArrowLeft, Star, Shield, Download, ExternalLink, Copy, Check,
  Package, Clock, Zap, Activity, ChevronRight, GitBranch,
  FileText, Terminal, Tag, Cpu, HardDrive, Timer,
  Sun, Moon, Code2, BookOpen, LayoutDashboard, Menu, X,
  MessageSquare, ThumbsUp, User,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import {
  SKILLS, formatNumber, formatPrice, formatMoney, trustBadge, timeAgo,
  getReviewsForSkill,
  type Skill, type Review,
} from "./marketplaceData";

/* ─── Stat Card ───────────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card/60 border border-border/50 rounded-xl p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-xs uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

/* ─── Copy Button ─────────────────────────────────────────────────────────── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-accent transition-colors">
      {copied ? <Check className="w-4 h-4 text-nexus-green" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
    </button>
  );
}

/* ─── Star Rating Input ───────────────────────────────────────────────────── */
function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer'} transition-colors`}
        >
          <Star
            className={`w-4 h-4 ${
              star <= (hover || value)
                ? 'text-nexus-amber fill-nexus-amber'
                : 'text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

/* ─── Reviews Section ─────────────────────────────────────────────────────── */
function ReviewsSection({ skillName }: { skillName: string }) {
  const reviews = useMemo(() => getReviewsForSkill(skillName), [skillName]);
  const [showForm, setShowForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [localReviews, setLocalReviews] = useState<Review[]>([]);
  const [sortBy, setSortBy] = useState<"recent" | "helpful">("recent");

  const allReviews = useMemo(() => {
    const combined = [...localReviews, ...reviews];
    return sortBy === "helpful"
      ? combined.sort((a, b) => b.helpful - a.helpful)
      : combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reviews, localReviews, sortBy]);

  const avgRating = allReviews.length > 0
    ? allReviews.reduce((a, r) => a + r.rating, 0) / allReviews.length
    : 0;

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: allReviews.filter((r) => r.rating === star).length,
    pct: allReviews.length > 0
      ? (allReviews.filter((r) => r.rating === star).length / allReviews.length) * 100
      : 0,
  }));

  const handleSubmit = () => {
    if (newRating === 0) { toast.error("Please select a rating"); return; }
    if (!newTitle.trim()) { toast.error("Please add a title"); return; }
    const review: Review = {
      id: `local-${Date.now()}`,
      author: "You",
      authorHandle: "@you",
      rating: newRating,
      title: newTitle,
      body: newBody,
      date: new Date().toISOString().slice(0, 10),
      helpful: 0,
      verified: false,
    };
    setLocalReviews((prev) => [review, ...prev]);
    setShowForm(false);
    setNewRating(0);
    setNewTitle("");
    setNewBody("");
    toast.success("Review submitted!");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-nexus-indigo" />
          Reviews
          <span className="text-sm font-normal text-muted-foreground">({allReviews.length})</span>
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-nexus-indigo hover:text-nexus-indigo/80 transition-colors font-medium"
        >
          {showForm ? "Cancel" : "Write a Review"}
        </button>
      </div>

      {/* Rating Summary */}
      <div className="bg-card/60 border border-border/50 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold">{avgRating.toFixed(1)}</p>
            <StarRating value={Math.round(avgRating)} readonly />
            <p className="text-xs text-muted-foreground mt-1">{allReviews.length} reviews</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {ratingDist.map((d) => (
              <div key={d.star} className="flex items-center gap-2 text-sm">
                <span className="w-3 text-right text-muted-foreground">{d.star}</span>
                <Star className="w-3 h-3 text-nexus-amber fill-nexus-amber" />
                <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-nexus-amber rounded-full transition-all"
                    style={{ width: `${d.pct}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-muted-foreground">{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Write Review Form */}
      {showForm && (
        <div className="bg-card/60 border border-nexus-indigo/30 rounded-xl p-5 mb-6">
          <h3 className="font-medium mb-3">Write a Review</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Rating</label>
              <StarRating value={newRating} onChange={setNewRating} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Summarize your experience"
                className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nexus-indigo/40"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Review (optional)</label>
              <textarea
                value={newBody}
                onChange={(e) => setNewBody(e.target.value)}
                placeholder="Share details about your experience..."
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-nexus-indigo/40 resize-none"
              />
            </div>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-nexus-indigo text-white rounded-lg text-sm font-medium hover:bg-nexus-indigo/90 transition-colors"
            >
              Submit Review
            </button>
          </div>
        </div>
      )}

      {/* Sort */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-muted-foreground">Sort by:</span>
        <button
          onClick={() => setSortBy("recent")}
          className={`text-xs px-2 py-1 rounded ${sortBy === "recent" ? "bg-nexus-indigo/10 text-nexus-indigo font-medium" : "text-muted-foreground hover:text-foreground"}`}
        >
          Most Recent
        </button>
        <button
          onClick={() => setSortBy("helpful")}
          className={`text-xs px-2 py-1 rounded ${sortBy === "helpful" ? "bg-nexus-indigo/10 text-nexus-indigo font-medium" : "text-muted-foreground hover:text-foreground"}`}
        >
          Most Helpful
        </button>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {allReviews.map((r) => (
          <div key={r.id} className="bg-card/40 border border-border/30 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-nexus-indigo/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-nexus-indigo" />
                </div>
                <div>
                  <p className="text-sm font-medium">{r.author}</p>
                  <p className="text-xs text-muted-foreground">{r.authorHandle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.verified && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-nexus-green/10 text-nexus-green rounded font-medium">Verified</span>
                )}
                <span className="text-xs text-muted-foreground">{timeAgo(r.date)}</span>
              </div>
            </div>
            <StarRating value={r.rating} readonly />
            <h4 className="font-medium text-sm mt-2">{r.title}</h4>
            {r.body && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{r.body}</p>}
            <div className="flex items-center gap-3 mt-3 pt-2 border-t border-border/20">
              <button
                onClick={() => toast.success("Marked as helpful")}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ThumbsUp className="w-3 h-3" />
                Helpful ({r.helpful})
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
export default function SkillDetailPage() {
  const params = useParams<{ skillName: string }>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const skill = useMemo(() => {
    return SKILLS.find((s) => s.name === params.skillName);
  }, [params.skillName]);

  if (!skill) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h1 className="text-2xl font-bold mb-2">Skill Not Found</h1>
          <p className="text-muted-foreground mb-6">The skill "{params.skillName}" doesn't exist in the marketplace.</p>
          <Link href="/marketplace">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-nexus-indigo text-white rounded-lg text-sm font-medium cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> Back to Marketplace
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const installCmd = `naos marketplace install ${skill.name}`;
  const earningsPerCall = skill.pricing.pricePerCall ? (skill.pricing.pricePerCall * 0.7).toFixed(5) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/">
              <span className="font-bold text-lg tracking-tight cursor-pointer">
                nexus<span className="text-nexus-indigo">.</span>os
              </span>
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <Link href="/marketplace">
              <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer hidden sm:block">Marketplace</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <span className="text-foreground font-medium hidden sm:block">{skill.name}</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/marketplace">
              <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Browse</span>
            </Link>
            <Link href="/marketplace/developer">
              <span className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <LayoutDashboard className="w-4 h-4" /> Developer
              </span>
            </Link>
            <button
              onClick={() => toggleTheme?.()}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <button className="md:hidden p-2 rounded-lg hover:bg-accent" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl p-4 space-y-3">
            <Link href="/marketplace"><span className="block text-sm py-2 cursor-pointer">Browse Marketplace</span></Link>
            <Link href="/marketplace/developer"><span className="block text-sm py-2 cursor-pointer">Developer Portal</span></Link>
            <Link href="/docs"><span className="block text-sm py-2 cursor-pointer">API Docs</span></Link>
          </div>
        )}
      </nav>

      {/* ─── Content ──────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        {/* Back link */}
        <Link href="/marketplace">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Marketplace
          </span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ─── Left Column (2/3) ────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-nexus-indigo/10 border border-nexus-indigo/20 flex items-center justify-center shrink-0">
                  <Package className="w-7 h-7 text-nexus-indigo" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">{skill.name}</h1>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="font-mono">v{skill.version}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                    <span>{skill.publisher.handle}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                    <span>{skill.license}</span>
                  </div>
                </div>
              </div>

              {/* Trust badge */}
              {skill.trust.verified && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-nexus-green/10 border border-nexus-green/20 text-nexus-green text-xs font-medium mb-4">
                  <Shield className="w-3.5 h-3.5" />
                  AXIS Verified — {trustBadge(skill.trust)}
                </div>
              )}

              <p className="text-muted-foreground leading-relaxed">{skill.longDescription}</p>
            </div>

            {/* Install command */}
            <div className="bg-card/60 border border-border/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" /> Install
                </span>
                <CopyButton text={installCmd} />
              </div>
              <code className="text-sm font-mono text-nexus-green">$ {installCmd}</code>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                icon={<Activity className="w-4 h-4" />}
                label="Total Calls"
                value={formatNumber(skill.stats.totalCalls)}
              />
              <StatCard
                icon={<Zap className="w-4 h-4" />}
                label="Avg Latency"
                value={`${skill.stats.avgLatencyMs}ms`}
              />
              <StatCard
                icon={<Star className="w-4 h-4" />}
                label="Rating"
                value={`${skill.stats.rating}`}
                sub={`${formatNumber(skill.stats.reviews)} reviews`}
              />
              <StatCard
                icon={<Activity className="w-4 h-4" />}
                label="Success Rate"
                value={`${skill.stats.successRate}%`}
              />
            </div>

            {/* Patterns */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Tag className="w-5 h-5 text-nexus-indigo" />
                Patterns
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                Natural language patterns that route to this skill via the broker:
              </p>
              <div className="flex flex-wrap gap-2">
                {skill.patterns.map((p) => (
                  <span key={p} className="px-3 py-1.5 bg-card/60 border border-border/50 rounded-lg text-sm font-mono text-muted-foreground">
                    "{p}"
                  </span>
                ))}
              </div>
            </div>

            {/* Limits */}
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-nexus-indigo" />
                Resource Limits
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-card/40 border border-border/30 rounded-xl p-4 flex items-center gap-3">
                  <HardDrive className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Max Input</p>
                    <p className="text-sm font-medium">{skill.limits.maxInputSize}</p>
                  </div>
                </div>
                <div className="bg-card/40 border border-border/30 rounded-xl p-4 flex items-center gap-3">
                  <Timer className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Max Execution</p>
                    <p className="text-sm font-medium">{skill.limits.maxExecutionTime}</p>
                  </div>
                </div>
                <div className="bg-card/40 border border-border/30 rounded-xl p-4 flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Memory Limit</p>
                    <p className="text-sm font-medium">{skill.limits.memoryLimit}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* I/O */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Inputs &amp; Outputs</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card/40 border border-border/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Inputs</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skill.inputs.map((t) => (
                      <span key={t} className="px-2 py-1 bg-nexus-indigo/10 text-nexus-indigo rounded text-xs font-mono">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-card/40 border border-border/30 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Outputs</p>
                  <div className="flex flex-wrap gap-1.5">
                    {skill.outputs.map((t) => (
                      <span key={t} className="px-2 py-1 bg-nexus-green/10 text-nexus-green rounded text-xs font-mono">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <ReviewsSection skillName={skill.name} />
          </div>

          {/* ─── Right Column (1/3) ───────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Install Card */}
            <div className="bg-card/60 border border-border/50 rounded-xl p-5 sticky top-20">
              <div className="mb-4">
                <p className={`text-2xl font-bold ${skill.pricing.model === "free" ? "text-nexus-green" : "text-foreground"}`}>
                  {formatPrice(skill.pricing)}
                </p>
                {skill.pricing.model === "per-call" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Developer earns ${earningsPerCall}/call (70%)
                  </p>
                )}
              </div>

              <button
                onClick={() => toast.success(`${skill.name} installed successfully!`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-nexus-indigo text-white rounded-xl font-medium text-sm hover:bg-nexus-indigo/90 transition-colors mb-3"
              >
                <Download className="w-4 h-4" />
                Install Skill
              </button>

              <div className="space-y-3 pt-4 border-t border-border/30">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">{skill.category}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">WASM Size</span>
                  <span className="font-mono text-xs">{skill.wasmSize}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{timeAgo(skill.updatedAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{timeAgo(skill.createdAt)}</span>
                </div>
              </div>

              {skill.repository && (
                <a
                  href={skill.repository}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full mt-4 px-4 py-2.5 bg-card border border-border/50 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-border transition-all"
                >
                  <GitBranch className="w-4 h-4" />
                  View Source
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Publisher Card */}
            <div className="bg-card/60 border border-border/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">Publisher</h3>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-nexus-indigo/10 border border-nexus-indigo/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-nexus-indigo">
                    {skill.publisher.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">{skill.publisher.name}</p>
                  <p className="text-xs text-muted-foreground">{skill.publisher.handle}</p>
                </div>
              </div>
              {skill.trust.verified && (
                <div className="space-y-2 pt-3 border-t border-border/30 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">AXIS Trust</span>
                    <span className="text-nexus-green font-medium">{trustBadge(skill.trust)}</span>
                  </div>
                  {skill.trust.tScore && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">T-Score</span>
                      <span className="font-medium">{skill.trust.tScore}</span>
                    </div>
                  )}
                  {skill.trust.auid && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground mb-1">AUID</p>
                      <code className="text-xs font-mono text-muted-foreground break-all">{skill.trust.auid}</code>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Revenue Split */}
            {skill.pricing.model !== "free" && (
              <div className="bg-card/60 border border-border/50 rounded-xl p-5">
                <h3 className="text-sm font-semibold mb-3">Revenue Split</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Developer</span>
                    <span className="text-nexus-green font-medium">70%</span>
                  </div>
                  <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-nexus-green to-nexus-green/60" style={{ width: "70%" }} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Nexus</span>
                    <span className="font-medium">25%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Stripe</span>
                    <span className="font-medium">5%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; 2026 Nexus OS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/"><span className="hover:text-foreground transition-colors cursor-pointer">Home</span></Link>
            <Link href="/marketplace"><span className="hover:text-foreground transition-colors cursor-pointer">Marketplace</span></Link>
            <Link href="/docs"><span className="hover:text-foreground transition-colors cursor-pointer">Docs</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
