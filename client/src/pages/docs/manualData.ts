// Nexus OS User Manual — Authored by Leonidas Esquire Williamson
// Comprehensive documentation for every feature of Nexus OS

export interface ManualPage {
  slug: string;
  title: string;
  content: string;
}

export interface ManualSection {
  slug: string;
  title: string;
  icon: string;
  pages: ManualPage[];
}

export const MANUAL_SECTIONS: ManualSection[] = [
  // ─── INTRODUCTION ──────────────────────────────────────────
  {
    slug: "introduction",
    title: "Introduction",
    icon: "rocket",
    pages: [
      {
        slug: "what-is-nexus",
        title: "What is Nexus OS?",
        content: `# What is Nexus OS?

Nexus OS is an orchestration layer for AI agents. It provides the infrastructure needed to run agents reliably in production.

*Authored by Leonidas Esquire Williamson*

## The Problem

AI agents are powerful but fragile. In production, you face:

- **Crashes** — Agents fail and nobody restarts them
- **Partial failures** — Multi-step tasks fail halfway, leaving broken state
- **Cost overruns** — No budget enforcement, surprise bills
- **Trust issues** — No way to verify if an agent is trustworthy
- **No visibility** — What are your agents doing? Who knows.

## The Solution

Nexus OS handles all of this with a single 10MB binary:

| Problem | Nexus Solution |
|---------|----------------|
| Crashes | Supervisors auto-restart agents |
| Partial failures | Sagas roll back failed transactions |
| Cost overruns | Cost Controller enforces budgets |
| Trust issues | AXIS integration verifies agents |
| No visibility | Dashboard + Audit Log |

## How It Works

\`\`\`
Your Agents
     ↓
┌─────────────────────────────────┐
│          NEXUS OS               │
│  ┌───────────────────────────┐  │
│  │ Orchestration Layer       │  │
│  │ Supervisor│Saga│Workflow  │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ Trust & Cost Layer        │  │
│  │ AXIS │ Cost Controller    │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ Execution Layer           │  │
│  │ WASM Sandbox │ Audit Log  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
     ↓
Production
\`\`\`

## Key Features

- **Single binary** — No dependencies, no containers, no complexity
- **WASM sandbox** — Secure, isolated execution
- **Four orchestration primitives** — Supervisor, Saga, Workflow, Pool
- **Cost controls** — Per-agent budgets with automatic enforcement
- **Trust verification** — AXIS integration for agent verification
- **Edge deployment** — Deploy to Cloudflare's global network
- **Dashboard** — Visual monitoring and management
- **Audit trail** — Complete history of all actions

## What Nexus Is NOT

- **Not an agent framework** — Use LangChain, CrewAI, AutoGen, or any framework. Nexus runs underneath.
- **Not an LLM** — Nexus orchestrates agents that use LLMs.
- **Not a hosting platform** — You run Nexus on your infrastructure (or Cloudflare Edge).`,
      },
      {
        slug: "who-is-it-for",
        title: "Who is it For?",
        content: `# Who is Nexus OS For?

Nexus OS is designed for teams and individuals who run AI agents in production and need reliability, cost control, and visibility.

## Target Users

### Platform Engineers
You're building the infrastructure that AI teams depend on. Nexus gives you:
- Supervisor trees for fault tolerance
- Cost budgets per agent, per team
- Audit logs for compliance
- Edge deployment for global scale

### AI/ML Engineers
You're building agents and need them to run reliably. Nexus gives you:
- Automatic restarts when agents crash
- Saga rollbacks when multi-step tasks fail
- WASM sandboxing for security
- Dashboard for monitoring

### Startup CTOs
You're shipping fast and can't afford downtime. Nexus gives you:
- Single binary, zero infrastructure overhead
- Cost controls to prevent surprise bills
- Trust verification before running third-party agents
- Production-ready from day one

### DevOps / SRE Teams
You're responsible for keeping things running. Nexus gives you:
- Erlang-style supervision trees
- Automatic failure recovery
- Complete audit trail
- Edge deployment to Cloudflare

## Use Cases

| Use Case | Nexus Feature |
|----------|---------------|
| Run agents 24/7 without manual restarts | Supervisors |
| Process orders with rollback on failure | Sagas |
| Build data pipelines with sequential steps | Workflows |
| Fan out tasks to multiple agents | Pools |
| Control spending per agent | Cost Controller |
| Verify third-party agents | AXIS Trust |
| Deploy globally with low latency | Edge Deployment |
| Monitor everything in real-time | Dashboard |

## Prerequisites

To use Nexus OS, you need:
- A computer running macOS, Linux, or Windows (WSL)
- Rust toolchain (for building from source) or just \`curl\` (for binary install)
- AI agents you want to orchestrate (any framework)`,
      },
      {
        slug: "architecture-overview",
        title: "Architecture Overview",
        content: `# Architecture Overview

Nexus OS is structured in layers, each providing a distinct capability. Understanding the architecture helps you make better decisions about how to use each feature.

## Layer Diagram

\`\`\`
┌─────────────────────────────────────────────┐
│                CLI / Dashboard               │
│  naos create │ naos status │ naos dashboard  │
├─────────────────────────────────────────────┤
│              Broker Routing                  │
│  Skill Match → WASM → LLM Fallback          │
├─────────────────────────────────────────────┤
│           Orchestration Primitives           │
│  Supervisor │ Saga │ Workflow │ Pool         │
├─────────────────────────────────────────────┤
│            Trust & Cost Layer                │
│  AXIS Verification │ Budget Enforcement      │
├─────────────────────────────────────────────┤
│             Execution Layer                  │
│  WASM Sandbox │ Agent Runtime │ Audit Log    │
├─────────────────────────────────────────────┤
│               Storage Layer                  │
│  SQLite (local) │ Durable Objects (edge)     │
└─────────────────────────────────────────────┘
\`\`\`

## Components

### CLI (\`naos\`)
The command-line interface is the primary way to interact with Nexus OS. Every operation — creating agents, running sagas, checking costs — goes through \`naos\`.

### Dashboard
A web-based UI served by the \`naos\` binary itself. No separate server needed. Provides real-time monitoring of all components.

### Broker
The routing engine that decides how to handle incoming tasks. It checks skills first (cheapest), then WASM modules, then falls back to LLM (most expensive).

### Orchestration Primitives
Four patterns for coordinating agents:
- **Supervisor** — Monitor and restart failed agents
- **Saga** — Multi-step transactions with rollback
- **Workflow** — Sequential pipelines with data passing
- **Pool** — Parallel execution with result merging

### Trust Layer (AXIS)
Integration with AXIS Trust for agent verification. Checks T-Scores, Trust Tiers, and Credit Ratings before allowing agents to run.

### Cost Controller
Per-agent budget enforcement. Tracks spending, enforces limits, and can pause, throttle, or alert when budgets are exceeded.

### Execution Layer
Agents run in WASM sandboxes with no ambient authority. Every action is logged to the audit trail.

### Storage
Local SQLite database for development and testing. Cloudflare Durable Objects for edge deployment.

## Data Flow

\`\`\`
User Request
     │
     ▼
┌─────────┐    ┌──────────┐    ┌───────────┐
│  Broker  │───▶│  Trust   │───▶│   Cost    │
│ Routing  │    │  Check   │    │  Check    │
└─────────┘    └──────────┘    └───────────┘
                                     │
                                     ▼
                              ┌───────────┐
                              │  Execute  │
                              │  (WASM)   │
                              └───────────┘
                                     │
                                     ▼
                              ┌───────────┐
                              │  Audit    │
                              │   Log     │
                              └───────────┘
\`\`\`

## Design Principles

1. **Single binary** — Everything ships in one executable
2. **Zero dependencies** — No Docker, no Kubernetes, no cloud services required
3. **Erlang-inspired** — Supervision trees, let-it-crash philosophy
4. **Cost-aware** — Every operation has a cost, every agent has a budget
5. **Trust-first** — Verify before you trust, always`,
      },
      {
        slug: "key-concepts",
        title: "Key Concepts",
        content: `# Key Concepts

Before diving into Nexus OS, understand these fundamental concepts that appear throughout the documentation.

## Agent

An agent is a self-contained unit of work. It receives input, performs a task, and produces output. Agents run in WASM sandboxes for isolation and security.

\`\`\`bash
naos create my-agent --template researcher
\`\`\`

## Orchestration Primitives

Nexus provides four ways to coordinate agents:

| Primitive | Purpose | Analogy |
|-----------|---------|---------|
| Supervisor | Restart failed agents | A manager who rehires when someone quits |
| Saga | Multi-step with rollback | A transaction that undoes itself on failure |
| Workflow | Sequential pipeline | An assembly line where each station passes to the next |
| Pool | Parallel execution | A team working on the same task simultaneously |

## Supervision Tree

Supervisors can supervise other supervisors, creating a tree:

\`\`\`
root-supervisor
├── api-supervisor
│   ├── auth-agent
│   └── data-agent
└── worker-supervisor
    ├── processor-1
    ├── processor-2
    └── processor-3
\`\`\`

If \`processor-1\` crashes, \`worker-supervisor\` restarts it. If \`worker-supervisor\` itself crashes, \`root-supervisor\` restarts it and all its children.

## Cost Budget

Every agent can have a spending limit:

\`\`\`yaml
cost:
  budgets:
    researcher:
      limit: 1000    # cents ($10.00)
      period: day
      onExceed: pause
\`\`\`

## Trust Score

AXIS Trust assigns scores to agents:
- **T-Score**: 0-100 (overall trustworthiness)
- **Trust Tier**: T1-T5 (classification)
- **Credit Rating**: AAA to D (transaction reliability)

## WASM Sandbox

Agents compile to WebAssembly and run in an isolated sandbox. No file system access, no network access, no ambient authority — only what you explicitly grant.

## Audit Log

Every action in Nexus OS is logged:

\`\`\`bash
naos audit --last 10

# [2025-01-15 10:30:01] agent.created    researcher
# [2025-01-15 10:30:02] agent.started    researcher
# [2025-01-15 10:31:15] cost.recorded    researcher  $0.05
# [2025-01-15 10:31:16] agent.completed  researcher
\`\`\`

## Project

A Nexus project is a directory containing:
- \`nexus.config.yaml\` — Configuration
- \`data/\` — SQLite database
- \`agents/\` — Agent source files
- \`skills/\` — Skill definitions`,
      },
    ],
  },

  // ─── INSTALLATION ──────────────────────────────────────────
  {
    slug: "installation",
    title: "Installation",
    icon: "download",
    pages: [
      {
        slug: "requirements",
        title: "Requirements",
        content: `# System Requirements

## Supported Platforms

| Platform | Architecture | Status |
|----------|-------------|--------|
| macOS | x86_64, aarch64 (Apple Silicon) | ✓ Fully supported |
| Linux | x86_64, aarch64 | ✓ Fully supported |
| Windows | x86_64 (via WSL) | ✓ Supported via WSL2 |

## Minimum Requirements

- **CPU**: Any modern x86_64 or ARM64 processor
- **RAM**: 256 MB minimum, 1 GB recommended
- **Disk**: 50 MB for the binary, plus space for your project data
- **OS**: macOS 12+, Ubuntu 20.04+, or equivalent

## For Binary Install

- \`curl\` — For downloading the install script
- \`sh\` — POSIX shell (pre-installed on macOS/Linux)

## For Building from Source

- **Rust** 1.75+ (install via [rustup.rs](https://rustup.rs))
- **Git** — For cloning the repository
- **C compiler** — For linking (usually pre-installed)

\`\`\`bash
# Check Rust version
rustc --version
# rustc 1.75.0 or later

# Check Git
git --version
\`\`\`

## Optional Dependencies

| Dependency | Required For |
|-----------|-------------|
| Cloudflare account | Edge deployment |
| AXIS API key | Trust verification |
| SQLite CLI | Database inspection |`,
      },
      {
        slug: "quick-install",
        title: "Quick Install",
        content: `# Quick Install

The fastest way to get Nexus OS running.

## One-Line Install (macOS/Linux)

\`\`\`bash
curl -fsSL https://aiagents.nexus/install.sh | sh
\`\`\`

This script:
1. Detects your OS and architecture
2. Downloads the latest release binary
3. Places it in \`/usr/local/bin/naos\`
4. Verifies the installation

## Via Cargo (Rust Package Manager)

If you have Rust installed:

\`\`\`bash
cargo install naos
\`\`\`

This compiles from source and installs to \`~/.cargo/bin/naos\`.

## Verify Installation

\`\`\`bash
naos --version
# naos 0.1.0

naos --help
# Nexus OS — The orchestration layer for AI agents
# 
# Usage: naos <COMMAND>
# 
# Commands:
#   init        Initialize a new project
#   create      Create a new agent
#   status      Show project status
#   ...
\`\`\`

## Quick Start

\`\`\`bash
# Create a new project
naos init my-project
cd my-project

# Create an agent
naos create researcher --template researcher

# Check status
naos status
\`\`\`

You're ready to go! Continue to [Build from Source](/docs/manual/installation/build-from-source) for advanced installation options.`,
      },
      {
        slug: "build-from-source",
        title: "Build from Source",
        content: `# Build from Source

Building from source gives you the latest features and the ability to customize Nexus OS.

## Clone the Repository

\`\`\`bash
git clone https://github.com/leonidas-esquire/nexus-os
cd nexus-os
\`\`\`

## Build

\`\`\`bash
# Debug build (faster compilation, slower runtime)
cargo build

# Release build (slower compilation, optimized runtime)
cargo build --release
\`\`\`

## Install

\`\`\`bash
# Copy to your PATH
sudo cp target/release/naos /usr/local/bin/

# Or use cargo install
cargo install --path .
\`\`\`

## Build Options

| Flag | Effect |
|------|--------|
| \`--release\` | Optimized build (~10MB binary) |
| \`--features edge\` | Include Cloudflare edge support |
| \`--features full\` | All features enabled |

\`\`\`bash
# Full-featured release build
cargo build --release --features full
\`\`\`

## Cross-Compilation

Build for a different target:

\`\`\`bash
# Add target
rustup target add x86_64-unknown-linux-musl

# Build static binary
cargo build --release --target x86_64-unknown-linux-musl
\`\`\`

## Troubleshooting Build Issues

### Missing C compiler
\`\`\`bash
# macOS
xcode-select --install

# Ubuntu/Debian
sudo apt install build-essential

# Fedora
sudo dnf install gcc
\`\`\`

### Rust version too old
\`\`\`bash
rustup update stable
\`\`\``,
      },
      {
        slug: "verify-installation",
        title: "Verify Installation",
        content: `# Verify Installation

After installing Nexus OS, verify everything works correctly.

## Check Version

\`\`\`bash
naos --version
# naos 0.1.0
\`\`\`

## Check Help

\`\`\`bash
naos --help
\`\`\`

You should see a list of all available commands.

## Create a Test Project

\`\`\`bash
# Create a temporary project
naos init /tmp/nexus-test
cd /tmp/nexus-test

# Verify project structure
ls -la
# nexus.config.yaml
# data/
# agents/
\`\`\`

## Create a Test Agent

\`\`\`bash
naos create test-agent --template researcher

# Expected output:
# ✓ Created agent: test-agent
# ✓ Template: researcher
# ✓ Agent ID: a1b2c3d4e5f6
\`\`\`

## Check Status

\`\`\`bash
naos status

# Expected output:
# Project: nexus-test
# Agents: 1
# 
# NAME         STATUS    ID
# test-agent   stopped   a1b2c3d4e5f6
\`\`\`

## Run the Dashboard

\`\`\`bash
naos dashboard --port 4200

# Expected output:
# ✓ Dashboard running at http://127.0.0.1:4200
# Press Ctrl+C to stop
\`\`\`

Open http://127.0.0.1:4200 in your browser. You should see the Nexus OS dashboard with your test agent listed.

## Clean Up

\`\`\`bash
rm -rf /tmp/nexus-test
\`\`\`

If all steps completed successfully, Nexus OS is properly installed and ready for use.`,
      },
      {
        slug: "updating",
        title: "Updating",
        content: `# Updating Nexus OS

Keep Nexus OS up to date to get the latest features and bug fixes.

## Update via Install Script

\`\`\`bash
curl -fsSL https://aiagents.nexus/install.sh | sh
\`\`\`

The script detects existing installations and replaces the binary.

## Update via Cargo

\`\`\`bash
cargo install naos --force
\`\`\`

The \`--force\` flag overwrites the existing installation.

## Update from Source

\`\`\`bash
cd nexus-os
git pull origin master
cargo build --release
sudo cp target/release/naos /usr/local/bin/
\`\`\`

## Check Current Version

\`\`\`bash
naos --version
\`\`\`

## Database Migrations

When updating, Nexus OS automatically migrates your SQLite database:

\`\`\`bash
naos status
# ✓ Database migrated from v3 to v5
# Project: my-project
# ...
\`\`\`

Migrations are non-destructive — your data is preserved.

## Rollback

If you need to go back to a previous version:

\`\`\`bash
# If installed via cargo
cargo install naos --version 0.1.0

# If installed from source
git checkout v0.1.0
cargo build --release
\`\`\`

> **Note**: Downgrading may not undo database migrations. Back up your \`data/\` directory before downgrading.`,
      },
    ],
  },

  // ─── CONFIGURATION ──────────────────────────────────────────
  {
    slug: "configuration",
    title: "Configuration",
    icon: "settings",
    pages: [
      {
        slug: "project-structure",
        title: "Project Structure",
        content: `# Project Structure

Every Nexus OS project follows a standard directory layout.

## Directory Layout

\`\`\`
my-project/
├── nexus.config.yaml    # Main configuration file
├── data/
│   └── nexus.db         # SQLite database (auto-created)
├── agents/
│   ├── researcher.wasm  # Compiled agent modules
│   └── analyzer.wasm
├── skills/
│   ├── summarize.wasm   # Skill handlers
│   └── translate.wasm
└── logs/                # Optional log directory
    └── audit.log
\`\`\`

## Files

### nexus.config.yaml
The main configuration file. Contains all settings for agents, supervisors, cost budgets, trust requirements, and more. See [Configuration Reference](/docs/manual/configuration/nexus-config-yaml).

### data/nexus.db
SQLite database that stores:
- Agent records and state
- Supervisor configurations
- Saga/workflow executions
- Cost tracking data
- Audit log entries
- AXIS trust cache

Auto-created on first run. Do not delete while agents are running.

### agents/
Directory for compiled agent WASM modules. Agents are compiled from your source code and placed here.

### skills/
Directory for broker skill handlers. WASM modules that handle specific task patterns.

## Creating a Project

\`\`\`bash
naos init my-project

# Output:
# ✓ Created project structure
# ✓ Generated nexus.config.yaml
# ✓ Initialized SQLite database
# ✓ Created example agent
\`\`\`

## Project Detection

Nexus OS looks for \`nexus.config.yaml\` in the current directory and parent directories. You can run \`naos\` commands from any subdirectory of your project.`,
      },
      {
        slug: "nexus-config-yaml",
        title: "nexus.config.yaml",
        content: `# nexus.config.yaml Reference

The main configuration file for your Nexus OS project.

## Minimal Configuration

\`\`\`yaml
project: my-project
version: "0.1"
\`\`\`

## Full Configuration

\`\`\`yaml
project: my-project
version: "0.1"

# Agent definitions
agents:
  researcher:
    template: researcher
    autoStart: true
  analyzer:
    template: analyzer
    autoStart: false

# Supervisor configuration
supervisors:
  main:
    strategy: one-for-one
    maxRestarts: 3
    restartWindow: 60
    children:
      - researcher
      - analyzer

# Cost control
cost:
  budgets:
    researcher:
      limit: 1000      # cents ($10.00)
      period: day
      onExceed: pause
      alertAt: 80       # alert at 80% usage

# Trust requirements
trust:
  provider: axis
  requirements:
    minTrustTier: T3
    minTScore: 70
  enforcement:
    onUntrusted: reject

# Broker routing
broker:
  preferences:
    preferLocal: true
    maxLLMCost: 500
    confidenceThreshold: 0.85

# Skills
skills:
  summarize:
    patterns:
      - summarize
      - summary
      - tldr
    handler: skills/summarize.wasm
    costPerCall: 0

# Edge deployment
edge:
  provider: cloudflare
  regions:
    - us
    - eu
    - asia
  autoDeploy: false
\`\`\`

## Section Reference

| Section | Purpose |
|---------|---------|
| \`project\` | Project name |
| \`version\` | Config version |
| \`agents\` | Agent definitions |
| \`supervisors\` | Supervisor trees |
| \`cost\` | Budget settings |
| \`trust\` | AXIS requirements |
| \`broker\` | Routing preferences |
| \`skills\` | Skill definitions |
| \`edge\` | Edge deployment |`,
      },
      {
        slug: "environment-variables",
        title: "Environment Variables",
        content: `# Environment Variables

Nexus OS reads several environment variables for configuration that shouldn't be stored in files.

## Core Variables

| Variable | Description | Default |
|----------|-------------|---------|
| \`NEXUS_HOME\` | Project directory | Current directory |
| \`NEXUS_DB_PATH\` | Database file path | \`data/nexus.db\` |
| \`NEXUS_LOG_LEVEL\` | Log verbosity | \`info\` |
| \`NEXUS_CONFIG\` | Config file path | \`nexus.config.yaml\` |

## Cloudflare Edge

| Variable | Description |
|----------|-------------|
| \`CF_ACCOUNT_ID\` | Cloudflare account ID |
| \`CF_API_TOKEN\` | Cloudflare API token |

## AXIS Trust

| Variable | Description |
|----------|-------------|
| \`AXIS_API_KEY\` | AXIS Trust API key |
| \`AXIS_API_URL\` | AXIS API endpoint |

## Usage

\`\`\`bash
# Set for current session
export NEXUS_LOG_LEVEL=debug
export CF_API_TOKEN=your-token-here

# Or inline with command
NEXUS_LOG_LEVEL=debug naos status
\`\`\`

## .env File

Nexus OS reads \`.env\` files in the project root:

\`\`\`bash
# .env
NEXUS_LOG_LEVEL=debug
CF_ACCOUNT_ID=abc123
CF_API_TOKEN=your-token
AXIS_API_KEY=your-key
\`\`\`

> **Security**: Never commit \`.env\` files to version control. Add \`.env\` to your \`.gitignore\`.`,
      },
      {
        slug: "agent-configuration",
        title: "Agent Configuration",
        content: `# Agent Configuration

Configure individual agents in \`nexus.config.yaml\`.

## Basic Agent

\`\`\`yaml
agents:
  my-agent:
    template: researcher
\`\`\`

## Full Agent Configuration

\`\`\`yaml
agents:
  researcher:
    template: researcher
    autoStart: true
    wasm:
      fuel: 1000000        # Max WASM fuel
      memoryPages: 256     # Max memory (256 × 64KB = 16MB)
    env:
      API_KEY: "sk-..."
      MODEL: "claude-3-sonnet"
    metadata:
      team: research
      priority: high
\`\`\`

## Configuration Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| \`template\` | string | required | Agent template name |
| \`autoStart\` | bool | false | Start agent on project load |
| \`wasm.fuel\` | int | 1000000 | WASM execution fuel limit |
| \`wasm.memoryPages\` | int | 256 | WASM memory page limit |
| \`env\` | map | {} | Environment variables for the agent |
| \`metadata\` | map | {} | Custom metadata tags |

## Templates

Available built-in templates:

| Template | Description |
|----------|-------------|
| \`researcher\` | Web research and summarization |
| \`analyzer\` | Data analysis and reporting |
| \`coder\` | Code generation and review |
| \`planner\` | Task planning and decomposition |
| \`custom\` | Blank template for custom agents |

\`\`\`bash
# Create with template
naos create my-agent --template researcher

# List available templates
naos templates
\`\`\``,
      },
      {
        slug: "advanced-options",
        title: "Advanced Options",
        content: `# Advanced Configuration Options

Fine-tune Nexus OS behavior with advanced settings.

## Database Options

\`\`\`yaml
database:
  path: data/nexus.db
  walMode: true           # Write-Ahead Logging
  busyTimeout: 5000       # ms to wait for locks
  cacheSize: 2000         # pages
\`\`\`

## Logging

\`\`\`yaml
logging:
  level: info             # trace, debug, info, warn, error
  format: json            # json or text
  output: stdout          # stdout, stderr, or file path
  auditRetention: 90      # days to keep audit logs
\`\`\`

## WASM Runtime

\`\`\`yaml
wasm:
  defaultFuel: 1000000
  defaultMemoryPages: 256
  enableSIMD: true
  enableThreads: false
  maxInstances: 100       # concurrent WASM instances
\`\`\`

## Network

\`\`\`yaml
network:
  dashboard:
    host: 127.0.0.1       # bind address
    port: 4200
    cors: false
  timeout: 30000          # ms for HTTP requests
  retries: 3
\`\`\`

## Performance Tuning

| Setting | Low Memory | Balanced | High Performance |
|---------|-----------|----------|-----------------|
| \`cacheSize\` | 500 | 2000 | 10000 |
| \`maxInstances\` | 10 | 100 | 1000 |
| \`defaultFuel\` | 500000 | 1000000 | 5000000 |
| \`walMode\` | false | true | true |`,
      },
    ],
  },

  // ─── AGENTS ──────────────────────────────────────────
  {
    slug: "agents",
    title: "Agents",
    icon: "bot",
    pages: [
      {
        slug: "what-is-an-agent",
        title: "What is an Agent?",
        content: `# What is an Agent?

An agent is the fundamental unit of work in Nexus OS. It's a self-contained program that receives input, performs a task, and produces output.

## Agent Properties

Every agent has:

| Property | Description |
|----------|-------------|
| **Name** | Human-readable identifier (e.g., \`researcher\`) |
| **ID** | Unique hash (e.g., \`a1b2c3d4e5f6\`) |
| **Template** | The base template it was created from |
| **Status** | Current state: \`running\`, \`stopped\`, \`failed\`, \`budget_exceeded\` |
| **Source** | Path to the agent's source/WASM file |

## Agent Lifecycle

\`\`\`
created → stopped → running → completed
                       ↓
                    failed → restarted (by supervisor)
                       ↓
                 budget_exceeded → paused
\`\`\`

## What Agents Can Do

Agents can:
- Call LLMs (Claude, GPT-4, etc.)
- Process data
- Make HTTP requests (if granted permission)
- Read/write files (if granted permission)
- Communicate with other agents

## What Agents Cannot Do (by default)

The WASM sandbox prevents agents from:
- Accessing the file system
- Making network requests
- Reading environment variables
- Spawning processes
- Accessing other agents' memory

These capabilities must be explicitly granted in the agent configuration.

## Agent vs. Traditional Programs

| Aspect | Traditional Program | Nexus Agent |
|--------|-------------------|-------------|
| Isolation | Shared OS resources | WASM sandbox |
| Failure handling | Crash = dead | Supervisor restarts |
| Cost tracking | None | Per-agent budgets |
| Trust | Implicit | AXIS verification |
| Audit | Manual logging | Automatic audit trail |`,
      },
      {
        slug: "creating-agents",
        title: "Creating Agents",
        content: `# Creating Agents

## From a Template

\`\`\`bash
naos create my-agent --template researcher
\`\`\`

Available templates:

| Template | Description |
|----------|-------------|
| \`researcher\` | Web research and summarization |
| \`analyzer\` | Data analysis and reporting |
| \`coder\` | Code generation and review |
| \`planner\` | Task planning and decomposition |
| \`custom\` | Blank template |

## From Configuration

Define agents in \`nexus.config.yaml\`:

\`\`\`yaml
agents:
  researcher:
    template: researcher
    autoStart: true
  analyzer:
    template: analyzer
    env:
      MODEL: claude-3-sonnet
\`\`\`

Then create all configured agents:

\`\`\`bash
naos create --from-config
\`\`\`

## Verify Creation

\`\`\`bash
naos status

# NAME         STATUS    ID
# researcher   stopped   a1b2c3d4e5f6
# analyzer     stopped   b2c3d4e5f6a1
\`\`\`

## Agent Naming Rules

- Lowercase letters, numbers, and hyphens only
- Must start with a letter
- Maximum 64 characters
- Must be unique within the project

\`\`\`bash
# ✓ Valid names
naos create my-agent
naos create data-processor-v2
naos create agent123

# ✗ Invalid names
naos create My-Agent        # uppercase
naos create 123-agent       # starts with number
naos create my_agent        # underscores
\`\`\``,
      },
      {
        slug: "agent-templates",
        title: "Agent Templates",
        content: `# Agent Templates

Templates provide pre-configured agent setups for common use cases.

## Built-in Templates

### researcher
Optimized for web research and information gathering.
\`\`\`bash
naos create my-researcher --template researcher
\`\`\`
- Pre-configured for search and summarization
- Includes web access permissions
- Default model: claude-3-sonnet

### analyzer
Optimized for data analysis and reporting.
\`\`\`bash
naos create my-analyzer --template analyzer
\`\`\`
- Pre-configured for data processing
- Includes file read permissions
- Default model: claude-3-haiku

### coder
Optimized for code generation and review.
\`\`\`bash
naos create my-coder --template coder
\`\`\`
- Pre-configured for code tasks
- Includes file read/write permissions
- Default model: claude-3-sonnet

### planner
Optimized for task decomposition and planning.
\`\`\`bash
naos create my-planner --template planner
\`\`\`
- Pre-configured for planning workflows
- Minimal permissions
- Default model: claude-3-haiku

### custom
Blank template for custom agents.
\`\`\`bash
naos create my-custom --template custom
\`\`\`
- No pre-configuration
- No default permissions
- You define everything

## Listing Templates

\`\`\`bash
naos templates

# NAME         DESCRIPTION
# researcher   Web research and summarization
# analyzer     Data analysis and reporting
# coder        Code generation and review
# planner      Task planning and decomposition
# custom       Blank template
\`\`\``,
      },
      {
        slug: "running-agents",
        title: "Running Agents",
        content: `# Running Agents

## Start an Agent

\`\`\`bash
naos run researcher

# Output:
# ✓ Starting agent: researcher
# ✓ WASM sandbox initialized
# ✓ Agent running (ID: a1b2c3d4e5f6)
\`\`\`

## Start with Input

\`\`\`bash
naos run researcher --input "Research the latest AI trends"

# Output:
# ✓ Starting agent: researcher
# ✓ Input: "Research the latest AI trends"
# ✓ Agent running (ID: a1b2c3d4e5f6)
\`\`\`

## Start All Agents

\`\`\`bash
naos run --all

# Output:
# ✓ Starting researcher
# ✓ Starting analyzer
# ✓ 2 agents running
\`\`\`

## Auto-Start

Configure agents to start automatically:

\`\`\`yaml
agents:
  researcher:
    template: researcher
    autoStart: true
\`\`\`

## Check Running Status

\`\`\`bash
naos status

# NAME         STATUS     ID
# researcher   ● running  a1b2c3d4e5f6
# analyzer     ○ stopped  b2c3d4e5f6a1
\`\`\`

## Run with Trust Check

\`\`\`bash
naos run researcher --verify-trust

# Output:
# ✓ Verifying trust via AXIS...
# ✓ Trust Tier: T2 (meets minimum T3)
# ✓ Starting agent: researcher
\`\`\``,
      },
      {
        slug: "stopping-agents",
        title: "Stopping Agents",
        content: `# Stopping Agents

## Stop an Agent

\`\`\`bash
naos stop researcher

# Output:
# ✓ Stopping agent: researcher
# ✓ Agent stopped gracefully
\`\`\`

## Force Stop

If an agent doesn't respond to graceful shutdown:

\`\`\`bash
naos stop researcher --force

# Output:
# ✓ Force stopping agent: researcher
# ✓ WASM instance terminated
\`\`\`

## Stop All Agents

\`\`\`bash
naos stop --all

# Output:
# ✓ Stopping researcher
# ✓ Stopping analyzer
# ✓ 2 agents stopped
\`\`\`

## Graceful Shutdown

By default, \`naos stop\` sends a shutdown signal and waits up to 30 seconds:

1. Agent receives shutdown signal
2. Agent completes current task (if any)
3. Agent saves state
4. Agent exits

If the agent doesn't exit within 30 seconds, it's force-terminated.

## Stop vs. Kill

| Command | Behavior |
|---------|----------|
| \`naos stop\` | Graceful shutdown, waits 30s |
| \`naos stop --force\` | Immediate termination |

## Supervisor Interaction

If an agent is supervised, stopping it may trigger a restart:

\`\`\`bash
# Stop without supervisor restart
naos stop researcher --no-restart

# Stop and let supervisor decide
naos stop researcher
\`\`\``,
      },
      {
        slug: "agent-lifecycle",
        title: "Agent Lifecycle",
        content: `# Agent Lifecycle

Understanding the full lifecycle of an agent in Nexus OS.

## States

\`\`\`
┌──────────┐
│ created  │ ← naos create
└────┬─────┘
     │
     ▼
┌──────────┐
│ stopped  │ ← initial state / after naos stop
└────┬─────┘
     │ naos run
     ▼
┌──────────┐     ┌──────────────────┐
│ running  │────▶│ budget_exceeded  │ ← cost limit hit
└────┬─────┘     └──────────────────┘
     │
     ├──────────────────┐
     ▼                  ▼
┌──────────┐     ┌──────────┐
│completed │     │  failed  │ ← crash / error
└──────────┘     └────┬─────┘
                      │ supervisor restart
                      ▼
                 ┌──────────┐
                 │ running  │ ← restarted
                 └──────────┘
\`\`\`

## State Transitions

| From | To | Trigger |
|------|----|---------|
| created | stopped | Initial state after \`naos create\` |
| stopped | running | \`naos run\` or supervisor start |
| running | completed | Agent finishes successfully |
| running | failed | Agent crashes or errors |
| running | budget_exceeded | Cost limit reached |
| failed | running | Supervisor restart |
| budget_exceeded | stopped | Budget reset |

## Events

Each transition generates an audit log entry:

\`\`\`bash
naos audit --agent researcher

# [10:00:01] agent.created     researcher
# [10:00:05] agent.started     researcher
# [10:05:30] agent.failed      researcher  "connection timeout"
# [10:05:31] agent.restarted   researcher  (by supervisor: main)
# [10:10:00] agent.completed   researcher
\`\`\``,
      },
      {
        slug: "agent-state",
        title: "Agent State",
        content: `# Agent State Management

How agents persist and manage their internal state.

## State Storage

Agent state is stored in the SQLite database. Each agent has a JSON state blob that persists across restarts.

## Saving State

Agents can save state during execution:

\`\`\`
Agent Runtime
     │
     ├── save_state(key, value)
     │        ↓
     │   SQLite database
     │
     ├── load_state(key) → value
     │        ↑
     │   SQLite database
     │
     └── clear_state(key)
\`\`\`

## State and Restarts

When a supervisor restarts an agent:
1. The agent's WASM instance is destroyed
2. A new WASM instance is created
3. The agent can load its previous state from the database
4. Execution continues from the saved state

## State Inspection

\`\`\`bash
naos inspect researcher --state

# Agent: researcher
# State:
#   last_query: "AI trends 2025"
#   results_count: 15
#   checkpoint: "step-3"
\`\`\`

## State Size Limits

| Tier | Max State Size |
|------|---------------|
| Default | 1 MB |
| Extended | 10 MB |
| Edge (Durable Objects) | 128 KB per key |

## Best Practices

1. **Save frequently** — Don't lose work on crashes
2. **Save incrementally** — Don't rewrite the entire state every time
3. **Keep state small** — Large states slow down restarts
4. **Use checkpoints** — For long-running tasks, save progress markers`,
      },
      {
        slug: "wasm-sandbox",
        title: "WASM Sandbox",
        content: `# WASM Sandbox

Every agent runs in a WebAssembly sandbox for security and isolation.

## What is Sandboxing?

The WASM sandbox ensures agents:
- Cannot access the host file system
- Cannot make network requests (unless granted)
- Cannot read environment variables (unless granted)
- Cannot access other agents' memory
- Cannot spawn processes

## Capability Model

Agents start with zero capabilities. You grant what they need:

\`\`\`yaml
agents:
  researcher:
    template: researcher
    capabilities:
      network: true       # Allow HTTP requests
      fileRead: true      # Allow reading files
      fileWrite: false    # No file writing
      env:                # Specific env vars
        - API_KEY
        - MODEL
\`\`\`

## Resource Limits

| Resource | Default | Configurable |
|----------|---------|-------------|
| Fuel (CPU) | 1,000,000 | Yes |
| Memory | 16 MB (256 pages) | Yes |
| Stack | 1 MB | No |
| Instances | 100 concurrent | Yes |

\`\`\`yaml
agents:
  researcher:
    wasm:
      fuel: 5000000        # 5x default
      memoryPages: 512     # 32 MB
\`\`\`

## Fuel System

Fuel is the WASM equivalent of CPU time. Every instruction consumes fuel. When fuel runs out, the agent is paused.

\`\`\`
Start: fuel = 1,000,000
  │
  ├── instruction 1: fuel = 999,999
  ├── instruction 2: fuel = 999,998
  │   ...
  └── fuel = 0 → agent paused
\`\`\`

This prevents infinite loops and ensures predictable resource usage.

## Security Model

\`\`\`
┌─────────────────────────────┐
│        Host System          │
│  ┌───────────────────────┐  │
│  │    WASM Sandbox       │  │
│  │  ┌─────────────────┐  │  │
│  │  │    Agent Code   │  │  │
│  │  │                 │  │  │
│  │  │  No FS access   │  │  │
│  │  │  No net access  │  │  │
│  │  │  No env access  │  │  │
│  │  └─────────────────┘  │  │
│  │                       │  │
│  │  Granted capabilities │  │
│  │  only via host calls  │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
\`\`\``,
      },
    ],
  },

  // ─── SUPERVISORS ──────────────────────────────────────────
  {
    slug: "supervisors",
    title: "Supervisors",
    icon: "network",
    pages: [
      {
        slug: "what-is-a-supervisor",
        title: "What is a Supervisor?",
        content: `# What is a Supervisor?

A supervisor monitors child agents and restarts them when they fail. Inspired by Erlang/OTP supervision trees.

## Why Supervisors?

In production, agents crash. Network timeouts, API errors, out-of-memory — failures are inevitable. Supervisors ensure your system recovers automatically.

## Without Supervisors

\`\`\`
Agent crashes → Nobody notices → System broken
\`\`\`

## With Supervisors

\`\`\`
Agent crashes → Supervisor detects → Agent restarted → System healed
\`\`\`

## How It Works

1. You create a supervisor with a restart strategy
2. You add child agents to the supervisor
3. The supervisor monitors all children
4. When a child fails, the supervisor restarts it according to the strategy

\`\`\`bash
# Create supervisor
naos supervisor create main --strategy one-for-one

# Add children
naos supervisor add-child main researcher
naos supervisor add-child main analyzer

# Check status
naos supervisor status main
\`\`\`

## Supervisor Properties

| Property | Description |
|----------|-------------|
| Name | Unique identifier |
| Strategy | How to handle failures |
| Max Restarts | Maximum restart attempts |
| Restart Window | Time window for counting restarts |
| Children | List of supervised agents |`,
      },
      {
        slug: "creating-supervisors",
        title: "Creating Supervisors",
        content: `# Creating Supervisors

## Via CLI

\`\`\`bash
naos supervisor create main --strategy one-for-one --max-restarts 3
\`\`\`

## Via Configuration

\`\`\`yaml
supervisors:
  main:
    strategy: one-for-one
    maxRestarts: 3
    restartWindow: 60
    children:
      - researcher
      - analyzer
      - worker
\`\`\`

## Adding Children

\`\`\`bash
# Add individual child
naos supervisor add-child main researcher

# Add multiple children
naos supervisor add-child main researcher analyzer worker
\`\`\`

## Verify

\`\`\`bash
naos supervisor status main

# Supervisor: main
# Strategy: one-for-one
# Max Restarts: 3
# Restart Window: 60s
#
# Children:
#   researcher   ● running    0 restarts
#   analyzer     ● running    0 restarts
#   worker       ○ stopped    0 restarts
\`\`\``,
      },
      {
        slug: "restart-strategies",
        title: "Restart Strategies",
        content: `# Supervisor Restart Strategies

Supervisors monitor child agents and restart them when they fail. The restart strategy determines how failures are handled.

## Available Strategies

### one-for-one

When one agent fails, only that agent is restarted. Other agents continue running.

\`\`\`
Before:  [Agent A ✓] [Agent B ✗] [Agent C ✓]
After:   [Agent A ✓] [Agent B ✓] [Agent C ✓]
                          ↑
                     restarted
\`\`\`

**Use when:** Agents are independent and don't share state.

\`\`\`bash
naos supervisor create main --strategy one-for-one
\`\`\`

### one-for-all

When one agent fails, ALL agents are restarted.

\`\`\`
Before:  [Agent A ✓] [Agent B ✗] [Agent C ✓]
After:   [Agent A ✓] [Agent B ✓] [Agent C ✓]
              ↑           ↑           ↑
           restarted   restarted   restarted
\`\`\`

**Use when:** Agents share state and must be consistent.

\`\`\`bash
naos supervisor create main --strategy one-for-all
\`\`\`

### rest-for-one

When one agent fails, that agent and all agents started AFTER it are restarted.

\`\`\`
Start order: A → B → C → D
B fails:

Before:  [Agent A ✓] [Agent B ✗] [Agent C ✓] [Agent D ✓]
After:   [Agent A ✓] [Agent B ✓] [Agent C ✓] [Agent D ✓]
                          ↑           ↑           ↑
                     restarted   restarted   restarted
\`\`\`

**Use when:** Later agents depend on earlier agents.

\`\`\`bash
naos supervisor create main --strategy rest-for-one
\`\`\`

## Choosing a Strategy

| Scenario | Strategy |
|----------|----------|
| Independent workers | one-for-one |
| Shared database connection | one-for-all |
| Pipeline with dependencies | rest-for-one |
| Default choice | one-for-one |`,
      },
      {
        slug: "supervisor-trees",
        title: "Supervisor Trees",
        content: `# Supervisor Trees

Supervisors can supervise other supervisors, creating hierarchical fault-tolerance trees.

## Why Trees?

A single supervisor handles one group of agents. For complex systems, you need multiple levels of supervision:

\`\`\`
root-supervisor (one-for-one)
├── api-supervisor (one-for-all)
│   ├── auth-agent
│   └── data-agent
└── worker-supervisor (one-for-one)
    ├── processor-1
    ├── processor-2
    └── processor-3
\`\`\`

## How It Works

1. If \`processor-1\` crashes → \`worker-supervisor\` restarts it
2. If \`worker-supervisor\` crashes → \`root-supervisor\` restarts it (and all its children)
3. If \`auth-agent\` crashes → \`api-supervisor\` restarts ALL API agents (one-for-all)

## Creating a Tree

\`\`\`bash
# Create supervisors
naos supervisor create root --strategy one-for-one
naos supervisor create api --strategy one-for-all
naos supervisor create workers --strategy one-for-one

# Build the tree
naos supervisor add-child root api
naos supervisor add-child root workers
naos supervisor add-child api auth-agent data-agent
naos supervisor add-child workers processor-1 processor-2 processor-3
\`\`\`

## Via Configuration

\`\`\`yaml
supervisors:
  root:
    strategy: one-for-one
    children:
      - api
      - workers
  api:
    strategy: one-for-all
    children:
      - auth-agent
      - data-agent
  workers:
    strategy: one-for-one
    maxRestarts: 5
    children:
      - processor-1
      - processor-2
      - processor-3
\`\`\`

## Depth Limits

Supervisor trees can be up to 10 levels deep. Beyond that, consider restructuring your system.`,
      },
      {
        slug: "max-restarts",
        title: "Max Restarts",
        content: `# Max Restarts

Prevent infinite restart loops by limiting how many times a supervisor will restart a failing agent.

## Configuration

\`\`\`bash
naos supervisor create main --strategy one-for-one --max-restarts 3
\`\`\`

\`\`\`yaml
supervisors:
  main:
    strategy: one-for-one
    maxRestarts: 3
    restartWindow: 60    # seconds
\`\`\`

## How It Works

The supervisor counts restarts within the restart window:

\`\`\`
Time 0s:  Agent fails → Restart 1/3
Time 10s: Agent fails → Restart 2/3
Time 20s: Agent fails → Restart 3/3 (max reached)
Time 25s: Agent fails → NOT restarted, marked as failed
\`\`\`

## Restart Window

The restart window determines the time period for counting restarts. After the window expires, the count resets.

\`\`\`
Window: 60 seconds, Max: 3

Time 0s:  Agent fails → Restart 1/3
Time 10s: Agent fails → Restart 2/3
Time 70s: Agent fails → Restart 1/3 (window reset!)
\`\`\`

## Defaults

| Setting | Default |
|---------|---------|
| maxRestarts | 3 |
| restartWindow | 60 seconds |

## What Happens at Max

When max restarts is reached:
1. The agent is marked as \`failed\`
2. The supervisor logs the event
3. The agent is NOT restarted again
4. An audit entry is created

\`\`\`bash
naos supervisor status main

# Children:
#   worker-1   ● running    0 restarts
#   worker-2   ✗ failed     3 restarts (max reached)
\`\`\``,
      },
      {
        slug: "monitoring-supervisors",
        title: "Monitoring Supervisors",
        content: `# Monitoring Supervisors

## CLI Status

\`\`\`bash
naos supervisor status main

# Supervisor: main
# Strategy: one-for-one
# Max Restarts: 3 / Restart Window: 60s
#
# Children:
#   researcher   ● running    0 restarts
#   analyzer     ● running    2 restarts
#   worker       ✗ failed     3 restarts (max reached)
\`\`\`

## Dashboard

The dashboard provides a visual view of all supervisors:

\`\`\`bash
naos dashboard --port 4200
# Open http://127.0.0.1:4200/supervisors
\`\`\`

## Audit Log

All supervisor events are logged:

\`\`\`bash
naos audit --filter supervisor

# [10:00:01] supervisor.created      main
# [10:00:05] supervisor.child_added  main ← researcher
# [10:05:30] supervisor.child_failed main → researcher
# [10:05:31] supervisor.child_restart main → researcher (1/3)
\`\`\`

## API

The dashboard API provides JSON data:

\`\`\`bash
curl http://127.0.0.1:4200/api/supervisors | jq
\`\`\``,
      },
      {
        slug: "best-practices",
        title: "Best Practices",
        content: `# Supervisor Best Practices

## 1. Start with one-for-one

Unless you have a specific reason for one-for-all or rest-for-one, use one-for-one. It's the simplest and most predictable.

## 2. Set Reasonable Max Restarts

- **3 restarts** is a good default
- **1 restart** for agents that shouldn't fail at all
- **10 restarts** for agents in unstable environments

## 3. Use Supervisor Trees

Don't put all agents under one supervisor. Group related agents:

\`\`\`
# ✗ Bad: flat structure
supervisor → [agent1, agent2, agent3, agent4, agent5]

# ✓ Good: grouped by function
root-supervisor
├── api-supervisor → [auth, data]
└── worker-supervisor → [proc1, proc2, proc3]
\`\`\`

## 4. Monitor Restart Counts

High restart counts indicate a systemic problem. Don't just restart — investigate.

## 5. Combine with Cost Controls

Supervisors respect budget status. An agent with \`budget_exceeded\` status won't be restarted.

## 6. Test Failure Scenarios

Deliberately crash agents during development to verify your supervision tree works correctly.

## 7. Log Everything

Enable audit logging for supervisor events. You'll need the history when debugging production issues.`,
      },
    ],
  },

  // ─── SAGAS ──────────────────────────────────────────
  {
    slug: "sagas",
    title: "Sagas",
    icon: "git-branch",
    pages: [
      {
        slug: "what-is-a-saga",
        title: "What is a Saga?",
        content: `# What is a Saga?

A saga is a multi-step transaction with automatic rollback. If any step fails, all previously completed steps are undone via compensation actions.

## The Problem

Multi-step operations can fail partway through:

\`\`\`
Step 1: Reserve inventory  ✓
Step 2: Charge payment     ✓
Step 3: Ship order         ✗ (fails!)

Result: Payment charged but order not shipped!
\`\`\`

## The Solution

Sagas automatically undo completed steps:

\`\`\`
Step 1: Reserve inventory  ✓
Step 2: Charge payment     ✓
Step 3: Ship order         ✗ (fails!)

Compensation:
  Undo Step 2: Refund payment  ✓
  Undo Step 1: Release inventory  ✓

Result: System back to original state
\`\`\`

## Key Properties

| Property | Description |
|----------|-------------|
| Steps | Ordered list of actions |
| Compensations | Undo action for each step |
| Execution | Forward (step by step) |
| Rollback | Reverse (compensation by compensation) |
| Checkpoints | Resume from last successful step |`,
      },
      {
        slug: "creating-sagas",
        title: "Creating Sagas",
        content: `# Creating Sagas

## Via CLI

\`\`\`bash
naos saga create order-fulfillment
\`\`\`

## Via Configuration

\`\`\`yaml
sagas:
  order-fulfillment:
    steps:
      - name: reserve-inventory
        agent: inventory-reserve
        compensate: inventory-release
      - name: charge-payment
        agent: payment-charge
        compensate: payment-refund
      - name: ship-order
        agent: shipping-create
        compensate: shipping-cancel
\`\`\`

## Adding Steps

\`\`\`bash
# Add step with compensation
naos saga add-step order-fulfillment reserve-inventory \\
  --compensate release-inventory

naos saga add-step order-fulfillment charge-payment \\
  --compensate refund-payment

naos saga add-step order-fulfillment ship-order \\
  --compensate cancel-shipment
\`\`\`

## Verify

\`\`\`bash
naos saga status order-fulfillment

# Saga: order-fulfillment
# Steps: 3
# Status: ready
#
# Steps:
#   1. reserve-inventory  (compensate: release-inventory)
#   2. charge-payment     (compensate: refund-payment)
#   3. ship-order         (compensate: cancel-shipment)
\`\`\``,
      },
      {
        slug: "adding-steps",
        title: "Adding Steps",
        content: `# Adding Saga Steps

## Step Structure

Each saga step has:
- **Name**: Identifier for the step
- **Agent**: The agent that executes the step
- **Compensate**: The agent that undoes the step

## Adding Steps via CLI

\`\`\`bash
naos saga add-step <saga-name> <step-name> --compensate <compensation-agent>
\`\`\`

## Step Order

Steps execute in the order they're added:

\`\`\`bash
naos saga add-step my-saga step-1 --compensate undo-1  # Runs first
naos saga add-step my-saga step-2 --compensate undo-2  # Runs second
naos saga add-step my-saga step-3 --compensate undo-3  # Runs third
\`\`\`

## Step Dependencies

Steps are sequential — each step runs only after the previous step succeeds:

\`\`\`
step-1 ✓ → step-2 ✓ → step-3 ✓ → saga complete
\`\`\`

If any step fails, compensation runs in reverse:

\`\`\`
step-1 ✓ → step-2 ✓ → step-3 ✗
                         ↓
              undo-2 ✓ → undo-1 ✓ → saga rolled back
\`\`\`

## Steps Without Compensation

If a step doesn't need compensation (e.g., a read-only operation):

\`\`\`bash
naos saga add-step my-saga read-data  # No --compensate flag
\`\`\`

Steps without compensation are skipped during rollback.`,
      },
      {
        slug: "compensation-actions",
        title: "Compensation Actions",
        content: `# Saga Compensation Actions

Every step in a saga has a compensation action — the "undo" that runs if a later step fails.

## How Compensation Works

\`\`\`
Forward execution:
  Step 1 ✓ → Step 2 ✓ → Step 3 ✗ (fails)

Compensation (reverse order):
  Compensate 2 ✓ → Compensate 1 ✓

Result: System returned to original state
\`\`\`

## Defining Compensations

When adding a step, specify its compensation:

\`\`\`bash
naos saga add-step order-saga charge-payment --compensate refund-payment
\`\`\`

## Example: E-Commerce Order

\`\`\`yaml
sagas:
  order-fulfillment:
    steps:
      - name: reserve-inventory
        agent: inventory-reserve
        compensate: inventory-release     # Undo: release the reserved items

      - name: charge-payment
        agent: payment-charge
        compensate: payment-refund        # Undo: refund the charge

      - name: ship-order
        agent: shipping-create
        compensate: shipping-cancel       # Undo: cancel shipment
\`\`\`

## Scenarios

### All Steps Succeed
\`\`\`
reserve ✓ → charge ✓ → ship ✓
Result: Order fulfilled, no compensation needed
\`\`\`

### Step 3 Fails
\`\`\`
reserve ✓ → charge ✓ → ship ✗
Compensate: refund ✓ → release ✓
Result: Customer refunded, inventory released
\`\`\`

### Step 2 Fails
\`\`\`
reserve ✓ → charge ✗
Compensate: release ✓
Result: Inventory released, no charge to refund
\`\`\`

## Compensation Best Practices

1. **Make compensations idempotent** — They might run more than once
2. **Log everything** — You need to trace what was undone
3. **Test compensations** — They're as important as the forward steps
4. **Handle partial states** — Compensations should work even if the forward step partially completed`,
      },
      {
        slug: "running-sagas",
        title: "Running Sagas",
        content: `# Running Sagas

## Execute a Saga

\`\`\`bash
naos saga run order-fulfillment

# Output:
# ✓ Step 1: reserve-inventory  (completed)
# ✓ Step 2: charge-payment     (completed)
# ✓ Step 3: ship-order         (completed)
# ✓ Saga completed successfully
\`\`\`

## Execute with Input

\`\`\`bash
naos saga run order-fulfillment --input '{"orderId": "ORD-123"}'
\`\`\`

## Failed Execution

\`\`\`bash
naos saga run order-fulfillment

# Output:
# ✓ Step 1: reserve-inventory  (completed)
# ✓ Step 2: charge-payment     (completed)
# ✗ Step 3: ship-order         (failed: shipping API timeout)
#
# Rolling back...
# ✓ Compensate: refund-payment  (completed)
# ✓ Compensate: release-inventory  (completed)
# ✗ Saga rolled back
\`\`\`

## Check Execution Status

\`\`\`bash
naos saga status order-fulfillment

# Saga: order-fulfillment
# Last Execution: 2025-01-15 10:30:00
# Status: rolled_back
# Steps: 3 (2 completed, 1 failed, 2 compensated)
\`\`\``,
      },
      {
        slug: "rollback-behavior",
        title: "Rollback Behavior",
        content: `# Saga Rollback Behavior

When a saga step fails, compensation actions run in reverse order to undo all completed steps.

## Rollback Order

Compensations always run in reverse order of the original steps:

\`\`\`
Forward:  Step 1 → Step 2 → Step 3 → Step 4 (fails)
Rollback: Comp 3 → Comp 2 → Comp 1
\`\`\`

## Compensation Failures

What happens if a compensation itself fails?

\`\`\`
Forward:  Step 1 ✓ → Step 2 ✓ → Step 3 ✗
Rollback: Comp 2 ✗ (compensation failed!)
\`\`\`

Nexus retries the failed compensation up to 3 times. If it still fails:
1. The saga is marked as \`compensation_failed\`
2. An alert is generated
3. Manual intervention is required

## Manual Resolution

\`\`\`bash
# Check saga status
naos saga status order-fulfillment

# Retry failed compensation
naos saga retry-compensation order-fulfillment --step 2

# Force mark as resolved
naos saga resolve order-fulfillment --step 2
\`\`\`

## Partial Rollback

If only some compensations fail, the saga tracks which steps were successfully compensated:

\`\`\`bash
naos saga status order-fulfillment

# Steps:
#   1. reserve-inventory   ✓ completed  ✓ compensated
#   2. charge-payment      ✓ completed  ✗ compensation failed
#   3. ship-order          ✗ failed
\`\`\``,
      },
      {
        slug: "checkpoints-and-resume",
        title: "Checkpoints & Resume",
        content: `# Saga Checkpoints and Resume

Sagas save checkpoints after each successful step, allowing them to resume from where they left off after a crash.

## How Checkpoints Work

\`\`\`
Step 1 ✓ → checkpoint saved
Step 2 ✓ → checkpoint saved
Step 3    → CRASH!

Resume:
Step 3 ✓ → checkpoint saved  (steps 1-2 skipped)
Step 4 ✓ → saga complete
\`\`\`

## Automatic Checkpointing

Checkpoints are saved automatically after each step. No configuration needed.

## Manual Resume

\`\`\`bash
# Resume a crashed saga
naos saga resume order-fulfillment

# Output:
# ✓ Resuming from checkpoint (step 3)
# ✓ Step 3: ship-order  (completed)
# ✓ Saga completed successfully
\`\`\`

## Checkpoint Storage

Checkpoints are stored in the SQLite database and include:
- Step number
- Step status
- Step output
- Timestamp

## Clearing Checkpoints

\`\`\`bash
# Clear checkpoints to start fresh
naos saga reset order-fulfillment
\`\`\``,
      },
      {
        slug: "saga-vs-workflow",
        title: "Saga vs. Workflow",
        content: `# Saga vs. Workflow

Both sagas and workflows are sequential multi-step processes, but they serve different purposes.

## Key Differences

| Feature | Saga | Workflow |
|---------|------|----------|
| **Purpose** | Transactions with rollback | Data pipelines |
| **Compensation** | ✓ Every step has an undo | ✗ No rollback |
| **Data passing** | Limited | ✓ Output → Input |
| **On failure** | Rollback all steps | Stop or skip |
| **Use case** | Orders, payments, bookings | ETL, analysis, reports |

## When to Use Sagas

Use sagas when:
- Steps have side effects that need to be undone
- Consistency is critical
- You need all-or-nothing semantics

**Examples**: Order processing, payment flows, booking systems

## When to Use Workflows

Use workflows when:
- Steps transform data sequentially
- No rollback is needed
- Each step's output feeds the next step's input

**Examples**: Data pipelines, report generation, content processing

## Decision Tree

\`\`\`
Does the process need rollback?
├── Yes → Use a Saga
└── No
    └── Does each step's output feed the next?
        ├── Yes → Use a Workflow
        └── No
            └── Are steps independent?
                ├── Yes → Use a Pool
                └── No → Use a Supervisor
\`\`\``,
      },
      {
        slug: "best-practices",
        title: "Best Practices",
        content: `# Saga Best Practices

## 1. Make Compensations Idempotent

Compensations might run more than once (retries). They should produce the same result regardless.

\`\`\`
# ✓ Good: Idempotent refund
refund(orderId) → if not already refunded, refund

# ✗ Bad: Non-idempotent
refund(orderId) → always issue refund (double refund!)
\`\`\`

## 2. Keep Steps Small

Each step should do one thing. Don't combine multiple operations in a single step.

## 3. Test the Rollback Path

Your compensation code is as important as your forward code. Test it thoroughly.

## 4. Use Checkpoints for Long Sagas

For sagas with many steps, checkpoints prevent re-running completed steps after a crash.

## 5. Monitor Saga Executions

\`\`\`bash
naos saga status --all
naos audit --filter saga
\`\`\`

## 6. Handle Compensation Failures

Have a plan for when compensations fail. Manual resolution should be documented.

## 7. Set Timeouts

Don't let saga steps run forever:

\`\`\`yaml
sagas:
  order:
    timeout: 300    # 5 minutes total
    stepTimeout: 60 # 1 minute per step
\`\`\``,
      },
    ],
  },
];

import { MANUAL_SECTIONS_REMAINING } from "./manualSections2";

export const ALL_MANUAL_SECTIONS: ManualSection[] = [
  ...MANUAL_SECTIONS,
  ...MANUAL_SECTIONS_REMAINING,
];

// Helper to get flat list of all manual pages
export interface FlatManualPage {
  sectionSlug: string;
  sectionTitle: string;
  pageSlug: string;
  pageTitle: string;
  content: string;
}

export function getFlatManualPages(): FlatManualPage[] {
  return ALL_MANUAL_SECTIONS.flatMap((section) =>
    section.pages.map((page) => ({
      sectionSlug: section.slug,
      sectionTitle: section.title,
      pageSlug: page.slug,
      pageTitle: page.title,
      content: page.content,
    }))
  );
}
