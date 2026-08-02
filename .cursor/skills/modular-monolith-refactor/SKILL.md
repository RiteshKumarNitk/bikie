---
name: modular-monolith-refactor
description: Audits and migrates BIKIE bounded contexts into a backward-compatible modular monolith. Use for architecture refactors, module extraction, ports/adapters, dependency boundaries, or clean architecture work.
---

# Modular Monolith Refactor

## Required workflow

1. Read project docs, HLD/LLD, ADRs, and the current implementation plan.
2. Audit the selected context: contracts, callers, data, side effects, dependencies, and tests.
3. Add characterization/API compatibility tests before moving behavior.
4. Define:
   - module public API
   - application use cases
   - domain policies/errors
   - repository and provider ports
   - infrastructure adapters
   - composition root
5. Implement a compatibility facade so existing imports/routes continue to work.
6. Migrate one vertical slice and verify parity.
7. Switch callers gradually; delete legacy paths only after all gates pass.

## Boundary rules

- Presentation may depend on module public APIs.
- Application may depend on domain and ports.
- Infrastructure implements ports and may depend on Prisma/vendor SDKs.
- Domain depends on no framework, database, transport, or vendor.
- Modules do not import another module's internals.

## Avoid

- Directory-only rewrites.
- Generic `common` dumping grounds.
- One interface per class without a substitution need.
- New queues, JWT systems, Kafka, or CQRS without measured requirements.
- Breaking route or mobile contracts during migration.

## Required handoff

Report contract preserved, files migrated, tests and commands, architecture deviations,
feature-flag/rollback instructions, and remaining legacy code.
