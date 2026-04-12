/*
 * SkillDetailPage — /marketplace/:skillName
 * Full skill detail view: metadata, trust info, pricing, stats, patterns,
 * install command, and publisher info.
 */
import { useMemo, useState } from "react";
import InstallModal from "./InstallModal";
import { Link, useParams } from "wouter";
import {
  ArrowLeft, Star, Shield, Download, ExternalLink, Copy, Check,
  Package, Clock, Zap, Activity, ChevronRight, GitBranch,
  FileText, Terminal, Tag, Cpu, HardDrive, Timer,
  Sun, Moon, Code2, BookOpen, LayoutDashboard, Menu, X,
  MessageSquare, ThumbsUp, User, History, AlertTriangle,
  ArrowRight, GitCommit, Link2,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import NotificationBell from "./NotificationBell";
import {
  SKILLS, formatNumber, formatPrice, formatMoney, trustBadge, timeAgo,
  getReviewsForSkill, getVersionHistory, getSkillDependencies, getSkillUsageExamples,
  getSkillSandboxExamples,
  type Skill, type Review, type VersionEntry, type UsageExample, type SandboxExample,
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

/* ─── Skill Sandbox / Playground ──────────────────────────────────────────── */
function SkillSandbox({ skillName }: { skillName: string }) {
  const examples = useMemo(() => getSkillSandboxExamples(skillName), [skillName]);
  const [selectedExample, setSelectedExample] = useState(0);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [latency, setLatency] = useState(0);

  // Set initial input when example changes
  const currentExample = examples[selectedExample];
  useState(() => {
    if (currentExample) setInput(currentExample.input);
  });

  if (examples.length === 0) return null;

  const handleExampleChange = (idx: number) => {
    setSelectedExample(idx);
    setInput(examples[idx].input);
    setOutput("");
    setHasRun(false);
  };

  const handleRun = () => {
    setRunning(true);
    setOutput("");
    const fakeLatency = Math.floor(Math.random() * 5) + 1;
    setTimeout(() => {
      setOutput(currentExample.expectedOutput);
      setLatency(fakeLatency);
      setRunning(false);
      setHasRun(true);
    }, 300 + Math.random() * 700);
  };

  return (
    <div className="bg-card/40 border border-border/30 rounded-xl overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Terminal className="w-5 h-5 text-nexus-green" />
          Skill Playground
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-nexus-green/10 text-nexus-green font-medium">LIVE</span>
        </h3>
        {hasRun && (
          <span className="text-[11px] text-muted-foreground">
            Executed in <span className="text-nexus-green font-medium">{latency}ms</span>
          </span>
        )}
      </div>

      {/* Example Selector */}
      <div className="px-5 pb-3 flex gap-1.5 flex-wrap">
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => handleExampleChange(i)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              selectedExample === i
                ? "bg-nexus-green/15 text-nexus-green border border-nexus-green/30"
                : "bg-accent/20 text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div className="px-5 pb-2">
        <p className="text-xs text-muted-foreground">{currentExample.description}</p>
      </div>

      {/* Input/Output Split */}
      <div className="grid md:grid-cols-2 border-t border-border/30">
        {/* Input */}
        <div className="border-r border-border/20">
          <div className="px-3 py-2 bg-accent/10 border-b border-border/20 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-nexus-amber">INPUT</span>
          </div>
          <textarea
            value={input || currentExample.input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-4 bg-transparent text-sm font-mono text-foreground/90 resize-none focus:outline-none min-h-[140px]"
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div>
          <div className="px-3 py-2 bg-accent/10 border-b border-border/20 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-nexus-cyan">OUTPUT</span>
            {hasRun && <span className="text-[10px] text-nexus-green">Success</span>}
          </div>
          <div className="p-4 min-h-[140px]">
            {running ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-3.5 h-3.5 border-2 border-nexus-green/30 border-t-nexus-green rounded-full animate-spin" />
                Executing WASM skill...
              </div>
            ) : output ? (
              <pre className="text-sm font-mono text-foreground/90 whitespace-pre-wrap">{output}</pre>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">Click "Run" to execute the skill</p>
            )}
          </div>
        </div>
      </div>

      {/* Run Button */}
      <div className="px-5 py-3 border-t border-border/30 flex items-center justify-between bg-accent/5">
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> WASM Sandbox</span>
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Isolated</span>
          <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> Max 100ms</span>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="px-4 py-1.5 rounded-lg text-sm font-medium bg-nexus-green text-black hover:bg-nexus-green/90 transition-all disabled:opacity-50 flex items-center gap-1.5"
        >
          {running ? (
            <><div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Running...</>
          ) : (
            <><Zap className="w-3.5 h-3.5" /> Run</>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Usage Examples Section ──────────────────────────────────────────────── */
function UsageExamplesSection({ skillName }: { skillName: string }) {
  const examples = useMemo(() => getSkillUsageExamples(skillName), [skillName]);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  if (examples.length === 0) return null;

  const active = examples[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(active.code);
    setCopied(true);
    toast.success("Code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const langColors: Record<string, string> = {
    toml: "text-nexus-amber",
    rust: "text-orange-400",
    python: "text-blue-400",
    bash: "text-nexus-green",
    json: "text-nexus-cyan",
  };

  const langLabels: Record<string, string> = {
    toml: "TOML",
    rust: "Rust",
    python: "Python",
    bash: "Bash",
    json: "JSON",
  };

  return (
    <div className="bg-card/40 border border-border/30 rounded-xl overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Code2 className="w-5 h-5 text-nexus-indigo" />
          Usage Examples
        </h3>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-nexus-green" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Language Tabs */}
      <div className="px-5 flex gap-1 border-b border-border/30">
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => { setActiveTab(i); setCopied(false); }}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === i
                ? "border-nexus-indigo text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {ex.title}
          </button>
        ))}
      </div>

      {/* Description */}
      <div className="px-5 py-2.5 bg-accent/10 border-b border-border/20">
        <p className="text-xs text-muted-foreground">{active.description}</p>
      </div>

      {/* Code Block */}
      <div className="relative">
        <div className="absolute top-2 right-3">
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${langColors[active.language] || "text-muted-foreground"}`}>
            {langLabels[active.language] || active.language}
          </span>
        </div>
        <pre className="p-5 overflow-x-auto text-sm leading-relaxed">
          <code className="font-mono text-foreground/90 whitespace-pre">{active.code}</code>
        </pre>
      </div>
    </div>
  );
}

/* ─── Version History Section ──────────────────────────────────────────────── */
function VersionHistorySection({ skillName }: { skillName: string }) {
  const versions = useMemo(() => getVersionHistory(skillName), [skillName]);
  const [expanded, setExpanded] = useState<string | null>(versions[0]?.version ?? null);

  if (versions.length === 0) return null;

  const typeColor = (type: string) => {
    if (type === "major") return "text-nexus-amber bg-nexus-amber/10 border-nexus-amber/30";
    if (type === "minor") return "text-nexus-cyan bg-nexus-cyan/10 border-nexus-cyan/30";
    return "text-muted-foreground bg-muted/50 border-border/50";
  };

  return (
    <div className="bg-card/60 border border-border/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <History className="w-5 h-5 text-nexus-indigo" />
          Version History
        </h2>
        <span className="text-xs text-muted-foreground">{versions.length} releases</span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border/50" />

        <div className="space-y-1">
          {versions.map((v, i) => {
            const isExpanded = expanded === v.version;
            return (
              <div key={v.version} className="relative">
                {/* Timeline dot */}
                <div className={`absolute left-0 top-4 w-[23px] h-[23px] rounded-full border-2 flex items-center justify-center z-10 ${
                  i === 0 ? "border-nexus-indigo bg-nexus-indigo/20" : "border-border bg-background"
                }`}>
                  <GitCommit className={`w-3 h-3 ${i === 0 ? "text-nexus-indigo" : "text-muted-foreground"}`} />
                </div>

                <button
                  onClick={() => setExpanded(isExpanded ? null : v.version)}
                  className="w-full text-left pl-9 py-3 rounded-lg hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-mono font-bold text-sm ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}>
                      v{v.version}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium uppercase ${typeColor(v.type)}`}>
                      {v.type}
                    </span>
                    {v.breaking && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-400 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> BREAKING
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">{timeAgo(v.date)}</span>
                  </div>
                  <p className={`text-sm mt-1 ${i === 0 ? "text-foreground/80" : "text-muted-foreground"}`}>
                    {v.summary}
                  </p>
                </button>

                {isExpanded && (
                  <div className="pl-9 pb-3 animate-in slide-in-from-top-2 duration-200">
                    <div className="bg-accent/20 rounded-lg p-4 border border-border/30">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Changes</h4>
                      <ul className="space-y-2">
                        {v.changes.map((c, ci) => (
                          <li key={ci} className="flex items-start gap-2 text-sm text-foreground/80">
                            <ChevronRight className="w-3.5 h-3.5 text-nexus-indigo mt-0.5 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/30">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <HardDrive className="w-3 h-3" /> {v.wasmSize}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Download className="w-3 h-3" /> {formatNumber(v.downloads)} installs
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {v.date}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Dependency Info Section ─────────────────────────────────────────────── */
function DependencyInfoSection({ skillName }: { skillName: string }) {
  const deps = useMemo(() => getSkillDependencies(skillName), [skillName]);
  const hasDeps = deps.requires.length > 0 || deps.optionalDeps.length > 0 || deps.commonlyUsedWith.length > 0 || deps.dependedOnBy.length > 0;

  if (!hasDeps) return null;

  const DepChip = ({ name, type }: { name: string; type: "requires" | "optional" | "commonly-used-with" | "depended-on-by" }) => {
    const colors = {
      requires: "border-red-500/30 bg-red-500/10 text-red-400",
      optional: "border-nexus-amber/30 bg-nexus-amber/10 text-nexus-amber",
      "commonly-used-with": "border-nexus-cyan/30 bg-nexus-cyan/10 text-nexus-cyan",
      "depended-on-by": "border-nexus-indigo/30 bg-nexus-indigo/10 text-nexus-indigo",
    };
    return (
      <Link href={`/marketplace/${name}`}>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium hover:opacity-80 transition-opacity cursor-pointer ${colors[type]}`}>
          <Package className="w-3 h-3" />
          {name}
        </span>
      </Link>
    );
  };

  return (
    <div className="bg-card/60 border border-border/50 rounded-xl p-5">
      <h2 className="text-lg font-semibold flex items-center gap-2 mb-5">
        <Link2 className="w-5 h-5 text-nexus-cyan" />
        Dependencies & Related Skills
      </h2>

      <div className="space-y-4">
        {deps.requires.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-400" /> Required
            </h3>
            <div className="flex flex-wrap gap-2">
              {deps.requires.map((n) => <DepChip key={n} name={n} type="requires" />)}
            </div>
          </div>
        )}

        {deps.optionalDeps.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-nexus-amber" /> Optional
            </h3>
            <div className="flex flex-wrap gap-2">
              {deps.optionalDeps.map((n) => <DepChip key={n} name={n} type="optional" />)}
            </div>
          </div>
        )}

        {deps.commonlyUsedWith.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-nexus-cyan" /> Commonly Used With
            </h3>
            <div className="flex flex-wrap gap-2">
              {deps.commonlyUsedWith.map((n) => <DepChip key={n} name={n} type="commonly-used-with" />)}
            </div>
          </div>
        )}

        {deps.dependedOnBy.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-nexus-indigo" /> Depended On By
            </h3>
            <div className="flex flex-wrap gap-2">
              {deps.dependedOnBy.map((n) => <DepChip key={n} name={n} type="depended-on-by" />)}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border/30">
        <Link href="/marketplace/dependencies">
          <span className="text-xs text-nexus-cyan hover:underline cursor-pointer flex items-center gap-1">
            View full dependency graph <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </div>
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
  const [showInstallModal, setShowInstallModal] = useState(false);
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
      {/* Install Modal */}
      <InstallModal
        skillName={skill.name}
        skillVersion={skill.version}
        wasmSize={skill.wasmSize}
        publisher={skill.publisher.handle}
        trustBadge={trustBadge(skill.trust)}
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
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
            <NotificationBell />
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

            {/* Skill Sandbox / Playground */}
            <SkillSandbox skillName={skill.name} />

            {/* Usage Examples */}
            <UsageExamplesSection skillName={skill.name} />

            {/* Version History */}
            <VersionHistorySection skillName={skill.name} />

            {/* Dependency Info */}
            <DependencyInfoSection skillName={skill.name} />

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
                onClick={() => setShowInstallModal(true)}
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
              <Link href={`/marketplace/publisher/${skill.publisher.handle}`}>
                <div className="flex items-center gap-3 mb-3 cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-nexus-indigo/10 border border-nexus-indigo/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-nexus-indigo">
                      {skill.publisher.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm group-hover:text-nexus-indigo transition-colors">{skill.publisher.name}</p>
                    <p className="text-xs text-muted-foreground">@{skill.publisher.handle}</p>
                  </div>
                </div>
              </Link>
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
