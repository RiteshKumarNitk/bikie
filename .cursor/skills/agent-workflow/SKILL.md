---
name: agent-workflow
description: Coordinates BIKIE planning, implementation, testing, security, NFR, review, documentation, and release gates. Use for multi-stage features or architecture migrations.
---

# BIKIE Agent Workflow

Execute gates in this order:

1. **Project manager:** scope, milestones, dependencies, acceptance criteria, rollback.
2. **Architect:** boundaries, contracts, data ownership, ports/adapters, ADR decision.
3. **Coding manager:** smallest approved vertical slice with compatibility facade.
4. **Testing:** unit, integration, API contract, E2E, regression.
5. **Security:** threat model and security tests.
6. **API/NFR:** response compatibility, baseline latency, query/load/resilience checks.
7. **Code review:** independent correctness and maintainability decision.
8. **Documentation/release:** update source-of-truth docs and release/rollback notes.

## Stop conditions

Stop and return to the prior gate when:

- a public contract would break without an approved versioned migration;
- a schema change lacks safe deployment sequencing;
- tests cannot characterize the current behavior;
- security finds a deployment blocker;
- an architectural dependency cycle is introduced;
- performance claims lack a reproducible baseline.

## Progress format

- Gate and status
- Evidence produced
- Blocking issues
- Decision needed
- Next approved action
