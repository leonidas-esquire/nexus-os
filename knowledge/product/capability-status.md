---
type: Capability Status
title: Nexus OS implementation and release boundaries
description: Distinguishes executable capabilities from planned behavior and source code from released binaries.
resource: https://www.aiagents.nexus/knowledge/product/capability-status.md
tags: [capabilities, runtime, marketplace, limitations]
owner: "human:leonidas-esquire"
status: maintained
sources:
  - resource: https://github.com/leonidas-esquire/nexus-os/blob/main/docs/DETERMINISTIC-WASM.md
    title: Deterministic execution contract
  - resource: https://github.com/leonidas-esquire/nexus-os/blob/main/docs/MARKETPLACE-REGISTRY.md
    title: Registry implementation and rollout requirements
---

# Capability status

| Capability | Implementation boundary |
| --- | --- |
| Deterministic WASM execution | Implemented in source: WASIp1 commands, bounded memory/fuel/time, stdin/stdout and audit records. |
| Operation without an LLM | Only deterministic work already implemented by a package continues; WASM does not replace missing model reasoning. |
| Skill publishing and installation | Implemented in source: free packages, ownership, immutable releases, manual approval, private storage, SHA-256 verification. Requires database migration, private storage configuration, and a CLI built with registry support. |
| Paid sales and developer payouts | Not enabled. No revenue or withdrawal should be inferred from the current registry. |
| Hosted execution billing | Not enabled by the registry. Installation is local; browser download is not hosted execution. |
| Supervisors, sagas, workflows, pools and edge deployment | Interfaces and design exist; do not assume fully operational end-to-end implementations from CLI commands or conceptual guides alone. |

The GitHub release tag and current source tree are separate channels. A version advertised as the latest downloadable release does not establish that its binaries include subsequent source changes. Check release notes and the CLI build before using newer commands.

Generated metadata records content identity, not human approval. Automated evidence is attached to CI runs; quarterly human review is governed by the repository content policy. Publisher descriptions and examples remain publisher claims until separately tested.
