---
type: Installation Guide
title: Install Nexus OS
description: Install the naos CLI through Cargo, a prebuilt binary, or a source build.
resource: https://www.aiagents.nexus/docs/getting-started/installation
tags: [installation, cargo, binary, source]
owner: "human:leonidas-esquire"
generated: { by: "process:nexus-okf-generator", at: 2026-09-07T09:13:03Z }
historical_process_check: { by: "process:documentation-regression-tests", at: 2026-09-07T09:13:03Z }
status: maintained
stale_after: 2026-12-06T09:13:03Z
sources:
  - id: install-docs
    resource: https://www.aiagents.nexus/docs/getting-started/installation
    title: Installation documentation
    author: "human:leonidas-esquire"
  - id: release-assets
    resource: https://github.com/leonidas-esquire/nexus-os/releases/latest
    title: Latest release assets
    author: "process:github-actions-release"
---

# Installation

## Cargo from GitHub

```bash
cargo install --git https://github.com/leonidas-esquire/nexus-os.git
```

## Verify

```bash
naos --version
```

Prebuilt binaries and source-build instructions are maintained in the installation documentation.[^install-docs]

[^install-docs]: Installation documentation
