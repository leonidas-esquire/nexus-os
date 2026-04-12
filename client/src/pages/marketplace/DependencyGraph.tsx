/**
 * DependencyGraph — /marketplace/dependencies
 * Interactive SVG-based visualization of skill dependencies and relationships.
 * Circular layout with animated edges, hover highlights, and click-to-navigate.
 */
import { useState, useMemo, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft, Package, Sun, Moon, Code2, BookOpen,
  Link2, ArrowRight, Filter, Eye, EyeOff,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import {
  SKILLS, SKILL_DEPENDENCIES, getGraphNodes,
  type SkillNode, type SkillDependency,
} from "./marketplaceData";

const CATEGORY_COLORS: Record<string, string> = {
  Parsers: "#6366f1",     // indigo
  Data: "#06b6d4",        // cyan
  Validators: "#f59e0b",  // amber
  Transformers: "#8b5cf6", // purple
  "AI / ML": "#ec4899",   // pink
  Security: "#ef4444",    // red
  Web: "#10b981",         // green
  Text: "#f97316",        // orange
  Media: "#14b8a6",       // teal
  Calculators: "#a855f7", // violet
};

const EDGE_STYLES: Record<string, { color: string; dash: string; label: string }> = {
  requires: { color: "#ef4444", dash: "none", label: "Requires" },
  optional: { color: "#f59e0b", dash: "6,3", label: "Optional" },
  "commonly-used-with": { color: "#06b6d4", dash: "3,3", label: "Commonly Used With" },
};

/* ─── SVG Arrow Marker ───────────────────────────────────────────────────── */
function ArrowDefs() {
  return (
    <defs>
      {Object.entries(EDGE_STYLES).map(([type, style]) => (
        <marker
          key={type}
          id={`arrow-${type}`}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={style.color} opacity={0.7} />
        </marker>
      ))}
    </defs>
  );
}

/* ─── Edge Component ─────────────────────────────────────────────────────── */
function Edge({
  dep,
  nodes,
  highlighted,
  dimmed,
}: {
  dep: SkillDependency;
  nodes: SkillNode[];
  highlighted: boolean;
  dimmed: boolean;
}) {
  const from = nodes.find((n) => n.name === dep.from);
  const to = nodes.find((n) => n.name === dep.to);
  if (!from || !to) return null;

  const style = EDGE_STYLES[dep.type];
  const isDirectional = dep.type !== "commonly-used-with";

  // Calculate control point for curved edges
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  // Curve offset perpendicular to the line
  const offset = dist * 0.15;
  const cx = mx - (dy / dist) * offset;
  const cy = my + (dx / dist) * offset;

  // Shorten path to not overlap with node circles
  const r = 22; // node radius
  const angle1 = Math.atan2(cy - from.y, cx - from.x);
  const angle2 = Math.atan2(to.y - cy, to.x - cx);
  const x1 = from.x + r * Math.cos(angle1);
  const y1 = from.y + r * Math.sin(angle1);
  const x2 = to.x - r * Math.cos(angle2);
  const y2 = to.y - r * Math.sin(angle2);

  return (
    <path
      d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
      fill="none"
      stroke={style.color}
      strokeWidth={highlighted ? 2.5 : 1.2}
      strokeDasharray={style.dash}
      opacity={dimmed ? 0.08 : highlighted ? 0.9 : 0.35}
      markerEnd={isDirectional ? `url(#arrow-${dep.type})` : undefined}
      className="transition-all duration-300"
    />
  );
}

/* ─── Node Component ─────────────────────────────────────────────────────── */
function Node({
  node,
  highlighted,
  dimmed,
  hovered,
  onHover,
  onLeave,
}: {
  node: SkillNode;
  highlighted: boolean;
  dimmed: boolean;
  hovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}) {
  const color = CATEGORY_COLORS[node.category] ?? "#6366f1";
  const [, navigate] = useLocation();

  return (
    <g
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={() => navigate(`/marketplace/${node.name}`)}
      className="cursor-pointer"
      style={{ transition: "opacity 0.3s" }}
      opacity={dimmed ? 0.15 : 1}
    >
      {/* Glow ring on hover */}
      {hovered && (
        <circle
          cx={node.x}
          cy={node.y}
          r={28}
          fill="none"
          stroke={color}
          strokeWidth={2}
          opacity={0.4}
          className="animate-pulse"
        />
      )}

      {/* Main circle */}
      <circle
        cx={node.x}
        cy={node.y}
        r={highlighted ? 22 : 18}
        fill={`${color}20`}
        stroke={color}
        strokeWidth={highlighted ? 2.5 : 1.5}
        className="transition-all duration-300"
      />

      {/* Icon placeholder */}
      <text
        x={node.x}
        y={node.y + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={highlighted ? 11 : 9}
        fontWeight="bold"
        fill={color}
        className="select-none transition-all duration-300"
      >
        {node.name.split("-").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
      </text>

      {/* Label */}
      <text
        x={node.x}
        y={node.y + (highlighted ? 34 : 30)}
        textAnchor="middle"
        fontSize={highlighted ? 11 : 9}
        fontWeight={highlighted ? 600 : 400}
        fill={highlighted ? "var(--foreground)" : "var(--muted-foreground)"}
        className="select-none transition-all duration-300"
      >
        {node.name}
      </text>

      {/* Call count on hover */}
      {hovered && (
        <text
          x={node.x}
          y={node.y + 46}
          textAnchor="middle"
          fontSize={8}
          fill="var(--muted-foreground)"
          className="select-none"
        >
          {(node.calls / 1000).toFixed(0)}K calls
        </text>
      )}
    </g>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function DependencyGraph() {
  const { theme, toggleTheme } = useTheme();
  const nodes = useMemo(() => getGraphNodes(), []);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);

  // Determine which nodes/edges are highlighted based on hover
  const { highlightedNodes, highlightedEdges } = useMemo(() => {
    if (!hoveredNode) return { highlightedNodes: new Set<string>(), highlightedEdges: new Set<number>() };
    const hn = new Set<string>([hoveredNode]);
    const he = new Set<number>();
    SKILL_DEPENDENCIES.forEach((dep, i) => {
      if (dep.from === hoveredNode || dep.to === hoveredNode) {
        hn.add(dep.from);
        hn.add(dep.to);
        he.add(i);
      }
    });
    return { highlightedNodes: hn, highlightedEdges: he };
  }, [hoveredNode]);

  const filteredDeps = useMemo(() => {
    if (!filterType) return SKILL_DEPENDENCIES;
    return SKILL_DEPENDENCIES.filter((d) => d.type === filterType);
  }, [filterType]);

  // Count connections per node
  const connectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SKILL_DEPENDENCIES.forEach((d) => {
      counts[d.from] = (counts[d.from] ?? 0) + 1;
      counts[d.to] = (counts[d.to] ?? 0) + 1;
    });
    return counts;
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/marketplace">
              <span className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <ArrowLeft className="w-4 h-4" /> Back to Marketplace
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/marketplace">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Browse</span>
            </Link>
            <Link href="/docs">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5" /> Docs
              </span>
            </Link>
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-accent transition-colors">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-3 mb-2">
            <Link2 className="w-6 h-6 text-nexus-cyan" />
            Skill Dependency Graph
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl">
            Visualize how skills depend on and relate to each other. Hover over a node to highlight
            its connections. Click a node to view the skill detail page.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </div>
          <button
            onClick={() => setFilterType(null)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              !filterType ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/30"
            }`}
          >
            All ({SKILL_DEPENDENCIES.length})
          </button>
          {Object.entries(EDGE_STYLES).map(([type, style]) => {
            const count = SKILL_DEPENDENCIES.filter((d) => d.type === type).length;
            return (
              <button
                key={type}
                onClick={() => setFilterType(filterType === type ? null : type)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors flex items-center gap-1.5 ${
                  filterType === type ? "border-foreground/50 bg-accent" : "border-border hover:border-foreground/30"
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.color }} />
                {style.label} ({count})
              </button>
            );
          })}

          <div className="ml-auto">
            <button
              onClick={() => setShowLabels(!showLabels)}
              className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-foreground/30 transition-colors flex items-center gap-1.5"
            >
              {showLabels ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              Labels
            </button>
          </div>
        </div>

        {/* Graph */}
        <div className="bg-card/40 border border-border/50 rounded-2xl p-4 overflow-hidden">
          <svg viewBox="0 0 600 500" className="w-full max-h-[600px]">
            <ArrowDefs />

            {/* Edges */}
            {filteredDeps.map((dep, i) => (
              <Edge
                key={`${dep.from}-${dep.to}-${dep.type}`}
                dep={dep}
                nodes={nodes}
                highlighted={hoveredNode ? highlightedEdges.has(SKILL_DEPENDENCIES.indexOf(dep)) : false}
                dimmed={hoveredNode ? !highlightedEdges.has(SKILL_DEPENDENCIES.indexOf(dep)) : false}
              />
            ))}

            {/* Nodes */}
            {nodes.map((node) => (
              <Node
                key={node.name}
                node={node}
                highlighted={hoveredNode ? highlightedNodes.has(node.name) : false}
                dimmed={hoveredNode ? !highlightedNodes.has(node.name) : false}
                hovered={hoveredNode === node.name}
                onHover={() => setHoveredNode(node.name)}
                onLeave={() => setHoveredNode(null)}
              />
            ))}
          </svg>
        </div>

        {/* Legend + Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Legend */}
          <div className="bg-card/60 border border-border/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4">Edge Types</h3>
            <div className="space-y-3">
              {Object.entries(EDGE_STYLES).map(([type, style]) => (
                <div key={type} className="flex items-center gap-3">
                  <svg width="40" height="12">
                    <line
                      x1="0" y1="6" x2="40" y2="6"
                      stroke={style.color}
                      strokeWidth="2"
                      strokeDasharray={style.dash}
                    />
                  </svg>
                  <span className="text-sm text-foreground/80">{style.label}</span>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold mt-6 mb-4">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_COLORS).map(([cat, color]) => {
                const count = SKILLS.filter((s) => s.category === cat).length;
                if (count === 0) return null;
                return (
                  <span
                    key={cat}
                    className="text-xs px-2 py-1 rounded-lg border flex items-center gap-1.5"
                    style={{ borderColor: `${color}40`, backgroundColor: `${color}10`, color }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    {cat} ({count})
                  </span>
                );
              })}
            </div>
          </div>

          {/* Connection Stats */}
          <div className="bg-card/60 border border-border/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold mb-4">Most Connected Skills</h3>
            <div className="space-y-2">
              {Object.entries(connectionCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([name, count]) => {
                  const skill = SKILLS.find((s) => s.name === name);
                  const color = skill ? CATEGORY_COLORS[skill.category] ?? "#6366f1" : "#6366f1";
                  const maxCount = Math.max(...Object.values(connectionCounts));
                  return (
                    <Link key={name} href={`/marketplace/${name}`}>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer group">
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          {name.split("-").map((w) => w[0]).join("").toUpperCase().slice(0, 2)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground group-hover:text-nexus-cyan transition-colors">
                              {name}
                            </span>
                            <span className="text-xs text-muted-foreground">{count} connections</span>
                          </div>
                          <div className="w-full h-1.5 bg-accent/30 rounded-full mt-1.5">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${(count / maxCount) * 100}%`,
                                backgroundColor: color,
                                opacity: 0.6,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/30 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>&copy; 2026 Nexus OS. All rights reserved.</span>
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
