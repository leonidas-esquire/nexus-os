/*
 * Nexus OS Landing Page — "Terminal Noir" Design
 * Design: Deep charcoal base, electric indigo accent, JetBrains Mono + Space Grotesk
 * Layout: Asymmetric terminal panels, code-as-design, staggered scroll reveals
 */

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  Terminal, Shield, Cpu, GitBranch, DollarSign,
  Layers, Zap, Globe, ArrowRight, ChevronRight,
  Activity, Box, Network, Eye, BookOpen, Github
} from "lucide-react";

// ---- Constants ----
const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030909471/NRmiWdZq2JgxyAQQ5B7Zs7/nexus-hero-bg-KZaygkzLoQetYLpJYVsvWt.webp";
const ARCH_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030909471/NRmiWdZq2JgxyAQQ5B7Zs7/nexus-architecture-4DiwhY8q9MGbukEE9PinuU.webp";
const TERMINAL_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030909471/NRmiWdZq2JgxyAQQ5B7Zs7/nexus-terminal-4Hd335zah89fxbMfUwEoUh.webp";
const DASHBOARD_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030909471/NRmiWdZq2JgxyAQQ5B7Zs7/nexus-dashboard-fwAdGqtnxNA3pFiqWHe6iD.webp";

const GITHUB_URL = "https://github.com/punkpeye/nexus-os";

// ---- Typewriter Hook ----
function useTypewriter(text: string, speed = 40, delay = 500) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;
    const timer = setTimeout(() => {
      setDisplayed(text.slice(0, displayed.length + 1));
    }, speed);
    return () => clearTimeout(timer);
  }, [displayed, started, text, speed]);

  return displayed;
}

// ---- Section Wrapper with scroll animation ----
function AnimatedSection({ children, className = "", delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ---- Feature Card ----
function FeatureCard({ icon: Icon, title, description, code, delay = 0 }: {
  icon: any;
  title: string;
  description: string;
  code?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className="group relative terminal-border rounded-lg p-6 hover:border-nexus-indigo/40 transition-all duration-300 hover:glow-indigo"
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-10 h-10 rounded-md bg-nexus-indigo/10 flex items-center justify-center text-nexus-indigo">
          <Icon size={20} />
        </div>
        <div className="min-w-0">
          <h3 className="font-mono font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
          {code && (
            <div className="mt-3 bg-nexus-deep rounded-md px-3 py-2 font-mono text-xs text-nexus-indigo overflow-x-auto">
              {code}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---- Stat Block ----
function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="font-mono text-3xl font-bold text-nexus-indigo glow-text">{value}</div>
      <div className="text-muted-foreground text-sm mt-1">{label}</div>
    </div>
  );
}

// ---- Nav ----
function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "bg-nexus-deep/90 backdrop-blur-md border-b border-border" : "bg-transparent"
    }`}>
      <div className="container flex items-center justify-between h-16">
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-nexus-indigo/20 flex items-center justify-center border border-nexus-indigo/30">
            <Network size={16} className="text-nexus-indigo" />
          </div>
          <span className="font-mono font-bold text-lg tracking-tight">nexus<span className="text-nexus-indigo">.</span>os</span>
        </a>

        <div className="hidden md:flex items-center gap-8 text-sm font-mono text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">features</a>
          <a href="#architecture" className="hover:text-foreground transition-colors">architecture</a>
          <a href="#cli" className="hover:text-foreground transition-colors">cli</a>
          <a href="#dashboard" className="hover:text-foreground transition-colors">dashboard</a>
          <a href="#broker" className="hover:text-foreground transition-colors">broker</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">pricing</a>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github size={16} />
            <span>GitHub</span>
          </a>
          <a
            href="#get-started"
            className="flex items-center gap-1.5 bg-nexus-indigo text-white text-sm font-mono px-4 py-2 rounded-md hover:bg-nexus-indigo/90 transition-colors"
          >
            Get Started
            <ChevronRight size={14} />
          </a>
        </div>
      </div>
    </nav>
  );
}

// ---- Hero Section ----
function Hero() {
  const tagline = useTypewriter("The orchestration layer for AI agents.", 35, 800);

  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img
          src={HERO_BG}
          alt=""
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-nexus-deep/60 via-nexus-deep/40 to-nexus-deep" />
      </div>

      {/* Dot grid overlay */}
      <div className="absolute inset-0 dot-grid opacity-30" />

      <div className="container relative z-10 pt-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-nexus-indigo/10 border border-nexus-indigo/20 rounded-full px-4 py-1.5 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-nexus-green animate-pulse" />
              <span className="font-mono text-xs text-nexus-indigo">v0.1.0 — Phase 1 Release</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
            >
              <span className="text-foreground">Nexus</span>{" "}
              <span className="text-nexus-indigo glow-text">OS</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-8"
            >
              <p className="font-mono text-xl sm:text-2xl text-muted-foreground leading-relaxed">
                {tagline}
                <span className="cursor-blink text-nexus-indigo">|</span>
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-lg mb-8"
            >
              One CLI to create, supervise, and scale AI agents. Built in Rust.
              WASM-sandboxed. Erlang-style fault tolerance. Token-cost optimization
              that saves you money on every call.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex flex-wrap gap-4"
            >
              <a
                href="#get-started"
                className="inline-flex items-center gap-2 bg-nexus-indigo text-white font-mono text-sm px-6 py-3 rounded-md hover:bg-nexus-indigo/90 transition-colors glow-indigo"
              >
                <Terminal size={16} />
                cargo install naos
              </a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-border text-foreground font-mono text-sm px-6 py-3 rounded-md hover:border-nexus-indigo/40 hover:bg-nexus-indigo/5 transition-all"
              >
                <Github size={16} />
                View on GitHub
              </a>
            </motion.div>
          </div>

          {/* Right: Terminal Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="hidden lg:block"
          >
            <div className="terminal-border rounded-lg overflow-hidden glow-indigo">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-nexus-deep">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-2 font-mono text-xs text-muted-foreground">naos — terminal</span>
              </div>
              <div className="p-5 font-mono text-sm leading-relaxed bg-nexus-deep/80">
                <div className="text-muted-foreground">$ <span className="text-foreground">naos init my-project</span></div>
                <div className="text-nexus-green mt-1">  ✓ Created project structure</div>
                <div className="text-nexus-green">  ✓ Generated nexus.config.yaml</div>
                <div className="text-nexus-green">  ✓ Initialized SQLite database</div>
                <div className="text-nexus-green">  ✓ Created example agent</div>
                <div className="mt-3 text-muted-foreground">$ <span className="text-foreground">naos create researcher --template research</span></div>
                <div className="text-nexus-green mt-1">  ✓ Agent ID: <span className="text-nexus-indigo">e79ce380adcb</span></div>
                <div className="mt-3 text-muted-foreground">$ <span className="text-foreground">naos status</span></div>
                <div className="mt-1 text-muted-foreground">  NAME           STATUS       ID</div>
                <div className="text-muted-foreground">  ─────────────────────────────────────</div>
                <div>  researcher     <span className="text-nexus-green">● running</span>    e79ce380adcb</div>
                <div>  data-bot       <span className="text-muted-foreground">○ stopped</span>    a1b2c3d4e5f6</div>
                <div className="mt-3 text-muted-foreground">$ <span className="cursor-blink text-nexus-indigo">|</span></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ---- Stats Bar ----
function StatsBar() {
  return (
    <AnimatedSection className="relative py-16 border-y border-border bg-nexus-surface/50">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatBlock value="< 5min" label="Project setup time" />
          <StatBlock value="~90%" label="Token cost savings" />
          <StatBlock value="3" label="Supervisor strategies" />
          <StatBlock value="∞" label="WASM skill modules" />
        </div>
      </div>
    </AnimatedSection>
  );
}

// ---- Features Section ----
function Features() {
  const features = [
    {
      icon: Shield,
      title: "Erlang-Style Supervisors",
      description: "One-for-one, one-for-all, rest-for-one restart strategies. Agents self-heal with configurable restart windows and escalation policies.",
      code: "naos deploy researcher --supervisor one-for-one --max-restarts 5",
    },
    {
      icon: Layers,
      title: "Sagas & Workflows",
      description: "Multi-step orchestration with automatic compensation. If step 3 fails, steps 1 and 2 are automatically rolled back.",
      code: "naos workflow run data-pipeline",
    },
    {
      icon: DollarSign,
      title: "Token-Cost Optimization",
      description: "Per-agent budgets, automatic model downsizing, semantic caching, and prompt compression. Every call is routed to the cheapest capable handler.",
      code: "naos cost set researcher --budget $10/day --alert-at 80%",
    },
    {
      icon: Cpu,
      title: "WASM Skill Marketplace",
      description: "Deterministic tasks run in WASM sandboxes at near-zero cost. Skills are portable, versioned, and composable.",
      code: "naos marketplace install json-parser@1.2",
    },
    {
      icon: Eye,
      title: "Causal Audit Trail",
      description: "Every agent action is logged with Lamport timestamps, content hashes, and cost tracking. Full replay and fork capabilities.",
      code: "naos audit tail --lines 50",
    },
    {
      icon: Globe,
      title: "Edge Deployment",
      description: "Deploy agents to Cloudflare Workers for sub-50ms latency worldwide. Offline-first with automatic sync.",
      code: "naos edge deploy researcher",
    },
    {
      icon: GitBranch,
      title: "CRDT State Management",
      description: "Conflict-free replicated data types for agent memory. Merge without coordination. Fork and replay from any point.",
      code: "naos state inspect researcher",
    },
    {
      icon: Activity,
      title: "Broker Routing Engine",
      description: "Skill → WASM → LLM routing cascade. The broker picks the cheapest handler that can solve the task with high confidence.",
      code: "naos broker route \"parse JSON from API response\"",
    },
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 dot-grid opacity-10" />
      <div className="container relative">
        <AnimatedSection>
          <div className="max-w-2xl mb-16">
            <span className="font-mono text-xs text-nexus-indigo uppercase tracking-widest">Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">
              Everything you need to orchestrate AI agents
            </h2>
            <p className="text-muted-foreground text-lg">
              From lifecycle management to cost optimization, Nexus OS provides the
              primitives that production agent systems require.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ---- Architecture Section ----
function Architecture() {
  return (
    <section id="architecture" className="py-24 bg-nexus-surface/30 border-y border-border">
      <div className="container">
        <AnimatedSection>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="font-mono text-xs text-nexus-indigo uppercase tracking-widest">Architecture</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-6">
                Three layers, one binary
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                Nexus OS organizes agent systems into three distinct layers. The Execution
                Layer runs code in WASM sandboxes. The Orchestration Layer manages supervisors,
                sagas, and workflows. The Intelligence Layer handles LLM routing and cost optimization.
              </p>

              <div className="space-y-4">
                {[
                  { color: "text-nexus-cyan", label: "Execution", desc: "WASM sandboxes, containers, edge runtimes" },
                  { color: "text-nexus-indigo", label: "Orchestration", desc: "Supervisors, sagas, workflows, pools" },
                  { color: "text-nexus-green", label: "Intelligence", desc: "Broker routing, cost control, model selection" },
                ].map((layer) => (
                  <div key={layer.label} className="flex items-start gap-3">
                    <div className={`shrink-0 mt-1 w-2 h-2 rounded-full ${layer.color} bg-current`} />
                    <div>
                      <span className={`font-mono font-semibold ${layer.color}`}>{layer.label}</span>
                      <span className="text-muted-foreground text-sm ml-2">— {layer.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg overflow-hidden glow-indigo border border-border">
              <img
                src={ARCH_IMG}
                alt="Nexus OS Architecture — Three layers: Execution, Orchestration, Intelligence"
                className="w-full h-auto"
              />
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

// ---- CLI Section ----
function CliSection() {
  return (
    <section id="cli" className="py-24 relative">
      <div className="absolute inset-0 dot-grid opacity-10" />
      <div className="container relative">
        <AnimatedSection>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1 rounded-lg overflow-hidden glow-indigo border border-border">
              <img
                src={TERMINAL_IMG}
                alt="naos CLI in action — init, create, status commands"
                className="w-full h-auto"
              />
            </div>

            <div className="order-1 lg:order-2">
              <span className="font-mono text-xs text-nexus-indigo uppercase tracking-widest">CLI</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-6">
                One command to rule them all
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                The <code className="font-mono text-nexus-indigo bg-nexus-indigo/10 px-1.5 py-0.5 rounded text-sm">naos</code> CLI
                is your single interface for the entire agent lifecycle. Initialize projects,
                create agents from templates, deploy with supervisors, track costs, and
                monitor everything from your terminal.
              </p>

              <div className="space-y-3">
                {[
                  { cmd: "naos init", desc: "Scaffold a new project in < 5 minutes" },
                  { cmd: "naos create", desc: "Create agents from built-in templates" },
                  { cmd: "naos run / stop", desc: "Manage agent lifecycle" },
                  { cmd: "naos deploy", desc: "Deploy with supervisor strategies" },
                  { cmd: "naos dashboard", desc: "Launch the web dashboard" },
                  { cmd: "naos cost status", desc: "View real-time cost tracking" },
                  { cmd: "naos broker route", desc: "Route tasks through the broker" },
                  { cmd: "naos audit tail", desc: "Stream the causal audit trail" },
                ].map((item) => (
                  <div key={item.cmd} className="flex items-center gap-3 group">
                    <code className="font-mono text-sm text-nexus-green shrink-0 w-40">{item.cmd}</code>
                    <span className="text-muted-foreground text-sm">{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

// ---- Dashboard Section ----
const DASHBOARD_PAGES = [
  { path: "/", name: "Overview", desc: "Real-time summary of agents, supervisors, cost, trust, and recent activity" },
  { path: "/agents", name: "Agents", desc: "All agents with status, cost budget, and AXIS trust scores" },
  { path: "/supervisors", name: "Supervisors", desc: "Supervisor trees with child agent states and restart counts" },
  { path: "/sagas", name: "Sagas", desc: "Multi-step saga definitions with execution history and rollback status" },
  { path: "/workflows", name: "Workflows", desc: "Sequential data pipeline steps with execution tracking" },
  { path: "/pools", name: "Pools", desc: "Concurrent fan-out pools with member status and strategy" },
  { path: "/cost", name: "Cost", desc: "Budget tracking with progress bars and per-agent spend breakdown" },
  { path: "/audit", name: "Audit Log", desc: "Searchable, filterable log of every system event" },
  { path: "/trust", name: "AXIS Trust", desc: "Trust verification status for all registered agents" },
  { path: "/broker", name: "Broker", desc: "Routing stats, skill calls, WASM/LLM breakdown, and cost savings" },
];

function DashboardSection() {
  return (
    <section id="dashboard" className="py-24 bg-nexus-surface/30 border-y border-border">
      <div className="container">
        <AnimatedSection>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs text-nexus-indigo uppercase tracking-widest">Dashboard</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">
              Real-time monitoring at localhost:4200
            </h2>
            <p className="text-muted-foreground text-lg">
              A built-in web dashboard served by the naos binary itself — no separate install needed.
              Server-rendered HTML with auto-refresh, terminal-aesthetic styling, and 5 JSON API endpoints.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <div className="rounded-lg overflow-hidden glow-indigo border border-border max-w-5xl mx-auto mb-16">
            <img
              src={DASHBOARD_IMG}
              alt="Nexus OS Dashboard — Agent monitoring, cost tracking, supervisor tree, audit trail"
              className="w-full h-auto"
            />
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.25}>
          <div className="grid lg:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
            {/* Left: Page list */}
            <div>
              <h3 className="font-mono text-sm text-nexus-indigo uppercase tracking-widest mb-6">9 Pages</h3>
              <div className="space-y-3">
                {DASHBOARD_PAGES.map((page) => (
                  <div key={page.path} className="flex items-start gap-3 group">
                    <code className="font-mono text-xs text-nexus-green shrink-0 w-24 pt-0.5">{page.path}</code>
                    <div className="min-w-0">
                      <span className="font-mono text-sm text-foreground font-medium">{page.name}</span>
                      <p className="text-muted-foreground text-xs leading-relaxed mt-0.5">{page.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Terminal preview */}
            <div className="terminal-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-nexus-deep">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
                <span className="ml-2 font-mono text-xs text-muted-foreground">naos dashboard</span>
              </div>
              <div className="p-5 font-mono text-sm leading-loose bg-nexus-deep/80">
                <div><span className="text-nexus-amber">$</span> naos dashboard --open</div>
                <div className="mt-2 text-nexus-green">  ⬡ Dashboard running at http://127.0.0.1:4200</div>
                <div className="mt-1 text-muted-foreground">  Pages:</div>
                <div className="text-muted-foreground">    /            Overview</div>
                <div className="text-muted-foreground">    /agents      Agent list and status</div>
                <div className="text-muted-foreground">    /supervisors Supervisor trees</div>
                <div className="text-muted-foreground">    /sagas       Saga definitions</div>
                <div className="text-muted-foreground">    /workflows   Workflow pipelines</div>
                <div className="text-muted-foreground">    /pools       Pool status</div>
                <div className="text-muted-foreground">    /cost        Budget tracking</div>
                <div className="text-muted-foreground">    /audit       Audit log</div>
                <div className="text-muted-foreground">    /trust       AXIS Trust status</div>
                <div className="text-muted-foreground">    /broker      Broker routing stats</div>
                <div className="mt-2 text-muted-foreground">  Press Ctrl+C to stop</div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.35}>
          <div className="max-w-5xl mx-auto mt-12">
            <h3 className="font-mono text-sm text-nexus-indigo uppercase tracking-widest mb-6 text-center">JSON API Endpoints</h3>
            <div className="grid sm:grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { endpoint: "/api/agents", label: "Agents" },
                { endpoint: "/api/supervisors", label: "Supervisors" },
                { endpoint: "/api/cost", label: "Cost" },
                { endpoint: "/api/audit", label: "Audit" },
                { endpoint: "/api/trust", label: "Trust" },
                { endpoint: "/api/broker", label: "Broker" },
              ].map((api) => (
                <div key={api.endpoint} className="terminal-border rounded-md px-3 py-2.5 text-center">
                  <code className="font-mono text-xs text-nexus-green">{api.endpoint}</code>
                  <div className="text-muted-foreground text-xs mt-1">{api.label}</div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

// ---- Broker Routing Section ----
function BrokerSection() {
  const routeSteps = [
    { label: "SKILL", color: "text-nexus-green", desc: "Pattern-matched deterministic functions", cost: "~$0.00", latency: "~5ms" },
    { label: "WASM", color: "text-nexus-cyan", desc: "Sandboxed WebAssembly modules", cost: "~$0.00", latency: "~10ms" },
    { label: "LLM", color: "text-nexus-amber", desc: "Language model API (last resort)", cost: "~$0.01", latency: "~1s" },
  ];

  return (
    <section id="broker" className="py-24 relative">
      <div className="absolute inset-0 dot-grid opacity-10" />
      <div className="container relative">
        <AnimatedSection>
          <div className="max-w-2xl mb-16">
            <span className="font-mono text-xs text-nexus-indigo uppercase tracking-widest">Broker Routing</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">
              Route tasks to the cheapest capable handler
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              The broker evaluates every task against registered skills, WASM modules, and LLM providers.
              It picks the fastest, cheapest handler that meets the confidence threshold — saving up to 90% on token costs.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: Routing cascade */}
            <div>
              <h3 className="font-mono text-sm text-nexus-indigo uppercase tracking-widest mb-6">Routing Cascade</h3>
              <div className="space-y-4">
                {routeSteps.map((step, i) => (
                  <div key={step.label} className="terminal-border rounded-lg p-4 flex items-start gap-4">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`font-mono font-bold text-sm ${step.color}`}>{step.label}</div>
                      {i < routeSteps.length - 1 && (
                        <div className="w-px h-6 bg-border mt-2" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-foreground">{step.desc}</div>
                      <div className="flex gap-4 mt-1.5">
                        <span className="font-mono text-xs text-muted-foreground">Cost: <span className={step.color}>{step.cost}</span></span>
                        <span className="font-mono text-xs text-muted-foreground">Latency: <span className={step.color}>{step.latency}</span></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 terminal-border rounded-lg p-4">
                <div className="font-mono text-xs text-muted-foreground mb-2">Confidence Thresholds</div>
                <div className="flex gap-6">
                  <div>
                    <span className="font-mono text-sm text-nexus-green">90%</span>
                    <span className="text-muted-foreground text-xs ml-2">Skill match</span>
                  </div>
                  <div>
                    <span className="font-mono text-sm text-nexus-cyan">80%</span>
                    <span className="text-muted-foreground text-xs ml-2">WASM match</span>
                  </div>
                  <div>
                    <span className="font-mono text-sm text-nexus-amber">70%</span>
                    <span className="text-muted-foreground text-xs ml-2">LLM fallback</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Terminal demo */}
            <div className="space-y-4">
              <div className="terminal-border rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-nexus-deep">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="ml-2 font-mono text-xs text-muted-foreground">naos broker</span>
                </div>
                <div className="p-5 font-mono text-sm leading-loose bg-nexus-deep/80">
                  <div><span className="text-nexus-amber">$</span> naos broker route "summarize the quarterly report"</div>
                  <div className="mt-2 text-muted-foreground">  Routing decision:</div>
                  <div className="text-muted-foreground">  Route:      <span className="text-nexus-green">SKILL (summarize)</span></div>
                  <div className="text-muted-foreground">  Confidence:  <span className="text-nexus-green">93%</span></div>
                  <div className="text-muted-foreground">  Est. cost:  <span className="text-nexus-green">$0.00</span></div>
                  <div className="text-muted-foreground">  Est. latency: <span className="text-nexus-green">~5ms</span></div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div><span className="text-nexus-amber">$</span> naos broker route "write me a poem about cats"</div>
                    <div className="mt-2 text-muted-foreground">  Routing decision:</div>
                    <div className="text-muted-foreground">  Route:      <span className="text-nexus-amber">LLM (anthropic/claude-sonnet)</span></div>
                    <div className="text-muted-foreground">  Confidence:  <span className="text-nexus-amber">70%</span></div>
                    <div className="text-muted-foreground">  Est. cost:  <span className="text-nexus-amber">$0.01</span></div>
                    <div className="text-muted-foreground">  Est. latency: <span className="text-nexus-amber">~1000ms</span></div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div><span className="text-nexus-amber">$</span> naos broker stats</div>
                    <div className="mt-2 text-muted-foreground">  SKILL  7 calls   $0.00   ~4ms</div>
                    <div className="text-muted-foreground">  WASM   0 calls   $0.00   -</div>
                    <div className="text-muted-foreground">  LLM    8 calls   $0.08   ~1,100ms</div>
                    <div className="text-muted-foreground mt-1">  Savings: <span className="text-nexus-green">$0.07 (46%)</span></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { cmd: "broker route", desc: "Dry-run routing" },
                  { cmd: "broker execute", desc: "Route & run" },
                  { cmd: "broker stats", desc: "Cost savings" },
                  { cmd: "broker config", desc: "View config" },
                  { cmd: "broker skills", desc: "List skills" },
                ].map((item) => (
                  <div key={item.cmd} className="terminal-border rounded-md px-3 py-2.5">
                    <code className="font-mono text-xs text-nexus-green block">{item.cmd}</code>
                    <div className="text-muted-foreground text-xs mt-1">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

// ---- Config Example ----
function ConfigSection() {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 dot-grid opacity-10" />
      <div className="container relative">
        <AnimatedSection>
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <span className="font-mono text-xs text-nexus-indigo uppercase tracking-widest">Configuration</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-6">
                Declarative YAML, zero boilerplate
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                Define your entire agent system in a single <code className="font-mono text-nexus-indigo bg-nexus-indigo/10 px-1.5 py-0.5 rounded text-sm">nexus.config.yaml</code>.
                Agents, supervisors, cost budgets, broker routing, skills, and deployment targets — all in one place.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                The config file supports agent templates (research, coding, data, custom),
                supervisor strategies with restart windows, per-agent cost budgets with
                automatic throttling, broker routing with skill/WASM/LLM cascade, and edge deployment targets.
              </p>
            </div>

            <div className="terminal-border rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-nexus-deep">
                <span className="font-mono text-xs text-muted-foreground">nexus.config.yaml</span>
              </div>
              <pre className="p-5 font-mono text-sm leading-relaxed overflow-x-auto bg-nexus-deep/80">
                <code>{`project: my-agents
version: "1.0"

agents:
  researcher:
    template: research
    model: claude-sonnet
    capabilities:
      - resource: "web.*"
        actions: [read]
      - resource: "fs.output"
        actions: [write]

supervisor:
  strategy: one-for-one
  max_restarts: 5
  window: 300s

cost:
  researcher:
    budget: $10/day
    alert_at: 80%
    action: throttle

broker:
  routing:
    preferSkill: true
    llmAsLastResort: true
  thresholds:
    skill: 0.9
    wasm: 0.8

skills:
  - name: summarize
    patterns: [summarize, summary, tldr]
    handler: "fn:summarize_text"
    cost: "$0.0001"`}</code>
              </pre>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

// ---- Pricing / Open Source Section ----
function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-nexus-surface/30 border-y border-border">
      <div className="container">
        <AnimatedSection>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="font-mono text-xs text-nexus-indigo uppercase tracking-widest">Pricing</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-4">
              Open source. Free forever.
            </h2>
            <p className="text-muted-foreground text-lg">
              Nexus OS is MIT licensed. The CLI, dashboard, and all orchestration primitives
              are free. You only pay for the LLM tokens your agents consume.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: "Core CLI",
                price: "Free",
                items: ["Agent lifecycle management", "Supervisor strategies", "Sagas & workflows", "Cost tracking", "Audit trail", "Dashboard"],
              },
              {
                title: "WASM Marketplace",
                price: "Free",
                items: ["Install community skills", "Publish your own skills", "Version management", "Deterministic execution", "Near-zero cost per call"],
                highlight: true,
              },
              {
                title: "Edge Deployment",
                price: "Pay-as-you-go",
                items: ["Cloudflare Workers", "Sub-50ms latency", "Offline-first sync", "Auto-scaling", "Your Cloudflare account"],
              },
            ].map((plan) => (
              <div
                key={plan.title}
                className={`terminal-border rounded-lg p-6 ${
                  plan.highlight ? "border-nexus-indigo/40 glow-indigo" : ""
                }`}
              >
                <h3 className="font-mono font-semibold text-lg mb-1">{plan.title}</h3>
                <div className="font-mono text-2xl font-bold text-nexus-indigo mb-4">{plan.price}</div>
                <ul className="space-y-2">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="text-nexus-green text-xs">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

// ---- Get Started Section ----
function GetStarted() {
  return (
    <section id="get-started" className="py-24 relative">
      <div className="absolute inset-0 dot-grid opacity-10" />
      <div className="container relative">
        <AnimatedSection>
          <div className="max-w-3xl mx-auto text-center">
            <span className="font-mono text-xs text-nexus-indigo uppercase tracking-widest">Get Started</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-6">
              From zero to running agents in 5 minutes
            </h2>
            <p className="text-muted-foreground text-lg mb-10">
              Install the CLI, initialize a project, create your first agent, and watch it run.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <div className="max-w-2xl mx-auto terminal-border rounded-lg overflow-hidden glow-indigo">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-nexus-deep">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-2 font-mono text-xs text-muted-foreground">quickstart</span>
            </div>
            <div className="p-5 font-mono text-sm leading-loose bg-nexus-deep/80">
              <div className="text-muted-foreground"># Install</div>
              <div><span className="text-nexus-amber">$</span> cargo install naos</div>
              <div className="mt-3 text-muted-foreground"># Initialize a project</div>
              <div><span className="text-nexus-amber">$</span> naos init my-agents</div>
              <div><span className="text-nexus-amber">$</span> cd my-agents</div>
              <div className="mt-3 text-muted-foreground"># Create your first agent</div>
              <div><span className="text-nexus-amber">$</span> naos create researcher --template research</div>
              <div className="mt-3 text-muted-foreground"># Run it</div>
              <div><span className="text-nexus-amber">$</span> naos run researcher</div>
              <div className="mt-3 text-muted-foreground"># Check status</div>
              <div><span className="text-nexus-amber">$</span> naos status</div>
              <div className="mt-3 text-muted-foreground"># Launch dashboard</div>
              <div><span className="text-nexus-amber">$</span> naos dashboard</div>
              <div className="text-nexus-green mt-1">  Dashboard: http://localhost:4200</div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

// ---- Footer ----
function Footer() {
  return (
    <footer className="py-12 border-t border-border bg-nexus-deep">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-md bg-nexus-indigo/20 flex items-center justify-center border border-nexus-indigo/30">
                <Network size={14} className="text-nexus-indigo" />
              </div>
              <span className="font-mono font-bold tracking-tight">nexus<span className="text-nexus-indigo">.</span>os</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
              The orchestration layer for AI agents. Open source, MIT licensed.
              Built with Rust for reliability and performance.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">GitHub</a></li>
              <li><a href="#get-started" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
              <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">Project</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#architecture" className="text-muted-foreground hover:text-foreground transition-colors">Architecture</a></li>
              <li><a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
              <li><a href="#cli" className="text-muted-foreground hover:text-foreground transition-colors">CLI Reference</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-mono text-xs text-muted-foreground">
            aiagents.nexus — MIT License
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            Built with Rust, Axum, SQLite, WASM
          </span>
        </div>
      </div>
    </footer>
  );
}

// ---- Main Page ----
export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <Hero />
      <StatsBar />
      <Features />
      <Architecture />
      <CliSection />
      <DashboardSection />
      <BrokerSection />
      <ConfigSection />
      <PricingSection />
      <GetStarted />
      <Footer />
    </div>
  );
}
