---
type: Deployment Guide
title: Deploy AI Agents Nexus
description: Production topology and configuration guidance for the Vercel frontend, Railway backend, Clerk authentication, and MySQL database.
resource: https://github.com/leonidas-esquire/nexus-os/blob/main/DEPLOYMENT.md
tags: [deployment, vercel, railway, clerk, mysql]
owner: "human:leonidas-esquire"
generated: { by: "process:nexus-okf-generator", at: 2026-09-07T09:13:03Z }
verified: { by: "process:deployment-ci", at: 2026-09-07T09:13:03Z }
status: stable
stale_after: 2026-12-06T09:13:03Z
sources:
  - id: deployment-guide
    resource: https://github.com/leonidas-esquire/nexus-os/blob/main/DEPLOYMENT.md
    title: Deployment guide
    author: "human:leonidas-esquire"
  - id: api-health
    resource: https://api.aiagents.nexus/api/health
    title: Production API health endpoint
    author: "process:railway-runtime"
---

# Deployment

The production system uses `www.aiagents.nexus` as the canonical Vercel frontend and `api.aiagents.nexus` as the Railway Express backend. Vercel proxies dynamic API paths to Railway. Railway hosts the MySQL-connected application server and Clerk-authenticated protected procedures.[^deployment-guide]

Consult the deployment guide for environment contracts, migration order, health checks, and the current portable-storage limitation.

[^deployment-guide]: Deployment guide
