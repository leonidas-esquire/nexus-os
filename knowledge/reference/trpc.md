---
type: API Reference
title: AI Agents Nexus tRPC procedures
description: Agent-facing catalog of public and protected tRPC procedures exposed by the application server.
resource: https://www.aiagents.nexus/api-reference/trpc.md
tags: [api, trpc, typescript, procedures]
owner: "human:leonidas-esquire"
generated: { by: "process:nexus-okf-generator", at: 2026-09-07T09:13:03Z }
verified: { by: "process:typescript-and-vitest", at: 2026-09-07T09:13:03Z }
status: stable
stale_after: 2026-12-06T09:13:03Z
sources:
  - id: trpc-reference
    resource: https://www.aiagents.nexus/api-reference/trpc.md
    title: Agent-facing tRPC reference
    author: "process:nexus-api-build"
  - id: router-source
    resource: https://github.com/leonidas-esquire/nexus-os/blob/main/server/routers.ts
    title: Application router source
    author: "human:leonidas-esquire"
---

# tRPC procedures

The application uses tRPC for typed frontend-to-backend operations. Public procedures expose content such as blog and showcase data; protected and administrative procedures require Clerk authentication and role authorization.

Agents should consult the generated procedure reference for procedure names, access level, inputs, and outputs. The reference documents the contract; it does not bypass authentication.
