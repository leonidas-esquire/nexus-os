/**
 * AdminDashboard — /marketplace/admin
 * Protected marketplace admin page showing pending AXIS reviews,
 * flagged skills, and ecosystem health metrics.
 */
import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  Shield, AlertTriangle, Activity, TrendingUp, TrendingDown,
  Package, Users, Zap, Clock, CheckCircle2, XCircle, Eye,
  ChevronRight, ChevronDown, BarChart3, Sun, Moon, Menu, X,
  Lock, RefreshCw, FileWarning, AlertOctagon, Scale, Bug,
  ArrowUpRight, ArrowDownRight, Filter, Search,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import NotificationBell from "./NotificationBell";
import { SKILLS, formatNumber, trustBadge } from "./marketplaceData";

/* ─── Mock Admin Data ────────────────────────────────────────────────────── */

interface PendingReview {
  id: string;
  skillName: string;
  publisher: string;
  submittedAt: string;
  version: string;
  type: "new" | "update" | "re-review";
  riskLevel: "low" | "medium" | "high" | "critical";
  wasmSize: string;
  checksCompleted: number;
  checksTotal: number;
  status: "pending" | "in-progress" | "needs-info";
}

interface FlaggedSkill {
  id: string;
  skillName: string;
  publisher: string;
  reason: string;
  reasonId: string;
  severity: "critical" | "high" | "medium" | "low";
  reportCount: number;
  reportedAt: string;
  status: "open" | "investigating" | "resolved" | "dismissed";
  description: string;
}

interface HealthMetric {
  label: string;
  value: string;
  change: number;
  trend: "up" | "down" | "flat";
  icon: typeof Activity;
  color: string;
}

const PENDING_REVIEWS: PendingReview[] = [
  {
    id: "REV-001",
    skillName: "html-sanitizer",
    publisher: "@security-labs",
    submittedAt: "2 hours ago",
    version: "1.0.0",
    type: "new",
    riskLevel: "high",
    wasmSize: "312 KB",
    checksCompleted: 3,
    checksTotal: 7,
    status: "in-progress",
  },
  {
    id: "REV-002",
    skillName: "pdf-extractor",
    publisher: "@doc-tools",
    submittedAt: "5 hours ago",
    version: "2.0.0",
    type: "update",
    riskLevel: "medium",
    wasmSize: "1.8 MB",
    checksCompleted: 5,
    checksTotal: 7,
    status: "in-progress",
  },
  {
    id: "REV-003",
    skillName: "xml-parser",
    publisher: "@data-forge",
    submittedAt: "8 hours ago",
    version: "1.0.0",
    type: "new",
    riskLevel: "low",
    wasmSize: "198 KB",
    checksCompleted: 0,
    checksTotal: 7,
    status: "pending",
  },
  {
    id: "REV-004",
    skillName: "crypto-hash",
    publisher: "@verified-dev",
    submittedAt: "12 hours ago",
    version: "3.1.0",
    type: "update",
    riskLevel: "high",
    wasmSize: "456 KB",
    checksCompleted: 7,
    checksTotal: 7,
    status: "needs-info",
  },
  {
    id: "REV-005",
    skillName: "graphql-builder",
    publisher: "@api-tools",
    submittedAt: "1 day ago",
    version: "1.0.0",
    type: "new",
    riskLevel: "medium",
    wasmSize: "890 KB",
    checksCompleted: 2,
    checksTotal: 7,
    status: "pending",
  },
  {
    id: "REV-006",
    skillName: "image-resizer",
    publisher: "@media-ops",
    submittedAt: "1 day ago",
    version: "1.4.0",
    type: "re-review",
    riskLevel: "critical",
    wasmSize: "2.1 MB",
    checksCompleted: 1,
    checksTotal: 7,
    status: "in-progress",
  },
];

const FLAGGED_SKILLS: FlaggedSkill[] = [
  {
    id: "FLG-001",
    skillName: "data-scraper-pro",
    publisher: "@unknown-dev",
    reason: "Malicious Behavior",
    reasonId: "malicious",
    severity: "critical",
    reportCount: 12,
    reportedAt: "3 hours ago",
    status: "investigating",
    description: "Multiple users report unauthorized network requests to external endpoints during execution. Possible data exfiltration attempt.",
  },
  {
    id: "FLG-002",
    skillName: "fast-crypto",
    publisher: "@crypto-labs",
    reason: "Security Vulnerability",
    reasonId: "security",
    severity: "high",
    reportCount: 5,
    reportedAt: "6 hours ago",
    status: "open",
    description: "Buffer overflow vulnerability in the hashing function when input exceeds 64KB. CVE-2026-1234 reported.",
  },
  {
    id: "FLG-003",
    skillName: "ai-summarizer",
    publisher: "@ml-tools",
    reason: "Misrepresentation",
    reasonId: "misrepresentation",
    severity: "high",
    reportCount: 8,
    reportedAt: "1 day ago",
    status: "investigating",
    description: "Claimed 99.5% accuracy but independent benchmarks show 72%. Trust score and benchmarks appear fabricated.",
  },
  {
    id: "FLG-004",
    skillName: "text-formatter",
    publisher: "@format-co",
    reason: "License Violation",
    reasonId: "license",
    severity: "medium",
    reportCount: 2,
    reportedAt: "2 days ago",
    status: "open",
    description: "Contains GPL-licensed code from the 'libformat' project but is distributed under MIT license without attribution.",
  },
  {
    id: "FLG-005",
    skillName: "json-minifier",
    publisher: "@mini-tools",
    reason: "Critical Bug",
    reasonId: "bug",
    severity: "medium",
    reportCount: 15,
    reportedAt: "3 days ago",
    status: "resolved",
    description: "Skill crashes with stack overflow on deeply nested JSON (>50 levels). Publisher has been notified and released a fix in v1.0.3.",
  },
  {
    id: "FLG-006",
    skillName: "name-generator",
    publisher: "@fun-tools",
    reason: "Policy Violation",
    reasonId: "policy",
    severity: "low",
    reportCount: 1,
    reportedAt: "4 days ago",
    status: "dismissed",
    description: "Skill name too similar to existing 'name-gen' skill. After review, names are sufficiently distinct.",
  },
];

const HEALTH_METRICS: HealthMetric[] = [
  { label: "Total Skills", value: "2,847", change: 12.3, trend: "up", icon: Package, color: "text-nexus-indigo" },
  { label: "Active Publishers", value: "1,234", change: 8.7, trend: "up", icon: Users, color: "text-nexus-green" },
  { label: "Daily API Calls", value: "48.2M", change: 15.1, trend: "up", icon: Zap, color: "text-nexus-cyan" },
  { label: "Avg Latency", value: "4.2ms", change: -2.1, trend: "down", icon: Clock, color: "text-nexus-amber" },
  { label: "Trust Score Avg", value: "87.3", change: 1.4, trend: "up", icon: Shield, color: "text-purple-400" },
  { label: "Error Rate", value: "0.03%", change: -0.01, trend: "down", icon: AlertTriangle, color: "text-red-400" },
];

/* ─── Ecosystem Health Charts (SVG sparklines) ───────────────────────────── */
const DAILY_CALLS_7D = [42.1, 44.3, 43.8, 46.2, 45.1, 47.8, 48.2];
const ERROR_RATE_7D = [0.05, 0.04, 0.04, 0.03, 0.04, 0.03, 0.03];
const NEW_SKILLS_7D = [8, 12, 6, 15, 9, 11, 14];
const TRUST_ACTIONS_7D = [3, 5, 2, 7, 4, 6, 3];

function MiniBarChart({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  const max = Math.max(...data);
  const barW = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full" style={{ height }}>
      {data.map((v, i) => {
        const h = (v / max) * (height - 4);
        return (
          <rect
            key={i}
            x={i * barW + barW * 0.15}
            y={height - h}
            width={barW * 0.7}
            height={h}
            rx={2}
            className={color}
            opacity={i === data.length - 1 ? 1 : 0.5}
          />
        );
      })}
    </svg>
  );
}

/* ─── Severity helpers ───────────────────────────────────────────────────── */
const severityConfig: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  high: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  low: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
};

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  "pending": { bg: "bg-muted/50", text: "text-muted-foreground", label: "Pending" },
  "in-progress": { bg: "bg-nexus-indigo/10", text: "text-nexus-indigo", label: "In Progress" },
  "needs-info": { bg: "bg-amber-500/10", text: "text-amber-400", label: "Needs Info" },
  "open": { bg: "bg-red-500/10", text: "text-red-400", label: "Open" },
  "investigating": { bg: "bg-orange-500/10", text: "text-orange-400", label: "Investigating" },
  "resolved": { bg: "bg-green-500/10", text: "text-green-400", label: "Resolved" },
  "dismissed": { bg: "bg-muted/50", text: "text-muted-foreground", label: "Dismissed" },
};

const reasonIcons: Record<string, typeof AlertTriangle> = {
  malicious: AlertOctagon,
  security: Shield,
  misrepresentation: FileWarning,
  license: Scale,
  bug: Bug,
  policy: AlertTriangle,
};

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "flagged">("overview");
  const [reviewFilter, setReviewFilter] = useState<string>("all");
  const [flagFilter, setFlagFilter] = useState<string>("all");
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredReviews = useMemo(() => {
    let items = PENDING_REVIEWS;
    if (reviewFilter !== "all") items = items.filter(r => r.status === reviewFilter);
    if (searchQuery) items = items.filter(r => r.skillName.includes(searchQuery) || r.publisher.includes(searchQuery));
    return items;
  }, [reviewFilter, searchQuery]);

  const filteredFlags = useMemo(() => {
    let items = FLAGGED_SKILLS;
    if (flagFilter !== "all") items = items.filter(f => f.status === flagFilter);
    if (searchQuery) items = items.filter(f => f.skillName.includes(searchQuery) || f.publisher.includes(searchQuery));
    return items;
  }, [flagFilter, searchQuery]);

  const pendingCount = PENDING_REVIEWS.filter(r => r.status === "pending").length;
  const criticalFlags = FLAGGED_SKILLS.filter(f => f.severity === "critical" && f.status !== "resolved" && f.status !== "dismissed").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/">
              <span className="font-bold text-lg tracking-tight cursor-pointer">
                <span className="text-foreground">nexus</span>
                <span className="text-nexus-indigo">.</span>
                <span className="text-foreground">os</span>
              </span>
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Link href="/marketplace"><span className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">Marketplace</span></Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">Admin</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <Link href="/marketplace"><span className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Browse</span></Link>
            <Link href="/marketplace/developer"><span className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Developer</span></Link>
            <NotificationBell />
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Marketplace moderation &amp; ecosystem health</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {criticalFlags > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                <AlertOctagon className="w-4 h-4" />
                {criticalFlags} critical
              </div>
            )}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-400">
              <Clock className="w-4 h-4" />
              {pendingCount} pending
            </div>
            <button
              onClick={() => toast.info("Refreshing dashboard data...")}
              className="p-2 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 border-b border-border/50">
          {(["overview", "reviews", "flagged"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-nexus-indigo text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "overview" && <span className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Overview</span>}
              {tab === "reviews" && (
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" /> AXIS Reviews
                  <span className="text-xs bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-full">{PENDING_REVIEWS.length}</span>
                </span>
              )}
              {tab === "flagged" && (
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Flagged Skills
                  <span className="text-xs bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-full">
                    {FLAGGED_SKILLS.filter(f => f.status !== "resolved" && f.status !== "dismissed").length}
                  </span>
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ─── Overview Tab ───────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Health Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {HEALTH_METRICS.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div key={metric.label} className="bg-card/60 border border-border/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${metric.color}`} />
                      <span className="text-xs text-muted-foreground">{metric.label}</span>
                    </div>
                    <p className="text-xl font-bold mb-1">{metric.value}</p>
                    <div className={`flex items-center gap-1 text-xs ${
                      metric.trend === "up" && metric.label !== "Error Rate" ? "text-green-400" :
                      metric.trend === "down" && metric.label === "Error Rate" ? "text-green-400" :
                      metric.trend === "down" && metric.label === "Avg Latency" ? "text-green-400" :
                      "text-red-400"
                    }`}>
                      {metric.change > 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {Math.abs(metric.change)}%
                      <span className="text-muted-foreground ml-1">7d</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card/60 border border-border/50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Daily API Calls</span>
                  <span className="text-xs text-nexus-cyan">48.2M</span>
                </div>
                <MiniBarChart data={DAILY_CALLS_7D} color="fill-nexus-cyan" height={48} />
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
              <div className="bg-card/60 border border-border/50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Error Rate</span>
                  <span className="text-xs text-green-400">0.03%</span>
                </div>
                <MiniBarChart data={ERROR_RATE_7D} color="fill-green-500" height={48} />
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
              <div className="bg-card/60 border border-border/50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">New Skills</span>
                  <span className="text-xs text-nexus-indigo">14 today</span>
                </div>
                <MiniBarChart data={NEW_SKILLS_7D} color="fill-nexus-indigo" height={48} />
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
              <div className="bg-card/60 border border-border/50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Trust Actions</span>
                  <span className="text-xs text-amber-400">3 today</span>
                </div>
                <MiniBarChart data={TRUST_ACTIONS_7D} color="fill-amber-500" height={48} />
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recent Reviews */}
              <div className="bg-card/60 border border-border/50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-nexus-indigo" />
                    Pending AXIS Reviews
                  </h3>
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className="text-xs text-nexus-indigo hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  {PENDING_REVIEWS.slice(0, 3).map((review) => {
                    const sc = statusConfig[review.status];
                    const rc = severityConfig[review.riskLevel];
                    return (
                      <div key={review.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${rc.bg} flex items-center justify-center`}>
                            <Package className={`w-4 h-4 ${rc.text}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{review.skillName}</p>
                            <p className="text-xs text-muted-foreground">{review.publisher} · v{review.version}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-medium uppercase px-1.5 py-0.5 rounded ${sc.bg} ${sc.text}`}>
                            {sc.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Flags */}
              <div className="bg-card/60 border border-border/50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    Recent Flags
                  </h3>
                  <button
                    onClick={() => setActiveTab("flagged")}
                    className="text-xs text-red-400 hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  {FLAGGED_SKILLS.filter(f => f.status !== "resolved" && f.status !== "dismissed").slice(0, 3).map((flag) => {
                    const sc = statusConfig[flag.status];
                    const rc = severityConfig[flag.severity];
                    const ReasonIcon = reasonIcons[flag.reasonId] || AlertTriangle;
                    return (
                      <div key={flag.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg ${rc.bg} flex items-center justify-center`}>
                            <ReasonIcon className={`w-4 h-4 ${rc.text}`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{flag.skillName}</p>
                            <p className="text-xs text-muted-foreground">{flag.reason} · {flag.reportCount} reports</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-medium uppercase px-1.5 py-0.5 rounded ${sc.bg} ${sc.text}`}>
                            {sc.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ecosystem Breakdown */}
            <div className="bg-card/60 border border-border/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-nexus-green" />
                Ecosystem Breakdown
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/20 rounded-xl">
                  <p className="text-2xl font-bold text-nexus-indigo">{SKILLS.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">Listed Skills</p>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-xl">
                  <p className="text-2xl font-bold text-nexus-green">9</p>
                  <p className="text-xs text-muted-foreground mt-1">Active Publishers</p>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-xl">
                  <p className="text-2xl font-bold text-nexus-amber">7</p>
                  <p className="text-xs text-muted-foreground mt-1">Categories</p>
                </div>
                <div className="text-center p-4 bg-muted/20 rounded-xl">
                  <p className="text-2xl font-bold text-nexus-cyan">99.97%</p>
                  <p className="text-xs text-muted-foreground mt-1">Avg Uptime</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── AXIS Reviews Tab ───────────────────────────────────────────── */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search skills or publishers..."
                  className="w-full pl-10 pr-4 py-2.5 bg-card/60 border border-border/50 rounded-xl text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-nexus-indigo/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                {["all", "pending", "in-progress", "needs-info"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setReviewFilter(f)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      reviewFilter === f
                        ? "bg-nexus-indigo/10 border-nexus-indigo/30 text-nexus-indigo"
                        : "border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f === "all" ? "All" : f === "in-progress" ? "In Progress" : f === "needs-info" ? "Needs Info" : "Pending"}
                  </button>
                ))}
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-3">
              {filteredReviews.map((review) => {
                const sc = statusConfig[review.status];
                const rc = severityConfig[review.riskLevel];
                const progress = Math.round((review.checksCompleted / review.checksTotal) * 100);
                return (
                  <div key={review.id} className="bg-card/60 border border-border/50 rounded-xl p-5 hover:border-border transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl ${rc.bg} border ${rc.border} flex items-center justify-center flex-shrink-0`}>
                          <Shield className={`w-5 h-5 ${rc.text}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{review.skillName}</span>
                            <span className="text-xs text-muted-foreground font-mono">v{review.version}</span>
                            <span className={`text-[10px] font-medium uppercase px-1.5 py-0.5 rounded border ${rc.bg} ${rc.text} ${rc.border}`}>
                              {review.riskLevel}
                            </span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                              review.type === "new" ? "bg-green-500/10 text-green-400" :
                              review.type === "update" ? "bg-blue-500/10 text-blue-400" :
                              "bg-purple-500/10 text-purple-400"
                            }`}>
                              {review.type}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {review.publisher} · {review.wasmSize} · Submitted {review.submittedAt}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  progress === 100 ? "bg-green-500" : "bg-nexus-indigo"
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{review.checksCompleted}/{review.checksTotal}</span>
                          </div>
                          <span className={`text-[10px] font-medium uppercase px-1.5 py-0.5 rounded ${sc.bg} ${sc.text}`}>
                            {sc.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toast.success(`Approved ${review.skillName}`)}
                            className="p-2 rounded-lg hover:bg-green-500/10 text-muted-foreground hover:text-green-400 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toast.info(`Viewing ${review.skillName} details...`)}
                            className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toast.error(`Rejected ${review.skillName}`)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredReviews.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Shield className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No reviews match your filters</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Flagged Skills Tab ─────────────────────────────────────────── */}
        {activeTab === "flagged" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search flagged skills..."
                  className="w-full pl-10 pr-4 py-2.5 bg-card/60 border border-border/50 rounded-xl text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-red-500/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                {["all", "open", "investigating", "resolved", "dismissed"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFlagFilter(f)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      flagFilter === f
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "border-border/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Flagged Skills List */}
            <div className="space-y-3">
              {filteredFlags.map((flag) => {
                const sc = statusConfig[flag.status];
                const rc = severityConfig[flag.severity];
                const ReasonIcon = reasonIcons[flag.reasonId] || AlertTriangle;
                const isExpanded = expandedFlag === flag.id;
                return (
                  <div key={flag.id} className={`bg-card/60 border rounded-xl overflow-hidden transition-colors ${
                    flag.severity === "critical" ? "border-red-500/30" : "border-border/50"
                  }`}>
                    <button
                      onClick={() => setExpandedFlag(isExpanded ? null : flag.id)}
                      className="w-full p-5 text-left"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-xl ${rc.bg} border ${rc.border} flex items-center justify-center flex-shrink-0`}>
                            <ReasonIcon className={`w-5 h-5 ${rc.text}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{flag.skillName}</span>
                              <span className={`text-[10px] font-medium uppercase px-1.5 py-0.5 rounded border ${rc.bg} ${rc.text} ${rc.border}`}>
                                {flag.severity}
                              </span>
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${sc.bg} ${sc.text}`}>
                                {sc.label}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {flag.reason} · {flag.publisher} · {flag.reportCount} reports · {flag.reportedAt}
                            </p>
                          </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-0 border-t border-border/30">
                        <div className="mt-4 space-y-4">
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description</h4>
                            <p className="text-sm leading-relaxed">{flag.description}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => toast.success(`Suspended ${flag.skillName} from marketplace`)}
                              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-500 transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              Suspend Skill
                            </button>
                            <button
                              onClick={() => toast.info(`Contacting ${flag.publisher}...`)}
                              className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-500/20 transition-colors"
                            >
                              Contact Publisher
                            </button>
                            <button
                              onClick={() => toast.info(`Dismissed flag for ${flag.skillName}`)}
                              className="flex items-center gap-2 px-4 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredFlags.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No flagged skills match your filters</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; 2026 Nexus OS. Admin Dashboard — Restricted Access.</p>
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
