<div align="center">

<img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663030909471/jCAOeglRIAmKomRx.png" alt="AI Agents Nexus — open-source agent network for developers" width="900" />

# Nexus OS

### Production orchestration for AI agents

**One Rust CLI for resilient execution, cost control, verifiable trust, and observable multi-agent systems.**

[![License](https://img.shields.io/badge/license-Apache%202.0-2563EB.svg)](LICENSE)
[![Rust](https://img.shields.io/badge/built%20with-Rust-000000.svg?logo=rust)](https://www.rust-lang.org/)
[![Release](https://img.shields.io/github/v/release/leonidas-esquire/nexus-os?display_name=tag&sort=semver)](https://github.com/leonidas-esquire/nexus-os/releases/latest)
[![Deployment Tests](https://github.com/leonidas-esquire/nexus-os/actions/workflows/deployment-tests.yml/badge.svg?branch=main)](https://github.com/leonidas-esquire/nexus-os/actions/workflows/deployment-tests.yml)
[![GitHub Stars](https://img.shields.io/github/stars/leonidas-esquire/nexus-os.svg?style=flat)](https://github.com/leonidas-esquire/nexus-os/stargazers)

[**Live Platform**](https://www.aiagents.nexus) · [**Documentation**](https://www.aiagents.nexus/docs) · [**Showcase**](https://www.aiagents.nexus/showcase) · [**Deployment Guide**](DEPLOYMENT.md) · [**Discussions**](https://github.com/leonidas-esquire/nexus-os/discussions)

</div>

---

> **What Kubernetes did for containers, Nexus OS does for agents:** it supervises failures, coordinates multi-step work, enforces budgets, verifies trust, and records execution through one portable control plane.

## Start in 30 seconds

```bash
cargo install --git https://github.com/leonidas-esquire/nexus-os.git
naos init my-project
cd my-project
naos status
```

| **Resilient by default** | **Cost-aware execution** | **Trust you can verify** |
|---|---|---|
| Restart crashed agents, roll back failed sagas, and coordinate sequential or parallel work. | Set per-agent budgets, receive threshold alerts, and route work to the lowest-cost capable runtime. | Gate execution by AXIS trust tiers, preserve audit trails, and inspect every agent transition. |

<details>
<summary><strong>Explore this README</strong></summary>

- [Why Nexus OS?](#why-nexus-os)
- [Features](#features)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [CLI Reference](#cli-reference)
- [Architecture](#architecture)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Community](#community)

</details>

---

## Run a deterministic agent without an LLM

The local WASM execution path runs compiled WASIp1 agents with bounded input,
output, memory, fuel, and execution time. The included record-validation agent
checks structured records and computes totals without model credentials or a
model connection.

[Run the working example and outage checks →](docs/DETERMINISTIC-WASM.md)

## Why Nexus OS?

AI agents are powerful but fragile in production:

- **Agents crash** and nobody restarts them
- **Multi-step tasks fail halfway** and leave things broken
- **Costs spiral** with no budget enforcement
- **No visibility** into what agents are doing
- **No trust verification** for agent-to-agent interactions

Nexus OS solves all of this with a single 10MB binary.

---

## Features

### 🔄 Orchestration Primitives

| Primitive | What It Does |
|-----------|--------------|
| **Supervisor** | Auto-restart crashed agents (one-for-one, one-for-all, rest-for-one) |
| **Saga** | Multi-step transactions with automatic rollback on failure |
| **Workflow** | Sequential data pipelines — each step feeds the next |
| **Pool** | Parallel fan-out to multiple agents with result merging |

### 💰 Cost Controller

- Per-agent budgets (`$10/day`)
- Alert thresholds (warn at 80%)
- Enforcement actions (pause, throttle, alert)
- Real-time spend tracking

### 🔐 AXIS Trust Integration

- Verify agents before execution
- Trust tiers (T1-T5) and credit ratings (AAA-D)
- Trust-gated transactions between agents
- Built-in verification via [axistrust.io](https://axistrust.io)

### 🧠 Broker Routing

- Route tasks to skills, WASM, or LLM based on cost/capability
- Pattern matching for skill selection
- 85%+ cost savings vs all-LLM execution

### 🌍 Edge Deployment

- Deploy agents to Cloudflare Workers
- Global low-latency execution (300+ PoPs)
- Durable Objects for state persistence

### 📊 Dashboard

- Real-time monitoring (11 pages)
- Agent status, costs, trust, audit trail
- JSON API for integration

---

## Quick Start

### Install

### Quick Install (requires Rust)

```bash
cargo install --git https://github.com/leonidas-esquire/nexus-os.git
```

Don't have Rust? Install it first:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Download Binary

Pre-built binaries are available for Linux and macOS:

```bash
# macOS (Apple Silicon)
curl -fsSL https://github.com/leonidas-esquire/nexus-os/releases/latest/download/naos-v0.3.1-darwin-aarch64 -o naos
chmod +x naos
sudo mv naos /usr/local/bin/

# macOS (Intel)
curl -fsSL https://github.com/leonidas-esquire/nexus-os/releases/latest/download/naos-v0.3.1-darwin-x86_64 -o naos
chmod +x naos
sudo mv naos /usr/local/bin/

# Linux (x86_64)
curl -fsSL https://github.com/leonidas-esquire/nexus-os/releases/latest/download/naos-v0.3.1-linux-x86_64 -o naos
chmod +x naos
sudo mv naos /usr/local/bin/
```

### From Source

```bash
git clone https://github.com/leonidas-esquire/nexus-os.git
cd nexus-os
cargo build --release
sudo cp target/release/naos /usr/local/bin/
```

### Verify Installation

```bash
naos --version
```

### Create Your First Agent

Prepare a compiled WASIp1 module first (see the
[record-validation example](docs/DETERMINISTIC-WASM.md)) and place it at
`agents/researcher.wasm` in your new project.

```bash
# Initialize a new project
naos init my-project
cd my-project

# Bind the compiled agent module
naos create researcher --source agents/researcher.wasm

# Run the agent
naos run researcher

# Check status
naos status

# Open the dashboard
naos dashboard --open
```

### Add Supervision

```bash
# Create a supervisor with auto-restart
naos supervisor create main --strategy one-for-one --max-restarts 3

# Add agents to supervisor
naos supervisor add main researcher
naos supervisor add main analyzer

# Start the supervisor
naos supervisor start main
```

### Set Cost Budgets

```bash
# Set a $10/day budget, alert at 80%, pause when exceeded
naos cost set researcher --budget "$10/day" --alert-at 80 --action pause

# Check spend
naos cost status
```

### Verify Agent Trust

```bash
# Register with AXIS Trust
naos axis register researcher

# Check trust status
naos axis status researcher

# Verify an external agent
naos axis verify axis:company:agent:xyz
```

---

## Configuration

All configuration lives in `nexus.config.yaml`:

```yaml
name: my-project

agents:
  researcher:
    source: ./agents/researcher.wasm
    cost:
      budget: "$10/day"
      alertAt: 80
      action: pause
    axis:
      auid: "axis:company:agent:01hx7k2m3n4p5q6r7s8t9u0v1w:a3f7"

supervisors:
  main:
    strategy: one-for-one
    maxRestarts: 3
    children:
      - researcher
      - analyzer

trust:
  provider: axis
  requirements:
    minTrustTier: T3
    minTScore: 70
  enforcement:
    onUntrusted: reject

broker:
  enabled: true
  routing:
    preferSkill: true
    llmAsLastResort: true
```

---

## CLI Reference

### Core Commands

| Command | Description |
|---------|-------------|
| `naos init <project>` | Create a new project |
| `naos create <agent>` | Create a new agent |
| `naos run <agent>` | Run an agent |
| `naos stop <agent>` | Stop an agent |
| `naos status` | Show all agent statuses |
| `naos dashboard` | Start the web dashboard |

### Orchestration

| Command | Description |
|---------|-------------|
| `naos supervisor create <name>` | Create a supervisor |
| `naos saga create <name>` | Create a saga |
| `naos workflow create <name>` | Create a workflow |
| `naos pool create <name>` | Create a pool |

### Cost & Trust

| Command | Description |
|---------|-------------|
| `naos cost set <agent>` | Set agent budget |
| `naos cost status` | Show all costs |
| `naos axis register <agent>` | Register with AXIS |
| `naos axis verify <auid>` | Verify an agent |

### Broker & Edge

| Command | Description |
|---------|-------------|
| `naos broker route "<task>"` | Show routing decision |
| `naos broker stats` | Show routing statistics |
| `naos edge deploy <agent>` | Deploy to Cloudflare |
| `naos edge status <agent>` | Check edge deployment |

[Full CLI Reference →](https://www.aiagents.nexus/docs/cli-reference)

---

## Architecture

<p align="center">
  <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663030909471/YPtFhebkefwKBukz.png" alt="AI Agents Nexus architecture showing the orchestration, trust and cost, execution, and optional Cloudflare Edge layers" width="760" />
</p>

## Roadmap

- [x] Core CLI
- [x] WASM sandbox execution
- [x] Supervisor (auto-restart)
- [x] Saga (rollback)
- [x] Workflow (pipelines)
- [x] Pool (fan-out)
- [x] Cost Controller
- [x] AXIS Trust integration
- [x] Broker routing
- [x] Dashboard
- [x] Edge deployment
- [ ] Documentation site
- [ ] WASM Skill Marketplace
- [ ] Multi-node clustering
- [ ] Nexus Cloud (managed hosting)

## Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Start for Contributors

```bash
# Clone the repo
git clone https://github.com/leonidas-esquire/nexus-os.git
cd nexus-os

# Install Rust (if needed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Build
cargo build

# Run tests
cargo test

# Run the CLI locally
cargo run -- status
```

## Community

- **Discord:** [discord.gg/nexus-os](https://discord.gg/nexus-os)
- **Twitter:** [@nexus_os](https://twitter.com/nexus_os)
- **GitHub Discussions:** [Discussions](https://github.com/leonidas-esquire/nexus-os/discussions)

## License

Nexus OS is licensed under the [Apache License 2.0](LICENSE).

## Acknowledgments

Built with ❤️ using:

- [Rust](https://www.rust-lang.org/)
- [Wasmtime](https://wasmtime.dev/)
- [Axum](https://github.com/tokio-rs/axum)
- [SQLite](https://sqlite.org/)
- [AXIS Trust](https://axistrust.io)

<div align="center">

[Get Started](https://www.aiagents.nexus/docs) · [Documentation](https://www.aiagents.nexus/docs) · [GitHub](https://github.com/leonidas-esquire/nexus-os)

</div>
