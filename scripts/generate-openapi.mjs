#!/usr/bin/env node
/**
 * Phase 9 — scan Next.js Route Handlers and emit:
 *   .docs/openapi/route-inventory.json
 *   .docs/openapi/openapi-v1.json
 *   apps/web/public/openapi-v1.json  (static mirror for clients)
 *
 * Run: `pnpm openapi:generate`
 * Contract CI: inventory must match filesystem (see api-contract.test.ts).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const apiRoot = path.join(root, "apps/web/app/api");
const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name === "route.ts") out.push(p);
  }
  return out;
}

function fileToOpenApiPath(file) {
  const rel = path.relative(apiRoot, path.dirname(file)).split(path.sep).join("/");
  if (!rel || rel === ".") return "/api";
  return (
    "/api/" +
    rel.replace(/\[(\.\.\.)?([^\]]+)\]/g, (_m, dots, name) => `{${name}}`)
  );
}

function detectMethods(src) {
  const found = new Set();
  for (const m of HTTP_METHODS) {
    if (
      new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b`).test(src) ||
      new RegExp(`export\\s+const\\s+${m}\\b`).test(src)
    ) {
      found.add(m);
    }
  }
  // better-auth style: export const { GET, POST } = toNextJsHandler(...)
  const destructured = src.match(/export\s+const\s*\{([^}]+)\}\s*=/);
  if (destructured) {
    for (const part of destructured[1].split(",")) {
      const name = part.trim().split(/\s+as\s+/)[0]?.trim();
      if (HTTP_METHODS.includes(name)) found.add(name);
    }
  }
  return HTTP_METHODS.filter((m) => found.has(m));
}

function detectAuth(src, openApiPath) {
  if (openApiPath.startsWith("/api/admin")) return "admin";
  if (openApiPath.startsWith("/api/partner")) return "partner";
  if (openApiPath.startsWith("/api/cron")) return "cron";
  if (openApiPath.startsWith("/api/dev")) return "dev";
  if (openApiPath === "/api/auth/{all}" || openApiPath.startsWith("/api/auth/")) return "public-auth";
  if (/\brequireMembership\s*\(/.test(src)) return "membership";
  if (/\brequireRole\s*\(/.test(src)) return "role";
  if (/\brequireSession\s*\(/.test(src) || /\bassertRideRoomAccess\s*\(/.test(src)) {
    return "session";
  }
  if (/\bgetServerSession\s*\(/.test(src)) return "session";
  return "public-or-unclassified";
}

function tagForPath(openApiPath) {
  if (openApiPath.startsWith("/api/admin")) return "admin";
  if (openApiPath.startsWith("/api/partner")) return "partner";
  if (openApiPath.startsWith("/api/sos")) return "sos";
  if (openApiPath.startsWith("/api/trips")) return "rides";
  if (openApiPath.startsWith("/api/conversations") || openApiPath.startsWith("/api/messages") || openApiPath === "/api/sse") {
    return "messaging";
  }
  if (openApiPath.startsWith("/api/bikes") || openApiPath.startsWith("/api/destinations") || openApiPath.startsWith("/api/categories") || openApiPath.startsWith("/api/testimonials")) {
    return "catalog";
  }
  if (openApiPath.startsWith("/api/bookings") || openApiPath.startsWith("/api/wishlist") || openApiPath.startsWith("/api/reviews")) {
    return "rentals";
  }
  if (openApiPath.startsWith("/api/auth")) return "auth";
  if (openApiPath.startsWith("/api/membership")) return "membership";
  if (openApiPath.startsWith("/api/rider") || openApiPath.startsWith("/api/places")) return "safety-location";
  return "other";
}

function securityForAuth(auth) {
  switch (auth) {
    case "public-or-unclassified":
    case "public-auth":
      return [];
    case "cron":
      return [{ CronBearer: [] }];
    case "dev":
      return [{ SessionCookie: [] }];
    default:
      return [{ SessionCookie: [] }, { BearerAuth: [] }];
  }
}

function buildOpenApi(routes) {
  /** @type {Record<string, Record<string, object>>} */
  const paths = {};
  for (const route of routes) {
    const ops = {};
    const methods = route.methods.length > 0 ? route.methods : ["GET"];
    for (const method of methods) {
      ops[method.toLowerCase()] = {
        operationId: `${method.toLowerCase()}${route.path.replace(/\{|\}|\//g, "_").replace(/_+/g, "_")}`,
        tags: [tagForPath(route.path)],
        summary: `${method} ${route.path}`,
        description:
          `Source: \`${route.file}\`. Auth class: \`${route.auth}\`. ` +
          `Current stable surface is v1 under \`/api/*\` (no \`/api/v2\` without ADR approval). ` +
          `Narrative docs: \`.docs/API.md\`.`,
        security: securityForAuth(route.auth),
        "x-bikie-auth": route.auth,
        "x-bikie-source": route.file,
        responses: {
          "200": {
            description: "Success (shape documented in .docs/API.md for this route).",
            content: {
              "application/json": {
                schema: { type: "object", additionalProperties: true },
              },
            },
          },
          "400": { description: "Validation / bad request" },
          "401": { description: "Unauthenticated" },
          "403": { description: "Forbidden / membership / role" },
          "404": { description: "Not found" },
          "409": { description: "Conflict" },
          "429": { description: "Rate limited" },
        },
      };
    }
    // Catch-all Better Auth: document as multiple methods without inventing a fake GET-only shape
    if (route.path === "/api/auth/{all}") {
      for (const m of ["get", "post"]) {
        ops[m] = {
          ...(ops[m] ?? {}),
          operationId: `${m}_api_auth_all`,
          tags: ["auth"],
          summary: `${m.toUpperCase()} Better Auth catch-all`,
          description: "Better Auth handler — see packages/auth and .docs/API.md Auth section.",
          security: [],
          "x-bikie-auth": "public-auth",
          responses: { "200": { description: "Better Auth response" } },
        };
      }
    }
    paths[route.path] = { ...(paths[route.path] ?? {}), ...ops };
  }

  // Meta endpoint (added by Phase 9; may not exist on first generate pass — always include)
  paths["/api/openapi"] = {
    get: {
      operationId: "get_api_openapi",
      tags: ["contract"],
      summary: "OpenAPI 3.1 document for the stable v1 API",
      security: [],
      "x-bikie-auth": "public-or-unclassified",
      responses: {
        "200": {
          description: "OpenAPI 3.1 JSON",
          content: {
            "application/json": {
              schema: { type: "object", additionalProperties: true },
            },
          },
        },
      },
    },
  };

  return {
    openapi: "3.1.0",
    info: {
      title: "BIKIE API",
      version: "1.0.0",
      description:
        "Stable v1 contract under `/api/*`. Flutter and web share this surface. " +
        "`/api/v2` is reserved for approved breaking changes only (ADR-028). " +
        "Schemas are incrementally detailed; treat `.docs/API.md` as the narrative source of truth.",
    },
    servers: [{ url: "/", description: "Same origin (Next.js Route Handlers)" }],
    tags: [
      { name: "contract" },
      { name: "auth" },
      { name: "catalog" },
      { name: "rentals" },
      { name: "rides" },
      { name: "messaging" },
      { name: "sos" },
      { name: "safety-location" },
      { name: "membership" },
      { name: "partner" },
      { name: "admin" },
      { name: "other" },
    ],
    components: {
      securitySchemes: {
        SessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "better-auth.session_token",
          description: "Better Auth HTTP-only session cookie (web).",
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "Better Auth bearer token (Flutter / mobile). Header: Authorization: Bearer <token>.",
        },
        CronBearer: {
          type: "http",
          scheme: "bearer",
          description: "Cron routes: Authorization: Bearer <CRON_SECRET>.",
        },
      },
      headers: {
        "X-Request-Id": {
          description: "Correlation id for logs/telemetry (optional on responses).",
          schema: { type: "string", format: "uuid" },
        },
        Deprecation: {
          description: "RFC 9745-style signal when an operation is deprecated.",
          schema: { type: "string", example: "true" },
        },
        Sunset: {
          description: "HTTP-date when a deprecated operation may be removed.",
          schema: { type: "string" },
        },
      },
    },
    paths,
    "x-bikie-contract": {
      version: "v1",
      stablePrefix: "/api",
      v2Policy: "Only after approved ADR + consumer migration window",
      narrativeDocs: ".docs/API.md",
      inventory: ".docs/openapi/route-inventory.json",
    },
  };
}

const routeFiles = walk(apiRoot).sort();
const routes = routeFiles.map((file) => {
  const src = fs.readFileSync(file, "utf8");
  return {
    path: fileToOpenApiPath(file),
    methods: detectMethods(src),
    auth: detectAuth(src, fileToOpenApiPath(file)),
    file: path.relative(root, file).split(path.sep).join("/"),
  };
});

const inventory = {
  generatedAt: new Date().toISOString(),
  count: routes.length,
  routes,
};

const openapi = buildOpenApi(routes);

const docsDir = path.join(root, ".docs/openapi");
fs.mkdirSync(docsDir, { recursive: true });
fs.writeFileSync(path.join(docsDir, "route-inventory.json"), JSON.stringify(inventory, null, 2) + "\n");
fs.writeFileSync(path.join(docsDir, "openapi-v1.json"), JSON.stringify(openapi, null, 2) + "\n");

const publicDir = path.join(root, "apps/web/public");
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, "openapi-v1.json"), JSON.stringify(openapi, null, 2) + "\n");

const methodOps = routes.reduce((n, r) => n + Math.max(r.methods.length, 1), 0);
console.log(
  `OpenAPI inventory: ${routes.length} routes, ~${methodOps} operations → .docs/openapi/ + apps/web/public/openapi-v1.json`,
);
