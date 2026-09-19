#!/usr/bin/env node
/**
 * READ-ONLY reproduction of the exact SOS SMS body BIKIE would send for one alert — no MSG91
 * call, no write, only SELECT queries. Reproduces (byte-for-byte copy, not a reimplementation)
 * the current production logic from:
 *   packages/services/src/modules/safety-location/domain/dispatch-message.ts
 *     - describeLocation()
 *     - buildSmsTemplateBody()
 * Keep this in sync with that file if it ever changes.
 *
 * RUN (inside the running `web` container):
 *   docker compose exec web node packages/database/prisma/diagnose-sms-body.cjs <alertId>
 */
"use strict";

function requirePg() {
  const directCandidates = ["pg", "/app/packages/database/node_modules/pg", "/app/node_modules/pg"];
  for (const c of directCandidates) {
    try {
      return require(c);
    } catch (e) {}
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
      } catch (e) {}
    }
  }
  throw new Error("Could not resolve 'pg'.");
}
const { Client } = requirePg();

// ==== VERBATIM from packages/services/src/modules/safety-location/domain/dispatch-message.ts ====
function describeLocation(alert) {
  if (alert.formattedAddress) return alert.formattedAddress;
  const parts = [alert.placeName, alert.area, alert.city].filter((p) => Boolean(p));
  return parts.length > 0 ? parts.join(", ") : alert.city;
}
const SMS_LOCATION_MAX_LENGTH = 40;
function cleanForDltVariable(value) {
  return value.replace(/[,;]/g, " ").replace(/\s+/g, " ").trim();
}
function firstAddressSegment(value) {
  for (const part of value.split(",")) {
    const trimmed = part.trim();
    if (trimmed.length > 0) return trimmed;
  }
  return value.trim();
}
function describeShortLocation(alert) {
  const rawCandidates = [alert.area, alert.placeName, alert.city].filter((v) => Boolean(v && v.trim()));

  for (const raw of rawCandidates) {
    const segment = cleanForDltVariable(firstAddressSegment(raw));
    if (segment.length > 0 && segment.length <= SMS_LOCATION_MAX_LENGTH) return segment;
  }
  for (const raw of rawCandidates) {
    const cleaned = cleanForDltVariable(raw);
    if (cleaned.length > 0) return cleaned.slice(0, SMS_LOCATION_MAX_LENGTH).trim();
  }
  if (alert.latitude != null && alert.longitude != null) {
    return `${alert.latitude.toFixed(4)}, ${alert.longitude.toFixed(4)}`;
  }
  return "your area";
}
function buildSmsTemplateBody(alert) {
  const vehicleReg = (alert.riderVehicleRegistrationNumber && alert.riderVehicleRegistrationNumber.trim()) || "N/A";
  return (
    `Hello Riders/Service Providers, Rider ${alert.userName}, with Vehicle registration number is ` +
    `${vehicleReg} having some emergency situation at ${describeShortLocation(alert)};Please reach out ` +
    `to Rider to Provide Moral support and Adequate help, as noted by Kiesh India`
  );
}
// ==== end verbatim block ====

// The text pasted from the MSG91 dashboard's BIKIE_SR template (operator-supplied — paste the
// exact current dashboard text here if it's ever updated, to re-run this comparison).
const APPROVED_TEMPLATE_WITH_MARKERS =
  "Hello Riders/Service Providers, Rider ##alphanumeric##, with Vehicle registration number is " +
  "##alphanumeric## having some emergency situation at ##alphanumeric##;Please reach out to Rider " +
  "to Provide Moral support and Adequate help, as noted by Kiesh India";

function splitOnVariableMarkers(template) {
  return template.split("##alphanumeric##");
}

function main() {
  return (async () => {
    const alertId = process.argv[2];
    if (!alertId) {
      console.error("Usage: node diagnose-sms-body.cjs <alertId>");
      process.exit(1);
    }
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set.");

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
    try {
      const alertRes = await client.query('SELECT * FROM "sos_alert" WHERE id = $1', [alertId]);
      if (alertRes.rows.length === 0) {
        console.log(`No SOS alert found with id ${alertId}`);
        return;
      }
      const alert = alertRes.rows[0];

      const userRes = await client.query('SELECT * FROM "user" WHERE id = $1', [alert.userId]);
      const user = userRes.rows[0];

      const profileRes = await client.query('SELECT "vehicleRegistrationNumber" FROM "rider_profile" WHERE "userId" = $1', [alert.userId]);
      const vehicleReg = profileRes.rows[0] ? profileRes.rows[0].vehicleRegistrationNumber : null;

      const dispatchAlert = {
        userName: user ? user.name : "(unknown)",
        riderVehicleRegistrationNumber: vehicleReg,
        placeName: alert.placeName,
        area: alert.area,
        formattedAddress: alert.formattedAddress,
        city: alert.city,
        latitude: alert.latitude,
        longitude: alert.longitude,
      };

      console.log("================ RAW INPUTS (from DB, read-only) ================");
      console.log(`alert.id:                ${alert.id}`);
      console.log(`alert.type:              ${alert.type}`);
      console.log(`alert.city:              ${alert.city}`);
      console.log(`alert.placeName:         ${alert.placeName}`);
      console.log(`alert.area:              ${alert.area}`);
      console.log(`alert.formattedAddress:  ${alert.formattedAddress}`);
      console.log(`rider name:              ${dispatchAlert.userName}`);
      console.log(`rider vehicleRegistrationNumber (RiderProfile): ${vehicleReg === null ? "(not set on RiderProfile — falls back to 'N/A')" : vehicleReg}`);

      const location = describeLocation(dispatchAlert);
      const shortLocation = describeShortLocation(dispatchAlert);
      const smsBody = buildSmsTemplateBody(dispatchAlert);

      console.log("\n================ COMPUTED VALUES ================");
      console.log(`describeLocation(alert) result (WhatsApp/email/in-app only):  "${location}"`);
      console.log(`  -> length: ${location.length} characters, contains comma: ${location.includes(",")}`);
      console.log(`describeShortLocation(alert) result (SMS variable, ADR-087):  "${shortLocation}"`);
      console.log(`  -> length: ${shortLocation.length} characters, contains comma: ${shortLocation.includes(",")}`);
      const finalVehicleReg = (vehicleReg && vehicleReg.trim()) || "N/A";
      console.log(`vehicleReg used in SMS:           "${finalVehicleReg}" (length ${finalVehicleReg.length})`);
      console.log(`rider name used in SMS:           "${dispatchAlert.userName}" (length ${dispatchAlert.userName.length})`);

      console.log("\n================ A. EXACT SMS BODY BIKIE WOULD SEND (no MSG91 call made) ================");
      console.log(JSON.stringify(smsBody));
      console.log(`Total length: ${smsBody.length} characters`);

      console.log("\n================ B. APPROVED MSG91 DLT TEMPLATE (as pasted from the dashboard) ================");
      console.log(JSON.stringify(APPROVED_TEMPLATE_WITH_MARKERS));

      console.log("\n================ C. SEGMENT-BY-SEGMENT DIFF (static text between variables) ================");
      const approvedSegments = splitOnVariableMarkers(APPROVED_TEMPLATE_WITH_MARKERS);
      // Reconstruct the CODE's own static segments by re-running buildSmsTemplateBody with
      // sentinel variable values, then splitting on those sentinels.
      const sentinel1 = "VAR1";
      const sentinel2 = "VAR2";
      const sentinel3 = "VAR3";
      const codeTemplateBody = buildSmsTemplateBody({
        userName: sentinel1,
        riderVehicleRegistrationNumber: sentinel2,
        placeName: null,
        area: sentinel3,
        formattedAddress: null,
        city: null,
      });
      const codeSegments = codeTemplateBody.split(new RegExp(`${sentinel1}|${sentinel2}|${sentinel3}`));

      if (approvedSegments.length !== codeSegments.length) {
        console.log(`MISMATCH: approved template has ${approvedSegments.length - 1} variable(s), code produces ${codeSegments.length - 1} variable(s)`);
      }
      for (let i = 0; i < Math.max(approvedSegments.length, codeSegments.length); i++) {
        const a = approvedSegments[i] ?? "(missing)";
        const c = codeSegments[i] ?? "(missing)";
        const match = a === c;
        console.log(`Segment ${i}: ${match ? "MATCH" : "*** MISMATCH ***"}`);
        console.log(`  approved: ${JSON.stringify(a)}`);
        console.log(`  code:     ${JSON.stringify(c)}`);
      }

      console.log("\n================ D. VARIABLE LENGTH CHECK ================");
      console.log(`VAR1 (rider name) length:        ${dispatchAlert.userName.length}  ${dispatchAlert.userName.length > 40 ? "*** EXCEEDS 40 ***" : "ok"}`);
      console.log(`VAR2 (vehicle reg) length:        ${finalVehicleReg.length}  ${finalVehicleReg.length > 40 ? "*** EXCEEDS 40 ***" : "ok"}`);
      console.log(`VAR3 (location, actual SMS value) length: ${shortLocation.length}  ${shortLocation.length > 40 ? "*** EXCEEDS 40 ***" : "ok"}`);
      console.log(`VAR3 contains commas: ${shortLocation.includes(",")}`);
      console.log(`(for reference — the full describeLocation() address WhatsApp/email use is ${location.length} chars, not sent via SMS)`);
    } finally {
      await client.end();
    }
  })();
}

main().catch((err) => {
  console.error("DIAGNOSTIC SCRIPT ERROR:", err);
  process.exit(1);
});
