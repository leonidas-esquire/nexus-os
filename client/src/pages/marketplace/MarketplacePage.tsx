/*
 * MarketplacePage — /marketplace
 * Design: Dark theme, indigo accents, hexagonal grid pattern background.
 * Hero with generated marketplace banner, search bar, featured skills grid,
 * category pills, and recently added list.
 */
import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  Search, Star, Shield, ShieldCheck, Download, ArrowRight,
  Package, ChevronRight, ExternalLink, Zap, TrendingUp,
  FileJson, Calculator, Brain, Lock, Database, Globe,
  Type, Image, Shuffle, Menu, X, Sun, Moon, Code2,
  BookOpen, LayoutDashboard, GitCompareArrows,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  SKILLS, CATEGORIES, FEATURED_SKILLS, RECENTLY_ADDED,
  formatNumber, formatPrice, trustBadge, timeAgo,
  type Skill,
} from "./marketplaceData";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030909471/NRmiWdZq2JgxyAQQ5B7Zs7/marketplace-hero-C3DUoiijW2xtcomNktXyfq.webp";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Parsers: <FileJson className="w-4 h-4" />,
  Validators: <ShieldCheck className="w-4 h-4" />,
  Transformers: <Shuffle className="w-4 h-4" />,
  Calculators: <Calculator className="w-4 h-4" />,
  "AI / ML": <Brain className="w-4 h-4" />,
  Security: <Lock className="w-4 h-4" />,
  Data: <Database className="w-4 h-4" />,
  Web: <Globe className="w-4 h-4" />,
  Text: <Type className="w-4 h-4" />,
  Media: <Image className="w-4 h-4" />,
};

/* ─── Skill Card ──────────────────────────────────────────────────────────── */
function SkillCard({ skill }: { skill: Skill }) {
  return (
    <Link href={`/marketplace/${skill.name}`}>
      <div className="group relative bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 hover:border-nexus-indigo/40 hover:bg-card/80 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-nexus-indigo/5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-nexus-indigo/10 border border-nexus-indigo/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-nexus-indigo" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-nexus-indigo transition-colors">
                {skill.name}
              </h3>
              <p className="text-xs text-muted-foreground">{skill.publisher.handle}</p>
            </div>
          </div>
          <span className="text-xs font-mono text-muted-foreground">v{skill.version}</span>
        </div>

        {/* Trust Badge */}
        {skill.trust.verified && (
          <div className="flex items-center gap-1.5 mb-3">
            <Shield className="w-3.5 h-3.5 text-nexus-green" />
            <span className="text-xs font-medium text-nexus-green">
              {trustBadge(skill.trust)}
            </span>
          </div>
        )}

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
          {skill.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/30">
          <span className={`text-sm font-semibold ${skill.pricing.model === "free" ? "text-nexus-green" : "text-foreground"}`}>
            {formatPrice(skill.pricing)}
          </span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-nexus-amber fill-nexus-amber" />
              {skill.stats.rating}
            </span>
            <span>{formatNumber(skill.stats.totalCalls)} calls</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const filteredSkills = useMemo(() => {
    let results = SKILLS;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.patterns.some((p) => p.toLowerCase().includes(q)) ||
          s.publisher.handle.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) {
      results = results.filter((s) => s.category === selectedCategory);
    }
    return results;
  }, [searchQuery, selectedCategory]);

  const isSearching = searchQuery.trim() !== "" || selectedCategory !== null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <span className="font-bold text-lg tracking-tight cursor-pointer">
                nexus<span className="text-nexus-indigo">.</span>os
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium">Skill Marketplace</span>
            </div>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/marketplace/compare">
              <span className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <GitCompareArrows className="w-4 h-4" />
                Compare
              </span>
            </Link>
            <Link href="/marketplace/developer">
              <span className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <LayoutDashboard className="w-4 h-4" />
                Developer Portal
              </span>
            </Link>
            <Link href="/docs">
              <span className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <Code2 className="w-4 h-4" />
                API Docs
              </span>
            </Link>
            <Link href="/docs/manual">
              <span className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <BookOpen className="w-4 h-4" />
                Manual
              </span>
            </Link>
            <button
              onClick={() => toggleTheme?.()}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl p-4 space-y-3">
            <Link href="/marketplace/compare">
              <span className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2 cursor-pointer">
                <GitCompareArrows className="w-4 h-4" /> Compare Skills
              </span>
            </Link>
            <Link href="/marketplace/developer">
              <span className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2 cursor-pointer">
                <LayoutDashboard className="w-4 h-4" /> Developer Portal
              </span>
            </Link>
            <Link href="/docs">
              <span className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2 cursor-pointer">
                <Code2 className="w-4 h-4" /> API Docs
              </span>
            </Link>
            <Link href="/docs/manual">
              <span className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2 cursor-pointer">
                <BookOpen className="w-4 h-4" /> Manual
              </span>
            </Link>
          </div>
        )}
      </nav>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={HERO_IMG}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-20 sm:pb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-nexus-indigo/10 border border-nexus-indigo/20 text-nexus-indigo text-xs font-medium mb-6">
              <Package className="w-3.5 h-3.5" />
              {SKILLS.length} skills available
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-[1.1]">
              WASM Skill<br />
              <span className="text-nexus-indigo">Marketplace</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
              Discover, install, and monetize WASM skills for your AI agents.
              Sandboxed execution, AXIS trust verification, and per-call billing.
            </p>

            {/* Search */}
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder='Search skills... (e.g. "json", "email", "sentiment")'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-card/80 backdrop-blur-sm border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-nexus-indigo/40 focus:border-nexus-indigo/40 transition-all"
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6 sm:gap-10 mt-10 text-sm">
            <div>
              <p className="text-2xl font-bold text-foreground">{formatNumber(SKILLS.reduce((a, s) => a + s.stats.totalCalls, 0))}</p>
              <p className="text-muted-foreground">Total Calls</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{SKILLS.length}</p>
              <p className="text-muted-foreground">Skills</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {new Set(SKILLS.map((s) => s.publisher.handle)).size}
              </p>
              <p className="text-muted-foreground">Publishers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-nexus-green">99.9%</p>
              <p className="text-muted-foreground">Avg Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        {/* Categories */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-nexus-indigo" />
            Categories
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === null
                  ? "bg-nexus-indigo text-white"
                  : "bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === cat.name
                    ? "bg-nexus-indigo text-white"
                    : "bg-card/60 border border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {CATEGORY_ICONS[cat.name]}
                {cat.name}
                <span className="text-xs opacity-60">{cat.count}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Search Results or Default View */}
        {isSearching ? (
          <section className="mb-16">
            <h2 className="text-lg font-semibold mb-2">
              {filteredSkills.length} result{filteredSkills.length !== 1 ? "s" : ""}
              {searchQuery && <span className="text-muted-foreground font-normal"> for "{searchQuery}"</span>}
              {selectedCategory && <span className="text-muted-foreground font-normal"> in {selectedCategory}</span>}
            </h2>
            {filteredSkills.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {filteredSkills.map((skill) => (
                  <SkillCard key={skill.name} skill={skill} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="text-lg mb-2">No skills found</p>
                <p className="text-sm">Try a different search term or category</p>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Featured Skills */}
            <section className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Star className="w-5 h-5 text-nexus-amber" />
                  Featured Skills
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {FEATURED_SKILLS.map((skill) => (
                  <SkillCard key={skill.name} skill={skill} />
                ))}
              </div>
            </section>

            {/* All Skills */}
            <section className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-nexus-cyan" />
                  All Skills
                </h2>
                <span className="text-sm text-muted-foreground">{SKILLS.length} total</span>
              </div>

              {/* Table view for larger screens */}
              <div className="hidden lg:block border border-border/50 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-card/40 border-b border-border/50">
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Skill</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Version</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Publisher</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Price</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Trust</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Rating</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Calls</th>
                      <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {SKILLS.map((skill, i) => (
                      <tr
                        key={skill.name}
                        className={`border-b border-border/30 hover:bg-card/40 transition-colors ${i % 2 === 0 ? "" : "bg-card/20"}`}
                      >
                        <td className="px-5 py-3.5">
                          <Link href={`/marketplace/${skill.name}`}>
                            <span className="font-medium text-foreground hover:text-nexus-indigo transition-colors cursor-pointer">
                              {skill.name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-mono text-muted-foreground">{skill.version}</td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{skill.publisher.handle}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-sm font-medium ${skill.pricing.model === "free" ? "text-nexus-green" : "text-foreground"}`}>
                            {formatPrice(skill.pricing)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {skill.trust.verified ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-nexus-green">
                              <Shield className="w-3 h-3" />
                              {trustBadge(skill.trust)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="flex items-center gap-1 text-sm">
                            <Star className="w-3.5 h-3.5 text-nexus-amber fill-nexus-amber" />
                            {skill.stats.rating}
                            <span className="text-muted-foreground text-xs">({formatNumber(skill.stats.reviews)})</span>
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-muted-foreground">{formatNumber(skill.stats.totalCalls)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <Link href={`/marketplace/${skill.name}`}>
                            <span className="text-nexus-indigo hover:text-nexus-indigo/80 text-sm cursor-pointer">
                              View <ArrowRight className="w-3.5 h-3.5 inline" />
                            </span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Card view for mobile */}
              <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SKILLS.map((skill) => (
                  <SkillCard key={skill.name} skill={skill} />
                ))}
              </div>
            </section>

            {/* Recently Added */}
            <section className="mb-16">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Download className="w-5 h-5 text-nexus-green" />
                Recently Added
              </h2>
              <div className="space-y-2">
                {RECENTLY_ADDED.slice(0, 5).map((skill) => (
                  <Link key={skill.name} href={`/marketplace/${skill.name}`}>
                    <div className="flex items-center justify-between px-5 py-3.5 bg-card/40 border border-border/30 rounded-xl hover:border-nexus-indigo/30 hover:bg-card/60 transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-nexus-indigo/10 flex items-center justify-center">
                          <Package className="w-4 h-4 text-nexus-indigo" />
                        </div>
                        <div>
                          <span className="font-medium text-sm group-hover:text-nexus-indigo transition-colors">{skill.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">v{skill.version}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{skill.publisher.handle}</span>
                        <span className={skill.pricing.model === "free" ? "text-nexus-green font-medium" : ""}>
                          {formatPrice(skill.pricing)}
                        </span>
                        <span className="text-xs">{timeAgo(skill.createdAt)}</span>
                        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-nexus-indigo" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}

        {/* CTA */}
        <section className="text-center py-16 border-t border-border/30">
          <h2 className="text-2xl font-bold mb-3">Build and Monetize Skills</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Publish your WASM skills to the marketplace and earn 70% of every transaction.
            AXIS trust verification included.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/marketplace/developer">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-nexus-indigo text-white rounded-lg font-medium text-sm hover:bg-nexus-indigo/90 transition-colors cursor-pointer">
                Developer Portal
                <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
            <Link href="/docs">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-lg font-medium text-sm hover:bg-accent transition-colors cursor-pointer">
                <ExternalLink className="w-4 h-4" />
                Publisher Docs
              </span>
            </Link>
          </div>
        </section>
      </main>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; 2026 Nexus OS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/"><span className="hover:text-foreground transition-colors cursor-pointer">Home</span></Link>
            <Link href="/docs"><span className="hover:text-foreground transition-colors cursor-pointer">Docs</span></Link>
            <Link href="/docs/manual"><span className="hover:text-foreground transition-colors cursor-pointer">Manual</span></Link>
            <Link href="/marketplace/developer"><span className="hover:text-foreground transition-colors cursor-pointer">Developer</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
