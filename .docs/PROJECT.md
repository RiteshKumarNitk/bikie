# BIKIE — Project Overview

## What BIKIE is

BIKIE is a premium motorcycle rental and travel platform for India, positioned as
"Airbnb for motorcycles." Users search for an experience (a bike, in a destination,
for a date range) rather than choosing a service provider — the platform surfaces
the best bikes and the provider is secondary.

The long-term product spans:
- A public marketing + booking website
- A user dashboard (bookings, wishlist, trips, wallet, membership)
- A partner dashboard (fleet, bookings, analytics, payouts)
- An admin dashboard (users, partners, bikes, bookings, CMS, reports)
- A future mobile app (Flutter), reusing the same REST API

## Design language

Premium dark theme by default — Dark Navy / Midnight Blue / Deep Slate surfaces,
white typography, orange accent for CTAs. Visual inspiration: Airbnb (search/listing
UX), Apple (simplicity), Tesla (cleanliness), Linear/Notion (typography, spacing).
Glassmorphism used selectively (search bar, sticky nav). See `UI_GUIDELINES.md` for
concrete tokens.

## Non-goals (for now)

- Real payment processing (Razorpay is env-documented, not wired)
- Real push notifications (Firebase is env-documented, not wired)
- Real maps (Mapbox is env-documented, not wired)
- The Flutter mobile app itself (architecture must not preclude it)

## Where things live

See `ARCHITECTURE.md` for the monorepo layout and layering rules, `API.md` for the
REST surface, `DECISIONS.md` for why specific technical choices were made, and `SOS.md`
for the SOS feature flow (Mermaid diagrams).
