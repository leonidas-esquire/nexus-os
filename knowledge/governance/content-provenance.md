---
type: Content Governance
title: Content provenance and review
description: How source identity, automated checks, and human review are distinguished.
resource: https://www.aiagents.nexus/knowledge/governance/content-provenance.md
tags: [provenance, freshness, evidence]
owner: "human:leonidas-esquire"
status: maintained
sources:
  - resource: https://github.com/leonidas-esquire/nexus-os/blob/main/docs/AI_AGENT_READABILITY.md
    title: Content contracts and freshness policy
---

# Content provenance and review

The public content-provenance.json identifies the source commit, content digest, and generated artifact hashes. These establish identity, not correctness. CI tests cover schema contracts, approved-release access, document parity, and freshness. CI reports identify the tested source and are retained with the workflow run.

Marketplace documents are generated on request from approved release records. Publisher inputs, outputs, and examples are declarations. Publication approval and download integrity are distinct checks. No ratings, revenue, or independent security certification are invented.

Automated freshness checks run when source content changes, a release is published, and each week. They detect release-version mismatch, modified generated content, and overdue human review. Human review happens at least every 90 days and records the person, source digest, date, and evidence link. Rebuilds do not reset the human deadline. An absent review record means human review has not been recorded.

Unavailable or revoked machine-readable resources return explicit errors. Do not treat successful page discovery as proof that every described operation is implemented or authorized.
