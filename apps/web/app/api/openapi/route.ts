import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { applyContractHeaders, newRequestId } from "@/lib/api-contract";

export const dynamic = "force-static";
export const revalidate = 3600;

/**
 * Public OpenAPI 3.1 document for the stable v1 `/api/*` contract (ADR-028).
 * Also available at `/openapi-v1.json` (static public copy).
 */
export async function GET(request: Request) {
  const requestId = newRequestId(request.headers.get("x-request-id"));
  // Prefer the docs copy (source of truth after `pnpm openapi:generate`).
  const candidates = [
    join(process.cwd(), ".docs/openapi/openapi-v1.json"),
    join(process.cwd(), "public/openapi-v1.json"),
    join(process.cwd(), "../../.docs/openapi/openapi-v1.json"),
  ];

  let raw: string | null = null;
  for (const file of candidates) {
    try {
      raw = readFileSync(file, "utf8");
      break;
    } catch {
      // try next
    }
  }

  if (!raw) {
    const response = NextResponse.json(
      {
        error: "OPENAPI_UNAVAILABLE",
        message: "Run `pnpm openapi:generate` to publish the v1 OpenAPI snapshot.",
      },
      { status: 503 },
    );
    return applyContractHeaders(response, { requestId });
  }

  const response = new NextResponse(raw, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
  return applyContractHeaders(response, { requestId });
}
