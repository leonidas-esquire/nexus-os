import { ManualSection } from "./manualData";

export const MANUAL_SECTIONS_REMAINING: ManualSection[] = [
  // ─── WORKFLOWS ──────────────────────────────────────────
  {
    slug: "workflows",
    title: "Workflows",
    icon: "workflow",
    pages: [
      {
        slug: "what-is-a-workflow",
        title: "What is a Workflow?",
        content: `# What is a Workflow?

A workflow is a sequential data pipeline where each step's output feeds the next step's input. Unlike sagas, workflows don't have compensation actions — they're designed for data transformation, not transactions.

## Workflow vs. Saga

| Feature | Workflow | Saga |
|---------|----------|------|
| Purpose | Data pipeline | Transaction |
| Compensation | No | Yes |
| Data passing | Output → Input | Limited |
| On failure | Stop or skip | Rollback |

## How It Works

\`\`\`
Step 1: Fetch data     → output: raw_data
Step 2: Clean data     → input: raw_data, output: clean_data
Step 3: Analyze        → input: clean_data, output: analysis
Step 4: Generate report → input: analysis, output: report
\`\`\`

## Creating a Workflow

\`\`\`bash
naos workflow create data-pipeline
naos workflow add-step data-pipeline fetch-data
naos workflow add-step data-pipeline clean-data
naos workflow add-step data-pipeline analyze
naos workflow add-step data-pipeline report
\`\`\``,
      },
      {
        slug: "creating-workflows",
        title: "Creating Workflows",
        content: `# Creating Workflows

## Via CLI

\`\`\`bash
naos workflow create my-pipeline
\`\`\`

## Adding Steps

\`\`\`bash
naos workflow add-step my-pipeline step-1
naos workflow add-step my-pipeline step-2
naos workflow add-step my-pipeline step-3
\`\`\`

## Via Configuration

\`\`\`yaml
workflows:
  my-pipeline:
    steps:
      - name: step-1
        agent: agent-a
      - name: step-2
        agent: agent-b
      - name: step-3
        agent: agent-c
\`\`\`

## Verify

\`\`\`bash
naos workflow status my-pipeline

# Workflow: my-pipeline
# Steps: 3
# Status: ready
#
# Steps:
#   1. step-1  → step-2  → step-3
\`\`\``,
      },
      {
        slug: "data-passing",
        title: "Data Passing",
        content: `# Workflow Data Passing

The key feature of workflows is automatic data passing between steps.

## How Data Flows

\`\`\`
Step 1 output → Step 2 input → Step 3 input → ...
\`\`\`

Each step receives the previous step's output as its input. The first step receives the workflow's initial input.

## Example: Data Pipeline

\`\`\`
Step 1 (fetch):
  Input:  { url: "https://api.example.com/data" }
  Output: { records: [...1000 items...] }

Step 2 (clean):
  Input:  { records: [...1000 items...] }  ← from Step 1
  Output: { records: [...950 valid items...] }

Step 3 (analyze):
  Input:  { records: [...950 valid items...] }  ← from Step 2
  Output: { summary: "...", charts: [...] }
\`\`\`

## Running with Initial Input

\`\`\`bash
naos workflow run data-pipeline --input '{"url": "https://api.example.com/data"}'
\`\`\``,
      },
      {
        slug: "running-workflows",
        title: "Running Workflows",
        content: `# Running Workflows

## Execute a Workflow

\`\`\`bash
naos workflow run data-pipeline

# Output:
# ✓ Step 1: fetch-data    (2.1s)
# ✓ Step 2: clean-data    (0.8s)
# ✓ Step 3: analyze       (3.5s)
# ✓ Step 4: report        (1.2s)
# ✓ Workflow completed in 7.6s
\`\`\`

## Failed Execution

\`\`\`bash
naos workflow run data-pipeline

# Output:
# ✓ Step 1: fetch-data    (2.1s)
# ✓ Step 2: clean-data    (0.8s)
# ✗ Step 3: analyze       (failed: out of memory)
# ✗ Workflow failed at step 3
\`\`\`

## Resume from Failure

\`\`\`bash
naos workflow resume data-pipeline

# Resuming from step 3...
# ✓ Step 3: analyze       (3.5s)
# ✓ Step 4: report        (1.2s)
# ✓ Workflow completed
\`\`\``,
      },
      {
        slug: "error-handling",
        title: "Error Handling",
        content: `# Workflow Error Handling

## Strategies

| Strategy | Behavior |
|----------|----------|
| **stop** | Stop the workflow immediately (default) |
| **skip** | Skip the failed step, continue with next |
| **retry** | Retry the failed step N times |

## Configuration

\`\`\`yaml
workflows:
  data-pipeline:
    onError: stop
    retries: 3
    retryDelay: 5
    steps:
      - name: fetch-data
        agent: fetcher
        onError: retry
        retries: 5
      - name: clean-data
        agent: cleaner
\`\`\`

## Stop Strategy

\`\`\`
Step 1 ✓ → Step 2 ✗ → STOP
\`\`\`

## Skip Strategy

\`\`\`
Step 1 ✓ → Step 2 ✗ → Step 3 ✓ (receives Step 1's output)
\`\`\`

## Retry Strategy

\`\`\`
Step 1 ✓ → Step 2 ✗ → retry → Step 2 ✗ → retry → Step 2 ✓ → Step 3
\`\`\``,
      },
      {
        slug: "best-practices",
        title: "Best Practices",
        content: `# Workflow Best Practices

## 1. Keep Steps Focused

Each step should do one thing well. Don't combine fetch + clean + analyze in one step.

## 2. Validate Data Between Steps

Add validation steps to catch data quality issues early.

## 3. Use Retry for Flaky Steps

Network-dependent steps should use retry:

\`\`\`yaml
steps:
  - name: fetch-api
    onError: retry
    retries: 3
    retryDelay: 10
\`\`\`

## 4. Monitor Execution Times

\`\`\`bash
naos workflow status --all
\`\`\`

## 5. Combine with Cost Controls

Set budgets for workflow agents to prevent runaway costs during long pipelines.`,
      },
    ],
  },

  // ─── POOLS ──────────────────────────────────────────
  {
    slug: "pools",
    title: "Pools",
    icon: "layers",
    pages: [
      {
        slug: "what-is-a-pool",
        title: "What is a Pool?",
        content: `# What is a Pool?

A pool manages a group of identical agents that process tasks in parallel. Think of it as a thread pool for AI agents.

## How It Works

\`\`\`
Task Queue: [T1, T2, T3, T4, T5, T6, T7, T8]

Pool (size: 3):
  Agent 1: T1 → T4 → T7
  Agent 2: T2 → T5 → T8
  Agent 3: T3 → T6
\`\`\`

## Creating a Pool

\`\`\`bash
naos pool create workers --size 5 --agent researcher
\`\`\`

## Pool Properties

| Property | Description |
|----------|-------------|
| Name | Pool identifier |
| Size | Number of concurrent agents |
| Agent | Template agent to clone |
| Strategy | Task distribution method |
| Queue | Pending tasks |`,
      },
      {
        slug: "creating-pools",
        title: "Creating Pools",
        content: `# Creating Pools

## Via CLI

\`\`\`bash
naos pool create workers --size 5 --agent researcher
\`\`\`

## Via Configuration

\`\`\`yaml
pools:
  workers:
    agent: researcher
    size: 5
    strategy: round-robin
\`\`\`

## Pool Strategies

| Strategy | Description |
|----------|-------------|
| **round-robin** | Distribute tasks evenly across agents |
| **least-busy** | Send to the agent with fewest pending tasks |
| **random** | Random assignment |`,
      },
      {
        slug: "submitting-tasks",
        title: "Submitting Tasks",
        content: `# Submitting Tasks to Pools

## Single Task

\`\`\`bash
naos pool submit workers "Analyze document A"
\`\`\`

## Batch Tasks

\`\`\`bash
naos pool submit workers --batch tasks.txt
\`\`\`

## Task Distribution

With round-robin strategy and 3 agents:

\`\`\`
Submit: [T1, T2, T3, T4, T5, T6]

Agent 1: T1, T4
Agent 2: T2, T5
Agent 3: T3, T6
\`\`\``,
      },
      {
        slug: "scaling-pools",
        title: "Scaling Pools",
        content: `# Scaling Pools

## Manual Scaling

\`\`\`bash
naos pool scale workers --size 10
naos pool scale workers --size 3
\`\`\`

## Auto-Scaling

\`\`\`yaml
pools:
  workers:
    agent: researcher
    size: 3
    minSize: 1
    maxSize: 20
    autoScale:
      enabled: true
      scaleUpThreshold: 10
      scaleDownThreshold: 2
      cooldown: 60
\`\`\`

## Cost Considerations

More agents = more LLM calls = higher costs. Use cost budgets with pools:

\`\`\`yaml
cost:
  budgets:
    pool-workers:
      daily: 5000
\`\`\``,
      },
      {
        slug: "best-practices",
        title: "Best Practices",
        content: `# Pool Best Practices

## 1. Right-Size Your Pool

Start small and scale up based on actual workload.

## 2. Use Cost Budgets

Pools can consume resources quickly. Always set budgets.

## 3. Monitor Queue Depth

A growing queue means you need more agents. A consistently empty queue means you have too many.

## 4. Handle Failures

Combine pools with supervisors for automatic recovery.

## 5. Drain Before Shutdown

\`\`\`bash
naos pool drain workers
naos pool stop workers
\`\`\``,
      },
    ],
  },

  // ─── COST CONTROL ──────────────────────────────────────────
  {
    slug: "cost-control",
    title: "Cost Control",
    icon: "dollar-sign",
    pages: [
      {
        slug: "overview",
        title: "Cost Control Overview",
        content: `# Cost Control Overview

Nexus OS tracks every LLM call and enforces budgets to prevent cost overruns.

## Why Cost Control?

AI agents can be expensive:
- A single GPT-4 call costs ~$0.03-0.06
- An agent making 1000 calls/day = $30-60/day
- 10 agents = $300-600/day
- Without limits, a bug can cost thousands

## How It Works

\`\`\`
Agent makes LLM call
     ↓
Cost tracker records the cost
     ↓
Budget checker compares against limits
     ↓
├── Under budget → Allow
└── Over budget → Block + alert
\`\`\``,
      },
      {
        slug: "setting-budgets",
        title: "Setting Budgets",
        content: `# Setting Budgets

## Via CLI

\`\`\`bash
naos cost set-budget researcher --daily 1000
naos cost set-budget researcher --monthly 20000
\`\`\`

## Via Configuration

\`\`\`yaml
cost:
  budgets:
    researcher:
      daily: 1000
      monthly: 20000
    analyzer:
      daily: 500
    global:
      daily: 5000
      monthly: 100000
\`\`\`

## Budget Types

| Type | Scope | Reset |
|------|-------|-------|
| Daily | Per agent | Midnight UTC |
| Monthly | Per agent | 1st of month |
| Global daily | All agents | Midnight UTC |
| Global monthly | All agents | 1st of month |`,
      },
      {
        slug: "tracking-costs",
        title: "Tracking Costs",
        content: `# Tracking Costs

## Real-Time Status

\`\`\`bash
naos cost status

# Agent        Model           Calls   Cost
# researcher   claude-3-sonnet  45     $2.70
# researcher   claude-3-haiku   120    $0.36
# analyzer     gpt-4            12     $1.44
# TOTAL                         177    $4.50
\`\`\`

## Cost History

\`\`\`bash
naos cost history --days 7

# Date         Calls   Cost
# 2025-01-15   177     $4.50
# 2025-01-14   203     $5.12
# 7-day total  1,245   $31.45
\`\`\`

## Dashboard

\`\`\`bash
naos dashboard --port 4200
# Open http://127.0.0.1:4200/cost
\`\`\``,
      },
      {
        slug: "budget-enforcement",
        title: "Budget Enforcement",
        content: `# Budget Enforcement

When an agent exceeds its budget, Nexus OS takes action.

## Enforcement Modes

| Mode | Behavior |
|------|----------|
| **hard** | Block all calls immediately (default) |
| **soft** | Allow current call, block next |
| **warn** | Log warning but allow calls |

\`\`\`yaml
cost:
  enforcement: hard
  budgets:
    researcher:
      daily: 1000
\`\`\`

## Budget Reset

\`\`\`bash
naos cost reset researcher
naos cost reset --all
\`\`\`

## Alerts

\`\`\`yaml
cost:
  alerts:
    - threshold: 80
    - threshold: 95
\`\`\``,
      },
      {
        slug: "cost-models",
        title: "Cost Models",
        content: `# Cost Models

## Supported Models

| Provider | Model | Input (per 1K tokens) | Output (per 1K tokens) |
|----------|-------|-----------------------|------------------------|
| Anthropic | claude-3-opus | $0.015 | $0.075 |
| Anthropic | claude-3-sonnet | $0.003 | $0.015 |
| Anthropic | claude-3-haiku | $0.00025 | $0.00125 |
| OpenAI | gpt-4 | $0.03 | $0.06 |
| OpenAI | gpt-4-turbo | $0.01 | $0.03 |
| OpenAI | gpt-3.5-turbo | $0.0005 | $0.0015 |

## Custom Cost Models

\`\`\`yaml
cost:
  models:
    my-local-llama:
      inputCostPer1k: 0.001
      outputCostPer1k: 0.002
\`\`\`

## Cost Optimization Tips

1. Use cheaper models for simple tasks
2. Cache responses
3. Set per-agent model preferences
4. Use the broker for skill-based routing`,
      },
      {
        slug: "best-practices",
        title: "Best Practices",
        content: `# Cost Control Best Practices

## 1. Always Set Budgets

Never run agents without budgets in production.

## 2. Start Conservative

\`\`\`yaml
cost:
  budgets:
    researcher:
      daily: 500
\`\`\`

## 3. Use Global Budgets

\`\`\`yaml
cost:
  budgets:
    global:
      daily: 10000
\`\`\`

## 4. Monitor Daily

\`\`\`bash
naos cost status
naos cost history --days 7
\`\`\`

## 5. Use the Broker

The broker routes tasks to skills before LLMs, saving 40-60% on costs.

## 6. Set Alerts

\`\`\`yaml
cost:
  alerts:
    - threshold: 80
\`\`\``,
      },
    ],
  },

  // ─── TRUST & AXIS ──────────────────────────────────────────
  {
    slug: "trust-axis",
    title: "Trust & AXIS",
    icon: "shield",
    pages: [
      {
        slug: "overview",
        title: "Trust Overview",
        content: `# Trust & AXIS Overview

AXIS (Agent eXchange Identity & Security) is a trust verification protocol that scores agents on a T1-T5 scale.

## Why Trust?

Not all agents are equal. Some are well-tested, others are experimental. AXIS provides a standardized way to assess agent trustworthiness.

## Trust Tiers

| Tier | Score | Meaning |
|------|-------|---------|
| T1 | 90-100 | Production-grade, fully verified |
| T2 | 70-89 | Well-tested, minor gaps |
| T3 | 50-69 | Functional, needs more testing |
| T4 | 30-49 | Experimental, use with caution |
| T5 | 0-29 | Unverified, not recommended |

## How It Works

\`\`\`
naos axis verify researcher
     ↓
Check: Signature valid?
Check: Audit trail clean?
Check: Cost behavior normal?
Check: Capabilities declared?
Check: Test coverage adequate?
     ↓
Score: 82/100 → Tier T2
\`\`\``,
      },
      {
        slug: "verification",
        title: "Verification Process",
        content: `# AXIS Verification Process

## Running Verification

\`\`\`bash
naos axis verify researcher

# AXIS Verification: researcher
# ─────────────────────────────
# Signature:    ✓ Valid
# Audit Trail:  ✓ Clean (45 entries)
# Cost Behavior: ✓ Within norms
# Capabilities: ✓ Declared and minimal
# Test Coverage: △ 72% (recommend 80%+)
#
# Score: 82/100
# Tier:  T2
\`\`\`

## Verification Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Signature | 20% | WASM binary integrity |
| Audit Trail | 20% | Clean history, no anomalies |
| Cost Behavior | 20% | Spending within expected range |
| Capabilities | 20% | Minimal permissions declared |
| Test Coverage | 20% | Automated test coverage |

## Batch Verification

\`\`\`bash
naos axis verify --all

# researcher   T2 (82)
# analyzer     T1 (95)
# worker       T3 (55)
\`\`\``,
      },
      {
        slug: "trust-tiers",
        title: "Trust Tiers",
        content: `# Trust Tiers Explained

## T1: Production-Grade (90-100)

The gold standard. These agents are:
- Fully tested with 90%+ coverage
- Clean audit trail
- Minimal capabilities
- Verified signatures
- Cost-efficient

## T2: Well-Tested (70-89)

Ready for production with minor caveats:
- Good test coverage (70-89%)
- Clean audit trail
- Reasonable capabilities
- Verified signatures

## T3: Functional (50-69)

Works but needs improvement:
- Moderate test coverage
- Some audit gaps
- Broader capabilities than needed
- May have cost spikes

## T4: Experimental (30-49)

Use with caution:
- Low test coverage
- Incomplete audit trail
- Broad capabilities
- Unpredictable costs

## T5: Unverified (0-29)

Not recommended for production:
- Minimal or no testing
- No audit trail
- Unknown capabilities
- Unknown cost behavior

## Setting Minimum Trust

\`\`\`yaml
trust:
  minimumTier: T3
\`\`\`

Agents below the minimum tier cannot be started.`,
      },
      {
        slug: "trust-policies",
        title: "Trust Policies",
        content: `# Trust Policies

## Minimum Trust Tier

Set a minimum trust tier for your project:

\`\`\`yaml
trust:
  minimumTier: T3
\`\`\`

Agents below T3 cannot be started.

## Per-Context Policies

Different contexts can require different trust levels:

\`\`\`yaml
trust:
  policies:
    production:
      minimumTier: T1
    staging:
      minimumTier: T3
    development:
      minimumTier: T5
\`\`\`

## Trust Gates

Require trust verification before specific actions:

\`\`\`yaml
trust:
  gates:
    deploy: T1
    run: T3
    create: T5
\`\`\`

## Verification Frequency

\`\`\`yaml
trust:
  reverifyInterval: 24h
  cacheResults: true
\`\`\``,
      },
      {
        slug: "best-practices",
        title: "Best Practices",
        content: `# Trust Best Practices

## 1. Verify Before Deploy

Always run AXIS verification before deploying to production.

## 2. Set Minimum Tiers

Don't allow unverified agents in production:

\`\`\`yaml
trust:
  minimumTier: T2
\`\`\`

## 3. Regular Re-verification

Agent trust can change over time. Re-verify regularly:

\`\`\`bash
naos axis verify --all
\`\`\`

## 4. Track Trust Trends

Use the dashboard to monitor trust scores over time.

## 5. Improve Low Scores

Focus on the lowest-scoring criteria to improve trust tier.`,
      },
    ],
  },

  // ─── BROKER ROUTING ──────────────────────────────────────────
  {
    slug: "broker-routing",
    title: "Broker Routing",
    icon: "route",
    pages: [
      {
        slug: "overview",
        title: "Broker Overview",
        content: `# Broker Routing Overview

The broker routes tasks to the most cost-effective handler: skills first, then WASM, then LLM as a fallback.

## Routing Cascade

\`\`\`
Task received
     ↓
1. Skill match? → Execute skill (free)
     ↓ no
2. WASM match? → Execute WASM (cheap)
     ↓ no
3. LLM fallback → Call LLM (expensive)
\`\`\`

## Why a Broker?

Without a broker, every task goes to an LLM. With a broker:
- Simple tasks use free skills
- Medium tasks use cheap WASM
- Only complex tasks use expensive LLMs
- Result: 40-60% cost savings

## Quick Start

\`\`\`bash
naos broker skills
naos broker route "summarize this text"
naos broker execute "summarize this text"
naos broker stats
\`\`\``,
      },
      {
        slug: "routing-engine",
        title: "Routing Engine",
        content: `# Routing Engine

## How Matching Works

The broker uses pattern matching and confidence scoring:

\`\`\`
Task: "summarize the quarterly report"

Skill "summarize":
  Patterns: ["summarize", "summary", "tldr"]
  Match: "summarize" found → confidence 0.93
  Threshold: 0.90
  Result: MATCH ✓
\`\`\`

## Confidence Scoring

| Match Type | Confidence |
|------------|-----------|
| Exact match | 1.0 |
| Keyword match | 0.85-0.95 |
| Partial match | 0.50-0.84 |
| No match | 0.0 |

## Threshold Configuration

\`\`\`yaml
broker:
  confidenceThreshold: 0.90
  preferLocal: true
  fallbackModel: claude-3-haiku
\`\`\``,
      },
      {
        slug: "skills",
        title: "Skills",
        content: `# Broker Skills

Skills are pre-built handlers for common tasks that don't need an LLM.

## Defining Skills

\`\`\`yaml
skills:
  summarize:
    description: "Summarize text"
    handler: summarize.wasm
    patterns:
      - summarize
      - summary
      - tldr
  translate:
    description: "Translate text"
    handler: translate.wasm
    patterns:
      - translate
      - convert language
  classify:
    description: "Classify content"
    handler: classify.wasm
    patterns:
      - classify
      - categorize
      - label
\`\`\`

## Listing Skills

\`\`\`bash
naos broker skills

# SKILL        HANDLER           PATTERNS
# summarize    summarize.wasm    summarize, summary, tldr
# translate    translate.wasm    translate, convert language
# classify     classify.wasm     classify, categorize, label
\`\`\``,
      },
      {
        slug: "cost-savings",
        title: "Cost Savings",
        content: `# Broker Cost Savings

## How Savings Work

\`\`\`
Without broker:
  100 tasks × $0.06/task = $6.00

With broker:
  60 tasks → skills (free)     = $0.00
  10 tasks → WASM ($0.001)     = $0.01
  30 tasks → LLM ($0.06)       = $1.80
  Total                        = $1.81

Savings: $4.19 (70%)
\`\`\`

## Checking Savings

\`\`\`bash
naos broker stats

# Today's Stats:
#   Total tasks:    156
#   Skill handled:  72 (46%)
#   WASM handled:   15 (10%)
#   LLM fallback:   69 (44%)
#   Estimated savings: $12.45
\`\`\``,
      },
      {
        slug: "best-practices",
        title: "Best Practices",
        content: `# Broker Best Practices

## 1. Define Skills for Common Tasks

Identify your most frequent tasks and create skills for them.

## 2. Monitor Routing Stats

\`\`\`bash
naos broker stats
\`\`\`

## 3. Tune Confidence Threshold

Start at 0.90 and adjust based on accuracy:
- Too many false positives? Increase threshold
- Too many LLM fallbacks? Decrease threshold

## 4. Use Specific Patterns

\`\`\`yaml
# ✗ Too broad
patterns: ["data"]

# ✓ Specific
patterns: ["analyze data", "data analysis", "process dataset"]
\`\`\`

## 5. Combine with Cost Controls

The broker reduces costs, but still set budgets as a safety net.`,
      },
    ],
  },

  // ─── EDGE DEPLOYMENT ──────────────────────────────────────────
  {
    slug: "edge-deployment",
    title: "Edge Deployment",
    icon: "cloud",
    pages: [
      {
        slug: "overview",
        title: "Edge Overview",
        content: `# Edge Deployment Overview

Deploy agents to Cloudflare's global edge network for low-latency execution in 300+ locations.

## Architecture

\`\`\`
naos edge deploy researcher
     ↓
Compile agent → WASM
     ↓
Upload to Cloudflare Workers
     ↓
Agent runs at 300+ edge locations
     ↓
State persisted via Durable Objects
\`\`\`

## Benefits

| Feature | Local | Edge |
|---------|-------|------|
| Latency | Single location | <50ms globally |
| Availability | Single server | 99.99% SLA |
| Scaling | Manual | Automatic |
| State | SQLite | Durable Objects |

## Quick Start

\`\`\`bash
naos edge login
naos edge deploy researcher
naos edge status researcher
naos edge logs researcher
\`\`\``,
      },
      {
        slug: "setup",
        title: "Setup & Authentication",
        content: `# Edge Setup

## Prerequisites

- Cloudflare account
- Cloudflare API token with Workers permissions

## Login

\`\`\`bash
naos edge login

# Enter Cloudflare Account ID: xxxxxxxx
# Enter Cloudflare API Token: xxxxxxxx
# ✓ Credentials verified and stored
\`\`\`

## Configuration

\`\`\`yaml
edge:
  provider: cloudflare
  accountId: \${CF_ACCOUNT_ID}
  routes:
    - pattern: "api.example.com/agents/*"
      zone: example.com
  durableObjects: true
  regions:
    - us
    - eu
    - asia
\`\`\``,
      },
      {
        slug: "deploying",
        title: "Deploying Agents",
        content: `# Deploying Agents to Edge

## Deploy

\`\`\`bash
naos edge deploy researcher

# ✓ Compiling researcher → WASM
# ✓ Creating Durable Object namespace
# ✓ Uploading to Cloudflare Workers
# ✓ Configuring routes
# ✓ Deployed: researcher.workers.dev
\`\`\`

## Deploy All

\`\`\`bash
naos edge deploy --all
\`\`\`

## Verify

\`\`\`bash
naos edge status researcher

# Agent: researcher
# Status: ● active
# URL: researcher.workers.dev
# Regions: us, eu, asia
# Requests (24h): 1,234
# Errors (24h): 2
\`\`\``,
      },
      {
        slug: "monitoring",
        title: "Monitoring Edge",
        content: `# Monitoring Edge Deployments

## Status

\`\`\`bash
naos edge status researcher

# Agent: researcher
# Status: ● active
# URL: researcher.workers.dev
# Deployed: 2025-01-15 10:30:00
#
# Region Distribution:
#   us    ████████████████████ 45%
#   eu    ██████████████       30%
#   asia  ██████████           25%
\`\`\`

## Logs

\`\`\`bash
naos edge logs researcher

# [10:30:01] INFO  Request from us-east-1
# [10:30:02] INFO  Request from eu-west-1
# [10:30:03] WARN  Slow response (>500ms) from asia-east-1
\`\`\`

## List All

\`\`\`bash
naos edge list

# AGENT        STATUS    URL                        REQUESTS
# researcher   ● active  researcher.workers.dev     1,234
# analyzer     ● active  analyzer.workers.dev       567
\`\`\`

## Dashboard

\`\`\`bash
naos dashboard --port 4200
# Open http://127.0.0.1:4200/edge
\`\`\``,
      },
      {
        slug: "undeploying",
        title: "Undeploying",
        content: `# Undeploying from Edge

## Undeploy

\`\`\`bash
naos edge undeploy researcher

# ✓ Removing Cloudflare Worker
# ✓ Cleaning up Durable Objects
# ✓ Removing routes
# ✓ Agent undeployed
\`\`\`

## Undeploy All

\`\`\`bash
naos edge undeploy --all
\`\`\`

## Verify

\`\`\`bash
naos edge list

# No agents deployed
\`\`\``,
      },
      {
        slug: "best-practices",
        title: "Best Practices",
        content: `# Edge Deployment Best Practices

## 1. Test Locally First

Always test agents locally before deploying to edge.

## 2. Monitor Costs

Edge deployments have their own cost structure. Monitor via the dashboard.

## 3. Use Durable Objects for State

Enable Durable Objects for agents that need persistent state at the edge.

## 4. Set Up Routes

Configure routes to direct traffic to the right agents:

\`\`\`yaml
edge:
  routes:
    - pattern: "api.example.com/research/*"
      agent: researcher
    - pattern: "api.example.com/analyze/*"
      agent: analyzer
\`\`\`

## 5. Monitor Latency

Check regional latency in the dashboard to ensure good performance globally.`,
      },
    ],
  },

  // ─── DASHBOARD ──────────────────────────────────────────
  {
    slug: "dashboard",
    title: "Dashboard",
    icon: "layout-dashboard",
    pages: [
      {
        slug: "overview",
        title: "Dashboard Overview",
        content: `# Dashboard Overview

The Nexus OS dashboard provides a real-time web interface for monitoring your entire agent system.

## Starting the Dashboard

\`\`\`bash
naos dashboard --port 4200

# ✓ Dashboard running at http://127.0.0.1:4200
\`\`\`

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Overview | / | System summary with key metrics |
| Agents | /agents | All agents with status |
| Supervisors | /supervisors | Supervision trees |
| Sagas | /sagas | Saga executions |
| Workflows | /workflows | Workflow pipelines |
| Pools | /pools | Pool status and tasks |
| Cost | /cost | Budget and spending |
| Audit | /audit | Event log |
| Trust | /trust | AXIS verification scores |
| Broker | /broker | Routing stats |
| Edge | /edge | Edge deployments |`,
      },
      {
        slug: "pages",
        title: "Dashboard Pages",
        content: `# Dashboard Pages

## Overview Page

The overview page shows:
- Total agents and their status distribution
- Active supervisors
- Recent saga/workflow executions
- Cost summary
- System health

## Agents Page

Shows all registered agents with:
- Name, status, and ID
- Template and source
- Action buttons

## Cost Page

Shows:
- Budget utilization bars
- Spending by agent
- Spending by model
- Daily/monthly trends

## Audit Page

Shows the complete audit log with:
- Timestamp
- Agent name
- Action type
- Details`,
      },
      {
        slug: "api-endpoints",
        title: "API Endpoints",
        content: `# Dashboard API Endpoints

The dashboard exposes JSON API endpoints for programmatic access.

## Available Endpoints

| Endpoint | Description |
|----------|-------------|
| \`GET /api/agents\` | List all agents |
| \`GET /api/supervisors\` | List all supervisors |
| \`GET /api/cost\` | Cost summary |
| \`GET /api/audit\` | Audit log entries |
| \`GET /api/trust\` | AXIS trust scores |
| \`GET /api/broker\` | Broker routing stats |
| \`GET /api/edge\` | Edge deployments |

## Example

\`\`\`bash
curl http://127.0.0.1:4200/api/agents | jq

# [
#   {
#     "name": "researcher",
#     "status": "running",
#     "id": "a1b2c3d4e5f6"
#   }
# ]
\`\`\``,
      },
      {
        slug: "customization",
        title: "Customization",
        content: `# Dashboard Customization

## Port

\`\`\`bash
naos dashboard --port 8080
\`\`\`

## Auto-Open Browser

\`\`\`bash
naos dashboard --open
\`\`\`

## Refresh Interval

The dashboard auto-refreshes every 10 seconds via meta-refresh.

## Theming

The dashboard uses a dark terminal aesthetic with:
- JetBrains Mono font
- Dark background (#0a0a0a)
- Green accent (#00ff88)
- Responsive layout`,
      },
    ],
  },

  // ─── CLI REFERENCE ──────────────────────────────────────────
  {
    slug: "cli-reference",
    title: "CLI Reference",
    icon: "terminal",
    pages: [
      {
        slug: "overview",
        title: "CLI Overview",
        content: `# CLI Reference

The \`naos\` command-line interface is the primary way to interact with Nexus OS.

## Global Options

| Flag | Description |
|------|-------------|
| \`--help\` | Show help for any command |
| \`--version\` | Show version |
| \`--config <path>\` | Custom config file path |
| \`--data-dir <path>\` | Custom data directory |

## Command Groups

| Group | Description |
|-------|-------------|
| \`naos init\` | Initialize a new project |
| \`naos create\` | Create agents |
| \`naos run\` | Run agents |
| \`naos stop\` | Stop agents |
| \`naos status\` | Check agent status |
| \`naos supervisor\` | Manage supervisors |
| \`naos saga\` | Manage sagas |
| \`naos workflow\` | Manage workflows |
| \`naos pool\` | Manage pools |
| \`naos cost\` | Cost management |
| \`naos axis\` | Trust verification |
| \`naos broker\` | Broker routing |
| \`naos edge\` | Edge deployment |
| \`naos dashboard\` | Web dashboard |
| \`naos audit\` | Audit log |`,
      },
      {
        slug: "agent-commands",
        title: "Agent Commands",
        content: `# Agent Commands

## naos create

\`\`\`bash
naos create <name> [--template <template>]
naos create --from-config
\`\`\`

## naos run

\`\`\`bash
naos run <name> [--input <text>] [--verify-trust]
naos run --all
\`\`\`

## naos stop

\`\`\`bash
naos stop <name> [--force] [--no-restart]
naos stop --all
\`\`\`

## naos status

\`\`\`bash
naos status [<name>]
\`\`\`

## naos inspect

\`\`\`bash
naos inspect <name> [--state]
\`\`\``,
      },
      {
        slug: "orchestration-commands",
        title: "Orchestration Commands",
        content: `# Orchestration Commands

## Supervisor Commands

\`\`\`bash
naos supervisor create <name> --strategy <strategy> [--max-restarts <n>]
naos supervisor add-child <supervisor> <child> [<child>...]
naos supervisor status <name>
naos supervisor list
\`\`\`

## Saga Commands

\`\`\`bash
naos saga create <name>
naos saga add-step <saga> <step> [--compensate <agent>]
naos saga run <name> [--input <json>]
naos saga status <name>
naos saga resume <name>
naos saga reset <name>
\`\`\`

## Workflow Commands

\`\`\`bash
naos workflow create <name>
naos workflow add-step <workflow> <step>
naos workflow run <name> [--input <json>]
naos workflow status <name>
naos workflow resume <name>
\`\`\`

## Pool Commands

\`\`\`bash
naos pool create <name> --size <n> --agent <agent>
naos pool submit <name> <task>
naos pool status <name>
naos pool scale <name> --size <n>
naos pool drain <name>
\`\`\``,
      },
      {
        slug: "system-commands",
        title: "System Commands",
        content: `# System Commands

## Cost Commands

\`\`\`bash
naos cost status
naos cost set-budget <agent> --daily <cents> [--monthly <cents>]
naos cost history [--days <n>]
naos cost reset <agent>
naos cost reset --all
\`\`\`

## Trust Commands

\`\`\`bash
naos axis verify <agent>
naos axis verify --all
naos axis cache
\`\`\`

## Broker Commands

\`\`\`bash
naos broker skills
naos broker config
naos broker route <task>
naos broker execute <task>
naos broker stats
\`\`\`

## Edge Commands

\`\`\`bash
naos edge login
naos edge deploy <agent> [--all]
naos edge list
naos edge status <agent>
naos edge logs <agent>
naos edge undeploy <agent> [--all]
\`\`\`

## Dashboard

\`\`\`bash
naos dashboard [--port <port>] [--open]
\`\`\`

## Audit

\`\`\`bash
naos audit [--agent <name>] [--filter <type>] [--days <n>]
\`\`\``,
      },
    ],
  },

  // ─── TROUBLESHOOTING ──────────────────────────────────────────
  {
    slug: "troubleshooting",
    title: "Troubleshooting",
    icon: "wrench",
    pages: [
      {
        slug: "common-issues",
        title: "Common Issues",
        content: `# Common Issues

## Agent Won't Start

**Symptoms:** \`naos run\` shows error or agent stays in "stopped" state.

**Possible causes:**
1. Budget exceeded — check with \`naos cost status\`
2. Trust tier too low — check with \`naos axis verify <agent>\`
3. Missing WASM file — check agent source path
4. Configuration error — validate \`nexus.config.yaml\`

## Supervisor Not Restarting Agent

**Symptoms:** Agent crashed but supervisor didn't restart it.

**Possible causes:**
1. Max restarts reached — check with \`naos supervisor status <name>\`
2. Agent has \`budget_exceeded\` status
3. Supervisor itself crashed — check parent supervisor

## High Costs

**Symptoms:** Spending more than expected.

**Solutions:**
1. Set budgets: \`naos cost set-budget <agent> --daily 1000\`
2. Use the broker: \`naos broker stats\` to check routing
3. Switch to cheaper models
4. Check for infinite loops in agent logic

## Dashboard Won't Start

**Symptoms:** \`naos dashboard\` shows error.

**Possible causes:**
1. Port already in use — try \`--port 4201\`
2. No data directory — run \`naos init\` first
3. Database locked — stop other naos processes`,
      },
      {
        slug: "debugging",
        title: "Debugging",
        content: `# Debugging

## Enable Verbose Output

\`\`\`bash
RUST_LOG=debug naos run researcher
\`\`\`

## Check Audit Log

\`\`\`bash
naos audit --agent researcher --days 1
\`\`\`

## Inspect Agent State

\`\`\`bash
naos inspect researcher --state
\`\`\`

## Check Database

\`\`\`bash
sqlite3 data/nexus.db ".tables"
sqlite3 data/nexus.db "SELECT * FROM agents"
\`\`\`

## Dashboard Debugging

\`\`\`bash
naos dashboard --port 4200
curl http://127.0.0.1:4200/api/agents | jq
\`\`\``,
      },
      {
        slug: "performance",
        title: "Performance Tuning",
        content: `# Performance Tuning

## WASM Fuel

Increase fuel for CPU-intensive agents:

\`\`\`yaml
agents:
  analyzer:
    wasm:
      fuel: 5000000
\`\`\`

## Memory

Increase memory for data-heavy agents:

\`\`\`yaml
agents:
  analyzer:
    wasm:
      memoryPages: 512
\`\`\`

## Database

Enable WAL mode for better concurrent performance:

\`\`\`yaml
advanced:
  walMode: true
\`\`\`

## Pool Sizing

Right-size pools based on workload:

\`\`\`bash
naos pool status workers
# If queue is consistently > 10, scale up
naos pool scale workers --size 10
\`\`\``,
      },
    ],
  },

  // ─── FAQ ──────────────────────────────────────────
  {
    slug: "faq",
    title: "FAQ",
    icon: "help-circle",
    pages: [
      {
        slug: "general",
        title: "General FAQ",
        content: `# Frequently Asked Questions

## What is Nexus OS?

Nexus OS is an orchestration layer for AI agents. It provides supervisors, sagas, workflows, cost controls, trust verification, broker routing, and edge deployment in a single 10MB binary.

## Who created Nexus OS?

Nexus OS was created by Leonidas Esquire Williamson.

## What language is it written in?

Rust, compiled to a single static binary with no runtime dependencies.

## What platforms does it support?

Linux (x86_64, aarch64), macOS (x86_64, Apple Silicon), and Windows (x86_64).

## Is it open source?

Yes, Nexus OS is open source and available on GitHub.

## How much does it cost?

Nexus OS itself is free. You pay only for the LLM API calls your agents make (OpenAI, Anthropic, etc.).

## Can I use it without LLMs?

Yes. The broker can route tasks to local skills and WASM handlers without any LLM calls.

## How does it compare to LangChain?

LangChain is a framework for building LLM applications. Nexus OS is an orchestration layer for running agents in production. They solve different problems and can be used together.`,
      },
      {
        slug: "technical",
        title: "Technical FAQ",
        content: `# Technical FAQ

## How does the WASM sandbox work?

Agents are compiled to WebAssembly and run in a sandboxed environment with zero default capabilities. Permissions (network, file, env) must be explicitly granted.

## How does state persistence work?

Agent state is stored in a SQLite database. Each agent has a JSON state blob that persists across restarts.

## Can agents communicate with each other?

Not directly. Agents communicate through the orchestration layer (supervisors, sagas, workflows, pools).

## How does the broker decide which handler to use?

The broker uses pattern matching with confidence scoring. It checks skills first, then WASM handlers, then falls back to LLM. The confidence threshold is configurable (default: 0.90).

## What happens when the database gets large?

SQLite handles databases up to 281 TB. For most use cases, performance remains excellent. Enable WAL mode for better concurrent access.

## Can I run multiple projects?

Each project has its own directory and database. You can run multiple projects simultaneously.`,
      },
      {
        slug: "deployment",
        title: "Deployment FAQ",
        content: `# Deployment FAQ

## Can I deploy to AWS/GCP/Azure?

Nexus OS runs anywhere Linux runs. Deploy the binary to any cloud VM, container, or serverless environment. The \`naos edge\` commands specifically target Cloudflare Workers for edge deployment.

## How do I run Nexus OS in Docker?

\`\`\`dockerfile
FROM scratch
COPY naos /naos
COPY nexus.config.yaml /config/
WORKDIR /data
ENTRYPOINT ["/naos"]
\`\`\`

The binary is statically linked, so \`FROM scratch\` works.

## Can I run it in Kubernetes?

Yes. Use a StatefulSet with a PersistentVolumeClaim for the SQLite database:

\`\`\`yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: nexus-os
spec:
  replicas: 1
  template:
    spec:
      containers:
        - name: nexus
          image: nexus-os:latest
          volumeMounts:
            - name: data
              mountPath: /data
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 1Gi
\`\`\`

## How do I back up the database?

\`\`\`bash
# Simple file copy (while naos is stopped)
cp data/nexus.db backup/nexus-$(date +%Y%m%d).db

# Online backup (while naos is running)
sqlite3 data/nexus.db ".backup backup/nexus.db"
\`\`\`

## What ports does Nexus OS use?

Only the dashboard port (default 4200). All other operations are CLI-based and don't require network ports.`,
      },
      {
        slug: "troubleshooting-faq",
        title: "Common Issues FAQ",
        content: `# Common Issues FAQ

## "Agent not found" error

This means the agent name doesn't match any registered agent. Check:

\`\`\`bash
# List all agents
naos list

# Agent names are case-sensitive
naos run Planner   # Wrong
naos run planner   # Correct
\`\`\`

## Dashboard won't start

Check if the port is already in use:

\`\`\`bash
# Check port 4200
lsof -i :4200

# Use a different port
naos dashboard --port 4201
\`\`\`

## Saga compensation keeps failing

Compensation steps should be idempotent. If a compensation fails, Nexus retries it. Check:

1. Is the compensation handler returning errors?
2. Is the external service down?
3. Check the audit log: \`naos audit --action saga_compensation_failed\`

## "Budget exceeded" but I set a high limit

Budgets are in **cents**, not dollars:

\`\`\`bash
# This sets a $10 budget (1000 cents)
naos cost set planner 1000

# NOT $1000
\`\`\`

## Edge deploy hangs

Check your Cloudflare credentials:

\`\`\`bash
# Verify credentials are stored
naos edge login

# Check if the account ID is valid (32 hex chars)
# Check if the API token has Workers permissions
\`\`\`

## AXIS verification fails for all agents

The AXIS registry may be unreachable. Check:

\`\`\`bash
# Test connectivity
curl -s https://axis-registry.example.com/health

# Check cached results
naos axis list
\`\`\``,
      },
    ],
  },

  // ─── GLOSSARY ──────────────────────────────────────────
  {
    slug: "glossary",
    title: "Glossary",
    icon: "book-open",
    pages: [
      {
        slug: "terms",
        title: "Glossary of Terms",
        content: `# Glossary

| Term | Definition |
|------|-----------|
| **Agent** | A self-contained program that runs in a WASM sandbox |
| **AXIS** | Agent eXchange Identity & Security — trust verification protocol |
| **Broker** | Routes tasks to the most cost-effective handler |
| **Compensation** | An undo action for a saga step |
| **Durable Objects** | Cloudflare's stateful edge storage |
| **Edge** | Cloudflare Workers deployment for global low-latency |
| **Fuel** | WASM CPU budget — prevents infinite loops |
| **naos** | The Nexus OS CLI binary |
| **One-for-all** | Supervisor strategy: restart all children when one fails |
| **One-for-one** | Supervisor strategy: restart only the failed child |
| **Pool** | A group of identical agents processing tasks in parallel |
| **Rest-for-one** | Supervisor strategy: restart failed child and all after it |
| **Saga** | Multi-step transaction with automatic rollback |
| **Skill** | A pre-built handler for common tasks (no LLM needed) |
| **Supervisor** | Monitors agents and restarts them on failure |
| **Trust Tier** | T1-T5 rating of agent trustworthiness |
| **WASM** | WebAssembly — sandboxed execution environment |
| **Workflow** | Sequential data pipeline where output feeds next input |`,
      },
    ],
  },
  // ─── SECURITY ──────────────────────────────────────────
  {
    slug: "security",
    title: "Security",
    icon: "shield",
    pages: [
      {
        slug: "overview",
        title: "Security Overview",
        content: `# Security Overview

Nexus OS is designed with security as a core principle. Every component follows the principle of least privilege.

## Security Model

Nexus OS uses a layered security model:

\`\`\`
┌─────────────────────────────────┐
│  Application Layer              │
│  Agent code + business logic    │
├─────────────────────────────────┤
│  Orchestration Layer            │
│  Supervisors, Sagas, Workflows  │
├─────────────────────────────────┤
│  Sandbox Layer                  │
│  WASM isolation + syscall filter│
├─────────────────────────────────┤
│  Storage Layer                  │
│  Encrypted SQLite + audit trail │
└─────────────────────────────────┘
\`\`\`

## Key Security Features

- **WASM Sandboxing** — Agents run in isolated WebAssembly sandboxes with no direct filesystem or network access
- **AXIS Trust Verification** — Cryptographic verification of agent identity and capabilities
- **Audit Trail** — Every action is logged with timestamps, agent IDs, and details
- **Cost Controls** — Budget enforcement prevents runaway spending
- **Credential Isolation** — API tokens and secrets are never exposed to agent code

## Threat Model

| Threat | Mitigation |
|--------|------------|
| Malicious agent code | WASM sandbox prevents escape |
| Credential theft | Secrets injected at runtime, never stored in agent code |
| Cost attacks | Per-agent budgets with hard limits |
| Data exfiltration | Network access controlled by sandbox policy |
| Privilege escalation | No root access, minimal syscall surface |`,
      },
      {
        slug: "wasm-sandbox",
        title: "WASM Sandbox",
        content: `# WASM Sandbox Security

The WASM sandbox is the primary isolation boundary for agent execution.

## How It Works

Each agent runs in its own WebAssembly instance with:

- **Memory isolation** — Each instance has its own linear memory, no shared state
- **Syscall filtering** — Only whitelisted system calls are available
- **Resource limits** — CPU time, memory, and I/O are bounded
- **No ambient authority** — Agents must explicitly request capabilities

## Sandbox Configuration

\`\`\`yaml
agents:
  planner:
    sandbox:
      memory_limit: 256MB
      cpu_timeout: 30s
      network: restricted    # none | restricted | open
      filesystem: none       # none | readonly | readwrite
      allowed_hosts:
        - api.openai.com
        - api.anthropic.com
\`\`\`

## Capability Model

Agents request capabilities through a manifest:

\`\`\`toml
[capabilities]
network = ["api.openai.com"]
filesystem = "readonly"
max_memory = "256MB"
\`\`\`

The runtime enforces these limits. Any violation terminates the agent immediately.

## Escape Prevention

The WASM sandbox prevents common escape vectors:

- **No raw syscalls** — All I/O goes through the capability API
- **No shared memory** — Agents cannot read other agents' memory
- **No dynamic code loading** — JIT compilation is disabled
- **Stack overflow protection** — Guard pages prevent stack smashing`,
      },
      {
        slug: "credentials",
        title: "Credential Management",
        content: `# Credential Management

Nexus OS provides secure credential management for API keys, tokens, and secrets.

## How Credentials Work

Credentials are stored encrypted in the Nexus database and injected at runtime:

\`\`\`bash
# Store a credential
naos secret set OPENAI_API_KEY sk-...

# List stored credentials (values hidden)
naos secret list

# Remove a credential
naos secret delete OPENAI_API_KEY
\`\`\`

## Credential Scoping

Credentials can be scoped to specific agents:

\`\`\`yaml
agents:
  planner:
    secrets:
      - OPENAI_API_KEY
      - ANTHROPIC_API_KEY
  coder:
    secrets:
      - GITHUB_TOKEN
\`\`\`

Agents can only access secrets explicitly assigned to them.

## Encryption

All credentials are encrypted at rest using AES-256-GCM. The encryption key is derived from:

1. A master key stored in the project's \`.nexus/\` directory
2. A per-credential salt
3. PBKDF2 key derivation with 100,000 iterations

## Best Practices

- **Never hardcode secrets** in agent source code
- **Rotate credentials** regularly using \`naos secret set\`
- **Use scoped credentials** — only give agents the secrets they need
- **Audit access** — check \`naos audit\` for credential usage patterns`,
      },
      {
        slug: "network-security",
        title: "Network Security",
        content: `# Network Security

Nexus OS controls network access at multiple levels.

## Network Policies

Three network modes are available:

| Mode | Description | Use Case |
|------|-------------|----------|
| \`none\` | No network access | Pure computation agents |
| \`restricted\` | Allowlist only | API-calling agents |
| \`open\` | Full access | Web scraping agents |

## Allowlist Configuration

\`\`\`yaml
agents:
  researcher:
    sandbox:
      network: restricted
      allowed_hosts:
        - "*.openai.com"
        - "api.anthropic.com"
        - "api.tavily.com"
      blocked_ports:
        - 22    # SSH
        - 3306  # MySQL
\`\`\`

## TLS Verification

All outbound HTTPS connections verify TLS certificates. Self-signed certificates are rejected unless explicitly allowed:

\`\`\`yaml
agents:
  internal-agent:
    sandbox:
      tls_verify: false  # Only for internal services
\`\`\`

## Rate Limiting

Network requests can be rate-limited per agent:

\`\`\`yaml
agents:
  scraper:
    sandbox:
      rate_limit: 10/s    # Max 10 requests per second
      burst_limit: 50     # Allow bursts up to 50
\`\`\`

## Dashboard Monitoring

The dashboard shows network activity per agent:

\`\`\`bash
naos dashboard
# Navigate to Agents > [agent] > Network tab
\`\`\``,
      },
      {
        slug: "audit-security",
        title: "Audit & Compliance",
        content: `# Audit & Compliance

Nexus OS maintains a complete audit trail for compliance and debugging.

## What Gets Logged

Every significant action is recorded:

- Agent creation, start, stop, restart
- Saga step execution and compensation
- Workflow step transitions
- Cost budget changes and spending
- AXIS trust verification results
- Credential access (not values)
- Edge deployment operations
- Configuration changes

## Audit Log Format

Each entry contains:

\`\`\`json
{
  "id": 1234,
  "timestamp": "2025-01-15T10:30:00Z",
  "agent_id": "planner",
  "agent_name": "planner",
  "action": "saga_step_completed",
  "detail": "Step 3 of order-processing saga completed successfully"
}
\`\`\`

## Querying the Audit Log

\`\`\`bash
# View recent entries
naos audit --limit 50

# Filter by agent
naos audit --agent planner

# Filter by action type
naos audit --action saga_step_completed

# Export for compliance
naos audit --format json --output audit-export.json
\`\`\`

## Retention Policy

By default, audit logs are retained indefinitely. Configure retention:

\`\`\`yaml
audit:
  retention_days: 90
  compress_after: 30
  export_format: json
\`\`\``,
      },
    ],
  },
  // ─── CONTRIBUTING ──────────────────────────────────────────
  {
    slug: "contributing",
    title: "Contributing",
    icon: "git-branch",
    pages: [
      {
        slug: "getting-started",
        title: "Getting Started",
        content: `# Contributing to Nexus OS

Nexus OS is open source and welcomes contributions from the community.

## Repository Structure

\`\`\`
nexus-os/
├── src/
│   ├── main.rs          # Entry point
│   ├── cli.rs           # CLI argument parsing
│   ├── config.rs        # Configuration loading
│   ├── store.rs         # SQLite data layer
│   ├── commands.rs      # Agent lifecycle commands
│   ├── axis.rs          # AXIS trust verification
│   ├── broker.rs        # Broker routing engine
│   ├── cloudflare.rs    # Cloudflare API client
│   ├── edge.rs          # Edge deployment commands
│   └── dashboard.rs     # Web dashboard
├── tests/               # Integration tests
├── docs/                # Documentation source
├── Cargo.toml           # Rust dependencies
└── README.md
\`\`\`

## Development Setup

\`\`\`bash
# Clone the repository
git clone https://github.com/leonidas-esquire/nexus-os.git
cd nexus-os

# Build in debug mode
cargo build

# Run tests
cargo test

# Build release binary
cargo build --release
\`\`\`

## Code Style

- Follow standard Rust formatting (\`cargo fmt\`)
- Run clippy before submitting (\`cargo clippy\`)
- Write tests for new features
- Document public APIs with doc comments`,
      },
      {
        slug: "architecture",
        title: "Architecture Guide",
        content: `# Architecture Guide

Understanding the internal architecture of Nexus OS.

## Module Dependency Graph

\`\`\`
main.rs
  ├── cli.rs (argument parsing)
  ├── config.rs (YAML loading)
  ├── store.rs (SQLite persistence)
  ├── commands.rs (agent lifecycle)
  │   └── store.rs
  ├── axis.rs (trust verification)
  │   └── store.rs
  ├── broker.rs (routing engine)
  │   ├── store.rs
  │   └── config.rs
  ├── edge.rs (edge deployment)
  │   ├── store.rs
  │   ├── config.rs
  │   └── cloudflare.rs
  └── dashboard.rs (web UI)
      └── store.rs
\`\`\`

## Data Flow

1. **CLI** parses user input into a \`Cmd\` enum
2. **Main** dispatches to the appropriate module
3. **Module** opens the \`Store\` (SQLite connection)
4. **Store** reads/writes data and returns results
5. **Module** formats output for the terminal

## Store Design

The Store uses SQLite with these design principles:

- **Single file** — All data in one \`nexus.db\` file
- **Migrations** — Schema created on first open
- **No ORM** — Direct SQL with rusqlite
- **Transactions** — Used for multi-step operations

## Adding a New Module

1. Create \`src/new_module.rs\`
2. Add tables to \`Store::open()\` migration
3. Add data types and methods to \`store.rs\`
4. Add CLI subcommand to \`cli.rs\`
5. Add dispatch arm to \`main.rs\`
6. Add dashboard page to \`dashboard.rs\``,
      },
      {
        slug: "testing",
        title: "Testing Guide",
        content: `# Testing Guide

How to write and run tests for Nexus OS.

## Running Tests

\`\`\`bash
# Run all tests
cargo test

# Run a specific test
cargo test test_agent_lifecycle

# Run tests with output
cargo test -- --nocapture

# Run only integration tests
cargo test --test integration
\`\`\`

## Writing Unit Tests

Unit tests go in the same file as the code they test:

\`\`\`rust
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_agent_creation() {
        let dir = TempDir::new().unwrap();
        let store = Store::open(dir.path()).unwrap();
        store.create_agent("test", "idle", "test.wasm").unwrap();
        let agents = store.list_agents().unwrap();
        assert_eq!(agents.len(), 1);
        assert_eq!(agents[0].name, "test");
    }
}
\`\`\`

## Writing Integration Tests

Integration tests go in the \`tests/\` directory:

\`\`\`rust
// tests/integration.rs
use std::process::Command;

#[test]
fn test_cli_init() {
    let dir = tempfile::TempDir::new().unwrap();
    let output = Command::new("cargo")
        .args(["run", "--", "init"])
        .current_dir(dir.path())
        .output()
        .unwrap();
    assert!(output.status.success());
}
\`\`\`

## Test Coverage

Generate coverage reports:

\`\`\`bash
cargo install cargo-tarpaulin
cargo tarpaulin --out html
open tarpaulin-report.html
\`\`\``,
      },
      {
        slug: "pull-requests",
        title: "Pull Request Guide",
        content: `# Pull Request Guide

How to submit changes to Nexus OS.

## PR Workflow

1. **Fork** the repository on GitHub
2. **Create a branch** from \`master\`
3. **Make changes** with clear, focused commits
4. **Run tests** locally (\`cargo test\`)
5. **Submit PR** with a clear description

## Commit Messages

Follow conventional commits:

\`\`\`
feat: add broker routing engine
fix: correct saga compensation order
docs: update CLI reference
test: add supervisor restart tests
refactor: simplify store migration
\`\`\`

## PR Template

\`\`\`markdown
## What
[Brief description of the change]

## Why
[Motivation and context]

## How
[Implementation approach]

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] cargo fmt
- [ ] cargo clippy (no warnings)
- [ ] cargo test (all pass)
- [ ] Documentation updated
\`\`\`

## Review Process

- PRs require at least one approval
- CI must pass (build + tests + clippy)
- Squash merge into master
- Delete branch after merge`,
      },
      {
        slug: "release-process",
        title: "Release Process",
        content: `# Release Process

How Nexus OS releases are managed.

## Versioning

Nexus OS follows Semantic Versioning (SemVer):

- **MAJOR** — Breaking changes to CLI or config format
- **MINOR** — New features, backward compatible
- **PATCH** — Bug fixes only

## Release Checklist

1. Update version in \`Cargo.toml\`
2. Update CHANGELOG.md
3. Run full test suite
4. Build release binaries for all platforms
5. Create GitHub release with binaries
6. Update Homebrew formula
7. Update documentation site

## Building Release Binaries

\`\`\`bash
# Linux (x86_64)
cargo build --release --target x86_64-unknown-linux-musl

# macOS (Apple Silicon)
cargo build --release --target aarch64-apple-darwin

# macOS (Intel)
cargo build --release --target x86_64-apple-darwin

# Windows
cargo build --release --target x86_64-pc-windows-msvc
\`\`\`

## Platform Support

| Platform | Architecture | Status |
|----------|-------------|--------|
| Linux | x86_64 | Tier 1 |
| Linux | aarch64 | Tier 1 |
| macOS | Apple Silicon | Tier 1 |
| macOS | Intel | Tier 1 |
| Windows | x86_64 | Tier 2 |
| FreeBSD | x86_64 | Tier 3 |`,
      },
    ],
  },
  // ─── APPENDIX ──────────────────────────────────────────
  {
    slug: "appendix",
    title: "Appendix",
    icon: "book-open",
    pages: [
      {
        slug: "config-reference",
        title: "Full Config Reference",
        content: `# Full Configuration Reference

Complete reference for all \`nexus.config.yaml\` options.

## Top-Level Structure

\`\`\`yaml
name: my-project
version: "0.1.0"

agents:
  # Agent definitions...

supervisors:
  # Supervisor definitions...

sagas:
  # Saga definitions...

workflows:
  # Workflow definitions...

pools:
  # Pool definitions...

cost:
  # Cost control settings...

broker:
  # Broker routing settings...

edge:
  # Edge deployment settings...

skills:
  # Skill definitions...

audit:
  # Audit settings...
\`\`\`

## Agent Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`template\` | string | required | Agent template name |
| \`source\` | string | required | Path to agent source |
| \`status\` | string | \`idle\` | Initial status |
| \`sandbox.memory_limit\` | string | \`256MB\` | Max memory |
| \`sandbox.cpu_timeout\` | string | \`30s\` | Max CPU time |
| \`sandbox.network\` | string | \`restricted\` | Network mode |

## Supervisor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`strategy\` | string | \`one_for_one\` | Restart strategy |
| \`max_restarts\` | number | \`3\` | Max restarts in window |
| \`window_secs\` | number | \`60\` | Restart window |
| \`children\` | list | required | Child agent names |

## Cost Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| \`default_budget\` | number | \`1000\` | Default budget in cents |
| \`alert_threshold\` | number | \`0.8\` | Alert at this % |
| \`hard_limit\` | boolean | \`true\` | Enforce hard limits |`,
      },
      {
        slug: "error-codes",
        title: "Error Code Reference",
        content: `# Error Code Reference

Complete list of Nexus OS error codes and their meanings.

## Agent Errors (1xx)

| Code | Name | Description |
|------|------|-------------|
| 100 | AGENT_NOT_FOUND | Agent does not exist |
| 101 | AGENT_ALREADY_EXISTS | Agent name is taken |
| 102 | AGENT_NOT_RUNNING | Agent is not in running state |
| 103 | AGENT_CRASHED | Agent terminated unexpectedly |
| 104 | AGENT_TIMEOUT | Agent exceeded CPU timeout |
| 105 | AGENT_OOM | Agent exceeded memory limit |

## Saga Errors (2xx)

| Code | Name | Description |
|------|------|-------------|
| 200 | SAGA_NOT_FOUND | Saga does not exist |
| 201 | SAGA_STEP_FAILED | A saga step failed |
| 202 | SAGA_COMPENSATION_FAILED | Compensation step failed |
| 203 | SAGA_TIMEOUT | Saga exceeded total timeout |
| 204 | SAGA_ALREADY_RUNNING | Saga is already executing |

## Cost Errors (3xx)

| Code | Name | Description |
|------|------|-------------|
| 300 | BUDGET_EXCEEDED | Agent exceeded its budget |
| 301 | BUDGET_NOT_FOUND | No budget for this agent |
| 302 | INVALID_AMOUNT | Negative or zero amount |

## Trust Errors (4xx)

| Code | Name | Description |
|------|------|-------------|
| 400 | AXIS_UNREACHABLE | Cannot reach AXIS registry |
| 401 | VERIFICATION_FAILED | Agent failed trust check |
| 402 | CERTIFICATE_EXPIRED | Agent certificate expired |
| 403 | TRUST_SCORE_LOW | Trust score below threshold |

## Edge Errors (5xx)

| Code | Name | Description |
|------|------|-------------|
| 500 | DEPLOY_FAILED | Cloudflare deployment failed |
| 501 | CREDENTIALS_MISSING | No CF credentials stored |
| 502 | WORKER_NOT_FOUND | Worker does not exist |
| 503 | REGION_UNAVAILABLE | Target region not available |`,
      },
      {
        slug: "environment-variables",
        title: "Environment Variables",
        content: `# Environment Variables

All environment variables recognized by Nexus OS.

## Core Variables

| Variable | Default | Description |
|----------|---------|-------------|
| \`NEXUS_HOME\` | \`.\` | Project root directory |
| \`NEXUS_DB_PATH\` | \`data/nexus.db\` | Database file location |
| \`NEXUS_CONFIG\` | \`nexus.config.yaml\` | Config file path |
| \`NEXUS_LOG_LEVEL\` | \`info\` | Log verbosity (trace/debug/info/warn/error) |
| \`NEXUS_LOG_FORMAT\` | \`text\` | Log format (text/json) |

## Cloudflare Variables

| Variable | Default | Description |
|----------|---------|-------------|
| \`CF_ACCOUNT_ID\` | none | Cloudflare account ID |
| \`CF_API_TOKEN\` | none | Cloudflare API token |
| \`CF_WORKER_PREFIX\` | \`nexus-\` | Worker name prefix |

## Dashboard Variables

| Variable | Default | Description |
|----------|---------|-------------|
| \`NEXUS_DASH_PORT\` | \`4200\` | Dashboard port |
| \`NEXUS_DASH_HOST\` | \`127.0.0.1\` | Dashboard bind address |
| \`NEXUS_DASH_TOKEN\` | none | Dashboard auth token |

## AXIS Variables

| Variable | Default | Description |
|----------|---------|-------------|
| \`AXIS_REGISTRY_URL\` | default | AXIS registry endpoint |
| \`AXIS_CACHE_TTL\` | \`3600\` | Cache TTL in seconds |
| \`AXIS_TIMEOUT\` | \`10\` | Request timeout in seconds |

## Precedence

Configuration is resolved in this order (highest priority first):

1. CLI flags (\`--port 4201\`)
2. Environment variables (\`NEXUS_DASH_PORT=4201\`)
3. Config file (\`nexus.config.yaml\`)
4. Built-in defaults`,
      },
      {
        slug: "migration-guide",
        title: "Migration Guide",
        content: `# Migration Guide

How to upgrade between Nexus OS versions.

## v0.0.x to v0.1.0

v0.1.0 is the first public release. If you were using a pre-release version:

### Config Changes

\`\`\`yaml
# OLD (v0.0.x)
agents:
  - name: planner
    type: llm

# NEW (v0.1.0)
agents:
  planner:
    template: llm
    source: agents/planner.wasm
\`\`\`

### Database Migration

The database schema changed significantly. Export and reimport:

\`\`\`bash
# Export old data
naos export --format json --output backup.json

# Reinitialize
rm -rf data/
naos init

# Import data
naos import backup.json
\`\`\`

### CLI Changes

| Old Command | New Command |
|-------------|-------------|
| \`naos agent list\` | \`naos list\` |
| \`naos agent create\` | \`naos create\` |
| \`naos agent run\` | \`naos run\` |
| \`naos agent stop\` | \`naos stop\` |

## Future Migrations

Starting with v0.1.0, Nexus OS includes automatic database migrations. When you upgrade, the database schema is updated automatically on first run.

\`\`\`bash
# Upgrade binary
cargo install naos

# Run any command — migrations happen automatically
naos list
# [info] Migrated database from v3 to v5
\`\`\``,
      },
    ],
  },
];
