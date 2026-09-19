#!/usr/bin/env node
/**
 * READ-ONLY production diagnostic: every PartnerMembership + MembershipInvoice row for one
 * userId, plus the exact eligibility condition SOS dispatch (and the "active membership" screen)
 * use, evaluated against each row. No writes, no mutations — only SELECT queries.
 *
 * Plain CommonJS Node — same rationale as diagnose-sos.cjs (tsx isn't reliably reachable via
 * `pnpm exec` from the container's WORKDIR; this needs only `node` + the `pg` package
 * @bikie/database already depends on at runtime).
 *
 * The eligibility condition reproduced here is copy-verified against BOTH call sites that use it
 * today (confirmed identical, so there is no query-mismatch between "shows as active in the app"
 * and "SOS eligibility"):
 *   - packages/database/src/repositories/partner-membership.repository.ts's getActiveMembership
 *     (`GET /api/partner-membership/active`, what the app's own membership screen reads)
 *   - packages/database/src/repositories/partner.repository.ts's findEligiblePartnersNearPoint
 *     (what SOS dispatch reads)
 *   Both: `WHERE "userId" = $1 AND status = 'ACTIVE' AND "endDate" >= NOW()`
 *
 * RUN (inside the already-running `web` container):
 *   docker compose exec web node packages/database/prisma/diagnose-membership.cjs <userId>
 */
"use strict";

function requirePg() {
  const directCandidates = ["pg", "/app/packages/database/node_modules/pg", "/app/node_modules/pg"];
  for (const c of directCandidates) {
    try {
      return require(c);
    } catch (e) {
      /* try next */
    }
  }
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
  throw new Error("Could not resolve 'pg'. Run: docker compose exec web find /app -maxdepth 8 -type d -name pg");
}

const { Client } = requirePg();

function maskPhone(phone) {
  if (!phone) return "(none)";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  const last4 = digits.slice(-4);
  return `${phone.trim().startsWith("+") ? "+" : ""}${"*".repeat(Math.max(digits.length - 4, 3))}${last4}`;
}
function maskRef(ref) {
  if (!ref) return "(none)";
  if (ref.length <= 8) return "*".repeat(ref.length);
  return `${ref.slice(0, 4)}${"*".repeat(ref.length - 8)}${ref.slice(-4)}`;
}
function fmt(d) {
  return d ? new Date(d).toISOString() : "(null)";
}

async function main() {
  const userId = process.argv[2];
  if (!userId) {
    console.error("Usage: node diagnose-membership.cjs <userId>");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set in this shell/container environment.");

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    // ---------------- server clock / timezone ----------------
    const timeRes = await client.query("SELECT NOW() AS db_now, current_setting('TIMEZONE') AS db_tz");
    const dbNow = timeRes.rows[0].db_now;
    console.log("================ SERVER CLOCK ================");
    console.log(`Postgres NOW() (should be UTC):        ${fmt(dbNow)}`);
    console.log(`Postgres session TIMEZONE setting:      ${timeRes.rows[0].db_tz}`);
    console.log(`Node process Date.now() (this script):  ${new Date().toISOString()}`);
    console.log(`IST equivalent of Postgres NOW():       ${new Date(new Date(dbNow).getTime() + 5.5 * 3600 * 1000).toISOString().replace("Z", " IST-equivalent")}`);

    // ---------------- user + partner ----------------
    const userRes = await client.query('SELECT * FROM "user" WHERE id = $1', [userId]);
    const user = userRes.rows[0];
    console.log("\n================ USER ================");
    if (!user) {
      console.log(`No user row found for id ${userId}`);
    } else {
      console.log(`id:            ${user.id}`);
      console.log(`name:          ${user.name}`);
      console.log(`accountType:   ${user.accountType}`);
      console.log(`role:          ${user.role}`);
      console.log(`phoneNumber:   ${maskPhone(user.phoneNumber)}`);
      console.log(`phone:         ${maskPhone(user.phone)}`);
    }

    const partnerRes = await client.query('SELECT * FROM "Partner" WHERE "userId" = $1', [userId]);
    const partner = partnerRes.rows[0];
    console.log("\n================ PARTNER ================");
    if (!partner) {
      console.log(`No Partner row found for userId ${userId}`);
    } else {
      console.log(`Partner.id:              ${partner.id}`);
      console.log(`userId:                  ${partner.userId}`);
      console.log(`businessName:            ${partner.businessName}`);
      console.log(`type:                    ${partner.type}`);
      console.log(`verificationStatus:      ${partner.verificationStatus}`);
      console.log(`isVerified:              ${partner.isVerified}`);
      console.log(`isAvailable:             ${partner.isAvailable}`);
      console.log(`isGeneralResponder:      ${partner.isGeneralResponder}`);
      console.log(`latitude/longitude:      ${partner.latitude}, ${partner.longitude}`);
      console.log(`createdAt:               ${fmt(partner.createdAt)}`);
    }

    // ---------------- EVERY PartnerMembership row (not just the "active" one) ----------------
    console.log("\n================ ALL PartnerMembership rows for this userId ================");
    const memRes = await client.query(
      `SELECT pm.*, plan.name AS "planName", plan.price AS "planPrice", plan."durationDays" AS "planDurationDays"
       FROM "partner_membership" pm
       JOIN "partner_membership_plan" plan ON plan.id = pm."planId"
       WHERE pm."userId" = $1
       ORDER BY pm."createdAt" DESC`,
      [userId],
    );
    if (memRes.rows.length === 0) {
      console.log("(zero PartnerMembership rows exist for this userId at all — no membership was ever created, active or expired)");
    }
    for (const m of memRes.rows) {
      const now = new Date(dbNow);
      const startOk = new Date(m.startDate) <= now;
      const endOk = new Date(m.endDate) >= now;
      const statusOk = m.status === "ACTIVE";
      const eligible = statusOk && endOk;
      console.log(`\n--- PartnerMembership id=${m.id} ---`);
      console.log(`  planId:            ${m.planId}  (${m.planName}, ₹${m.planPrice}, ${m.planDurationDays} days)`);
      console.log(`  status:            ${m.status}`);
      console.log(`  startDate:         ${fmt(m.startDate)}`);
      console.log(`  endDate:           ${fmt(m.endDate)}`);
      console.log(`  paymentId:         ${maskRef(m.paymentId)}`);
      console.log(`  razorpayOrderId:   ${maskRef(m.razorpayOrderId)}`);
      console.log(`  createdAt:         ${fmt(m.createdAt)}`);
      console.log("  --- eligibility condition (status='ACTIVE' AND endDate >= NOW()) ---");
      console.log(`  | Condition                          | Expected | Actual                     | Pass/Fail |`);
      console.log(`  | status = 'ACTIVE'                   | ACTIVE   | ${m.status.padEnd(26)} | ${statusOk ? "PASS" : "FAIL"}      |`);
      console.log(`  | endDate >= NOW()                    | true     | ${(fmt(m.endDate) + (endOk ? " (future)" : " (PAST — expired)")).padEnd(26)} | ${endOk ? "PASS" : "FAIL"}      |`);
      console.log(`  | startDate <= NOW() (informational)  | true     | ${(fmt(m.startDate) + (startOk ? " (started)" : " (not started yet)")).padEnd(26)} | ${startOk ? "PASS" : "FAIL"}      |`);
      console.log(`  => this row ${eligible ? "WOULD" : "would NOT"} satisfy SOS/active-membership eligibility right now.`);
    }

    // ---------------- EVERY MembershipInvoice row (the actual payment records) ----------------
    console.log("\n\n================ ALL MembershipInvoice rows for this userId (SERVICE_PROVIDER) ================");
    const invRes = await client.query(
      `SELECT * FROM "membership_invoice" WHERE "userId" = $1 AND "accountType" = 'SERVICE_PROVIDER' ORDER BY "createdAt" DESC`,
      [userId],
    );
    if (invRes.rows.length === 0) {
      console.log("(zero invoices exist for this userId as a Service Provider — either no purchase was ever made under this account, or it was made under a different userId)");
    }
    for (const inv of invRes.rows) {
      console.log(`\n--- MembershipInvoice id=${inv.id} receiptNo=${inv.receiptNo} ---`);
      console.log(`  status:                 ${inv.status}`);
      console.log(`  planName:                ${inv.planName}`);
      console.log(`  amount:                  ₹${inv.amount}`);
      console.log(`  durationDays:            ${inv.durationDays}`);
      console.log(`  membershipStartDate:     ${fmt(inv.membershipStartDate)}`);
      console.log(`  membershipEndDate:       ${fmt(inv.membershipEndDate)}`);
      console.log(`  partnerMembershipId:     ${inv.partnerMembershipId || "(null — not linked to any PartnerMembership row!)"}`);
      console.log(`  paymentId:               ${maskRef(inv.paymentId)}`);
      console.log(`  razorpayPaymentId:       ${maskRef(inv.razorpayPaymentId)}`);
      console.log(`  razorpayOrderId:         ${maskRef(inv.razorpayOrderId)}`);
      console.log(`  paidAt:                  ${fmt(inv.paidAt)}`);
      console.log(`  confirmationSmsSentAt:   ${fmt(inv.confirmationSmsSentAt)}`);
      console.log(`  createdAt:               ${fmt(inv.createdAt)}`);

      if (inv.partnerMembershipId) {
        const linked = memRes.rows.find((m) => m.id === inv.partnerMembershipId);
        console.log(`  => linked PartnerMembership row ${linked ? "FOUND above" : "NOT FOUND — dangling reference, the membership row this invoice points to no longer exists (or belongs to a different query scope)"}`);
      }
    }

    // ---------------- Cross-check: any membership row for this userId NOT owned by this Partner's business ----------------
    console.log("\n================ SANITY: partner_membership_plan catalog (for reference) ================");
    const plansRes = await client.query(`SELECT id, name, price, "durationDays", "isActive" FROM "partner_membership_plan" ORDER BY "sortOrder" ASC`);
    for (const p of plansRes.rows) {
      console.log(`- ${p.id}  "${p.name}"  ₹${p.price}  ${p.durationDays} days  isActive=${p.isActive}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("DIAGNOSTIC SCRIPT ERROR:", err);
  process.exit(1);
});
