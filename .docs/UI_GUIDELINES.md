# BIKIE — UI Guidelines

## Theme: dark-default premium

Dark mode is the default (`next-themes` `defaultTheme="dark"`); light mode remains
available via the navbar toggle for accessibility.

### Color tokens (`apps/web/app/globals.css`, Tailwind v4 `@theme`)

| Token | Dark (default) | Light |
|---|---|---|
| `--color-background` | `#0A0E1A` (deep slate/midnight) | `#FAFAFA` |
| `--color-surface` | `#0F172A` (dark navy) | `#FFFFFF` |
| `--color-card` | `#111827` | `#FFFFFF` |
| `--color-foreground` | `#F8FAFC` (white typography) | `#0F172A` |
| `--color-secondary` | `#1E293B` (midnight blue) | `#1E293B` |
| `--color-accent` | `#3B3A91` (indigo, buttons/badges/fills) | `#3B3A91` |
| `--color-accent-hover` | `#2E2D74` | `#2E2D74` |
| `--color-accent-text` | `#8482D6` (lighter tint — `#3B3A91` as text on the near-black dark background is ~1.8:1 contrast, fails WCAG AA) | `#3B3A91` |
| `--color-success` | `#22C55E` | `#22C55E` |
| `--color-warning` | `#F59E0B` | `#F59E0B` |
| `--color-brand` | `#FF4D1A` (orange, logo mark only) | `#FF4D1A` |

`--color-brand` is theme-independent and reserved for the "B" logo mark, rendered through the
shared `LogoMark` component (`apps/web/components/layout/LogoMark.tsx`) so the navbar, footer,
auth and onboarding screens stay identical to the `/welcome` splash. Don't use it as a general
fill — buttons and badges stay on `--color-accent`.

`--color-accent` is for solid fills (buttons, badges, avatar/chat-bubble backgrounds,
translucent `bg-accent/NN` tints) — always paired with white/light foreground text.
`--color-accent-text` is for accent used *as* text/icon color (links, "See all", star
ratings, badges' own text) so it stays readable against the dark background; Tailwind
class `text-accent-text`. The Flutter app mirrors this as `AppColors.darkAccentText` /
`lightAccentText`, applied via `AppTheme.accentTextOf(context)`.

24px rounded corners → Tailwind's built-in `rounded-3xl`. Glass panels use
`.glass` (backdrop-blur + translucent surface) for search bars and the sticky nav.

## Typography

Display: Geist Sans (`--font-display`). Body: Inter (`--font-body`). Headings use
`font-display`; body copy uses `font-body`.

## Layout primitives (`apps/web/components/layout`)

- **Navbar** — sticky, glass-on-scroll, mega-nav dropdown for "Explore" (Bikes /
  Destinations / Trips / Community), mobile hamburger menu.
- **Footer** — full sitemap of links grouped by Explore / Company / Support / Legal
  / Social / App downloads.
- **Breadcrumbs** — used on any page nested more than one level deep (e.g. bike
  details, destination detail, blog post, dashboard sub-pages).
- **Skeleton** (`@bikie/ui`) — loading placeholders, paired with route-level
  `loading.tsx` files.
- **EmptyState** — shared component for "no results" / "no bookings yet" / "no
  wishlist items" states across dashboards and search.
- **PageTransition** — Motion-based fade/slide wrapper applied via `template.tsx`
  at the root so navigations feel smooth without fighting Next's own transitions.

## Error pages

`apps/web/app/not-found.tsx` (404) and `apps/web/app/error.tsx` (500) match the
dark theme and offer a way back to Home / Rent a Bike.

## Motion division of labor

Unchanged from Milestone 1: Lenis for scroll, GSAP+ScrollTrigger for the Hero
parallax only, Motion for everything else (reveals, hovers, carousels, page
transitions, mega-nav dropdown).
