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
| `--color-accent` | `#FF7A1F` (orange CTA) | `#FF6B00` |
| `--color-success` | `#22C55E` | `#22C55E` |
| `--color-warning` | `#F59E0B` | `#F59E0B` |

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
dark theme and offer a way back to Home / Explore Bikes.

## Motion division of labor

Unchanged from Milestone 1: Lenis for scroll, GSAP+ScrollTrigger for the Hero
parallax only, Motion for everything else (reveals, hovers, carousels, page
transitions, mega-nav dropdown).
