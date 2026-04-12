import { useState } from "react";
import { Link } from "wouter";
import {
  Trophy, TrendingUp, Star, Zap, Crown, Medal,
  Award, ArrowUpRight, Sun, Moon, ChevronRight,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  SKILLS, formatNumber, trustBadge, getPublisherBadge,
  TRENDING_SKILLS,
  type Skill,
} from "./marketplaceData";
import NotificationBell from "./NotificationBell";

/* ─── Leaderboard Data ──────────────────────────────────────────────────── */

// Top publishers by total calls
const topPublishers = (() => {
  const map = new Map<string, { handle: string; name: string; totalCalls: number; skillCount: number; avgRating: number; trust: string }>();
  SKILLS.forEach((s) => {
    const h = s.publisher.handle;
    const existing = map.get(h);
    if (existing) {
      existing.totalCalls += s.stats.totalCalls;
      existing.skillCount += 1;
      existing.avgRating = (existing.avgRating * (existing.skillCount - 1) + s.stats.rating) / existing.skillCount;
    } else {
      map.set(h, {
        handle: h,
        name: s.publisher.name,
        totalCalls: s.stats.totalCalls,
        skillCount: 1,
        avgRating: s.stats.rating,
        trust: trustBadge(s.trust),
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => b.totalCalls - a.totalCalls);
})();

// Highest rated skills (min 100 reviews)
const highestRated = [...SKILLS]
  .sort((a, b) => b.stats.rating - a.stats.rating || b.stats.totalCalls - a.stats.totalCalls)
  .slice(0, 10);

// Most installed skills
const mostInstalled = [...SKILLS]
  .sort((a, b) => b.stats.totalCalls - a.stats.totalCalls)
  .slice(0, 10);

// Fastest growing (from trending data)
const fastestGrowing = [...TRENDING_SKILLS].sort((a, b) => b.growthPct - a.growthPct).slice(0, 10);

/* ─── Rank Badge ────────────────────────────────────────────────────────── */

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-muted-foreground">{rank}</span>;
}

/* ─── Tab Types ─────────────────────────────────────────────────────────── */

type LeaderboardTab = "publishers" | "rated" | "installed" | "growing";

const TABS: { id: LeaderboardTab; label: string; icon: React.ReactNode }[] = [
  { id: "publishers", label: "Top Publishers", icon: <Trophy className="w-4 h-4" /> },
  { id: "rated", label: "Highest Rated", icon: <Star className="w-4 h-4" /> },
  { id: "installed", label: "Most Used", icon: <Zap className="w-4 h-4" /> },
  { id: "growing", label: "Fastest Growing", icon: <TrendingUp className="w-4 h-4" /> },
];

/* ─── Main Component ────────────────────────────────────────────────────── */

export default function LeaderboardPage() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("publishers");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-mono font-bold text-lg tracking-tight">
              nexus<span className="text-nexus-indigo">.os</span>
            </Link>
            <span className="text-muted-foreground">›</span>
            <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Marketplace
            </Link>
            <span className="text-muted-foreground">›</span>
            <span className="text-sm font-medium">Leaderboard</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/marketplace" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Browse</Link>
            <Link href="/marketplace/developer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Developer</Link>
            <NotificationBell />
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-accent transition-colors">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h1 className="text-2xl font-bold">Marketplace Leaderboard</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Discover the top publishers, highest-rated skills, and fastest-growing tools in the Nexus OS ecosystem.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-nexus-indigo text-white"
                  : "bg-accent/50 text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Top Publishers */}
        {activeTab === "publishers" && (
          <div className="space-y-3">
            <div className="grid grid-cols-[3rem_1fr_8rem_6rem_6rem_6rem] gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              <span>Rank</span>
              <span>Publisher</span>
              <span className="text-right">Total Calls</span>
              <span className="text-right">Skills</span>
              <span className="text-right">Avg Rating</span>
              <span className="text-right">Trust</span>
            </div>
            {topPublishers.map((pub, i) => {
              const badge = getPublisherBadge(
                SKILLS.find((s) => s.publisher.handle === pub.handle)?.trust ?? { verified: false, trustTier: "T5", creditRating: "B", tScore: 0 }
              );
              return (
                <Link
                  key={pub.handle}
                  href={`/marketplace/publisher/${pub.handle.replace("@", "")}`}
                  className={`grid grid-cols-[3rem_1fr_8rem_6rem_6rem_6rem] gap-4 px-4 py-3 rounded-xl border transition-all hover:border-nexus-indigo/30 ${
                    i < 3 ? "border-yellow-400/20 bg-yellow-400/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <RankBadge rank={i + 1} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-nexus-indigo to-nexus-cyan flex items-center justify-center text-white text-xs font-bold">
                      {pub.name[0]}
                    </div>
                    <div>
                      <span className="font-semibold text-sm">{pub.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{pub.handle}</span>
                    </div>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{ backgroundColor: badge.color + "20", color: badge.color }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <span className="text-right font-mono text-sm self-center">{formatNumber(pub.totalCalls)}</span>
                  <span className="text-right text-sm self-center">{pub.skillCount}</span>
                  <span className="text-right text-sm self-center">⭐ {pub.avgRating.toFixed(1)}</span>
                  <span className="text-right text-xs font-mono self-center text-muted-foreground">{pub.trust}</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Highest Rated */}
        {activeTab === "rated" && (
          <div className="space-y-3">
            <div className="grid grid-cols-[3rem_1fr_6rem_8rem_6rem] gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              <span>Rank</span>
              <span>Skill</span>
              <span className="text-right">Rating</span>
              <span className="text-right">Total Calls</span>
              <span className="text-right">Category</span>
            </div>
            {highestRated.map((skill, i) => (
              <Link
                key={skill.name}
                href={`/marketplace/${skill.name}`}
                className={`grid grid-cols-[3rem_1fr_6rem_8rem_6rem] gap-4 px-4 py-3 rounded-xl border transition-all hover:border-nexus-indigo/30 ${
                  i < 3 ? "border-yellow-400/20 bg-yellow-400/5" : "border-border"
                }`}
              >
                <div className="flex items-center justify-center">
                  <RankBadge rank={i + 1} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-nexus-indigo/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-nexus-indigo" />
                  </div>
                  <div>
                    <span className="font-mono font-semibold text-sm">{skill.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">v{skill.version}</span>
                  </div>
                </div>
                <div className="text-right self-center">
                  <span className="text-sm font-semibold">⭐ {skill.stats.rating}</span>
                  <div className="text-[10px] text-muted-foreground">{formatNumber(skill.stats.reviews)} reviews</div>
                </div>
                <span className="text-right font-mono text-sm self-center">{formatNumber(skill.stats.totalCalls)}</span>
                <span className="text-right text-xs self-center text-muted-foreground">{skill.category}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Most Used */}
        {activeTab === "installed" && (
          <div className="space-y-3">
            <div className="grid grid-cols-[3rem_1fr_8rem_6rem_6rem_6rem] gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              <span>Rank</span>
              <span>Skill</span>
              <span className="text-right">Total Calls</span>
              <span className="text-right">Latency</span>
              <span className="text-right">Rating</span>
              <span className="text-right">Success</span>
            </div>
            {mostInstalled.map((skill, i) => (
              <Link
                key={skill.name}
                href={`/marketplace/${skill.name}`}
                className={`grid grid-cols-[3rem_1fr_8rem_6rem_6rem_6rem] gap-4 px-4 py-3 rounded-xl border transition-all hover:border-nexus-indigo/30 ${
                  i < 3 ? "border-yellow-400/20 bg-yellow-400/5" : "border-border"
                }`}
              >
                <div className="flex items-center justify-center">
                  <RankBadge rank={i + 1} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-nexus-green/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-nexus-green" />
                  </div>
                  <div>
                    <span className="font-mono font-semibold text-sm">{skill.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">by {skill.publisher.handle}</span>
                  </div>
                </div>
                <span className="text-right font-mono text-sm self-center font-semibold">{formatNumber(skill.stats.totalCalls)}</span>                <span className="text-right font-mono text-sm self-center">{skill.stats.avgLatencyMs}ms</span>        <span className="text-right text-sm self-center">⭐ {skill.stats.rating}</span>
                <span className="text-right text-sm self-center text-nexus-green">{skill.stats.successRate}</span>
              </Link>
            ))}
          </div>
        )}

        {/* Fastest Growing */}
        {activeTab === "growing" && (
          <div className="space-y-3">
            <div className="grid grid-cols-[3rem_1fr_8rem_8rem_6rem] gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              <span>Rank</span>
              <span>Skill</span>
              <span className="text-right">7d Growth</span>
              <span className="text-right">Calls (7d)</span>
              <span className="text-right">Trend</span>
            </div>
            {fastestGrowing.map((ts, i) => {
              const skill = SKILLS.find((s) => s.name === ts.name);
              // Build a mini sparkline from the trend data
              const max = Math.max(...ts.sparkline);
              const min = Math.min(...ts.sparkline);
              const range = max - min || 1;
              const points = ts.sparkline
                .map((v, idx) => `${(idx / (ts.sparkline.length - 1)) * 100},${100 - ((v - min) / range) * 80 - 10}`)
                .join(" ");

              return (
                <Link
                  key={ts.name}
                  href={`/marketplace/${ts.name}`}
                  className={`grid grid-cols-[3rem_1fr_8rem_8rem_6rem] gap-4 px-4 py-3 rounded-xl border transition-all hover:border-nexus-indigo/30 ${
                    i < 3 ? "border-nexus-green/20 bg-nexus-green/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <RankBadge rank={i + 1} />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-nexus-green/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-nexus-green" />
                    </div>
                    <div>
                      <span className="font-mono font-semibold text-sm">{ts.name}</span>
                      {skill && <span className="text-xs text-muted-foreground ml-2">{skill.category}</span>}
                    </div>
                  </div>
                  <div className="text-right self-center">
                    <span className="text-sm font-semibold text-nexus-green flex items-center justify-end gap-1">
                      <ArrowUpRight className="w-3 h-3" />
                      +{ts.growthPct}%
                    </span>
                  </div>
                  <span className="text-right font-mono text-sm self-center">{formatNumber(ts.callsLast7d)}</span>
                  <div className="self-center flex justify-end">
                    <svg viewBox="0 0 100 100" className="w-16 h-8" preserveAspectRatio="none">
                      <polyline
                        points={points}
                        fill="none"
                        stroke="oklch(0.72 0.19 142)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12">
          <div className="border border-border rounded-xl p-5">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Skills</div>
            <div className="text-2xl font-bold">{SKILLS.length}</div>
            <div className="text-xs text-muted-foreground mt-1">in the marketplace</div>
          </div>
          <div className="border border-border rounded-xl p-5">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Calls</div>
            <div className="text-2xl font-bold">{formatNumber(SKILLS.reduce((sum, s) => sum + s.stats.totalCalls, 0))}</div>
            <div className="text-xs text-muted-foreground mt-1">across all skills</div>
          </div>
          <div className="border border-border rounded-xl p-5">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Avg Rating</div>
            <div className="text-2xl font-bold">
              {(SKILLS.reduce((sum, s) => sum + s.stats.rating, 0) / SKILLS.length).toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">marketplace average</div>
          </div>
          <div className="border border-border rounded-xl p-5">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Publishers</div>
            <div className="text-2xl font-bold">{topPublishers.length}</div>
            <div className="text-xs text-muted-foreground mt-1">active publishers</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16 py-6">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
            <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
          </div>
          <span>© 2026 Nexus OS</span>
        </div>
      </footer>
    </div>
  );
}
