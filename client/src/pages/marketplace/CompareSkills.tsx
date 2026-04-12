/**
 * CompareSkills — /marketplace/compare
 * Side-by-side comparison of 2-3 skills across pricing, latency, trust, and more.
 * Users select skills from a dropdown and see a detailed comparison table.
 */
import { useState, useMemo } from "react";
import { Link, useSearch } from "wouter";
import {
  ArrowLeft, Package, ChevronDown, X, Star, Shield,
  Zap, Activity, Clock, Check, Minus, Plus,
  Sun, Moon, Code2, BookOpen, LayoutDashboard, Menu,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import NotificationBell from "./NotificationBell";
import {
  SKILLS, COMPARE_FIELDS, formatNumber, formatPrice, trustBadge,
  type Skill,
} from "./marketplaceData";

const MAX_COMPARE = 3;

/* ─── Skill Selector Dropdown ────────────────────────────────────────────── */
function SkillSelector({
  selected,
  onSelect,
  exclude,
}: {
  selected: Skill | null;
  onSelect: (s: Skill | null) => void;
  exclude: string[];
}) {
  const [open, setOpen] = useState(false);
  const available = SKILLS.filter((s) => !exclude.includes(s.name));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-card/60 border border-border/50 rounded-xl text-sm hover:border-nexus-indigo/40 transition-colors"
      >
        {selected ? (
          <span className="flex items-center gap-2 font-medium">
            <Package className="w-4 h-4 text-nexus-indigo" />
            {selected.name}
          </span>
        ) : (
          <span className="text-muted-foreground">Select a skill...</span>
        )}
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-card border border-border/50 rounded-xl shadow-xl max-h-64 overflow-y-auto">
          {selected && (
            <button
              onClick={() => { onSelect(null); setOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent transition-colors border-b border-border/30"
            >
              <X className="w-3.5 h-3.5" />
              Clear selection
            </button>
          )}
          {available.map((skill) => (
            <button
              key={skill.name}
              onClick={() => { onSelect(skill); setOpen(false); }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-nexus-indigo" />
                <span className="font-medium">{skill.name}</span>
                <span className="text-xs text-muted-foreground">v{skill.version}</span>
              </span>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <Star className="w-3 h-3 text-nexus-amber fill-nexus-amber" />
                {skill.stats.rating}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Comparison Value Cell ──────────────────────────────────────────────── */
function CompareCell({
  value,
  isBest,
  highlight,
}: {
  value: string;
  isBest: boolean;
  highlight?: "lower-better" | "higher-better";
}) {
  return (
    <td className={`px-4 py-3 text-sm text-center ${isBest && highlight ? "text-nexus-green font-semibold" : "text-foreground"}`}>
      {value}
      {isBest && highlight && (
        <Check className="w-3 h-3 text-nexus-green inline ml-1" />
      )}
    </td>
  );
}

/* ─── Main Compare Page ──────────────────────────────────────────────────── */
export default function CompareSkills() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchString = useSearch();
  
  // Parse initial skills from URL query params
  const initialSkills = useMemo(() => {
    const params = new URLSearchParams(searchString);
    const names = params.get("skills")?.split(",").filter(Boolean) ?? [];
    return names.map((n) => SKILLS.find((s) => s.name === n) ?? null).filter(Boolean) as Skill[];
  }, []);

  const [slots, setSlots] = useState<(Skill | null)[]>(() => {
    const initial: (Skill | null)[] = [...initialSkills];
    while (initial.length < 2) initial.push(null);
    return initial.slice(0, MAX_COMPARE);
  });

  const selectedNames = slots.filter(Boolean).map((s) => s!.name);
  const selectedSkills = slots.filter(Boolean) as Skill[];
  const canAddSlot = slots.length < MAX_COMPARE;

  const updateSlot = (index: number, skill: Skill | null) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = skill;
      return next;
    });
  };

  const removeSlot = (index: number) => {
    if (slots.length <= 2) {
      setSlots((prev) => {
        const next = [...prev];
        next[index] = null;
        return next;
      });
    } else {
      setSlots((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const addSlot = () => {
    if (slots.length < MAX_COMPARE) {
      setSlots((prev) => [...prev, null]);
    }
  };

  // Determine best values for highlighting
  const bestValues = useMemo(() => {
    if (selectedSkills.length < 2) return {};
    const bests: Record<string, number> = {};
    COMPARE_FIELDS.forEach((field) => {
      if (!field.highlight) return;
      const values = selectedSkills.map((s) => {
        const raw = field.getValue(s).replace(/[^0-9.]/g, "");
        return parseFloat(raw) || 0;
      });
      const bestIdx = field.highlight === "higher-better"
        ? values.indexOf(Math.max(...values))
        : values.indexOf(Math.min(...values));
      bests[field.key] = bestIdx;
    });
    return bests;
  }, [selectedSkills]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ─── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/marketplace">
              <span className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <ArrowLeft className="w-4 h-4" />
                Back to Marketplace
              </span>
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/marketplace">
              <span className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Browse</span>
            </Link>
            <Link href="/docs">
              <span className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <Code2 className="w-4 h-4" /> Docs
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
          <button
            className="md:hidden p-2 rounded-lg hover:bg-accent"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* ─── Content ─────────────────────────────────────────────────────── */}
      <main className="pt-24 pb-20 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Compare Skills
          </h1>
          <p className="text-muted-foreground">
            Select 2-3 skills to compare side by side across pricing, performance, trust, and more.
          </p>
        </div>

        {/* Skill Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {slots.map((skill, i) => (
            <div key={i} className="relative">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Skill {i + 1}
                </span>
                {slots.length > 2 && (
                  <button
                    onClick={() => removeSlot(i)}
                    className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <SkillSelector
                selected={skill}
                onSelect={(s) => updateSlot(i, s)}
                exclude={selectedNames.filter((n) => n !== skill?.name)}
              />
              {skill && (
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-nexus-amber fill-nexus-amber" />
                    {skill.stats.rating}
                  </span>
                  <span>{formatNumber(skill.stats.totalCalls)} calls</span>
                  <span className={skill.pricing.model === "free" ? "text-nexus-green" : ""}>
                    {formatPrice(skill.pricing)}
                  </span>
                </div>
              )}
            </div>
          ))}
          {canAddSlot && (
            <div className="flex items-end">
              <button
                onClick={addSlot}
                className="flex items-center gap-2 px-4 py-3 border border-dashed border-border/50 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-nexus-indigo/40 transition-colors w-full justify-center"
              >
                <Plus className="w-4 h-4" />
                Add Skill
              </button>
            </div>
          )}
        </div>

        {/* Comparison Table */}
        {selectedSkills.length >= 2 ? (
          <div className="border border-border/50 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-card/40 border-b border-border/50">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 w-40">
                    Metric
                  </th>
                  {selectedSkills.map((s) => (
                    <th key={s.name} className="text-center text-sm font-semibold px-4 py-3">
                      <Link href={`/marketplace/${s.name}`}>
                        <span className="hover:text-nexus-indigo transition-colors cursor-pointer flex items-center justify-center gap-1.5">
                          <Package className="w-4 h-4 text-nexus-indigo" />
                          {s.name}
                        </span>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_FIELDS.map((field, rowIdx) => (
                  <tr
                    key={field.key}
                    className={`border-b border-border/30 ${rowIdx % 2 === 0 ? "" : "bg-card/20"}`}
                  >
                    <td className="px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {field.label}
                    </td>
                    {selectedSkills.map((s, colIdx) => {
                      const isBest = bestValues[field.key] === colIdx;
                      return (
                        <CompareCell
                          key={s.name}
                          value={field.getValue(s)}
                          isBest={isBest}
                          highlight={field.highlight}
                        />
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <Package className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg mb-2">Select at least 2 skills to compare</p>
            <p className="text-sm">Use the dropdowns above to choose skills for comparison</p>
          </div>
        )}

        {/* Legend */}
        {selectedSkills.length >= 2 && (
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3 text-nexus-green" />
              Best value (highlighted in green)
            </span>
            <span>
              {COMPARE_FIELDS.filter((f) => f.highlight).length} comparable metrics
            </span>
          </div>
        )}
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
