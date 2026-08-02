# BIKIE — Authorization Matrix (Phase 9)

Machine-readable companion: `.docs/openapi/route-inventory.json` (`auth` field per route).
Regenerate with `pnpm openapi:generate`. Narrative API docs remain in `.docs/API.md`.

## Auth classes

| Class | Meaning | Typical gate |
|---|---|---|
| `public-or-unclassified` | No session gate detected in the route file (may still be public by design) | — |
| `public-auth` | Better Auth catch-all | Better Auth |
| `session` | Authenticated user (cookie or bearer) | `requireSession` / Ride Room access |
| `membership` | Active membership (admins often bypass) | `requireMembership` |
| `partner` | `User.role === PARTNER` | `requireRole("PARTNER")` |
| `admin` | `User.role === ADMIN` | `requireRole("ADMIN")` |
| `cron` | Shared secret | `Authorization: Bearer <CRON_SECRET>` |
| `dev` | Development-only helpers | Env-gated |

## Notes

- Cookie and bearer auth are both accepted on gated routes via Better Auth (`ADR-007`).
- `requirePermission()` exists (ADR-023) but is **not yet wired** into routes — role checks remain the live gate.
- Inventory auth is heuristic (static scan). Prefer `.docs/API.md` when a route mixes public GET + authenticated POST.

## Facade / legacy removal gates

Compatibility facades under `packages/services/src/*.service.ts` stay until **all** of:

1. Zero imports outside module `public.ts` / tests (repo-wide grep evidence).
2. Flutter + web consumers verified against OpenAPI v1 snapshot.
3. Characterization tests green for the module.
4. Explicit ADR approving facade deletion.

See `.docs/openapi/facade-registry.md`.
