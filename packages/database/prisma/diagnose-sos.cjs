#!/usr/bin/env node
/**
 * READ-ONLY production diagnostic for one Amber/Assistance SOS alert — no writes, no mutations,
 * only SELECT queries. Plain CommonJS Node (deliberately NOT TypeScript): `tsx` is a devDependency
 * scoped to this package alone (not hoisted to the workspace root), so it isn't reliably reachable
 * via `pnpm exec` from the container's WORKDIR. This script needs nothing beyond `node` itself and
 * the `pg` package `@bikie/database` already depends on at runtime (packages/database/package.json
 * — the same driver `createPrismaAdapter` wraps for a non-Neon `DATABASE_URL`, see
 * packages/database/src/adapter.ts) — no compile step, no bundler, no install.
 *
 * Mirrors (never imports, to stay usable even if the deployed image's layout differs from this
 * repo's) the exact eligibility logic from:
 *   - packages/services/src/modules/safety-location/domain/severity.ts (deriveSeverity)
 *   - packages/services/src/modules/safety-location/domain/partner-mapping.ts (partnerMatchesAlertType)
 *   - packages/services/src/modules/communications/domain/phone.ts (maskPhone/isValidIndianMobile)
 *   - packages/database/src/lib/geo.ts (haversineDistanceMeters)
 * Keep these in sync if those source files ever change.
 *
 * RUN (inside the already-running `web` container — no rebuild/restart needed once this file has
 * been deployed via the normal `git push origin master` -> CI/CD build):
 *
 *   docker compose exec web node packages/database/prisma/diagnose-sos.cjs [alertId]
 *
 * Omit alertId to inspect the most recently created SOS alert.
 */
"use strict";

function requirePg() {
  const directCandidates = [
    "pg", // standard resolution from this script's own directory upward
    "/app/packages/database/node_modules/pg", // @bikie/database's own direct dependency
    "/app/node_modules/pg", // hoisted to the workspace root, if hoisting is on
  ];
  for (const c of directCandidates) {
    try {
      return require(c);
    } catch (e) {
      /* try next */
    }
  }
  // Last resort: scan pnpm's virtual store for a pg@<version> directory anywhere under
  // node_modules/.pnpm, at any depth, and require its nested node_modules/pg. Self-sufficient —
  // no need to hunt for the exact path by hand first.
  const fs = require("fs");
  const path = require("path");
  function findPgUnderPnpmStore(root) {
    let stack = [root];
    let steps = 0;
    while (stack.length > 0 && steps < 20000) {
      const dir = stack.pop();
      steps += 1;
      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch (e) {
        continue;
      }
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const full = path.join(dir, entry.name);
        if (/^pg@[\d.]/.test(entry.name)) {
          const candidate = path.join(full, "node_modules", "pg");
          if (fs.existsSync(path.join(candidate, "package.json"))) return candidate;
        }
        if (entry.name === ".pnpm" || entry.name.startsWith("pg@") || !entry.name.startsWith(".")) {
          stack.push(full);
        }
      }
    }
    return null;
  }
  for (const root of ["/app/node_modules/.pnpm", "/app/packages/database/node_modules/.pnpm", "/app/node_modules"]) {
    if (!fs.existsSync(root)) continue;
    const found = findPgUnderPnpmStore(root);
    if (found) {
      try {
        return require(found);
      } catch (e) {
        /* fall through */
      }
    }
  }
  throw new Error(
    "Could not resolve the 'pg' package anywhere under /app/node_modules. Run: " +
      "docker compose exec web find /app -maxdepth 8 -type d -name pg 2>/dev/null   " +
      "and adjust the candidates/search roots above to the exact path.",
  );
}

const { Client } = requirePg();

function maskPhone(phone) {
  if (!phone) return "(none)";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  const last4 = digits.slice(-4);
  const maskedCount = Math.max(digits.length - 4, 3);
  return `${phone.trim().startsWith("+") ? "+" : ""}${"*".repeat(maskedCount)}${last4}`;
}
function toE164(phone) {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (trimmed.startsWith("+")) return `+${digits}`;
  return digits ? `+${digits}` : trimmed;
}
function isValidIndianMobile(phone) {
  const digits = phone.trim().replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local);
}

const EMERGENCY_TYPES = new Set(["ACCIDENT", "MEDICAL", "LIFE_THREATENING"]);
function deriveSeverity(type) {
  return EMERGENCY_TYPES.has(type) ? "EMERGENCY" : "ASSISTANCE";
}

const TYPE_BY_ALERT_TYPE = {
  BIKE_BREAKDOWN: "MECHANIC",
  FLAT_TYRE: "MECHANIC",
  BATTERY_ISSUE: "MECHANIC",
  FUEL_EMPTY: "FUEL_DELIVERY",
};
function partnerMatchesAlertType(partner, alertType) {
  const relevantType = TYPE_BY_ALERT_TYPE[alertType];
  return relevantType ? partner.type === relevantType : partner.isGeneralResponder;
}

const EARTH_RADIUS_METERS = 6_371_000;
function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const OPEN_SESSION_STATUSES = ["ACTIVE", "HELPER_ARRIVED", "ASSISTANCE_IN_PROGRESS"];
const STALE_MINUTES = 30;

async function main() {
  const alertIdArg = process.argv[2];
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set in this shell/container environment.");
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const alertRes = alertIdArg
      ? await client.query('SELECT * FROM "sos_alert" WHERE id = $1', [alertIdArg])
      : await client.query('SELECT * FROM "sos_alert" ORDER BY "createdAt" DESC LIMIT 1');

    if (alertRes.rows.length === 0) {
      console.log(alertIdArg ? `No SOS alert found with id ${alertIdArg}` : "No SOS alerts exist at all.");
      return;
    }
    const alert = alertRes.rows[0];

    const reporterRes = await client.query('SELECT * FROM "user" WHERE id = $1', [alert.userId]);
    const reporter = reporterRes.rows[0];

    const severity = deriveSeverity(alert.type);
    console.log("================ SOS ALERT ================");
    console.log(`id:                  ${alert.id}`);
    console.log(`type:                ${alert.type}`);
    console.log(
      `derived severity:   ${severity}  ${
        severity === "EMERGENCY"
          ? "(Service Providers NEVER dispatched for this type — by design)"
          : "(Amber/Assistance — Service Providers ARE eligible)"
      }`,
    );
    console.log(`status:              ${alert.status}`);
    console.log(`escalationTier:      ${alert.escalationTier}`);
    console.log(`currentRadiusMeters: ${alert.currentRadiusMeters}`);
    console.log(`city:                ${alert.city}`);
    console.log(`lat/lng:             ${alert.latitude}, ${alert.longitude}`);
    console.log(`createdAt:           ${new Date(alert.createdAt).toISOString()}`);
    console.log(`reporter userId:       ${alert.userId}`);
    console.log(`reporter name:         ${reporter ? reporter.name : "(user row not found)"}`);
    console.log(`reporter accountType:  ${reporter ? reporter.accountType : "?"}`);
    console.log(`reporter phoneNumber:  ${maskPhone(reporter && reporter.phoneNumber)}`);
    console.log(`reporter phone:        ${maskPhone(reporter && reporter.phone)}`);

    const relevantPartnerType = TYPE_BY_ALERT_TYPE[alert.type];
    console.log(
      `\npartnerMatchesAlertType rule for ${alert.type}: ${
        relevantPartnerType
          ? `Partner.type === "${relevantPartnerType}"`
          : "Partner.isGeneralResponder === true (no direct type mapping for this alert type)"
      }`,
    );

    // ---------------- NEARBY RIDERS ----------------
    console.log("\n============ NEARBY RIDERS (within 50km, every gate shown) ============");
    const riderRes = await client.query(
      `SELECT u."id" AS "userId", u."name" AS "name", u."phone" AS "phone", u."phoneNumber" AS "phoneNumber",
              rl."sharingEnabled" AS "sharingEnabled", rl."receiveSosAlerts" AS "receiveSosAlerts",
              ST_Y(rl."location"::geometry) AS "lat", ST_X(rl."location"::geometry) AS "lng",
              rl."updatedAt" AS "updatedAt"
       FROM "rider_location" rl
       JOIN "user" u ON u."id" = rl."userId"
       WHERE rl."location" IS NOT NULL AND u."id" != $1`,
      [alert.userId],
    );
    if (riderRes.rows.length === 0) console.log("(no rider has ever shared a location besides the reporter)");
    let anyRiderWithin50km = false;
    for (const r of riderRes.rows) {
      if (r.lat == null || r.lng == null) continue;
      const distanceMeters = haversineDistanceMeters(alert.latitude, alert.longitude, r.lat, r.lng);
      if (distanceMeters > 50_000) continue;
      anyRiderWithin50km = true;
      const ageMinutes = (Date.now() - new Date(r.updatedAt).getTime()) / 60000;
      const phone = r.phoneNumber || r.phone;
      const gates = {
        sharingEnabled: r.sharingEnabled,
        receiveSosAlerts: r.receiveSosAlerts,
        locationFresh: ageMinutes <= STALE_MINUTES,
        withinCurrentRadius: distanceMeters <= alert.currentRadiusMeters,
        hasPhone: Boolean(phone),
        validPhone: phone ? isValidIndianMobile(toE164(phone)) : false,
      };
      const eligible = Object.values(gates).every(Boolean);
      console.log(
        `- userId=${r.userId} name=${r.name} phone=${maskPhone(phone)} distance=${Math.round(distanceMeters)}m ` +
          `ageMin=${ageMinutes.toFixed(1)} ${JSON.stringify(gates)} => ${eligible ? "ELIGIBLE" : "NOT ELIGIBLE"}`,
      );
    }
    if (!anyRiderWithin50km) console.log("(none within 50km)");

    // ---------------- NEARBY SERVICE PROVIDERS ----------------
    console.log("\n============ NEARBY SERVICE PROVIDERS (within 50km, every gate shown) ============");
    const partnerRes = await client.query(
      `SELECT p.*, u."id" AS "u_id", u."name" AS "u_name", u."accountType" AS "u_accountType",
              u."phone" AS "u_phone", u."phoneNumber" AS "u_phoneNumber"
       FROM "Partner" p
       JOIN "user" u ON u."id" = p."userId"
       WHERE p."latitude" IS NOT NULL AND p."longitude" IS NOT NULL`,
    );
    const nearbyPartners = partnerRes.rows
      .map((p) => ({ ...p, distanceMeters: haversineDistanceMeters(alert.latitude, alert.longitude, p.latitude, p.longitude) }))
      .filter((p) => p.distanceMeters <= 50_000);

    let capacitySet = new Set();
    if (nearbyPartners.length > 0) {
      const capRes = await client.query(
        `SELECT DISTINCT "helperId" FROM "sos_session" WHERE "helperId" = ANY($1) AND status = ANY($2)`,
        [nearbyPartners.map((p) => p.userId), OPEN_SESSION_STATUSES],
      );
      capacitySet = new Set(capRes.rows.map((r) => r.helperId));
    }

    if (nearbyPartners.length === 0) {
      console.log("(no Partner row has a lat/lng within 50km of this alert — check Partner.latitude/longitude is set for your SP account)");
    }
    for (const p of nearbyPartners) {
      const memRes = await client.query(
        `SELECT * FROM "partner_membership" WHERE "userId" = $1 AND status = 'ACTIVE' AND "endDate" >= NOW() ORDER BY "endDate" DESC LIMIT 1`,
        [p.userId],
      );
      const membership = memRes.rows[0];
      const phone = p.u_phoneNumber || p.u_phone || p.contactPerson1Mobile;
      const gates = {
        accountTypeIsServiceProvider: p.u_accountType === "SERVICE_PROVIDER",
        notSuspended: p.verificationStatus !== "SUSPENDED",
        isAvailable: p.isAvailable,
        hasActiveMembership: Boolean(membership),
        typeMatches: partnerMatchesAlertType(p, alert.type),
        notAtCapacity: !capacitySet.has(p.userId),
        withinCurrentRadius: p.distanceMeters <= alert.currentRadiusMeters,
        hasPhone: Boolean(phone),
        validPhone: phone ? isValidIndianMobile(toE164(phone)) : false,
        severityAllowsServiceProviders: severity !== "EMERGENCY",
      };
      const eligible = Object.values(gates).every(Boolean);
      console.log(
        `- Partner.id=${p.id} userId=${p.userId} business="${p.businessName}" type=${p.type} ` +
          `isGeneralResponder=${p.isGeneralResponder} verificationStatus=${p.verificationStatus} ` +
          `membershipEndDate=${membership ? new Date(membership.endDate).toISOString() : "(none active)"} ` +
          `phone=${maskPhone(phone)} distance=${Math.round(p.distanceMeters)}m`,
      );
      console.log(`  gates: ${JSON.stringify(gates)} => ${eligible ? "ELIGIBLE" : "NOT ELIGIBLE"}`);
    }

    // ---------------- SOS TIMELINE ----------------
    console.log("\n============ sos_timeline_event rows for this alert ============");
    const eventsRes = await client.query(
      `SELECT * FROM "sos_timeline_event" WHERE "alertId" = $1 ORDER BY "createdAt" ASC`,
      [alert.id],
    );
    if (eventsRes.rows.length === 0) {
      console.log("(no timeline events recorded at all for this alert — dispatch may not have run, or this alert predates the timeline)");
    }
    const helperOffered = eventsRes.rows.filter((e) => e.type === "HELPER_OFFERED");
    console.log(`Total HELPER_OFFERED candidates across all batches: ${helperOffered.length}`);
    console.log(
      `Of those, marked smsEligible (metadata.sms=true):   ${
        helperOffered.filter((e) => e.metadata && e.metadata.sms === true).length
      }`,
    );
    for (const e of eventsRes.rows) {
      console.log(`- [${new Date(e.createdAt).toISOString()}] type=${e.type} metadata=${JSON.stringify(e.metadata)}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("DIAGNOSTIC SCRIPT ERROR:", err);
  process.exit(1);
});
