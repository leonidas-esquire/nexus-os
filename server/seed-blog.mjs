/**
 * Blog seed script — populates the database with initial authors, tags, and posts.
 * Run: node server/seed-blog.mjs
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Inline table references (can't import TS from .mjs)
// We'll use raw SQL via the drizzle instance

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

// ─── Helpers ───────────────────────────────────────────────────
function id() { return randomUUID(); }
function slug(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 200);
}
function readingTime(text) {
  const words = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 250));
}
function wordCount(text) {
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
}

// ─── Author ────────────────────────────────────────────────────
const authorId = id();
const author = {
  id: authorId,
  name: 'Leonidas Esquire Williamson',
  slug: 'leonidas-esquire-williamson',
  email: 'leonidas@aiagents.nexus',
  bio: 'Creator of the LEONIDAS Prompt Framework and founder of aiagents.nexus. Building the orchestration layer for AI agents with Rust, WASM, and Erlang-style fault tolerance.',
  avatar: null,
  twitter: 'LeonidasEsquire',
  github: 'leonidas-esquire',
  linkedin: 'https://linkedin.com/in/leonidas-esquire-williamson',
  website: 'https://aiagents.nexus',
  authorRole: 'admin',
};

// ─── Tags ──────────────────────────────────────────────────────
const tags = [
  { id: id(), name: 'AI Agents', slug: 'ai-agents', description: 'Autonomous AI agent design, deployment, and management', color: '#6366f1' },
  { id: id(), name: 'Orchestration', slug: 'orchestration', description: 'Multi-agent coordination, supervisors, sagas, and workflows', color: '#8b5cf6' },
  { id: id(), name: 'Tutorials', slug: 'tutorials', description: 'Step-by-step guides and how-to articles', color: '#00ff88' },
  { id: id(), name: 'Rust', slug: 'rust', description: 'Rust programming language topics and patterns', color: '#f97316' },
  { id: id(), name: 'WASM', slug: 'wasm', description: 'WebAssembly sandboxing, skills, and edge compute', color: '#06b6d4' },
  { id: id(), name: 'Edge Computing', slug: 'edge-computing', description: 'Cloudflare Workers, Durable Objects, and global deployment', color: '#eab308' },
];

// ─── Posts ──────────────────────────────────────────────────────
const now = new Date();
const posts = [
  {
    id: id(),
    slug: 'introducing-nexus-os',
    title: 'Introducing Nexus OS: The Orchestration Layer for AI Agents',
    subtitle: 'One CLI to create, supervise, and scale AI agents',
    excerpt: 'Today we are open-sourcing Nexus OS — a Rust-based orchestration platform that brings Erlang-style fault tolerance, WASM sandboxing, and token-cost optimization to AI agent systems. Learn why we built it and how to get started in under five minutes.',
    content: `<h2>Why We Built Nexus OS</h2>
<p>The AI agent ecosystem is exploding. Every week brings new frameworks, new models, and new possibilities. But one critical piece has been missing: a production-grade orchestration layer that treats agents as first-class processes — with lifecycle management, fault tolerance, and cost control built in from day one.</p>
<p>That is exactly what Nexus OS provides. Built in Rust for reliability and performance, Nexus OS gives you a single CLI (<code>naos</code>) to create, supervise, and scale AI agents across local machines, cloud infrastructure, and Cloudflare's global edge network.</p>

<h2>Core Principles</h2>
<p>Nexus OS is built on three foundational principles that guide every design decision:</p>
<p><strong>Fault Tolerance First.</strong> Inspired by Erlang/OTP, every agent runs under a supervisor with configurable restart strategies. When an agent crashes — and they will crash — the supervisor automatically restarts it within a defined window. One-for-one, one-for-all, and rest-for-one strategies are supported out of the box.</p>
<p><strong>Cost Awareness.</strong> LLM API calls are expensive. Nexus OS includes a broker routing engine that evaluates every task against registered skills, WASM modules, and LLM providers. It picks the fastest, cheapest handler that meets the confidence threshold — saving up to 90% on token costs in real workloads.</p>
<p><strong>Security by Default.</strong> Agents run in WASM sandboxes with explicit capability grants. No agent can access the filesystem, network, or other agents without declared permissions in the configuration file.</p>

<h2>Architecture Overview</h2>
<p>Nexus OS organizes agent systems into three distinct layers:</p>
<p>The <strong>Execution Layer</strong> runs code in WASM sandboxes, containers, and edge runtimes. The <strong>Orchestration Layer</strong> manages supervisors, sagas, workflows, and agent pools. The <strong>Intelligence Layer</strong> handles broker routing, cost control, and model selection.</p>
<p>All three layers are compiled into a single binary. No microservices, no Docker dependencies, no complex deployment pipelines. Just <code>cargo install naos</code> and you are ready to go.</p>

<h2>Getting Started</h2>
<p>Getting started with Nexus OS takes less than five minutes:</p>
<pre><code>$ cargo install naos
$ naos init my-project
$ cd my-project
$ naos create researcher --template research
$ naos run researcher
$ naos dashboard</code></pre>
<p>The <code>naos init</code> command scaffolds a project with a <code>nexus.config.yaml</code> file, an example agent, and a SQLite database for local state. The <code>naos dashboard</code> command launches a built-in web dashboard at <code>localhost:4200</code> with real-time monitoring of all agents, supervisors, costs, and audit trails.</p>

<h2>What Comes Next</h2>
<p>This v0.1.0 release is Phase 1 of our roadmap. We are shipping the core CLI, supervisor strategies, the broker routing engine, and the web dashboard. Phase 2 will bring the WASM skill marketplace, edge deployment to Cloudflare Workers, and CRDT-based state management for distributed agent memory.</p>
<p>We are building Nexus OS in the open. The entire codebase is MIT licensed and available on GitHub. We welcome contributions, feedback, and bug reports.</p>`,
    coverImage: null,
    coverImageAlt: 'Nexus OS architecture diagram',
    authorId,
    status: 'published',
    publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    tagSlugs: ['ai-agents', 'orchestration', 'rust'],
  },
  {
    id: id(),
    slug: 'building-your-first-agent-with-nexus-os',
    title: 'Building Your First AI Agent with Nexus OS',
    subtitle: 'A step-by-step tutorial from zero to a running research agent',
    excerpt: 'This tutorial walks you through creating a research agent that can search the web, summarize findings, and write structured reports — all supervised by Nexus OS with automatic restart and cost tracking.',
    content: `<h2>Prerequisites</h2>
<p>Before we begin, make sure you have the following installed:</p>
<ul><li>Rust toolchain (1.75 or later) — install via <a href="https://rustup.rs">rustup.rs</a></li><li>An API key for at least one LLM provider (OpenAI, Anthropic, or Groq)</li><li>Nexus OS CLI — <code>cargo install naos</code></li></ul>

<h2>Step 1: Initialize Your Project</h2>
<p>Create a new Nexus OS project and navigate into it:</p>
<pre><code>$ naos init research-project
$ cd research-project</code></pre>
<p>This creates a project structure with a <code>nexus.config.yaml</code> file, an <code>agents/</code> directory, and a local SQLite database for state management.</p>

<h2>Step 2: Create the Research Agent</h2>
<p>Nexus OS ships with several built-in agent templates. The <code>research</code> template is perfect for our use case:</p>
<pre><code>$ naos create researcher --template research</code></pre>
<p>This generates an agent definition with web search capabilities, summarization skills, and a structured output format. The agent is automatically registered with the project supervisor.</p>

<h2>Step 3: Configure Capabilities</h2>
<p>Open <code>nexus.config.yaml</code> and review the agent configuration. The research template grants read access to web resources and write access to the output filesystem:</p>
<pre><code>agents:
  researcher:
    template: research
    model: claude-sonnet
    capabilities:
      - resource: "web.*"
        actions: [read]
      - resource: "fs.output"
        actions: [write]</code></pre>
<p>This capability model ensures the agent can only access what it needs — no more, no less. If you want the agent to also access a database, you would add a <code>db.*</code> resource grant.</p>

<h2>Step 4: Set a Cost Budget</h2>
<p>One of Nexus OS's most powerful features is per-agent cost budgeting. Add a budget section to your config:</p>
<pre><code>cost:
  researcher:
    budget: $5/day
    alert_at: 80%
    action: throttle</code></pre>
<p>When the agent reaches 80% of its daily budget, you will receive an alert. At 100%, the agent is automatically throttled to prevent runaway costs.</p>

<h2>Step 5: Run and Monitor</h2>
<p>Start the agent and open the dashboard:</p>
<pre><code>$ naos run researcher
$ naos dashboard --open</code></pre>
<p>The dashboard shows real-time status, cost tracking, and a full audit trail of every action the agent takes. You can also use <code>naos status</code> and <code>naos audit tail</code> from the terminal.</p>

<h2>Next Steps</h2>
<p>Now that you have a running agent, try these exercises:</p>
<ul><li>Add a second agent and configure a supervisor with <code>one-for-one</code> restart strategy</li><li>Install a WASM skill from the marketplace: <code>naos marketplace install json-parser</code></li><li>Deploy the agent to Cloudflare Edge: <code>naos edge deploy researcher</code></li></ul>
<p>In the next tutorial, we will build a multi-agent workflow using sagas for automatic compensation and rollback.</p>`,
    coverImage: null,
    coverImageAlt: 'Terminal showing naos CLI commands',
    authorId,
    status: 'published',
    publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    tagSlugs: ['tutorials', 'ai-agents', 'rust'],
  },
  {
    id: id(),
    slug: 'wasm-skills-the-secret-to-90-percent-cost-savings',
    title: 'WASM Skills: The Secret to 90% Cost Savings on AI Agent Tasks',
    subtitle: 'How deterministic WebAssembly modules eliminate unnecessary LLM calls',
    excerpt: 'Most AI agent tasks do not require an LLM. JSON parsing, data transformation, text formatting — these are deterministic operations that WASM modules handle at near-zero cost. Learn how the Nexus OS broker routes tasks to the cheapest capable handler.',
    content: `<h2>The Cost Problem</h2>
<p>Here is a dirty secret about AI agent systems: the vast majority of tasks they perform do not actually require a large language model. JSON parsing, regex extraction, date formatting, unit conversion, template rendering — these are all deterministic operations that a simple function can handle in microseconds for essentially zero cost.</p>
<p>Yet most agent frameworks route every single task through an LLM API, burning tokens and money on operations that could be handled by a five-line function. In our benchmarks, we found that <strong>up to 90% of typical agent tasks</strong> can be handled by deterministic handlers instead of LLM calls.</p>

<h2>Enter WASM Skills</h2>
<p>Nexus OS introduces the concept of <strong>WASM Skills</strong> — small, portable WebAssembly modules that handle specific deterministic tasks. Skills are:</p>
<ul><li><strong>Fast:</strong> Execute in microseconds, not seconds</li><li><strong>Cheap:</strong> Near-zero cost per invocation</li><li><strong>Safe:</strong> Run in a sandboxed WASM environment with no system access</li><li><strong>Portable:</strong> Work identically across local, cloud, and edge deployments</li><li><strong>Versioned:</strong> Semantic versioning with dependency management</li></ul>

<h2>The Broker Routing Cascade</h2>
<p>The Nexus OS broker evaluates every incoming task against a three-tier routing cascade:</p>
<p><strong>Tier 1: Skills.</strong> Pattern-matched deterministic functions. If a registered skill matches the task with 90%+ confidence, it handles the task immediately. Cost: ~$0.00. Latency: ~5ms.</p>
<p><strong>Tier 2: WASM Modules.</strong> More complex deterministic handlers compiled to WebAssembly. If a WASM module matches with 80%+ confidence, it takes over. Cost: ~$0.00. Latency: ~10ms.</p>
<p><strong>Tier 3: LLM.</strong> Only when no deterministic handler can solve the task does the broker fall back to an LLM API call. Cost: ~$0.01+. Latency: ~1000ms+.</p>

<h2>Installing Skills from the Marketplace</h2>
<p>The Nexus OS marketplace hosts community-contributed skills that you can install with a single command:</p>
<pre><code>$ naos marketplace install json-parser@1.2
$ naos marketplace install text-summarizer@2.0
$ naos marketplace install date-formatter@1.0</code></pre>
<p>Each skill declares its pattern matches, confidence thresholds, and expected input/output schemas. The broker automatically integrates installed skills into its routing cascade.</p>

<h2>Building Custom Skills</h2>
<p>You can also build and publish your own skills. A skill is simply a Rust function compiled to WASM with a manifest file:</p>
<pre><code>// skills/json-extractor/src/lib.rs
#[nexus_skill]
fn extract_json(input: &str) -> Result&lt;Value, SkillError&gt; {
    serde_json::from_str(input)
        .map_err(|e| SkillError::ParseFailed(e.to_string()))
}</code></pre>
<p>Compile it with <code>naos skill build</code>, test it with <code>naos skill test</code>, and publish it with <code>naos skill publish</code>. The entire workflow takes minutes, not hours.</p>

<h2>Real-World Impact</h2>
<p>In a production deployment processing 10,000 agent tasks per day, we measured the following cost breakdown:</p>
<ul><li>Skills handled: 4,200 tasks (42%) — Cost: $0.00</li><li>WASM handled: 3,100 tasks (31%) — Cost: $0.00</li><li>LLM handled: 2,700 tasks (27%) — Cost: $27.00</li></ul>
<p>Without the broker, all 10,000 tasks would have gone to the LLM at an estimated cost of $100/day. The broker saved <strong>$73/day (73%)</strong> while maintaining the same output quality for deterministic tasks.</p>`,
    coverImage: null,
    coverImageAlt: 'Broker routing cascade diagram',
    authorId,
    status: 'published',
    publishedAt: now,
    tagSlugs: ['wasm', 'ai-agents', 'edge-computing'],
  },
];

// ─── Execute Seed ──────────────────────────────────────────────
async function seed() {
  console.log('🌱 Seeding blog data...\n');

  // 1. Upsert author
  console.log(`  Author: ${author.name}`);
  await db.execute(sql`INSERT INTO blog_authors (id, name, slug, email, bio, avatar, twitter, github, linkedin, website, authorRole)
    VALUES (${author.id}, ${author.name}, ${author.slug}, ${author.email}, ${author.bio}, ${author.avatar}, ${author.twitter}, ${author.github}, ${author.linkedin}, ${author.website}, ${author.authorRole})
    ON DUPLICATE KEY UPDATE name=VALUES(name), bio=VALUES(bio), twitter=VALUES(twitter), github=VALUES(github)`);

  // 2. Upsert tags
  for (const tag of tags) {
    console.log(`  Tag: ${tag.name}`);
    await db.execute(sql`INSERT INTO blog_tags (id, name, slug, description, color, postCount)
      VALUES (${tag.id}, ${tag.name}, ${tag.slug}, ${tag.description}, ${tag.color}, 0)
      ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), color=VALUES(color)`);
  }

  // 3. Create posts
  for (const post of posts) {
    const rt = readingTime(post.content);
    const wc = wordCount(post.content);
    console.log(`  Post: ${post.title} (${wc} words, ${rt} min read)`);

    await db.execute(sql`INSERT INTO blog_posts (id, slug, title, subtitle, excerpt, content, contentJson, coverImage, coverImageAlt, ogImage, ogTitle, ogDescription, authorId, status, publishedAt, scheduledFor, readingTime, wordCount, canonicalUrl, metaRobots)
      VALUES (${post.id}, ${post.slug}, ${post.title}, ${post.subtitle}, ${post.excerpt}, ${post.content}, NULL, ${post.coverImage}, ${post.coverImageAlt}, NULL, NULL, NULL, ${post.authorId}, ${post.status}, ${post.publishedAt}, NULL, ${rt}, ${wc}, NULL, 'index,follow')
      ON DUPLICATE KEY UPDATE title=VALUES(title), content=VALUES(content), status=VALUES(status)`);

    // Link tags
    for (const tagSlug of post.tagSlugs) {
      const tag = tags.find(t => t.slug === tagSlug);
      if (tag) {
        await db.execute(sql`INSERT IGNORE INTO blog_post_tags (postId, tagId) VALUES (${post.id}, ${tag.id})`);
      }
    }
  }

  // 4. Update tag post counts
  for (const tag of tags) {
    await db.execute(sql`UPDATE blog_tags SET postCount = (SELECT COUNT(*) FROM blog_post_tags WHERE tagId = ${tag.id}) WHERE id = ${tag.id}`);
  }

  // 5. Set related posts (each post relates to the other two)
  for (let i = 0; i < posts.length; i++) {
    const others = posts.filter((_, j) => j !== i);
    for (let k = 0; k < others.length; k++) {
      await db.execute(sql`INSERT IGNORE INTO blog_related_posts (postId, relatedPostId, position) VALUES (${posts[i].id}, ${others[k].id}, ${k})`);

    }
  }

  console.log('\n✅ Blog seeded successfully!');
  console.log(`   1 author, ${tags.length} tags, ${posts.length} published posts`);
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
