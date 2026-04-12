/**
 * Seed script for the redesigned blog (v2).
 * Run: node server/seed-blog-v2.mjs
 */

import "dotenv/config";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

const posts = [
  {
    slug: "introducing-nexus-os",
    title: "Introducing Nexus OS: The Orchestration Layer for AI Agents",
    excerpt:
      "Nexus OS is a new open-source framework for creating, supervising, and scaling AI agents. Built in Rust with WASM sandboxing and Erlang-style fault tolerance.",
    content: `## Why We Built Nexus OS

The AI agent ecosystem is exploding. Every week brings a new framework, a new wrapper, a new way to chain LLM calls together. But production agent systems need more than prompt chains — they need **orchestration**.

Nexus OS is our answer. It's a single binary, written in Rust, that gives you everything you need to run AI agents in production:

- **Erlang-style supervisors** that restart crashed agents automatically
- **WASM-sandboxed skill modules** for deterministic, near-zero-cost execution
- **Token-cost optimization** that routes tasks to the cheapest capable handler
- **A built-in dashboard** at \`localhost:4200\` for real-time monitoring

### The Three-Layer Architecture

Nexus OS organizes agent systems into three distinct layers:

1. **Execution Layer** — WASM sandboxes, containers, and edge runtimes
2. **Orchestration Layer** — Supervisors, sagas, workflows, and pools
3. **Intelligence Layer** — Broker routing, cost control, and model selection

Each layer is independent but composable. You can use just the supervisor system, or the full stack.

### Getting Started

\`\`\`bash
cargo install naos
naos init my-project
naos create researcher --template research
naos run researcher
\`\`\`

That's it. Five minutes from zero to a running agent with automatic supervision, cost tracking, and a web dashboard.

### What's Next

This is Phase 1. We're shipping the core CLI, supervisor strategies, the broker routing engine, and the dashboard. Phase 2 will bring the WASM skill marketplace, edge deployment to Cloudflare Workers, and CRDT-based state management.

We're building Nexus OS in the open. Star us on [GitHub](https://github.com/leonidas-esquire/nexus-os), try the CLI, and tell us what you think.`,
    author: "Leonidas Esquire Williamson",
    category: "announcement",
    tags: '["nexus-os","launch","open-source"]',
    readingTimeMinutes: 4,
    featuredImageUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310419663030909471/NRmiWdZq2JgxyAQQ5B7Zs7/nexus-hero-bg-KZaygkzLoQetYLpJYVsvWt.webp",
    featuredImageAlt: "Nexus OS hero background — circuit board pattern with blue glow",
    featured: true,
    published: true,
  },
  {
    slug: "understanding-supervisor-strategies",
    title: "Understanding Supervisor Strategies in Nexus OS",
    excerpt:
      "A deep dive into the three supervisor restart strategies — one-for-one, one-for-all, and rest-for-one — and when to use each.",
    content: `## What Is a Supervisor?

In Erlang/OTP, a supervisor is a process whose sole job is to monitor other processes and restart them when they fail. Nexus OS brings this battle-tested pattern to AI agents.

When an agent crashes — whether from an API timeout, a malformed response, or an out-of-budget error — the supervisor detects the failure and applies a **restart strategy**.

## The Three Strategies

### One-for-One

If one child agent crashes, only that agent is restarted. Other agents continue running undisturbed.

\`\`\`yaml
supervisor:
  strategy: one-for-one
  max_restarts: 5
  window: 300s
\`\`\`

**Use when:** Agents are independent. A researcher crashing shouldn't affect a data-bot.

### One-for-All

If any child agent crashes, **all** children are stopped and restarted together.

\`\`\`yaml
supervisor:
  strategy: one-for-all
  max_restarts: 3
  window: 600s
\`\`\`

**Use when:** Agents share state or depend on each other. If one fails, the shared state may be corrupted.

### Rest-for-One

If a child crashes, that child and all children **started after it** are restarted. Children started before it continue running.

\`\`\`yaml
supervisor:
  strategy: rest-for-one
  max_restarts: 5
  window: 300s
\`\`\`

**Use when:** Agents form a pipeline. If step 2 fails, steps 3 and 4 need to restart, but step 1 is fine.

## Restart Windows

The \`max_restarts\` and \`window\` settings prevent restart loops. If an agent crashes more than \`max_restarts\` times within the \`window\` period, the supervisor escalates — either shutting down or notifying the operator.

This is critical for production. Without restart limits, a buggy agent could consume your entire LLM budget in minutes.

## Practical Example

\`\`\`bash
naos deploy researcher --supervisor one-for-one --max-restarts 5
naos status
\`\`\`

The dashboard at \`localhost:4200/supervisors\` shows the full supervisor tree with restart counts and child states in real time.`,
    author: "Leonidas Esquire Williamson",
    category: "explainer",
    tags: '["supervisors","fault-tolerance","erlang"]',
    readingTimeMinutes: 6,
    featuredImageUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310419663030909471/NRmiWdZq2JgxyAQQ5B7Zs7/nexus-architecture-4DiwhY8q9MGbukEE9PinuU.webp",
    featuredImageAlt: "Nexus OS architecture diagram showing three layers",
    featured: false,
    published: true,
  },
  {
    slug: "building-your-first-agent-tutorial",
    title: "Tutorial: Building Your First AI Agent with Nexus OS",
    excerpt:
      "A step-by-step guide to creating, configuring, and deploying your first AI agent using the naos CLI.",
    content: `## Prerequisites

Before we begin, make sure you have:

- Rust toolchain installed (\`rustup\`)
- An API key for your preferred LLM provider
- 10 minutes of free time

## Step 1: Install the CLI

\`\`\`bash
cargo install naos
\`\`\`

Verify the installation:

\`\`\`bash
naos --version
# naos 0.1.0
\`\`\`

## Step 2: Initialize a Project

\`\`\`bash
naos init my-first-agents
cd my-first-agents
\`\`\`

This creates the project structure with a \`nexus.config.yaml\` file, an SQLite database, and an example agent.

## Step 3: Create an Agent

\`\`\`bash
naos create researcher --template research
\`\`\`

The \`research\` template comes pre-configured with web browsing capabilities and a summarization skill.

## Step 4: Configure Cost Controls

Open \`nexus.config.yaml\` and add a budget:

\`\`\`yaml
cost:
  researcher:
    budget: $5/day
    alert_at: 80%
    action: throttle
\`\`\`

This ensures your agent won't exceed $5/day in LLM token costs. At 80% usage, you'll get an alert. At 100%, the agent throttles to lower-cost models.

## Step 5: Run the Agent

\`\`\`bash
naos run researcher
\`\`\`

## Step 6: Monitor with the Dashboard

\`\`\`bash
naos dashboard --open
\`\`\`

Navigate to \`http://localhost:4200\` to see your agent's status, cost tracking, and audit trail in real time.

## What's Next?

- Add a supervisor: \`naos deploy researcher --supervisor one-for-one\`
- Install a WASM skill: \`naos marketplace install json-parser\`
- Deploy to the edge: \`naos edge deploy researcher\`

Check the [full documentation](/docs) for advanced configuration options.`,
    author: "Leonidas Esquire Williamson",
    category: "tutorial",
    tags: '["getting-started","cli","tutorial"]',
    readingTimeMinutes: 5,
    featuredImageUrl:
      "https://d2xsxph8kpxj0f.cloudfront.net/310419663030909471/NRmiWdZq2JgxyAQQ5B7Zs7/nexus-terminal-4Hd335zah89fxbMfUwEoUh.webp",
    featuredImageAlt: "Nexus OS terminal showing naos CLI commands",
    featured: false,
    published: true,
  },
  {
    slug: "the-case-for-wasm-in-ai-agents",
    title: "The Case for WASM in AI Agent Systems",
    excerpt:
      "Why WebAssembly sandboxes are the missing piece in AI agent architectures — deterministic execution, near-zero cost, and portable skills.",
    content: `## The Problem with LLM-Only Agents

Most AI agent frameworks route every task through an LLM. Need to parse JSON? LLM call. Need to format a date? LLM call. Need to count words? LLM call.

This is wasteful. These are **deterministic tasks** with known solutions. Sending them to an LLM costs money, adds latency, and introduces non-determinism where none is needed.

## Enter WASM Skills

Nexus OS introduces WASM skill modules — small, sandboxed programs that handle deterministic tasks at near-zero cost.

| Handler | Cost per call | Latency | Deterministic |
|---------|--------------|---------|---------------|
| Skill (pattern match) | ~$0.00 | ~5ms | Yes |
| WASM module | ~$0.00 | ~10ms | Yes |
| LLM (Claude Sonnet) | ~$0.01 | ~1000ms | No |

The broker routing engine evaluates every task against registered skills first. Only when no skill matches with sufficient confidence does it fall back to the LLM.

## How It Works

1. You define a skill with patterns and a handler function
2. The broker matches incoming tasks against skill patterns
3. If confidence exceeds the threshold (default 90%), the skill handles it
4. If not, the task cascades to WASM, then to the LLM

\`\`\`yaml
skills:
  - name: summarize
    patterns: [summarize, summary, tldr]
    handler: "fn:summarize_text"
    cost: "$0.0001"
\`\`\`

## The Marketplace

The WASM skill marketplace lets you install community-built skills:

\`\`\`bash
naos marketplace install json-parser@1.2
naos marketplace install date-formatter@2.0
naos marketplace install csv-analyzer@1.0
\`\`\`

Skills are versioned, portable, and composable. They run in sandboxed WASM environments with no access to the filesystem or network unless explicitly granted.

## Real-World Impact

In our benchmarks, a typical agent workload with WASM skills enabled saw **~90% reduction in token costs** compared to LLM-only execution. The broker routed 70% of tasks to skills or WASM modules, reserving the LLM for genuinely creative or ambiguous tasks.

This isn't just a cost optimization — it's an architecture decision. Deterministic tasks should run deterministically.`,
    author: "Leonidas Esquire Williamson",
    category: "opinion",
    tags: '["wasm","cost-optimization","architecture"]',
    readingTimeMinutes: 5,
    featuredImageUrl: null,
    featuredImageAlt: null,
    featured: false,
    published: true,
  },
];

const now = new Date().toISOString().slice(0, 19).replace("T", " ");

for (const post of posts) {
  await conn.execute(
    `INSERT INTO blog_posts_v2
      (slug, title, excerpt, content, author, category, tags,
       readingTimeMinutes, featuredImageUrl, featuredImageAlt,
       ogImageOverride, featured, published, publishedAt,
       scheduledPublishAt, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, NULL, ?, ?)`,
    [
      post.slug,
      post.title,
      post.excerpt,
      post.content,
      post.author,
      post.category,
      post.tags,
      post.readingTimeMinutes,
      post.featuredImageUrl,
      post.featuredImageAlt,
      post.featured,
      post.published,
      now,
      now,
      now,
    ]
  );
  console.log(`  ✓ Seeded: ${post.title}`);
}

console.log(`\nDone — ${posts.length} posts seeded.`);
await conn.end();
