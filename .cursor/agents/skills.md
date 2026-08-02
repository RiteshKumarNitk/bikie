# BIKIE Agent Skills Matrix

## Project skills

| Area | Required knowledge |
|---|---|
| Architecture | Modular monolith, Clean Architecture, hexagonal ports/adapters, Strangler migration |
| Web | Next.js 16 App Router, React Server/Client Components, Tailwind v4 |
| Backend | TypeScript, Route Handlers, Zod, DTO mapping, dependency injection |
| Identity | Better Auth cookie sessions, bearer plugin, phone OTP, Google OAuth |
| Data | Prisma 7, Neon Postgres, PostGIS, migrations, transactions, query plans |
| Realtime/cache | Upstash Redis REST, SSE, caching and rate limiting |
| Mobile | Flutter REST client, bearer auth, polling |
| Providers | Twilio, Meta WhatsApp, SMTP/Resend, FCM, Cloudinary, Google Places |
| Testing | Unit/integration/API contract/E2E, Playwright, Flutter tests, load testing |
| Security | OWASP ASVS/API Top 10, PII/location privacy, audit and encryption |
| Delivery | pnpm/Turborepo, Docker, Vercel, feature flags, backward-compatible migrations |

## Assignment

- Planning and dependencies → `project-manager.md`
- Boundaries and architecture decisions → `architect.md`
- Implementation coordination → `coding-manager.md`
- Unit/integration/E2E → `testing-engineer.md`
- Independent review → `code-reviewer.md`
- Threat modeling/security tests → `security-engineer.md`
- API contract/performance/load → `nfr-api-engineer.md`

## Shared evidence rule

Agents must cite repository paths and line numbers for findings, distinguish verified
facts from assumptions, and never claim production scale or security without measured tests.
