# BIKIE Implementation Plan Prompt

Use `.cursor/skills/agent-workflow/SKILL.md` and
`.cursor/skills/modular-monolith-refactor/SKILL.md`.

Before writing production code:

1. Read HLD, LLD, project docs, API docs, ADRs, roadmap, tasks, and relevant Next.js docs.
2. Audit current behavior and cite file/line evidence for architecture, duplication,
   cycles, dead code, security, performance, API, folder/naming, and database issues.
3. Identify what already satisfies the requested capability; do not replace working
   Better Auth, Prisma, Redis, or Next.js mechanisms with generic alternatives.
4. Define one bounded migration slice with public contract, dependency direction,
   feature flag (if needed), rollback, and acceptance criteria.
5. Add characterization and API compatibility tests.
6. Implement route → application service → port → adapter/repository.
7. Run typecheck, lint, focused unit/integration/API tests, security checks, and NFR baseline.
8. Obtain review approval and update documentation.

Required plan sections:

- Executive summary
- Current architecture and verified audit findings
- Target module boundaries and dependency rules
- Migration principles and compatibility strategy
- Phased roadmap with acceptance criteria
- Test, security, API/NFR, data migration, observability, and rollback plans
- Risks, assumptions, non-goals, and definition of done

Never claim support for one million users from architecture alone; define a workload,
measure it, identify bottlenecks, and scale through evidence.
