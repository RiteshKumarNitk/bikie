import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export const REQUEST_ID_HEADER = "x-request-id";
export const DEPRECATION_HEADER = "deprecation";
export const SUNSET_HEADER = "sunset";
export const SUCCESSOR_LINK_HEADER = "link";

/** Stable API version label for the current `/api/*` surface (ADR-028). */
export const API_CONTRACT_VERSION = "v1";

export function newRequestId(existing?: string | null): string {
  if (existing && existing.trim()) return existing.trim().slice(0, 128);
  return randomUUID();
}

export type DeprecationOptions = {
  /** HTTP-date or ISO date when the operation may be removed. */
  sunset?: string;
  /** Absolute or relative URL of the successor operation. */
  successor?: string;
};

/**
 * Apply optional contract headers. Does not change status or body.
 * Use when sunsetting an operation during a consumer migration window.
 */
export function applyContractHeaders(
  response: NextResponse,
  options: {
    requestId?: string;
    deprecated?: DeprecationOptions | true;
  } = {},
): NextResponse {
  const requestId = options.requestId ?? newRequestId();
  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.headers.set("x-api-version", API_CONTRACT_VERSION);

  if (options.deprecated) {
    response.headers.set(DEPRECATION_HEADER, "true");
    const opts = options.deprecated === true ? {} : options.deprecated;
    if (opts.sunset) response.headers.set(SUNSET_HEADER, opts.sunset);
    if (opts.successor) {
      response.headers.append(SUCCESSOR_LINK_HEADER, `<${opts.successor}>; rel="successor-version"`);
    }
  }
  return response;
}

/** JSON response with v1 contract headers (request id + api version). */
export function jsonWithContract(
  body: unknown,
  init: ResponseInit & { requestId?: string; deprecated?: DeprecationOptions | true } = {},
): NextResponse {
  const { requestId, deprecated, ...rest } = init;
  const response = NextResponse.json(body, rest);
  return applyContractHeaders(response, { requestId, deprecated });
}
