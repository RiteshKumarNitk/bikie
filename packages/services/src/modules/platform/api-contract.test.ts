import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const inventoryPath = join(root, ".docs/openapi/route-inventory.json");
const openapiPath = join(root, ".docs/openapi/openapi-v1.json");
const publicOpenapiPath = join(root, "apps/web/public/openapi-v1.json");
const apiRoot = join(root, "apps/web/app/api");

type Inventory = {
  count: number;
  routes: Array<{ path: string; methods: string[]; file: string; auth: string }>;
};

function walkRoutes(dir: string, out: string[] = []): string[] {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) walkRoutes(p, out);
    else if (ent.name === "route.ts") out.push(p);
  }
  return out;
}

function fileToOpenApiPath(file: string): string {
  const rel = relative(apiRoot, join(file, "..")).split(sep).join("/");
  if (!rel || rel === ".") return "/api";
  return (
    "/api/" +
    rel.replace(/\[(\.\.\.)?([^\]]+)\]/g, (_m, _dots, name: string) => `{${name}}`)
  );
}

describe("Phase 9 OpenAPI / API contract snapshot", () => {
  it("keeps route inventory committed and in sync with filesystem", () => {
    expect(existsSync(inventoryPath), "run pnpm openapi:generate").toBe(true);
    const inventory = JSON.parse(readFileSync(inventoryPath, "utf8")) as Inventory;
    const files = walkRoutes(apiRoot).sort();
    const diskPaths = files.map(fileToOpenApiPath).sort();
    const invPaths = inventory.routes.map((r) => r.path).sort();

    expect(inventory.count).toBe(files.length);
    expect(invPaths).toEqual(diskPaths);
  });

  it("publishes OpenAPI 3.1 with every inventoried path", () => {
    expect(existsSync(openapiPath)).toBe(true);
    expect(existsSync(publicOpenapiPath)).toBe(true);

    const inventory = JSON.parse(readFileSync(inventoryPath, "utf8")) as Inventory;
    const openapi = JSON.parse(readFileSync(openapiPath, "utf8")) as {
      openapi: string;
      info: { version: string };
      paths: Record<string, unknown>;
      "x-bikie-contract": { version: string; stablePrefix: string };
    };
    const publicCopy = JSON.parse(readFileSync(publicOpenapiPath, "utf8"));

    expect(openapi.openapi).toBe("3.1.0");
    expect(openapi.info.version).toBe("1.0.0");
    expect(openapi["x-bikie-contract"].version).toBe("v1");
    expect(openapi["x-bikie-contract"].stablePrefix).toBe("/api");
    expect(openapi.paths["/api/openapi"]).toBeTruthy();

    for (const route of inventory.routes) {
      expect(openapi.paths[route.path], `missing OpenAPI path ${route.path}`).toBeTruthy();
    }

    expect(JSON.stringify(publicCopy.paths)).toBe(JSON.stringify(openapi.paths));
  });

  it("does not introduce /api/v2 paths without an explicit ADR", () => {
    const openapi = JSON.parse(readFileSync(openapiPath, "utf8")) as {
      paths: Record<string, unknown>;
    };
    const v2 = Object.keys(openapi.paths).filter((p) => p.startsWith("/api/v2"));
    expect(v2).toEqual([]);
  });
});
