/**
 * PublisherProfile — /marketplace/publisher/:handle
 * Shows all skills by a publisher, their trust history, aggregate stats, and badges.
 */
import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import {
  ArrowLeft, Star, Shield, ShieldCheck, Download, ExternalLink,
  Package, Clock, Zap, Activity, Globe, Github, Mail,
  Sun, Moon, Code2, BookOpen, LayoutDashboard, Menu, X,
  Award, TrendingUp, Calendar, CheckCircle2, AlertCircle,
  ChevronRight, User,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import NotificationBell from "./NotificationBell";
import {
  getPublisherProfile, getPublisherSkills,
  formatNumber, formatPrice, trustBadge, timeAgo,
  type PublisherProfile as PublisherProfileType, type Skill,
} from "./marketplaceData";

/* ─── Trust History Timeline ──────────────────────────────────────────────── */
function TrustTimeline({ history }: { history: PublisherProfileType["trustHistory"] }) {
  return (
    <div className="space-y-0">
      {history.map((entry, i) => (
        <div key={i} className="flex gap-4">
          {/* Timeline line */}
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full border-2 shrink-0 ${
              i === history.length - 1
                ? "bg-nexus-green border-nexus-green"
                : "bg-background border-border"
            }`} />
            {i < history.length - 1 && <div className="w-px flex-1 bg-border/50 min-h-[40px]" />}
          </div>
          {/* Content */}
          <div className="pb-5 -mt-0.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium">{entry.date}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                entry.tier <= "T2" ? "bg-nexus-green/10 text-nexus-green" :
                entry.tier <= "T3" ? "bg-nexus-amber/10 text-nexus-amber" :
                "bg-muted text-muted-foreground"
              }`}>
                {entry.tier}/{entry.rating}
              </span>
              <span className="text-[10px] text-muted-foreground">T-Score: {entry.tScore}</span>
            </div>
            <p className="text-xs text-muted-foreground">{entry.event}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Skill Card ──────────────────────────────────────────────────────────── */
function SkillCard({ skill }: { skill: Skill }) {
  const badge = trustBadge(skill.trust);
  const tierColor = skill.trust.trustTier && skill.trust.trustTier <= "T2" ? "bg-nexus-green/10 text-nexus-green" : skill.trust.trustTier === "T3" ? "bg-nexus-amber/10 text-nexus-amber" : "bg-muted text-muted-foreground";
  return (
    <Link href={`/marketplace/${skill.name}`}>
      <div className="bg-card/60 border border-border/30 rounded-xl p-5 hover:border-nexus-indigo/30 hover:bg-card/80 transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold group-hover:text-nexus-indigo transition-colors">{skill.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">v{skill.version} · {skill.category}</p>
          </div>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${tierColor}`}>
            {badge}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{skill.description}</p>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-nexus-amber fill-nexus-amber" />
              {skill.stats.rating}
            </span>
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3 text-muted-foreground" />
              {formatNumber(skill.stats.totalCalls)}
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-muted-foreground" />
              {skill.stats.avgLatencyMs}ms
            </span>
          </div>
          <span className={`font-medium ${skill.pricing.model === "free" ? "text-nexus-green" : "text-foreground"}`}>
            {formatPrice(skill.pricing)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
export default function PublisherProfile() {
  const { handle } = useParams<{ handle: string }>();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const publisher = useMemo(() => getPublisherProfile(handle || ""), [handle]);
  const skills = useMemo(() => getPublisherSkills(handle || ""), [handle]);

  if (!publisher) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Publisher Not Found</h1>
          <p className="text-muted-foreground mb-4">The publisher "@{handle}" doesn't exist.</p>
          <Link href="/marketplace">
            <span className="text-nexus-indigo hover:underline cursor-pointer">Back to Marketplace</span>
          </Link>
        </div>
      </div>
    );
  }

  const totalCalls = skills.reduce((sum, s) => sum + s.stats.totalCalls, 0);
  const avgRating = skills.length > 0
    ? skills.reduce((sum, s) => sum + s.stats.rating, 0) / skills.length
    : 0;
  const badge = trustBadge({ trustTier: publisher.trustTier, creditRating: publisher.creditRating, verified: publisher.verified });
  const badgeColor = publisher.trustTier <= "T2" ? "bg-nexus-green/10 text-nexus-green" : publisher.trustTier <= "T3" ? "bg-nexus-amber/10 text-nexus-amber" : "bg-muted text-muted-foreground";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Nav ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link href="/">
              <span className="font-mono font-bold text-sm cursor-pointer">nexus<span className="text-muted-foreground">.</span>os</span>
            </Link>
            <span className="text-muted-foreground/30">/</span>
            <Link href="/marketplace">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Marketplace</span>
            </Link>
            <span className="text-muted-foreground/30">/</span>
            <span className="text-sm font-medium">@{publisher.handle}</span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <Link href="/marketplace">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Browse</span>
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
          </div>
        )}
      </nav>

      {/* ─── Back Link ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <Link href="/marketplace">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Back to Marketplace
          </span>
        </Link>
      </div>

      {/* ─── Profile Header ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-nexus-indigo to-nexus-cyan flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {publisher.displayName.charAt(0)}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{publisher.displayName}</h1>
              {publisher.verified && (
                <ShieldCheck className="w-5 h-5 text-nexus-green" />
              )}
              <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${badgeColor}`}>
                {badge}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">@{publisher.handle}</p>
            <p className="text-sm text-foreground/80 max-w-2xl mb-4">{publisher.bio}</p>

            {/* Links */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {publisher.website && (
                <a href={publisher.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <Globe className="w-3.5 h-3.5" /> {publisher.website.replace(/^https?:\/\//, "")}
                </a>
              )}
              {publisher.github && (
                <a href={`https://github.com/${publisher.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground transition-colors">
                  <Github className="w-3.5 h-3.5" /> {publisher.github}
                </a>
              )}
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> {publisher.email}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Joined {publisher.joinedAt}
              </span>
            </div>
          </div>
        </div>

        {/* Badges */}
        {publisher.badges.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {publisher.badges.map((b) => (
              <span key={b} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-nexus-indigo/10 text-nexus-indigo border border-nexus-indigo/20">
                <Award className="w-3 h-3" /> {b}
              </span>
            ))}
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8">
          {[
            { label: "Skills", value: String(skills.length), icon: <Package className="w-4 h-4 text-nexus-indigo" /> },
            { label: "Total Calls", value: formatNumber(publisher.totalCalls), icon: <Activity className="w-4 h-4 text-nexus-cyan" /> },
            { label: "Revenue", value: `$${publisher.totalRevenue.toFixed(2)}`, icon: <TrendingUp className="w-4 h-4 text-nexus-green" /> },
            { label: "Avg Rating", value: avgRating.toFixed(1), icon: <Star className="w-4 h-4 text-nexus-amber" /> },
            { label: "T-Score", value: String(publisher.tScore), icon: <Shield className="w-4 h-4 text-purple-400" /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-card/60 border border-border/30 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                {stat.icon}
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Content Grid ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Skills (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-nexus-indigo" />
              Published Skills
              <span className="text-sm text-muted-foreground font-normal">({skills.length})</span>
            </h2>
            {skills.length === 0 ? (
              <div className="bg-card/40 border border-border/30 rounded-xl p-8 text-center">
                <Package className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-30" />
                <p className="text-sm text-muted-foreground">No skills published yet</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {skills.map((skill) => (
                  <SkillCard key={skill.name} skill={skill} />
                ))}
              </div>
            )}
          </div>

          {/* Right: Trust History & AUID (1/3) */}
          <div className="space-y-6">
            {/* AUID Card */}
            <div className="bg-card/60 border border-border/30 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                AXIS Identity
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">AUID</p>
                  <p className="text-[11px] font-mono text-foreground/70 break-all bg-accent/20 rounded-lg p-2">{publisher.auid}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Tier</p>
                    <p className={`text-sm font-bold ${publisher.trustTier <= "T2" ? "text-nexus-green" : publisher.trustTier <= "T3" ? "text-nexus-amber" : "text-muted-foreground"}`}>
                      {publisher.trustTier}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Rating</p>
                    <p className="text-sm font-bold">{publisher.creditRating}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">T-Score</p>
                    <p className="text-sm font-bold">{publisher.tScore}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust History */}
            <div className="bg-card/60 border border-border/30 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-nexus-cyan" />
                Trust History
              </h3>
              <TrustTimeline history={publisher.trustHistory} />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-border/30 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>Nexus OS — WASM Skill Marketplace</p>
          <div className="flex gap-4">
            <Link href="/"><span className="hover:text-foreground transition-colors cursor-pointer">Home</span></Link>
            <Link href="/marketplace"><span className="hover:text-foreground transition-colors cursor-pointer">Marketplace</span></Link>
            <Link href="/docs"><span className="hover:text-foreground transition-colors cursor-pointer">Docs</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
