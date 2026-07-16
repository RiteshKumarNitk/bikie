# BIKIE — Instructions for Claude Code

Before starting any non-trivial task, read:

- `.docs/PROJECT.md` — what BIKIE is, design language, non-goals
- `.docs/ARCHITECTURE.md` — monorepo layout, layering rule, auth/roles
- `.docs/API.md` — REST surface
- `.docs/UI_GUIDELINES.md` — theme tokens, layout primitives
- `.docs/DECISIONS.md` — why specific technical choices were made
- `.docs/ROADMAP.md` / `.docs/TASKS.md` — what's done, what's next

These are the source of truth. Don't contradict them without updating them.

## Workflow

1. Read the relevant docs above for the area you're touching.
2. Check `TASKS.md` for what's already done and what depends on what.
3. Implement only what's requested — don't refactor unrelated code.
4. Follow the existing layering (`UI → API → Service → Repository → DB`) and
   design tokens; don't introduce a second styling system or a second data-access
   pattern.
5. After finishing a task, update `TASKS.md`, `ROADMAP.md`, and `CHANGELOG.md`. If
   the change affects architecture, also update `ARCHITECTURE.md`, `API.md`, and
   `DECISIONS.md`.

## Conventions

- Package manager: pnpm (`corepack pnpm ...`). Dev server: `pnpm dev`, fixed to
  port 3000 (see ADR-003 in `DECISIONS.md`).
- No `@prisma/client` import outside `packages/database`.
- Relative imports between TS source files inside `packages/*` must NOT use a
  `.js` extension (Turbopack doesn't rewrite it like `tsc` does) — the one
  legitimate exception is importing the actual generated Prisma client output
  (`./generated/prisma/client.js`), which is real compiled JS.
- Real secrets only ever go in `apps/web/.env.local` (gitignored). `.env.example`
  at the repo root documents variable names only — never real values.



ADMIN	admin@bikie.app	Admin@12345
PARTNER	partner@bikie.app	Partner@12345
RENTER	rider@bikie.app	Rider@12345
RENTER	Riteshkumar.nitk21@gmail.com	12345678
