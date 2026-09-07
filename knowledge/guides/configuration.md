---
type: Configuration Guide
title: Configure Nexus OS
description: Configure agents, supervisors, cost controls, trust rules, broker routing, skills, and edge targets in nexus.config.yaml.
resource: https://www.aiagents.nexus/docs/getting-started/configuration
tags: [configuration, yaml, agents, supervisors, budgets]
owner: "human:leonidas-esquire"
generated: { by: "process:nexus-okf-generator", at: 2026-09-07T09:13:03Z }
historical_process_check: { by: "process:documentation-regression-tests", at: 2026-09-07T09:13:03Z }
status: maintained
stale_after: 2026-12-06T09:13:03Z
sources:
  - id: configuration-docs
    resource: https://www.aiagents.nexus/docs/getting-started/configuration
    title: Configuration documentation
    author: "human:leonidas-esquire"
---

# Configuration

Nexus OS uses `nexus.config.yaml` as its declarative project configuration. The documented model covers agent definitions, supervisor strategy, cost budgets, broker routing, trust requirements, skill bindings, and edge deployment targets.[^configuration-docs]

Consumers should consult the linked page for field-level examples and the current supported schema.

[^configuration-docs]: Configuration documentation
