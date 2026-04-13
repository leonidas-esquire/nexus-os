# Nexus OS — Project Briefing

> **Last updated:** April 13, 2026
> **Version:** 0.3.1
> **Status:** Pre-launch (Hacker News launch scheduled for Tuesday)

## Executive Summary

Nexus OS is an open-source orchestration layer for AI agents, written in Rust. It provides a single CLI binary (`naos`) that handles the complete agent lifecycle — creation, supervision, cost optimization, and deployment — using battle-tested patterns borrowed from Erlang/OTP. The project positions itself as "what Kubernetes did for containers, Nexus does for agents," offering five orchestration primitives (Supervisors, Sagas, Workflows, Pools, and Cost Controllers) that allow developers to build fault-tolerant, budget-aware agent systems without reinventing infrastructure.

The runtime executes agent skills inside WASM sandboxes for security and portability, with a broker routing engine that cascades tasks through deterministic skills, WASM modules, and LLM providers in order of cost — targeting an 85% reduction in token spend compared to naive all-LLM approaches. Local state is persisted in SQLite, configuration is declarative YAML, and the entire system ships as a single binary with zero external dependencies.

The project is currently in Phase 2 (Ecosystem) of its roadmap. The core CLI, all five orchestration primitives, AXIS Trust integration, a built-in web dashboard, and edge deployment to Cloudflare Workers are implemented. The website at [aiagents.nexus](https://aiagents.nexus) is live with documentation, a blog system, and a community showcase. The codebase is public on GitHub under the Apache 2.0 license, with automated binary releases via GitHub Actions.

---

## Table of Contents

1. [Project Identity](#1-project-identity)
2. [Technical Architecture](#2-technical-architecture)
3. [Core Features](#3-core-features)
4. [Codebase Structure](#4-codebase-structure)
5. [Installation & Usage](#5-installation--usage)
6. [Infrastructure](#6-infrastructure)
7. [Related Projects](#7-related-projects)
8. [Business Model](#8-business-model)
9. [Roadmap](#9-roadmap)
10. [Key Decisions Made](#10-key-decisions-made)
11. [Outstanding Tasks](#11-outstanding-tasks)
12. [Links & Resources](#12-links--resources)

---

## 1. Project Identity

### Name & Branding

| Field | Value |
|-------|-------|
| **Product Name** | Nexus OS |
| **CLI Command** | `naos` (Nexus Agent OS) |
| **Tagline** | "The orchestration layer for AI agents" |
| **Positioning** | "What Kubernetes did for containers, Nexus does for agents" |

### Domain & Hosting

| Service | Provider / URL |
|---------|---------------|
| **Website** | [https://aiagents.nexus](https://aiagents.nexus) |
| **Docs** | [https://aiagents.nexus/docs](https://aiagents.nexus/docs) |
| **Blog** | [https://aiagents.nexus/blog](https://aiagents.nexus/blog) |
| **Showcase** | [https://aiagents.nexus/showcase](https://aiagents.nexus/showcase) |
| **GitHub** | [https://github.com/leonidas-esquire/nexus-os](https://github.com/leonidas-esquire/nexus-os) |
| **Domain Registrar** | Namecheap |
| **DNS / CDN** | Cloudflare |
| **Website Hosting** | Manus Platform (React 19 + Tailwind 4 + Express 4 + tRPC 11) |

### Repository Status

| Field | Value |
|-------|-------|
| **Visibility** | Public |
| **License** | Apache 2.0 |
| **Primary Language** | Rust |
| **Current Version** | 0.3.1 |
| **Stars** | Growing (pre-launch) |

---

## 2. Technical Architecture

### Runtime Model

Nexus OS compiles to a single binary targeting approximately 10 MB. It uses **wasmtime v19** for WASM-sandboxed execution, **SQLite** for local state persistence, and a declarative **YAML** configuration file (`nexus.config.yaml`) that defines the entire agent system in one place. There are no external service dependencies required to run the CLI.

### Execution Environments

| Environment | Use Case | Isolation | Latency |
|-------------|----------|-----------|---------|
| **WASM** | Default, sandboxed, secure | Full sandbox | ~10ms |
| **Container** | Docker-based agents | Docker isolation | ~100ms |
| **Process** | Native subprocess | OS-level | ~5ms |
| **Edge** | Cloudflare Workers | V8 isolate | <50ms globally |

### Five Orchestration Primitives

| Primitive | Purpose | Strategies / Modes |
|-----------|---------|-------------------|
| **Supervisor** | Restart crashed agents automatically | one-for-one, one-for-all, rest-for-one |
| **Saga** | Multi-step operations with rollback | Steps + compensations, checkpoint/resume |
| **Workflow** | Sequential data pipelines | Data passing between steps, stop-on-error modes |
| **Pool** | Parallel fan-out execution | all, first, majority, quorum merge strategies |
| **Cost Controller** | Budget enforcement per agent | pause, throttle, alert actions with configurable thresholds |

### Broker Routing (Cost Optimization)

The broker evaluates every incoming task against three handler tiers in order of cost. It picks the cheapest handler that meets the confidence threshold, routing deterministic work away from expensive LLM calls.

| Tier | Handler | Approximate Cost | Latency | Confidence Threshold |
|------|---------|-----------------|---------|---------------------|
| 1 | Pattern-matched Skills | ~$0.0001 | ~5ms | 90% |
| 2 | WASM Modules | ~$0.00001 | ~10ms | 80% |
| 3 | LLM Provider (fallback) | ~$0.01+ | ~1s | 70% |

The target is an **85% cost reduction** versus a naive all-LLM approach.

---

## 3. Core Features

### Implemented (v0.3.1)

- [x] Agent lifecycle management (create, run, stop, status, delete)
- [x] Supervisor with Erlang-style restart strategies
- [x] Saga with rollback/compensation
- [x] Workflow with checkpointing and data passing
- [x] Pool with configurable merge strategies
- [x] Cost Controller with per-agent budgets
- [x] AXIS Trust integration for agent verification
- [x] Broker routing engine (Skill → WASM → LLM cascade)
- [x] Built-in web dashboard (11 pages, JSON API)
- [x] Causal audit logging with Lamport timestamps
- [x] Edge deployment to Cloudflare Workers
- [x] WASM Skill Marketplace structure
- [x] CRDT state management for agent memory

### CLI Commands

```
naos init <project>            # Create new project
naos create <agent>            # Create agent from template
naos run <agent>               # Run agent
naos stop <agent>              # Stop agent
naos status                    # Show all agent statuses
naos delete <agent>            # Delete agent
naos dashboard                 # Open web dashboard at localhost:4200
naos supervisor <subcommand>   # Supervisor management
naos saga <subcommand>         # Saga management
naos workflow <subcommand>     # Workflow management
naos pool <subcommand>         # Pool management
naos cost <subcommand>         # Cost controller
naos axis <subcommand>         # AXIS Trust integration
naos broker <subcommand>       # Broker routing
naos edge <subcommand>         # Edge deployment
naos marketplace <subcommand>  # Marketplace
naos audit <subcommand>        # Audit logs
```

---

## 4. Codebase Structure

```
nexus-os/
├── .github/
│   └── workflows/
│       └── release.yml          # CI/CD for binary releases
├── src/
│   ├── main.rs                  # Entry point, clap CLI setup
│   ├── lib.rs                   # Library exports for all modules
│   ├── error.rs                 # Unified error types (NexusError)
│   ├── cli/                     # CLI command handlers
│   │   ├── mod.rs               # Module index + shared helpers
│   │   ├── init.rs              # naos init
│   │   ├── create.rs            # naos create
│   │   ├── agent_run.rs         # naos run
│   │   ├── agent_stop.rs        # naos stop
│   │   ├── status.rs            # naos status
│   │   ├── delete.rs            # naos delete
│   │   ├── supervisor.rs        # naos supervisor *
│   │   ├── saga.rs              # naos saga *
│   │   ├── workflow.rs          # naos workflow *
│   │   ├── pool.rs              # naos pool *
│   │   ├── cost.rs              # naos cost *
│   │   ├── axis.rs              # naos axis *
│   │   ├── broker.rs            # naos broker *
│   │   ├── edge.rs              # naos edge *
│   │   ├── marketplace.rs       # naos marketplace *
│   │   ├── dashboard.rs         # naos dashboard
│   │   └── audit.rs             # naos audit *
│   ├── config/                  # Configuration parsing (nexus.config.yaml)
│   │   ├── mod.rs               # Config loader
│   │   └── types.rs             # Serde types for YAML schema
│   ├── db/                      # SQLite database layer (rusqlite)
│   │   └── mod.rs               # Schema, migrations, CRUD
│   ├── agent/                   # Agent runtime & lifecycle
│   │   └── mod.rs               # AgentManager, spawn/stop/status
│   ├── supervisor/              # Erlang-style supervision trees
│   │   └── mod.rs               # SupervisorManager, restart strategies
│   ├── saga/                    # Multi-step saga orchestration
│   │   └── mod.rs               # SagaManager, compensation logic
│   ├── workflow/                # Sequential pipeline execution
│   │   └── mod.rs               # WorkflowManager, step execution
│   ├── pool/                    # Parallel fan-out pools
│   │   └── mod.rs               # PoolManager, merge strategies
│   ├── cost/                    # Token cost tracking & budgets
│   │   └── mod.rs               # CostManager, budget enforcement
│   ├── trust/                   # AXIS Trust integration
│   │   └── mod.rs               # TrustManager, AUID verification
│   ├── broker/                  # Skill → WASM → LLM routing
│   │   └── mod.rs               # BrokerManager, routing cascade
│   ├── wasm/                    # WASM runtime (wasmtime stub)
│   │   └── mod.rs               # WasmRuntime, module loading
│   ├── edge/                    # Cloudflare Workers deployment
│   │   └── mod.rs               # EdgeManager, deploy/undeploy
│   ├── marketplace/             # WASM Skill Marketplace
│   │   └── mod.rs               # MarketplaceManager, install/publish
│   ├── dashboard/               # Built-in web dashboard
│   │   └── mod.rs               # DashboardServer (actix-web)
│   └── audit/                   # Causal audit trail
│       └── mod.rs               # AuditManager, Lamport timestamps
├── Cargo.toml                   # Rust dependencies
├── Cargo.lock                   # Locked dependency versions
├── README.md                    # Public-facing README
├── PROJECT-BRIEFING.md          # This document
├── LICENSE                      # Apache 2.0
├── CONTRIBUTING.md              # Contribution guidelines
├── CODE_OF_CONDUCT.md           # Code of conduct
└── SECURITY.md                  # Security policy
```

The Rust source totals approximately **3,100 lines** across **39 files** in 15 modules. All 7 unit tests pass (`cargo test`). The code compiles cleanly with zero warnings (`cargo check`).

---

## 5. Installation & Usage

### Install via Cargo (requires Rust)

```bash
cargo install --git https://github.com/leonidas-esquire/nexus-os.git
```

If you do not have Rust installed:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
```

### Download Pre-built Binary

Pre-built binaries are available for Linux and macOS from the [Releases page](https://github.com/leonidas-esquire/nexus-os/releases):

```bash
# macOS (Apple Silicon)
curl -fsSL https://github.com/leonidas-esquire/nexus-os/releases/latest/download/naos-v0.3.1-darwin-aarch64 -o naos
chmod +x naos && sudo mv naos /usr/local/bin/

# macOS (Intel)
curl -fsSL https://github.com/leonidas-esquire/nexus-os/releases/latest/download/naos-v0.3.1-darwin-x86_64 -o naos
chmod +x naos && sudo mv naos /usr/local/bin/

# Linux (x86_64)
curl -fsSL https://github.com/leonidas-esquire/nexus-os/releases/latest/download/naos-v0.3.1-linux-x86_64 -o naos
chmod +x naos && sudo mv naos /usr/local/bin/
```

### Build from Source

```bash
git clone https://github.com/leonidas-esquire/nexus-os.git
cd nexus-os
cargo build --release
sudo cp target/release/naos /usr/local/bin/
```

### Quick Start

```bash
naos init my-project
cd my-project
naos create hello
naos run hello
naos dashboard
```

### Verify Installation

```bash
naos --version
```

---

## 6. Infrastructure

### Website (aiagents.nexus)

| Component | Details |
|-----------|---------|
| **Framework** | React 19 + Tailwind CSS 4 + Express 4 + tRPC 11 |
| **Hosting** | Manus Platform (managed deployment with custom domain) |
| **Database** | TiDB (MySQL-compatible, for blog/showcase data) |
| **Auth** | Manus OAuth (for admin panel and showcase submissions) |
| **CDN** | Cloudflare (DNS proxy + caching) |

The website includes the following pages: Homepage (landing page with Terminal Noir design), Documentation (multi-section docs with sidebar navigation), User Manual (comprehensive reference manual), Blog (with scheduled publishing, markdown rendering, SEO meta tags), Community Showcase (project gallery with upvoting, admin moderation queue), and a Marketplace placeholder.

### GitHub Actions

The `release.yml` workflow triggers on version tag pushes (`v*`) and builds binaries for the following targets:

| Target | OS | Architecture |
|--------|----|-------------|
| `naos-{tag}-linux-x86_64` | Ubuntu (latest) | x86_64 |
| `naos-{tag}-darwin-x86_64` | macOS (latest) | x86_64 |
| `naos-{tag}-darwin-aarch64` | macOS (latest) | ARM64 (Apple Silicon) |

Each release includes the three binaries plus a `checksums.txt` file with SHA-256 hashes.

### DNS (Cloudflare)

| Record | Type | Value |
|--------|------|-------|
| `aiagents.nexus` | CNAME | Manus Platform endpoint |
| `www.aiagents.nexus` | CNAME | `aiagents.nexus` |

---

## 7. Related Projects

### AXIS Trust (axistrust.io)

Nexus OS integrates with [AXIS Trust](https://axistrust.io) for agent identity verification and trust scoring. AXIS provides a decentralized trust framework for AI agents.

| Concept | Description |
|---------|-------------|
| **AUID** | Agent Unique Identifier — globally unique agent ID |
| **T-Score** | Trust score on a 0–100 scale |
| **Trust Tiers** | T1 (Platinum) through T5 (Provisional) |
| **Credit Ratings** | AAA through D |

Integration is configured in `nexus.config.yaml`:

```yaml
trust:
  provider: axis
  apiKey: ${AXIS_API_KEY}
  requirements:
    minTrustTier: T3
    minCreditRating: BBB
    minTScore: 70
  enforcement:
    onUntrusted: reject
```

The AXIS API is accessed via `https://www.axistrust.io` with an `X-AXIS-API-Key` header for authentication.

---

## 8. Business Model

### Open Core Model

| Tier | License | Includes |
|------|---------|----------|
| **Open Source** | Apache 2.0 | CLI, runtime, all 5 orchestration primitives, basic dashboard, docs, edge deployment |
| **Proprietary** | Commercial | Multi-node clustering, SSO/RBAC, enterprise audit export, SLA support |

### Pricing Tiers (Planned)

| Tier | Price | Key Feature |
|------|-------|-------------|
| **Community** | Free | Single node, all open-source features |
| **Team** | $49/node/mo | Multi-node clustering |
| **Business** | $199/node/mo | SSO, RBAC, audit export, SLA |
| **Enterprise** | Custom | Multi-region, compliance, dedicated support |

### Revenue Streams (Planned)

Self-hosted licenses represent the primary revenue stream. In Year 2 and beyond, a managed **Nexus Cloud** offering with usage-based pricing is planned. The WASM Skill Marketplace will take a 25% commission on paid skill sales. Professional services and implementation consulting round out the revenue model.

---

## 9. Roadmap

### Phase 1: Foundation — COMPLETE

Core CLI and runtime with all five orchestration primitives, AXIS Trust integration, the dashboard MVP, and GitHub release automation are all shipped and working.

### Phase 2: Ecosystem — IN PROGRESS

| Item | Status |
|------|--------|
| WASM Skill Marketplace | Structure implemented |
| Blog system | Live with scheduled publishing |
| Community Showcase | Live with admin moderation |
| Community building | Pre-launch |
| Hacker News launch | Scheduled for Tuesday |

### Phase 3: Enterprise

Multi-node clustering, SSO/RBAC, audit export to external systems, and SLA support contracts.

### Phase 4: Cloud

Managed Nexus Cloud offering with usage-based pricing, global edge deployment, and a hosted dashboard.

---

## 10. Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Language** | Rust | Performance, memory safety, single-binary distribution |
| **Sandbox** | WASM (wasmtime) | Security, portability, near-native speed |
| **Database** | SQLite | Zero dependencies, embedded, no server required |
| **License** | Apache 2.0 | Business-friendly, allows proprietary extensions |
| **CLI name** | `naos` | Short, memorable, available |
| **Config format** | YAML | Developer-friendly, human-readable |
| **Supervision model** | Erlang-style | Proven fault-tolerance patterns (30+ years in production) |
| **Cost optimization** | Broker cascade | Skill → WASM → LLM routing minimizes token spend |
| **Website framework** | React 19 + tRPC | Type-safe end-to-end, fast iteration |
| **Edge target** | Cloudflare Workers | Global distribution, zero cold starts, Durable Objects |

---

## 11. Outstanding Tasks

### Pre-Launch (Before Tuesday HN Post)

- [x] Source code pushed to GitHub
- [x] Binary releases working (GitHub Actions)
- [x] Install command updated everywhere
- [x] Website live at aiagents.nexus
- [x] Docs live
- [ ] Test full user flow one more time
- [ ] Prepare for HN comments/questions

### Post-Launch

- [ ] Publish to crates.io (may need to rename if `naos` is taken)
- [ ] Add Linux ARM64 binary (currently blocked by OpenSSL cross-compile)
- [ ] Create standalone `install.sh` script
- [ ] Blog launch post
- [ ] Discord / community setup

---

## 12. Links & Resources

### Primary Links

| Resource | URL |
|----------|-----|
| **Website** | [https://aiagents.nexus](https://aiagents.nexus) |
| **Documentation** | [https://aiagents.nexus/docs](https://aiagents.nexus/docs) |
| **User Manual** | [https://aiagents.nexus/docs/manual](https://aiagents.nexus/docs/manual) |
| **Blog** | [https://aiagents.nexus/blog](https://aiagents.nexus/blog) |
| **Showcase** | [https://aiagents.nexus/showcase](https://aiagents.nexus/showcase) |
| **GitHub** | [https://github.com/leonidas-esquire/nexus-os](https://github.com/leonidas-esquire/nexus-os) |
| **Releases** | [https://github.com/leonidas-esquire/nexus-os/releases](https://github.com/leonidas-esquire/nexus-os/releases) |

### Related

| Resource | URL |
|----------|-----|
| **AXIS Trust** | [https://axistrust.io](https://axistrust.io) |

### Design Documents (Local Only)

| Document | Description |
|----------|-------------|
| `NEXUS-SPEC-v1.md` | Master specification |
| `ARCHITECTURE.md` | Technical architecture |
| `NCP-SPEC.md` | Nexus Capability Protocol |
| `MONETIZATION-PRIVATE.md` | **PRIVATE — never commit** |

---

## Appendix: HN Launch Plan

| Field | Details |
|-------|---------|
| **Post on** | Tuesday, 6–8 AM Pacific Time |
| **Title** | Show HN: Nexus OS – Open-source orchestration layer for AI agents |
| **URL** | https://github.com/leonidas-esquire/nexus-os |
| **First comment** | See launch comment template in project docs |

**Response strategy:** Reply to every comment. Be humble and ask follow-up questions. Do not ask for upvotes. Share on Twitter/LinkedIn after posting.

---

## Appendix: Key Contacts & Accounts

| Service | Details |
|---------|---------|
| **Domain Registrar** | Namecheap |
| **DNS / CDN** | Cloudflare |
| **GitHub Org** | leonidas-esquire |
| **Support Email** | support@aiagents.nexus (to be set up) |
| **Legal Email** | legal@aiagents.nexus (to be set up) |

---

*This document should be updated after major milestones or decisions. It contains no secrets and is safe to commit to the public repository.*
