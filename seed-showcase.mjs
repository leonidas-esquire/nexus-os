/**
 * Seed script — Showcase Projects
 * Inserts 6 sample projects (3 featured, 3 approved) into showcase_projects.
 * Run: node seed-showcase.mjs
 */
import "dotenv/config";
import mysql from "mysql2/promise";
import { randomUUID } from "crypto";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030909471/NRmiWdZq2JgxyAQQ5B7Zs7";

const projects = [
  {
    id: randomUUID(),
    slug: "agent-analytics-pro",
    title: "Agent Analytics Pro",
    tagline: "Real-time observability dashboard for Nexus OS agent fleets with cost tracking and anomaly detection.",
    description: `## Overview\n\nAgent Analytics Pro provides a comprehensive observability layer on top of Nexus OS. Monitor every agent in your fleet with sub-second latency metrics, token-cost breakdowns, and intelligent anomaly alerts.\n\n## Key Features\n\n- **Real-time metrics** — CPU, memory, token usage per agent\n- **Cost attribution** — Track spend per agent, per task, per model\n- **Anomaly detection** — ML-powered alerts when agents deviate from baseline\n- **Fleet comparison** — Side-by-side performance of agent variants\n\n## Architecture\n\nBuilt on Nexus OS Supervisor trees with a custom telemetry sink that streams to ClickHouse. The dashboard is a React + D3 app served from the edge via Nexus Edge Deploy.\n\n\`\`\`yaml\nagents:\n  - name: metrics-collector\n    template: telemetry\n    config:\n      sink: clickhouse\n      interval: 1s\n\`\`\``,
    screenshotUrl: `${CDN}/showcase-seed-1_964c294b.png`,
    screenshots: JSON.stringify([`${CDN}/showcase-seed-4_baabcc47.png`]),
    demoUrl: "https://analytics-demo.nexus-os.dev",
    repoUrl: "https://github.com/nexus-community/agent-analytics-pro",
    websiteUrl: "https://analytics.nexus-os.dev",
    videoUrl: "",
    authorName: "Marcus Chen",
    authorHandle: "@marcuschen",
    authorEmail: "marcus@nexus-os.dev",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus",
    authorTwitter: "marcuschendev",
    authorGithub: "marcuschen",
    featuresUsed: JSON.stringify(["Supervisor", "Cost Controller", "Edge Deploy"]),
    category: "ai-agents",
    status: "featured",
    featured: true,
    featuredOrder: 1,
    githubStars: 1247,
    upvotes: 342,
    views: 8921,
  },
  {
    id: randomUUID(),
    slug: "nexus-chat-assistant",
    title: "Nexus Chat Assistant",
    tagline: "Multi-model conversational AI with WASM-sandboxed tool execution and streaming responses.",
    description: `## Overview\n\nA production-ready chat assistant that leverages Nexus OS agent orchestration to route conversations across multiple LLM providers. Each tool call runs in a WASM sandbox for security.\n\n## Features\n\n- **Multi-model routing** — GPT-4, Claude, Gemini with automatic fallback\n- **Tool execution** — Sandboxed WASM runtime for safe code execution\n- **Streaming** — Real-time token streaming with backpressure\n- **Memory** — Persistent conversation context via Nexus Saga\n\n## Getting Started\n\n\`\`\`bash\nnaos create my-chatbot --template chat-assistant\nnaos deploy --edge\n\`\`\``,
    screenshotUrl: `${CDN}/showcase-seed-2_f31f4977.jpg`,
    screenshots: JSON.stringify([`${CDN}/showcase-seed-5_f8c8c147.png`]),
    demoUrl: "https://chat-demo.nexus-os.dev",
    repoUrl: "https://github.com/nexus-community/nexus-chat-assistant",
    websiteUrl: "",
    videoUrl: "https://youtube.com/watch?v=example123",
    authorName: "Sophia Ramirez",
    authorHandle: "@sophiar",
    authorEmail: "sophia@nexus-os.dev",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia",
    authorTwitter: "sophiaramirez_ai",
    authorGithub: "sophiar",
    featuresUsed: JSON.stringify(["WASM Sandbox", "Saga", "Broker", "Edge Deploy"]),
    category: "ai-agents",
    status: "featured",
    featured: true,
    featuredOrder: 2,
    githubStars: 893,
    upvotes: 276,
    views: 6543,
  },
  {
    id: randomUUID(),
    slug: "pipeline-orchestrator",
    title: "Pipeline Orchestrator",
    tagline: "Visual workflow builder for CI/CD pipelines powered by Nexus OS agent pools and fault-tolerant sagas.",
    description: `## Overview\n\nPipeline Orchestrator brings drag-and-drop workflow building to Nexus OS. Define complex CI/CD pipelines visually, then execute them with Erlang-style fault tolerance.\n\n## Features\n\n- **Visual builder** — Drag-and-drop pipeline editor\n- **Fault tolerance** — Automatic retry with exponential backoff\n- **Agent pools** — Distribute work across agent pools\n- **Notifications** — Slack, Discord, and webhook integrations\n\n## Why Nexus OS?\n\nTraditional CI/CD tools fail silently. Nexus OS Supervisor trees ensure every pipeline step is monitored and automatically restarted on failure.`,
    screenshotUrl: `${CDN}/showcase-seed-3_e87f67de.png`,
    screenshots: JSON.stringify([`${CDN}/showcase-seed-6_97bad82b.png`]),
    demoUrl: "",
    repoUrl: "https://github.com/nexus-community/pipeline-orchestrator",
    websiteUrl: "https://pipelines.nexus-os.dev",
    videoUrl: "",
    authorName: "Alex Kim",
    authorHandle: "@alexkim",
    authorEmail: "alex@nexus-os.dev",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    authorTwitter: "alexkimdev",
    authorGithub: "alexkim",
    featuresUsed: JSON.stringify(["Supervisor", "Pool", "Saga", "Workflow"]),
    category: "devops",
    status: "featured",
    featured: true,
    featuredOrder: 3,
    githubStars: 567,
    upvotes: 198,
    views: 4312,
  },
  {
    id: randomUUID(),
    slug: "research-swarm",
    title: "Research Swarm",
    tagline: "Distributed research agent swarm that crawls, summarizes, and synthesizes academic papers at scale.",
    description: `## Overview\n\nResearch Swarm deploys a fleet of specialized agents to crawl academic databases, extract key findings, and produce structured literature reviews.\n\n## How It Works\n\n1. **Crawler agents** — Fetch papers from arXiv, Semantic Scholar, PubMed\n2. **Extractor agents** — Parse PDFs and extract structured data\n3. **Synthesizer agent** — Combine findings into coherent summaries\n4. **Quality agent** — Fact-check citations and flag inconsistencies\n\nAll agents communicate through the Nexus Broker message bus with automatic load balancing.`,
    screenshotUrl: `${CDN}/showcase-seed-4_baabcc47.png`,
    screenshots: null,
    demoUrl: "",
    repoUrl: "https://github.com/nexus-community/research-swarm",
    websiteUrl: "",
    videoUrl: "",
    authorName: "Dr. Elena Vasquez",
    authorHandle: "@elenavasquez",
    authorEmail: "elena@university.edu",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena",
    authorTwitter: "elenavasquez_ai",
    authorGithub: "elenavasquez",
    featuresUsed: JSON.stringify(["Pool", "Broker", "Cost Controller"]),
    category: "research",
    status: "approved",
    featured: false,
    featuredOrder: 0,
    githubStars: 234,
    upvotes: 156,
    views: 3210,
  },
  {
    id: randomUUID(),
    slug: "trade-sentinel",
    title: "Trade Sentinel",
    tagline: "Autonomous trading agent with risk management, position sizing, and real-time market data processing.",
    description: `## Overview\n\nTrade Sentinel is an autonomous trading system built on Nexus OS that monitors markets, executes trades, and manages risk in real-time.\n\n## Features\n\n- **Multi-exchange** — Binance, Coinbase, Kraken support\n- **Risk management** — Position sizing, stop-loss, portfolio limits\n- **Backtesting** — Historical simulation with realistic slippage\n- **Alerts** — Real-time notifications via Telegram and Discord\n\n## Safety\n\nAll trading logic runs in WASM sandboxes with strict resource limits. The AXIS Trust layer ensures agents cannot exceed configured risk parameters.`,
    screenshotUrl: `${CDN}/showcase-seed-5_f8c8c147.png`,
    screenshots: null,
    demoUrl: "",
    repoUrl: "https://github.com/nexus-community/trade-sentinel",
    websiteUrl: "https://tradesentinel.io",
    videoUrl: "",
    authorName: "Jordan Park",
    authorHandle: "@jordanpark",
    authorEmail: "jordan@tradesentinel.io",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan",
    authorTwitter: "jordanpark_trade",
    authorGithub: "jordanpark",
    featuresUsed: JSON.stringify(["WASM Sandbox", "AXIS Trust", "Broker", "Cost Controller"]),
    category: "trading",
    status: "approved",
    featured: false,
    featuredOrder: 0,
    githubStars: 412,
    upvotes: 189,
    views: 5678,
  },
  {
    id: randomUUID(),
    slug: "infra-autopilot",
    title: "Infra Autopilot",
    tagline: "Self-healing infrastructure agent that monitors, diagnoses, and remediates cloud incidents automatically.",
    description: `## Overview\n\nInfra Autopilot uses Nexus OS to deploy a fleet of monitoring agents across your cloud infrastructure. When issues are detected, remediation agents automatically apply fixes.\n\n## Architecture\n\n- **Monitor agents** — Watch CloudWatch, Datadog, Prometheus metrics\n- **Diagnosis agent** — Correlate alerts and identify root cause\n- **Remediation agents** — Execute runbooks (scale up, restart, failover)\n- **Supervisor** — Ensures all agents stay healthy\n\n## Results\n\n- 73% reduction in MTTR\n- 89% of incidents auto-remediated\n- Zero false positive escalations in 6 months`,
    screenshotUrl: `${CDN}/showcase-seed-6_97bad82b.png`,
    screenshots: null,
    demoUrl: "https://autopilot-demo.nexus-os.dev",
    repoUrl: "https://github.com/nexus-community/infra-autopilot",
    websiteUrl: "https://infra-autopilot.dev",
    videoUrl: "",
    authorName: "Priya Sharma",
    authorHandle: "@priyasharma",
    authorEmail: "priya@infra-autopilot.dev",
    authorAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
    authorTwitter: "priyasharma_ops",
    authorGithub: "priyasharma",
    featuresUsed: JSON.stringify(["Supervisor", "Pool", "Workflow", "Edge Deploy"]),
    category: "automation",
    status: "approved",
    featured: false,
    featuredOrder: 0,
    githubStars: 678,
    upvotes: 223,
    views: 4890,
  },
];

const cols = [
  "id","slug","title","tagline","description","screenshotUrl","screenshots",
  "demoUrl","repoUrl","websiteUrl","videoUrl",
  "authorName","authorHandle","authorEmail","authorAvatar","authorTwitter","authorGithub",
  "featuresUsed","showcase_category","showcase_status","featured","featuredOrder",
  "githubStars","upvotes","views",
];

for (const p of projects) {
  const placeholders = cols.map(() => "?").join(", ");
  const sql = `INSERT INTO showcase_projects (${cols.join(", ")}) VALUES (${placeholders})`;
  const values = cols.map((c) => {
    // Map DB column names back to JS property names
    const key = c === "showcase_category" ? "category" : c === "showcase_status" ? "status" : c;
    const v = p[key];
    if (v === null || v === undefined) return null;
    if (typeof v === "boolean") return v ? 1 : 0;
    return v;
  });

  try {
    await conn.execute(sql, values);
    console.log(`✓ Inserted: ${p.title}`);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      console.log(`⊘ Skipped (already exists): ${p.title}`);
    } else {
      console.error(`✗ Failed: ${p.title}`, err.message);
    }
  }
}

await conn.end();
console.log("\nDone — seeded showcase projects.");
