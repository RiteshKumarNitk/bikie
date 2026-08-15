import { NextResponse } from "next/server";
import { CategoryService } from "@bikie/services";

// DB-backed, no request-varying input — must render at request time so the build
// doesn't try to prerender it against a database that isn't reachable at image-build
// time (Postgres is a Docker Compose service, only up after `docker compose up`).
export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await CategoryService.getAll();
  return NextResponse.json({ categories });
}
