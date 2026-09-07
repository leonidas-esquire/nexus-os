---
type: Architecture Reference
title: Nexus OS architecture
description: Architectural layers, deployment boundaries, and authoritative technical references for Nexus OS.
resource: https://www.aiagents.nexus/#architecture
tags: [architecture, wasm, orchestration, broker, deployment]
owner: "human:leonidas-esquire"
generated: { by: "process:nexus-okf-generator", at: 2026-09-07T09:13:03Z }
historical_process_check: { by: "process:github-main-and-production-checks", at: 2026-09-07T09:13:03Z }
status: maintained
stale_after: 2026-12-06T09:13:03Z
sources:
  - id: architecture-readme
    resource: https://github.com/leonidas-esquire/nexus-os/blob/main/README.md#architecture
    title: Repository architecture section
    author: "human:leonidas-esquire"
  - id: runtime-contract
    resource: https://github.com/leonidas-esquire/nexus-os/blob/main/docs/contracts/egov-runtime-contract-v1.md
    title: Governed runtime contract v1
    author: "human:leonidas-esquire"
---

# Architecture

Nexus OS separates agent execution, orchestration, and intelligence concerns while presenting them through one CLI and a shared configuration model.[^architecture-readme]

| Layer | Responsibilities |
|---|---|
| Execution | WASM sandboxes, containers, and edge runtimes |
| Orchestration | Supervisors, sagas, workflows, and pools |
| Intelligence | Broker routing, cost control, and model selection |

The public web deployment uses Vercel for the frontend and Railway for the Express API, MySQL-backed data, and dynamic routes.

[^architecture-readme]: Repository architecture section
