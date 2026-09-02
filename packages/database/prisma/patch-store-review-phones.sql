-- ADR-072 — raw-SQL fallback for patch-store-review-phones.ts, for when running Node/tsx inside
-- the production container is not convenient. Same effect, fully idempotent, one transaction.
--
-- Table names (from schema.prisma @@map): the User model maps to "user" (lowercase, reserved
-- word — must be quoted); Partner has no @@map so it is "Partner" (PascalCase); membership tables
-- are snake_case. Column names are NOT snake-cased (no @map on fields) — hence the quoted
-- "phoneNumber", "accountType", etc.
--
-- Run against the production DB from the VPS (psql lives in the postgres container):
--
--   cd /opt/bikie
--   docker compose exec -T postgres psql -U bikie -d bikie \
--     < packages/database/prisma/patch-store-review-phones.sql
--
-- If your test numbers differ from the two below, edit these two \set lines first. The
-- verification block at the bottom is read-only and always safe to re-run on its own.

\set ON_ERROR_STOP on
\set rider_phone '''+919000000001'''
\set provider_phone '''+919000000002'''

BEGIN;

-- 1. Rider account -----------------------------------------------------------------------------
INSERT INTO "user" (id, name, email, "emailVerified", phone, "phoneNumber", "phoneNumberVerified",
                    role, "accountType", "accountStatus", "createdAt", "updatedAt")
VALUES ('seed_review_rider', 'Demo Rider', 'rider@bikie.app', true,
        :rider_phone, :rider_phone, true, 'RENTER', 'RIDER', 'ACTIVE', now(), now())
ON CONFLICT (email) DO UPDATE SET
  phone                 = EXCLUDED.phone,
  "phoneNumber"         = EXCLUDED."phoneNumber",
  "phoneNumberVerified" = true,
  role                  = 'RENTER',
  "accountType"         = 'RIDER',
  "accountStatus"       = 'ACTIVE',
  "updatedAt"           = now();

-- 2. Service Provider account ----------------------------------------------------------------
INSERT INTO "user" (id, name, email, "emailVerified", phone, "phoneNumber", "phoneNumberVerified",
                    role, "accountType", "partnerStatus", "accountStatus", "createdAt", "updatedAt")
VALUES ('seed_review_partner', 'Demo Service Provider', 'partner@bikie.app', true,
        :provider_phone, :provider_phone, true, 'PARTNER', 'SERVICE_PROVIDER', 'APPROVED', 'ACTIVE', now(), now())
ON CONFLICT (email) DO UPDATE SET
  phone                 = EXCLUDED.phone,
  "phoneNumber"         = EXCLUDED."phoneNumber",
  "phoneNumberVerified" = true,
  role                  = 'PARTNER',
  "accountType"         = 'SERVICE_PROVIDER',
  "partnerStatus"       = 'APPROVED',
  "accountStatus"       = 'ACTIVE',
  "updatedAt"           = now();

-- 3. Partner profile (partner/layout.tsx redirects to /partner-onboarding without one) --------
INSERT INTO "Partner" (id, "userId", "businessName", type, city, description,
                       "isVerified", "verificationStatus", "submittedAt", "reviewedAt", "createdAt")
SELECT 'seed_review_partner_profile', u.id, 'BIKIE Demo Service Provider', 'MECHANIC', 'Bengaluru',
       'Demo Service Provider account for app-store review.',
       true, 'APPROVED', now(), now(), now()
FROM "user" u
WHERE u.email = 'partner@bikie.app'
ON CONFLICT ("userId") DO UPDATE SET
  "isVerified"         = true,
  "verificationStatus" = 'APPROVED',
  "reviewedAt"         = now();

-- 4. One ACTIVE PartnerMembership so gated provider features are reachable --------------------
INSERT INTO partner_membership (id, "userId", "planId", "startDate", "endDate", status, "createdAt")
SELECT 'seed_review_partner_membership', u.id,
       COALESCE(
         (SELECT id FROM partner_membership_plan WHERE name = 'Service Provider Membership' LIMIT 1),
         (SELECT id FROM partner_membership_plan WHERE id = 'legacy-free-partner-plan' LIMIT 1),
         (SELECT id FROM partner_membership_plan ORDER BY "createdAt" ASC LIMIT 1)
       ),
       now(), now() + INTERVAL '100 years', 'ACTIVE', now()
FROM "user" u
WHERE u.email = 'partner@bikie.app'
  AND EXISTS (SELECT 1 FROM partner_membership_plan)
  AND NOT EXISTS (
    SELECT 1 FROM partner_membership pm
    WHERE pm."userId" = u.id AND pm.status = 'ACTIVE' AND pm."endDate" >= now()
  );

COMMIT;

-- 5. Verification (read-only) ---------------------------------------------------------------
SELECT email, name, "phoneNumber", "phoneNumberVerified", "accountType", role, "partnerStatus"
FROM "user"
WHERE email IN ('rider@bikie.app', 'partner@bikie.app')
ORDER BY email;

SELECT u.email, p."verificationStatus", p."isVerified"
FROM "Partner" p JOIN "user" u ON u.id = p."userId"
WHERE u.email = 'partner@bikie.app';

SELECT u.email, pm.status, pm."endDate", pmp.name AS plan
FROM partner_membership pm
JOIN "user" u ON u.id = pm."userId"
JOIN partner_membership_plan pmp ON pmp.id = pm."planId"
WHERE u.email = 'partner@bikie.app' AND pm.status = 'ACTIVE';
