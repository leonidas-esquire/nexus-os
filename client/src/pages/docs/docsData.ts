// Documentation data structure for Nexus OS docs site
// Each section has a title, slug, and pages with markdown-like content

export interface DocPage {
  slug: string;
  title: string;
  content: string;
}

export interface DocSection {
  slug: string;
  title: string;
  icon: string;
  pages: DocPage[];
}

export const DOC_SECTIONS: DocSection[] = [
  {
    slug: "getting-started",
    title: "Getting Started",
    icon: "rocket",
    pages: [
      {
        slug: "installation",
        title: "Installation",
        content: `# Installation

## Quick Install (macOS/Linux)

The fastest way to install Nexus OS is via the install script:

\`\`\`bash
curl -fsSL https://aiagents.nexus/install.sh | sh
\`\`\`

This downloads the latest release binary and places it in \`/usr/local/bin/naos\`.

## From Source

If you prefer to build from source, clone the repository and compile with Cargo:

\`\`\`bash
git clone https://github.com/leonidas-esquire/nexus-os
cd nexus-os
cargo build --release
\`\`\`

The binary will be at \`target/release/naos\`. Move it to your PATH:

\`\`\`bash
sudo cp target/release/naos /usr/local/bin/
\`\`\`

## Verify Installation

Confirm the installation succeeded:

\`\`\`bash
naos --version
# nexus-os 1.0.0
\`\`\`

## Requirements

| Requirement | Details |
|---|---|
| Operating System | macOS, Linux, or Windows (WSL) |
| Disk Space | ~50MB |
| Runtime Dependencies | None |
| Build Dependencies | Rust 1.75+ (only for source builds) |

## Updating

To update to the latest version:

\`\`\`bash
curl -fsSL https://aiagents.nexus/install.sh | sh
\`\`\`

Or if built from source:

\`\`\`bash
cd nexus-os
git pull origin master
cargo build --release
\`\`\``,
      },
      {
        slug: "quickstart",
        title: "Quickstart",
        content: `# Quickstart

Get your first agent running in 5 minutes.

## 1. Create a Project

Initialize a new Nexus OS project directory:

\`\`\`bash
naos init my-project
cd my-project
\`\`\`

This creates a \`nexus.config.yaml\` and a \`data/\` directory for the embedded database.

## 2. Create an Agent

Create your first agent from a built-in template:

\`\`\`bash
naos create hello-agent --template echo
\`\`\`

Available templates: \`echo\`, \`http\`, \`cron\`, \`pipeline\`.

## 3. Run the Agent

Start the agent:

\`\`\`bash
naos run hello-agent
\`\`\`

You should see output confirming the agent is running:

\`\`\`
[nexus] agent hello-agent started (pid: 1)
[nexus] status: running
\`\`\`

## 4. Check Status

View all running agents:

\`\`\`bash
naos status
\`\`\`

Output:

\`\`\`
AGENT       STATUS    UPTIME    MEMORY
hello-agent running   2m 15s    12MB
\`\`\`

## 5. View the Dashboard

Launch the built-in web dashboard:

\`\`\`bash
naos dashboard --open
\`\`\`

This starts a local server at \`http://localhost:4200\` and opens it in your browser. The dashboard shows all agents, supervisors, costs, and more.

## Next Steps

- [Configuration](/docs/getting-started/configuration) — Customize your project settings
- [Creating Agents](/docs/agents/creating-agents) — Build custom agents
- [Supervisors](/docs/orchestration/supervisors) — Add fault tolerance`,
      },
      {
        slug: "configuration",
        title: "Configuration",
        content: `# Configuration

All configuration lives in \`nexus.config.yaml\` at your project root. Nexus OS uses a single config file to define project settings, agent behavior, cost controls, trust requirements, and more.

## Full Example

\`\`\`yaml
name: my-project

execution:
  type: wasm
  memoryLimit: 256MB

supervisor:
  strategy: one-for-one
  maxRestarts: 3

cost:
  budget: "$100/day"
  alertAt: 80
  action: pause

trust:
  provider: axis
  requirements:
    minTrustTier: T3
    minTScore: 70

broker:
  enabled: true
  routing:
    preferSkill: true
    llmAsLastResort: true

skills:
  - name: summarize
    handler: ./skills/summarize.wasm
    patterns:
      - summarize
      - summary
      - tldr

edge:
  provider: cloudflare
  regions:
    - us
    - eu
    - asia

agents:
  researcher:
    source: ./agents/researcher.wasm
    cost:
      budget: "$10/day"
  analyzer:
    source: ./agents/analyzer.wasm
    cost:
      budget: "$5/day"
\`\`\`

## Configuration Sections

| Section | Purpose |
|---|---|
| \`name\` | Project name identifier |
| \`execution\` | Runtime settings (WASM sandbox, memory limits) |
| \`supervisor\` | Default supervisor strategy and restart policy |
| \`cost\` | Global cost budget, alert threshold, and enforcement action |
| \`trust\` | AXIS Trust integration requirements |
| \`broker\` | Broker routing preferences |
| \`skills\` | Registered skill handlers for broker routing |
| \`edge\` | Cloudflare Edge deployment settings |
| \`agents\` | Per-agent configuration overrides |

## Environment Variables

Sensitive values should be set as environment variables rather than stored in the config file:

| Variable | Description |
|---|---|
| \`AXIS_API_KEY\` | AXIS Trust API key for agent verification |
| \`ANTHROPIC_API_KEY\` | API key for LLM fallback in broker routing |
| \`CF_ACCOUNT_ID\` | Cloudflare account ID for edge deployment |
| \`CF_API_TOKEN\` | Cloudflare API token for edge deployment |

## Config Validation

Validate your config file without running anything:

\`\`\`bash
naos config validate
\`\`\`

## Config Precedence

Settings are resolved in this order (highest priority first):

1. CLI flags (\`--budget 50\`)
2. Environment variables (\`NAOS_BUDGET=50\`)
3. \`nexus.config.yaml\` values
4. Built-in defaults`,
      },
    ],
  },
  {
    slug: "agents",
    title: "Agents",
    icon: "bot",
    pages: [
      {
        slug: "creating-agents",
        title: "Creating Agents",
        content: `# Creating Agents

Agents are the fundamental unit of work in Nexus OS. Each agent is an isolated process that can be started, stopped, monitored, and orchestrated.

## Create from Template

The fastest way to create an agent is from a built-in template:

\`\`\`bash
naos create my-agent --template echo
\`\`\`

### Available Templates

| Template | Description |
|---|---|
| \`echo\` | Simple echo agent that mirrors input |
| \`http\` | HTTP request handler agent |
| \`cron\` | Scheduled task agent |
| \`pipeline\` | Data processing pipeline agent |

## Create from Source

Point to a custom WASM binary:

\`\`\`bash
naos create my-agent --source ./agents/custom.wasm
\`\`\`

## Agent Structure

Each agent gets a record in the embedded database with:

\`\`\`
AGENT RECORD
├── name        unique identifier
├── source      path to WASM binary or template name
├── status      idle | running | stopped | failed
├── created_at  timestamp
└── metadata    JSON key-value pairs
\`\`\`

## Agent Lifecycle

\`\`\`
Created → Idle → Running → Stopped
                    ↓
                  Failed → (restart by supervisor)
\`\`\`

## Listing Agents

View all registered agents:

\`\`\`bash
naos status
\`\`\`

## Deleting Agents

Remove an agent (must be stopped first):

\`\`\`bash
naos stop my-agent
naos delete my-agent
\`\`\``,
      },
      {
        slug: "running-agents",
        title: "Running Agents",
        content: `# Running Agents

Once created, agents can be started, stopped, and monitored through the CLI.

## Starting an Agent

\`\`\`bash
naos run my-agent
\`\`\`

The agent starts in the WASM sandbox and transitions to \`running\` status.

## Stopping an Agent

\`\`\`bash
naos stop my-agent
\`\`\`

This sends a graceful shutdown signal. The agent has 5 seconds to clean up before being forcefully terminated.

## Checking Status

View a single agent:

\`\`\`bash
naos status my-agent
\`\`\`

View all agents:

\`\`\`bash
naos status
\`\`\`

Output format:

\`\`\`
AGENT       STATUS    UPTIME    MEMORY    COST
researcher  running   4h 12m    24MB      $2.40
analyzer    running   4h 12m    18MB      $1.10
planner     idle      -         -         $0.00
\`\`\`

## Running Multiple Agents

Start all agents defined in your config:

\`\`\`bash
naos run --all
\`\`\`

## Agent Logs

View agent output:

\`\`\`bash
naos logs my-agent
naos logs my-agent --follow    # stream live
naos logs my-agent --tail 50   # last 50 lines
\`\`\`

## Resource Limits

Set memory limits per agent in the config:

\`\`\`yaml
agents:
  researcher:
    source: ./agents/researcher.wasm
    execution:
      memoryLimit: 128MB
      timeoutSeconds: 300
\`\`\``,
      },
      {
        slug: "wasm-sandbox",
        title: "WASM Sandbox",
        content: `# WASM Sandbox

Nexus OS runs agents in a WebAssembly sandbox for security and portability. Each agent gets its own isolated execution environment.

## Why WASM?

| Benefit | Description |
|---|---|
| **Isolation** | Each agent runs in its own memory space |
| **Security** | No direct filesystem or network access |
| **Portability** | Same binary runs on any OS |
| **Performance** | Near-native execution speed |
| **Determinism** | Reproducible execution across environments |

## Sandbox Architecture

\`\`\`
┌─────────────────────────────────┐
│         Nexus OS Runtime        │
├─────────┬─────────┬─────────────┤
│ Agent A │ Agent B │  Agent C    │
│ (WASM)  │ (WASM)  │  (WASM)     │
├─────────┴─────────┴─────────────┤
│       WASM Sandbox Layer        │
│  Memory isolation │ Syscall     │
│  Resource limits  │ filtering   │
└─────────────────────────────────┘
\`\`\`

## Memory Limits

Configure per-agent or globally:

\`\`\`yaml
# Global default
execution:
  memoryLimit: 256MB

# Per-agent override
agents:
  researcher:
    execution:
      memoryLimit: 512MB
\`\`\`

## Host Functions

Agents can call these host-provided functions:

| Function | Description |
|---|---|
| \`log(msg)\` | Write to agent log |
| \`http_get(url)\` | Make HTTP GET request |
| \`http_post(url, body)\` | Make HTTP POST request |
| \`kv_get(key)\` | Read from key-value store |
| \`kv_set(key, value)\` | Write to key-value store |
| \`time_now()\` | Get current timestamp |

## Building WASM Agents

Agents can be written in any language that compiles to WASM:

\`\`\`bash
# Rust
cargo build --target wasm32-wasi --release

# Go
GOOS=wasip1 GOARCH=wasm go build -o agent.wasm

# AssemblyScript
asc agent.ts --outFile agent.wasm
\`\`\``,
      },
    ],
  },
  {
    slug: "orchestration",
    title: "Orchestration",
    icon: "network",
    pages: [
      {
        slug: "supervisors",
        title: "Supervisors",
        content: `# Supervisors

Supervisors monitor agents and automatically restart them on failure. Inspired by Erlang/OTP supervision trees, they provide fault tolerance for your agent systems.

## Strategies

| Strategy | Behavior |
|---|---|
| \`one-for-one\` | Restart only the failed agent |
| \`one-for-all\` | Restart all children if one fails |
| \`rest-for-one\` | Restart failed agent and all agents started after it |

## Creating a Supervisor

\`\`\`bash
# Create supervisor with strategy
naos supervisor create main --strategy one-for-one --max-restarts 3

# Add child agents
naos supervisor add main researcher
naos supervisor add main analyzer

# Start the supervisor (starts all children)
naos supervisor start main
\`\`\`

## Supervisor Tree

View the supervision tree:

\`\`\`bash
naos supervisor status main
\`\`\`

Output:

\`\`\`
SUPERVISOR: main
Strategy: one-for-one | Max Restarts: 3 | Status: running

CHILDREN:
  ├── researcher  running   4h 12m
  └── analyzer    running   4h 12m

RESTARTS: 0/3
\`\`\`

## Configuration

Define supervisors in \`nexus.config.yaml\`:

\`\`\`yaml
supervisors:
  main:
    strategy: one-for-one
    maxRestarts: 3
    children:
      - researcher
      - analyzer
  pipeline:
    strategy: rest-for-one
    maxRestarts: 5
    children:
      - fetcher
      - processor
      - writer
\`\`\`

## Restart Behavior

When an agent fails:

1. Supervisor detects the failure
2. Applies the restart strategy
3. Increments the restart counter
4. If max restarts exceeded, supervisor itself fails
5. Parent supervisor (if any) handles the failure

## Nested Supervisors

Supervisors can supervise other supervisors:

\`\`\`bash
naos supervisor create root --strategy one-for-one
naos supervisor add root main
naos supervisor add root pipeline
naos supervisor start root
\`\`\``,
      },
      {
        slug: "sagas",
        title: "Sagas",
        content: `# Sagas

Sagas are multi-step transactions with automatic compensation (rollback) on failure. Use them when you need all-or-nothing execution across multiple agents.

## How Sagas Work

\`\`\`
Step 1 → Step 2 → Step 3 → Success
  ↓         ↓         ↓
Comp 1 ← Comp 2 ← Comp 3 ← Failure
\`\`\`

Each step has a forward action and a compensation (undo) action. If any step fails, all previously completed steps are compensated in reverse order.

## Creating a Saga

\`\`\`bash
# Create the saga
naos saga create order-process

# Add steps (each step maps to an agent)
naos saga add-step order-process validator
naos saga add-step order-process processor
naos saga add-step order-process notifier
\`\`\`

## Running a Saga

\`\`\`bash
naos saga run order-process
\`\`\`

Output:

\`\`\`
[saga] order-process starting
[step 1/3] validator    ✓ completed (1.2s)
[step 2/3] processor    ✓ completed (3.4s)
[step 3/3] notifier     ✓ completed (0.8s)
[saga] order-process completed successfully (5.4s)
\`\`\`

## Saga Failure & Compensation

If step 2 fails:

\`\`\`
[saga] order-process starting
[step 1/3] validator    ✓ completed (1.2s)
[step 2/3] processor    ✗ failed (2.1s)
[compensate] validator  ✓ rolled back
[saga] order-process failed, all steps compensated
\`\`\`

## Viewing Saga History

\`\`\`bash
naos saga history order-process
\`\`\`

| Run | Status | Steps | Duration |
|---|---|---|---|
| #3 | completed | 3/3 | 5.4s |
| #2 | compensated | 1/3 | 3.3s |
| #1 | completed | 3/3 | 6.1s |`,
      },
      {
        slug: "workflows",
        title: "Workflows",
        content: `# Workflows

Workflows are sequential pipelines where each step's output feeds into the next step's input. Unlike sagas, workflows don't have compensation — they're designed for data processing pipelines.

## Creating a Workflow

\`\`\`bash
# Create the workflow
naos workflow create data-pipeline

# Add steps in order
naos workflow add-step data-pipeline fetcher
naos workflow add-step data-pipeline transformer
naos workflow add-step data-pipeline loader
\`\`\`

## Running a Workflow

\`\`\`bash
naos workflow run data-pipeline
\`\`\`

Output:

\`\`\`
[workflow] data-pipeline starting
[step 1/3] fetcher       ✓ completed (2.1s) → 1.2MB
[step 2/3] transformer   ✓ completed (4.3s) → 0.8MB
[step 3/3] loader        ✓ completed (1.5s) → done
[workflow] data-pipeline completed (7.9s)
\`\`\`

## Workflow vs Saga

| Feature | Workflow | Saga |
|---|---|---|
| **Purpose** | Data pipelines | Transactions |
| **Data flow** | Output → Input chaining | Independent steps |
| **On failure** | Stops at failed step | Compensates all previous |
| **Use case** | ETL, processing | Orders, bookings |

## Viewing Workflow Status

\`\`\`bash
naos workflow status data-pipeline
\`\`\`

\`\`\`
WORKFLOW: data-pipeline
Steps: 3 | Last Run: completed | Duration: 7.9s

PIPELINE:
  [1] fetcher       → [2] transformer → [3] loader
\`\`\`

## Workflow History

\`\`\`bash
naos workflow history data-pipeline
\`\`\``,
      },
      {
        slug: "pools",
        title: "Pools",
        content: `# Pools

Pools run multiple agents in parallel and collect their results. Use pools when you need concurrent execution of independent tasks.

## Creating a Pool

\`\`\`bash
# Create the pool
naos pool create research-pool

# Add agents to the pool
naos pool add research-pool web-scraper
naos pool add research-pool api-fetcher
naos pool add research-pool db-reader
\`\`\`

## Running a Pool

\`\`\`bash
naos pool run research-pool
\`\`\`

Output:

\`\`\`
[pool] research-pool starting (3 agents)
[parallel] web-scraper   ✓ completed (3.2s)
[parallel] api-fetcher   ✓ completed (1.8s)
[parallel] db-reader     ✓ completed (0.9s)
[pool] research-pool completed (3.2s, all 3 succeeded)
\`\`\`

## Pool Behavior

All agents in a pool run simultaneously. The pool completes when all agents finish (or fail).

| Scenario | Behavior |
|---|---|
| All succeed | Pool status: completed |
| Some fail | Pool status: partial (shows which failed) |
| All fail | Pool status: failed |

## Pool Status

\`\`\`bash
naos pool status research-pool
\`\`\`

\`\`\`
POOL: research-pool
Members: 3 | Last Run: completed | Duration: 3.2s

AGENTS:
  ├── web-scraper   ✓ 3.2s
  ├── api-fetcher   ✓ 1.8s
  └── db-reader     ✓ 0.9s
\`\`\`

## When to Use Pools

- Fetching data from multiple sources simultaneously
- Running independent analysis tasks in parallel
- Load testing with multiple concurrent agents
- Fan-out/fan-in processing patterns`,
      },
    ],
  },
  {
    slug: "cost-control",
    title: "Cost Control",
    icon: "dollar",
    pages: [
      {
        slug: "budgets",
        title: "Budgets",
        content: `# Cost Budgets

Nexus OS tracks every API call, LLM token, and resource usage. Set budgets to prevent runaway costs.

## Setting a Budget

\`\`\`bash
# Set a daily budget for an agent
naos cost set researcher --budget 10.00 --period day

# Set a monthly budget
naos cost set researcher --budget 200.00 --period month
\`\`\`

## Viewing Costs

\`\`\`bash
naos cost status
\`\`\`

Output:

\`\`\`
AGENT       BUDGET      SPENT     REMAINING   PERIOD
researcher  $10.00/day  $3.42     $6.58       resets in 8h
analyzer    $5.00/day   $1.20     $3.80       resets in 8h
planner     $20.00/day  $0.00     $20.00      resets in 8h
─────────────────────────────────────────────────
TOTAL       $35.00/day  $4.62     $30.38
\`\`\`

## Budget Enforcement

When an agent hits its budget limit, the configured action is taken:

| Action | Behavior |
|---|---|
| \`pause\` | Agent is paused until budget resets |
| \`warn\` | Warning logged, agent continues |
| \`stop\` | Agent is stopped permanently |
| \`throttle\` | Agent rate-limited to 10% capacity |

## Configuration

\`\`\`yaml
cost:
  budget: "$100/day"
  alertAt: 80        # alert at 80% usage
  action: pause      # what to do at 100%

agents:
  researcher:
    cost:
      budget: "$10/day"
      action: throttle
\`\`\`

## Resetting Costs

Manually reset an agent's spend counter:

\`\`\`bash
naos cost reset researcher
\`\`\``,
      },
      {
        slug: "alerts",
        title: "Alerts",
        content: `# Cost Alerts

Get notified before agents hit their budget limits.

## Alert Thresholds

Configure when alerts fire in \`nexus.config.yaml\`:

\`\`\`yaml
cost:
  budget: "$100/day"
  alertAt: 80    # fires at 80% of budget
\`\`\`

## Alert Output

When an agent reaches the alert threshold:

\`\`\`
[cost] WARNING: researcher at 82% of daily budget ($8.20/$10.00)
[cost] WARNING: 1h 45m until budget reset
\`\`\`

## Multiple Thresholds

Set multiple alert levels:

\`\`\`yaml
cost:
  alerts:
    - at: 50
      action: log
    - at: 80
      action: warn
    - at: 95
      action: throttle
    - at: 100
      action: pause
\`\`\`

## Dashboard Alerts

The web dashboard shows cost alerts in real-time on the Cost page. Agents approaching their budget are highlighted in amber; agents at or over budget are highlighted in red.

## Audit Trail

All cost events are recorded in the audit log:

\`\`\`bash
naos audit --filter cost
\`\`\`

\`\`\`
TIME                  AGENT       ACTION          DETAIL
2024-01-15 14:30:00  researcher  cost.alert      82% of $10.00/day
2024-01-15 15:45:00  researcher  cost.throttle   95% of $10.00/day
2024-01-15 16:00:00  researcher  cost.pause      100% of $10.00/day
\`\`\``,
      },
      {
        slug: "optimization",
        title: "Optimization",
        content: `# Cost Optimization

Strategies for reducing agent costs without sacrificing capability.

## Broker Routing

The biggest cost saver is the Broker Routing engine. Instead of sending every task to an LLM, the broker tries cheaper options first:

\`\`\`
Task → Skill Match (free) → WASM Handler ($0.001) → LLM ($0.03+)
\`\`\`

Enable broker routing:

\`\`\`yaml
broker:
  enabled: true
  routing:
    preferSkill: true
    llmAsLastResort: true
\`\`\`

## Cost Savings Breakdown

| Route | Avg Cost | Speed |
|---|---|---|
| Skill match | $0.00 | <1ms |
| WASM handler | ~$0.001 | ~10ms |
| LLM fallback | ~$0.03 | ~2s |

With broker routing enabled, typical projects see **40-60% cost reduction**.

## Caching

Enable response caching to avoid duplicate LLM calls:

\`\`\`yaml
broker:
  cache:
    enabled: true
    ttl: 3600    # cache for 1 hour
\`\`\`

## Right-Sizing Budgets

Use the dashboard to analyze actual spending patterns:

\`\`\`bash
naos dashboard --open
\`\`\`

Navigate to the Cost page to see:
- Per-agent spending over time
- Peak usage periods
- Budget utilization rates

## Tips

1. **Start with generous budgets** and tighten based on actual usage
2. **Use skill handlers** for repetitive tasks (summarize, classify, extract)
3. **Enable caching** for idempotent operations
4. **Monitor the dashboard** weekly to identify optimization opportunities
5. **Use throttle instead of pause** to maintain availability at reduced capacity`,
      },
    ],
  },
  {
    slug: "trust",
    title: "Trust & AXIS",
    icon: "shield",
    pages: [
      {
        slug: "axis-integration",
        title: "AXIS Integration",
        content: `# AXIS Integration

AXIS (Agent eXchange & Identity Standard) is a decentralized trust protocol for AI agents. Nexus OS integrates with AXIS to verify agent identity and trustworthiness.

## What is AXIS?

AXIS provides:
- **Unique Agent IDs (AUIDs)** — globally unique identifiers for agents
- **Trust Scores (T-Score)** — reputation scores based on agent behavior
- **Trust Tiers (T1-T5)** — classification levels based on verification depth
- **Public Directory** — searchable registry of verified agents

## Enabling AXIS

Add your AXIS API key and configure trust requirements:

\`\`\`yaml
trust:
  provider: axis
  requirements:
    minTrustTier: T3
    minTScore: 70
\`\`\`

\`\`\`bash
export AXIS_API_KEY="your-api-key-here"
\`\`\`

## Registering an Agent

\`\`\`bash
naos axis register researcher
\`\`\`

Output:

\`\`\`
[axis] Registering agent: researcher
[axis] AUID assigned: axis://agent/researcher/a1b2c3d4
[axis] Initial trust tier: T1 (unverified)
[axis] Submit verification at https://axis.nexus/verify/a1b2c3d4
\`\`\`

## Trust Tiers

| Tier | Name | Requirements |
|---|---|---|
| T1 | Unverified | Registration only |
| T2 | Basic | Email verification |
| T3 | Standard | Identity verification + code audit |
| T4 | Enhanced | Continuous monitoring + security audit |
| T5 | Certified | Full certification + insurance bond |`,
      },
      {
        slug: "verification",
        title: "Verification",
        content: `# Agent Verification

Verify agents before trusting them with sensitive tasks.

## Verifying an Agent

\`\`\`bash
naos axis verify axis://agent/researcher/a1b2c3d4
\`\`\`

Output:

\`\`\`
AXIS VERIFICATION REPORT
─────────────────────────
Agent:       researcher
AUID:        axis://agent/researcher/a1b2c3d4
Trust Tier:  T3 (Standard)
T-Score:     82/100
Verified:    2024-01-10

CHECKS:
  ✓ Identity verified
  ✓ Code audit passed
  ✓ No known vulnerabilities
  ✓ Behavior within norms
  ✗ Continuous monitoring (T4 required)
\`\`\`

## Verification in Config

Require minimum trust levels for your project:

\`\`\`yaml
trust:
  provider: axis
  requirements:
    minTrustTier: T3
    minTScore: 70
\`\`\`

With this config, any agent below T3 or with a T-Score under 70 will be rejected.

## Checking Trust Status

\`\`\`bash
naos axis status researcher
\`\`\`

## Browsing the Directory

Search the public AXIS directory for verified agents:

\`\`\`bash
naos axis directory
naos axis directory --search "data analysis"
naos axis directory --tier T4
\`\`\`

## Trust Cache

Verification results are cached locally to avoid repeated API calls:

\`\`\`bash
# View cached verifications
naos axis cache

# Clear the cache
naos axis cache --clear
\`\`\``,
      },
      {
        slug: "trust-tiers",
        title: "Trust Tiers",
        content: `# Trust Tiers

AXIS defines five trust tiers that represent increasing levels of agent verification and trustworthiness.

## Tier Overview

| Tier | Name | T-Score Range | Requirements |
|---|---|---|---|
| T1 | Unverified | 0-20 | Registration only |
| T2 | Basic | 21-50 | Email + basic identity |
| T3 | Standard | 51-75 | Full identity + code audit |
| T4 | Enhanced | 76-90 | Continuous monitoring + security audit |
| T5 | Certified | 91-100 | Full certification + insurance bond |

## T1 — Unverified

Any agent can register and receive a T1 rating. No verification is performed.

**Use case:** Development, testing, internal tools.

## T2 — Basic

Requires email verification and basic identity confirmation.

**Use case:** Low-risk tasks, public data access.

## T3 — Standard

Requires full identity verification and a code audit. The agent's source code is reviewed for security issues.

**Use case:** Business operations, API integrations, data processing.

## T4 — Enhanced

Adds continuous behavioral monitoring and a comprehensive security audit. The agent is actively monitored for anomalies.

**Use case:** Financial operations, sensitive data handling, customer-facing tasks.

## T5 — Certified

The highest trust level. Requires full certification by an AXIS-approved auditor and an insurance bond.

**Use case:** Healthcare, legal, financial compliance, critical infrastructure.

## Choosing a Minimum Tier

| Your Use Case | Recommended Minimum |
|---|---|
| Development/Testing | T1 |
| Internal tools | T2 |
| Business operations | T3 |
| Sensitive data | T4 |
| Regulated industry | T5 |`,
      },
    ],
  },
  {
    slug: "broker",
    title: "Broker Routing",
    icon: "route",
    pages: [
      {
        slug: "routing",
        title: "Routing Engine",
        content: `# Broker Routing Engine

The Broker routes tasks to the most cost-effective handler. It tries cheaper options first before falling back to expensive LLM calls.

## Routing Cascade

\`\`\`
Incoming Task
     │
     ▼
┌─────────────┐
│ Skill Match  │ ← Pattern matching against registered skills
│ (free, <1ms) │
└──────┬──────┘
       │ no match
       ▼
┌─────────────┐
│ WASM Handler │ ← Execute local WASM binary
│ (~$0.001)    │
└──────┬──────┘
       │ no handler
       ▼
┌─────────────┐
│ LLM Fallback │ ← Send to language model API
│ (~$0.03+)    │
└─────────────┘
\`\`\`

## How Skill Matching Works

The broker compares the incoming task against registered skill patterns:

\`\`\`yaml
skills:
  - name: summarize
    handler: ./skills/summarize.wasm
    patterns:
      - summarize
      - summary
      - tldr
  - name: classify
    handler: ./skills/classify.wasm
    patterns:
      - classify
      - categorize
      - label
\`\`\`

When a task like "summarize the quarterly report" arrives, the broker:

1. Tokenizes the task string
2. Matches against skill patterns
3. Calculates a confidence score (0.0 - 1.0)
4. Routes to the skill if confidence >= threshold (default 0.7)

## Testing Routes

Preview where a task would be routed without executing:

\`\`\`bash
naos broker route "summarize the quarterly report"
\`\`\`

Output:

\`\`\`
ROUTING DECISION
Task:       "summarize the quarterly report"
Route:      skill → summarize
Confidence: 0.93
Est. Cost:  $0.00
Est. Time:  <1ms
\`\`\`

## Configuration

\`\`\`yaml
broker:
  enabled: true
  routing:
    preferSkill: true
    llmAsLastResort: true
    confidenceThreshold: 0.7
\`\`\``,
      },
      {
        slug: "skills",
        title: "Skills",
        content: `# Broker Skills

Skills are lightweight, pattern-matched handlers that process tasks without LLM calls.

## Registering Skills

Define skills in \`nexus.config.yaml\`:

\`\`\`yaml
skills:
  - name: summarize
    handler: ./skills/summarize.wasm
    patterns:
      - summarize
      - summary
      - tldr
    description: "Summarize text content"

  - name: classify
    handler: ./skills/classify.wasm
    patterns:
      - classify
      - categorize
      - label
    description: "Classify text into categories"

  - name: extract
    handler: ./skills/extract.wasm
    patterns:
      - extract
      - parse
      - pull out
    description: "Extract structured data from text"

  - name: translate
    handler: ./skills/translate.wasm
    patterns:
      - translate
      - convert to
    description: "Translate between languages"
\`\`\`

## Listing Skills

\`\`\`bash
naos broker skills
\`\`\`

Output:

\`\`\`
REGISTERED SKILLS
SKILL       HANDLER                    PATTERNS
summarize   ./skills/summarize.wasm    summarize, summary, tldr
classify    ./skills/classify.wasm     classify, categorize, label
extract     ./skills/extract.wasm      extract, parse, pull out
translate   ./skills/translate.wasm    translate, convert to
\`\`\`

## Building Custom Skills

Skills are WASM binaries that implement a simple interface:

\`\`\`rust
// skill interface
fn handle(input: &str) -> Result<String, Error> {
    // process the input
    Ok(result)
}
\`\`\`

Compile to WASM and register in your config:

\`\`\`bash
cargo build --target wasm32-wasi --release
cp target/wasm32-wasi/release/my_skill.wasm ./skills/
\`\`\`

## Skill vs LLM Comparison

| Aspect | Skill | LLM |
|---|---|---|
| Cost | Free | $0.03+ per call |
| Latency | <1ms | 1-5 seconds |
| Accuracy | High for defined patterns | General purpose |
| Flexibility | Limited to patterns | Any task |`,
      },
      {
        slug: "llm-fallback",
        title: "LLM Fallback",
        content: `# LLM Fallback

When no skill or WASM handler matches a task, the broker falls back to an LLM (Language Model) API.

## How It Works

The LLM fallback is the last resort in the routing cascade:

1. **Skill match** — check registered patterns (free)
2. **WASM handler** — try local WASM execution (~$0.001)
3. **LLM fallback** — send to language model API (~$0.03+)

## Configuration

\`\`\`yaml
broker:
  enabled: true
  routing:
    llmAsLastResort: true
    llmProvider: anthropic
    llmModel: claude-3-haiku
\`\`\`

Set your API key:

\`\`\`bash
export ANTHROPIC_API_KEY="your-key-here"
\`\`\`

## Cost Tracking

Every LLM call is tracked in the cost system:

\`\`\`bash
naos broker stats
\`\`\`

Output:

\`\`\`
BROKER STATISTICS (today)
─────────────────────────
Total tasks:     142
Skill matches:   89 (63%)
WASM handlers:   31 (22%)
LLM fallbacks:   22 (15%)

Cost savings:    $3.51 (vs all-LLM)
Avg latency:     45ms (vs 2.1s all-LLM)
\`\`\`

## Reducing LLM Usage

To minimize expensive LLM calls:

1. **Add more skills** — cover common task patterns
2. **Lower confidence threshold** — match more tasks to skills
3. **Add WASM handlers** — for complex but deterministic tasks
4. **Enable caching** — avoid duplicate LLM calls

\`\`\`yaml
broker:
  routing:
    confidenceThreshold: 0.6   # lower = more skill matches
  cache:
    enabled: true
    ttl: 3600
\`\`\``,
      },
    ],
  },
  {
    slug: "edge",
    title: "Edge Deployment",
    icon: "globe",
    pages: [
      {
        slug: "cloudflare-deploy",
        title: "Cloudflare Deploy",
        content: `# Cloudflare Edge Deployment

Deploy agents to Cloudflare's global edge network for low-latency execution in 300+ locations worldwide.

## Prerequisites

1. A Cloudflare account with Workers enabled
2. Your Account ID and API Token

## Authentication

\`\`\`bash
naos edge login
\`\`\`

You'll be prompted for your Cloudflare credentials:

\`\`\`
Cloudflare Account ID: your-account-id
Cloudflare API Token: your-api-token
[edge] Credentials stored securely
[edge] Account verified ✓
\`\`\`

Or set via environment variables:

\`\`\`bash
export CF_ACCOUNT_ID="your-account-id"
export CF_API_TOKEN="your-api-token"
\`\`\`

## Deploying an Agent

\`\`\`bash
naos edge deploy researcher
\`\`\`

Output:

\`\`\`
[edge] Packaging agent: researcher
[edge] Compiling to Cloudflare Workers format
[edge] Creating Durable Object namespace
[edge] Uploading worker bundle (142KB)
[edge] Configuring routes
[edge] ✓ Deployed to Cloudflare Edge
[edge] URL: https://researcher.your-subdomain.workers.dev
[edge] Regions: 300+ locations worldwide
\`\`\`

## Listing Deployments

\`\`\`bash
naos edge list
\`\`\`

\`\`\`
EDGE DEPLOYMENTS
AGENT       STATUS    REGIONS   URL
researcher  active    global    researcher.your-subdomain.workers.dev
analyzer    active    global    analyzer.your-subdomain.workers.dev
\`\`\`

## Configuration

\`\`\`yaml
edge:
  provider: cloudflare
  regions:
    - us
    - eu
    - asia
  durableObjects: true
  routes:
    - pattern: "api.example.com/research/*"
      agent: researcher
\`\`\``,
      },
      {
        slug: "durable-objects",
        title: "Durable Objects",
        content: `# Durable Objects

Durable Objects provide persistent state for edge-deployed agents. Each agent instance gets its own isolated storage that persists across requests.

## What Are Durable Objects?

Cloudflare Durable Objects are:
- **Stateful** — maintain state between requests
- **Consistent** — strong consistency guarantees
- **Global** — automatically placed near users
- **Isolated** — each instance is independent

## How Nexus OS Uses Them

When you deploy an agent to the edge, Nexus OS automatically creates a Durable Object namespace for it:

\`\`\`
Agent (WASM) → Cloudflare Worker → Durable Object (state)
\`\`\`

The agent can read and write state that persists across invocations:

\`\`\`
Request 1: agent processes task, saves state
Request 2: agent reads previous state, continues work
\`\`\`

## Enabling Durable Objects

\`\`\`yaml
edge:
  provider: cloudflare
  durableObjects: true
\`\`\`

## State API

Edge-deployed agents can use these state functions:

| Function | Description |
|---|---|
| \`state_get(key)\` | Read a value from persistent storage |
| \`state_put(key, value)\` | Write a value to persistent storage |
| \`state_delete(key)\` | Delete a value from storage |
| \`state_list(prefix)\` | List keys with a given prefix |

## Limitations

| Limit | Value |
|---|---|
| Storage per object | 256KB (free) / 10GB (paid) |
| Request duration | 30 seconds |
| Concurrent requests | Serialized per object |
| Objects per namespace | Unlimited |`,
      },
      {
        slug: "global-distribution",
        title: "Global Distribution",
        content: `# Global Distribution

Edge-deployed agents run in Cloudflare's network of 300+ data centers worldwide, ensuring low latency for users everywhere.

## How It Works

When a request arrives:

1. Cloudflare routes it to the nearest data center
2. The agent's Worker executes locally
3. If state is needed, the Durable Object is accessed
4. Response is returned with minimal latency

## Region Configuration

Control where your agents are deployed:

\`\`\`yaml
edge:
  regions:
    - us        # North America
    - eu        # Europe
    - asia      # Asia Pacific
    - global    # All regions (default)
\`\`\`

## Latency Comparison

| Deployment | Avg Latency | P99 Latency |
|---|---|---|
| Local only | 50-200ms (same region) | 500ms+ (cross-region) |
| Edge (global) | 10-30ms | 50ms |

## Monitoring Edge Performance

\`\`\`bash
naos edge status researcher
\`\`\`

\`\`\`
EDGE STATUS: researcher
Status:     active
Regions:    global (300+ locations)
Requests:   12,847 (last 24h)
Avg Latency: 18ms
Error Rate:  0.02%

TOP REGIONS:
  US East     4,231 requests   12ms avg
  EU West     3,102 requests   15ms avg
  Asia East   2,891 requests   22ms avg
  US West     1,823 requests   14ms avg
  Other         800 requests   28ms avg
\`\`\`

## Edge Logs

Stream logs from edge deployments:

\`\`\`bash
naos edge logs researcher
naos edge logs researcher --follow
naos edge logs researcher --region us
\`\`\`

## Undeploying

Remove an agent from the edge:

\`\`\`bash
naos edge undeploy researcher
\`\`\``,
      },
    ],
  },
  {
    slug: "dashboard",
    title: "Dashboard",
    icon: "layout",
    pages: [
      {
        slug: "overview",
        title: "Dashboard Overview",
        content: `# Dashboard Overview

The Nexus OS dashboard is a built-in web interface for monitoring and managing your agent system. It provides real-time visibility into agents, supervisors, costs, trust, and more.

## Starting the Dashboard

\`\`\`bash
naos dashboard --open
\`\`\`

Options:

| Flag | Description | Default |
|---|---|---|
| \`--port\` | Port to serve on | 4200 |
| \`--open\` | Open browser automatically | false |

## Dashboard Pages

The dashboard includes 11 pages:

| Page | Description |
|---|---|
| **Overview** | System summary with key metrics |
| **Agents** | All registered agents with status |
| **Supervisors** | Supervision trees and restart counts |
| **Sagas** | Saga definitions and execution history |
| **Workflows** | Workflow pipelines and run history |
| **Pools** | Pool configurations and parallel execution results |
| **Cost** | Budget utilization, spending trends |
| **Audit Log** | Complete audit trail of all actions |
| **AXIS Trust** | Trust scores and verification status |
| **Broker** | Routing statistics and skill usage |
| **Edge** | Edge deployment status and metrics |

## Features

- **Auto-refresh** — pages update every 10 seconds
- **Dark theme** — terminal-inspired aesthetic with green accents
- **Sidebar navigation** — quick access to all pages
- **Responsive** — works on desktop and tablet

## Architecture

The dashboard is served by the \`naos\` binary itself using Axum. All HTML is server-rendered using the Maud templating engine. No JavaScript framework required.

\`\`\`
naos dashboard
     │
     ▼
Axum HTTP Server (port 4200)
     │
     ├── HTML pages (Maud templates)
     └── JSON API endpoints
\`\`\``,
      },
      {
        slug: "api-reference",
        title: "API Reference",
        content: `# Dashboard API Reference

The dashboard exposes JSON API endpoints for programmatic access to your agent system data.

## Base URL

\`\`\`
http://localhost:4200/api
\`\`\`

## Endpoints

### GET /api/agents

Returns all registered agents.

\`\`\`bash
curl http://localhost:4200/api/agents | jq
\`\`\`

\`\`\`json
{
  "agents": [
    {
      "name": "researcher",
      "status": "running",
      "source": "./agents/researcher.wasm",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
\`\`\`

### GET /api/supervisors

Returns all supervisors and their children.

\`\`\`bash
curl http://localhost:4200/api/supervisors | jq
\`\`\`

### GET /api/cost

Returns cost budgets and spending data.

\`\`\`bash
curl http://localhost:4200/api/cost | jq
\`\`\`

\`\`\`json
{
  "budgets": [
    {
      "agent_name": "researcher",
      "budget_cents": 1000,
      "spent_cents": 342,
      "period": "day",
      "action": "pause"
    }
  ]
}
\`\`\`

### GET /api/audit

Returns the audit log.

\`\`\`bash
curl http://localhost:4200/api/audit | jq
\`\`\`

### GET /api/trust

Returns AXIS trust verification data.

\`\`\`bash
curl http://localhost:4200/api/trust | jq
\`\`\`

### GET /api/broker

Returns broker routing statistics and skills.

\`\`\`bash
curl http://localhost:4200/api/broker | jq
\`\`\`

### GET /api/edge

Returns edge deployment data.

\`\`\`bash
curl http://localhost:4200/api/edge | jq
\`\`\`

## Authentication

The dashboard API currently has no authentication. It binds to \`127.0.0.1\` by default, making it accessible only from the local machine.

## Rate Limits

No rate limits are enforced on the local API.`,
      },
    ],
  },
  {
    slug: "cli-reference",
    title: "CLI Reference",
    icon: "terminal",
    pages: [
      {
        slug: "all-commands",
        title: "All Commands",
        content: `# CLI Reference

Complete list of all \`naos\` commands.

## Core Commands

| Command | Description |
|---|---|
| \`naos init <project>\` | Create a new project directory |
| \`naos create <agent>\` | Create a new agent |
| \`naos run <agent>\` | Start an agent |
| \`naos stop <agent>\` | Stop an agent |
| \`naos status\` | Show all agents and their status |
| \`naos logs <agent>\` | View agent logs |
| \`naos dashboard\` | Start the web dashboard |
| \`naos config validate\` | Validate nexus.config.yaml |

## Supervisor Commands

| Command | Description |
|---|---|
| \`naos supervisor create <name>\` | Create a new supervisor |
| \`naos supervisor add <sup> <agent>\` | Add a child agent to a supervisor |
| \`naos supervisor start <name>\` | Start a supervisor and all children |
| \`naos supervisor stop <name>\` | Stop a supervisor and all children |
| \`naos supervisor status <name>\` | Show supervisor tree and status |

## Saga Commands

| Command | Description |
|---|---|
| \`naos saga create <name>\` | Create a new saga |
| \`naos saga add-step <saga> <agent>\` | Add a step to a saga |
| \`naos saga run <name>\` | Execute a saga |
| \`naos saga history <name>\` | Show saga execution history |

## Workflow Commands

| Command | Description |
|---|---|
| \`naos workflow create <name>\` | Create a new workflow |
| \`naos workflow add-step <wf> <agent>\` | Add a step to a workflow |
| \`naos workflow run <name>\` | Execute a workflow |
| \`naos workflow status <name>\` | Show workflow pipeline status |

## Pool Commands

| Command | Description |
|---|---|
| \`naos pool create <name>\` | Create a new agent pool |
| \`naos pool add <pool> <agent>\` | Add an agent to a pool |
| \`naos pool run <name>\` | Execute all agents in parallel |
| \`naos pool status <name>\` | Show pool status and results |

## Cost Commands

| Command | Description |
|---|---|
| \`naos cost set <agent>\` | Set a cost budget for an agent |
| \`naos cost status\` | Show all cost budgets and spending |
| \`naos cost reset <agent>\` | Reset an agent's spend counter |

## AXIS Trust Commands

| Command | Description |
|---|---|
| \`naos axis register <agent>\` | Register an agent with AXIS |
| \`naos axis verify <auid>\` | Verify an agent's trust status |
| \`naos axis status <agent>\` | Show an agent's trust score |
| \`naos axis directory\` | Browse the public agent directory |
| \`naos axis cache\` | View cached verifications |

## Broker Commands

| Command | Description |
|---|---|
| \`naos broker route "<task>"\` | Preview routing decision |
| \`naos broker execute "<task>"\` | Route and execute a task |
| \`naos broker stats\` | Show routing statistics |
| \`naos broker skills\` | List registered skills |
| \`naos broker config\` | Show broker configuration |

## Edge Commands

| Command | Description |
|---|---|
| \`naos edge login\` | Authenticate with Cloudflare |
| \`naos edge deploy <agent>\` | Deploy an agent to the edge |
| \`naos edge list\` | List all edge deployments |
| \`naos edge status <agent>\` | Show edge deployment status |
| \`naos edge logs <agent>\` | Stream edge deployment logs |
| \`naos edge undeploy <agent>\` | Remove an agent from the edge |

## Global Flags

| Flag | Description |
|---|---|
| \`--help\` | Show help for any command |
| \`--version\` | Show version information |
| \`--verbose\` | Enable verbose output |
| \`--quiet\` | Suppress non-essential output |`,
      },
    ],
  },
  {
    slug: "changelog",
    title: "Changelog",
    icon: "history",
    pages: [
      {
        slug: "releases",
        title: "All Releases",
        content: `# Changelog

All notable changes to Nexus OS are documented here. This project follows [Semantic Versioning](https://semver.org/).

---

## v0.1.0 — Phase 1 Release (2025-04-11)

**The foundation release.** Everything you need to create, supervise, and scale AI agents from a single CLI.

### Core Engine
- Agent lifecycle management: create, start, stop, restart, destroy
- Template system with 5 built-in templates (research, code, data, chat, custom)
- WASM sandbox isolation for agent execution
- SQLite-backed persistent state store
- Project initialization with \`naos init\`
- YAML-based configuration (\`nexus.config.yaml\`)

### Orchestration Primitives
- **Supervisors** — one-for-one, one-for-all, rest-for-one restart strategies
- **Sagas** — distributed transactions with compensating rollbacks
- **Workflows** — sequential and parallel step execution with retry policies
- **Agent Pools** — round-robin, least-loaded, and random scheduling

### Cost Control
- Per-agent and global token budgets with hard/soft limits
- Real-time spend tracking across all LLM providers
- Budget alerts at configurable thresholds (50%, 80%, 90%)
- Cost action policies: warn, throttle, pause, kill
- Spending history and analytics

### Trust & AXIS
- AXIS trust verification protocol integration
- Trust tier system: unverified, basic, standard, verified, trusted
- Cryptographic identity verification for agents
- Trust score caching with configurable TTL
- Automatic trust-based access control

### Broker Routing
- Skill-based task routing with pattern matching
- Three-tier routing cascade: Skill → WASM → LLM
- Configurable confidence thresholds (default 0.9)
- Routing statistics and cost savings tracking
- 5 CLI commands: \`broker route\`, \`execute\`, \`stats\`, \`config\`, \`skills\`

### Cloudflare Edge Deployment
- Deploy agents as Cloudflare Workers
- Durable Objects for persistent agent state
- Global distribution across 300+ edge locations
- Edge deployment management: deploy, list, status, logs, undeploy
- Simulation mode for testing without live credentials

### Web Dashboard
- 11 server-rendered HTML pages (Overview, Agents, Supervisors, Sagas, Workflows, Pools, Cost, Audit, Trust, Broker, Edge)
- 7 JSON API endpoints for programmatic access
- Terminal/hacker aesthetic with auto-refresh
- \`naos dashboard --port 4200 --open\`

### Audit Trail
- Append-only audit log for all agent actions
- Timestamped entries with agent ID, action type, and detail
- Queryable via CLI and dashboard

### CLI
- 40+ commands across 8 command groups
- Consistent \`--json\` output flag for scripting
- Color-coded terminal output with progress indicators
- Global flags: \`--help\`, \`--version\`, \`--verbose\`, \`--quiet\`

---

## Roadmap

### v0.2.0 — Planned
- Hot-reload agent configuration without restart
- WebSocket real-time dashboard updates
- Multi-provider LLM support (OpenAI, Anthropic, local models)
- Agent-to-agent messaging protocol
- Plugin system for custom orchestration strategies

### v0.3.0 — Planned
- Distributed mode with multi-node clustering
- Kubernetes operator for cloud-native deployment
- Prometheus metrics exporter
- GraphQL API for dashboard
- Visual workflow builder

### v1.0.0 — Planned
- Stable API with backwards compatibility guarantees
- Comprehensive test suite with >90% coverage
- Performance benchmarks and optimization
- Enterprise features: SSO, RBAC, team management
- Commercial support options`,
      },
    ],
  },
];

// Flatten all pages for navigation
export interface FlatDocPage {
  sectionSlug: string;
  sectionTitle: string;
  pageSlug: string;
  pageTitle: string;
  content: string;
  path: string;
}

export function getFlatPages(): FlatDocPage[] {
  const pages: FlatDocPage[] = [];
  for (const section of DOC_SECTIONS) {
    for (const page of section.pages) {
      pages.push({
        sectionSlug: section.slug,
        sectionTitle: section.title,
        pageSlug: page.slug,
        pageTitle: page.title,
        content: page.content,
        path: `/docs/${section.slug}/${page.slug}`,
      });
    }
  }
  return pages;
}

export function getPageByPath(sectionSlug: string, pageSlug: string): FlatDocPage | undefined {
  return getFlatPages().find(
    (p) => p.sectionSlug === sectionSlug && p.pageSlug === pageSlug
  );
}

export function getAdjacentPages(sectionSlug: string, pageSlug: string) {
  const flat = getFlatPages();
  const idx = flat.findIndex(
    (p) => p.sectionSlug === sectionSlug && p.pageSlug === pageSlug
  );
  return {
    prev: idx > 0 ? flat[idx - 1] : null,
    next: idx < flat.length - 1 ? flat[idx + 1] : null,
  };
}
