# BIKIE — API Reference

All routes live under `apps/web/app/api/**`. Each validates input with Zod
(`@bikie/validation`), calls a `@bikie/services` function, and returns typed JSON.
No route imports `@prisma/client` directly.

## Auth

`ALL /api/auth/[...all]` — Better Auth catch-all (signup, login, session, signout).

## Content (read)

| Route | Query params | Returns |
|---|---|---|
| `GET /api/bikes/featured` | `limit` (default 8, max 20) | `{ bikes: BikeSummaryDTO[] }` |
| `GET /api/bikes` | `location, category, priceMin, priceMax, brand, instantBooking, sort, page` | `{ bikes: BikeSummaryDTO[], total, page }` |
| `GET /api/bikes/[slug]` | — | `BikeDetailDTO` |
| `GET /api/destinations/popular` | `limit` | `{ destinations: DestinationSummaryDTO[] }` |
| `GET /api/destinations/[slug]` | — | `DestinationDetailDTO` |
| `GET /api/categories` | — | `{ categories: CategoryDTO[] }` |
| `GET /api/testimonials` | `limit` | `{ testimonials: TestimonialDTO[] }` |
| `GET /api/trips` | `tab` (upcoming/weekend/adventure/road-trip/international/completed) | `{ trips: TripSummaryDTO[] }` |
| `GET /api/trips/[slug]` | — | `TripDetailDTO` |

## Bookings (auth required)

| Route | Method | Notes |
|---|---|---|
| `/api/bookings` | GET | Current user's bookings, `?status=` filter |
| `/api/bookings` | POST | Create a booking (bike, dates) — no real payment capture yet |
| `/api/bookings/[id]` | GET | Booking detail |

## Reviews

| Route | Method | Notes |
|---|---|---|
| `/api/bikes/[slug]/reviews` | GET | Reviews for a bike |
| `/api/reviews` | POST | Auth required; must have a completed booking for that bike |

## Partner (role: PARTNER)

| Route | Method |
|---|---|
| `/api/partner/bikes` | GET/POST |
| `/api/partner/bookings` | GET |
| `/api/partner/analytics` | GET |

## Admin (role: ADMIN)

| Route | Method |
|---|---|
| `/api/admin/users` | GET |
| `/api/admin/partners` | GET |
| `/api/admin/bookings` | GET |

## Conventions

- List endpoints accept `limit`/`page` and are `revalidate`-cached where the data
  changes rarely (categories, destinations).
- All DTOs live in `packages/types` — Prisma types never leak past the repository
  layer.
