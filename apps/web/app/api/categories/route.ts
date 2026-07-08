import { NextResponse } from "next/server";
import { CategoryService } from "@bikie/services";

export const revalidate = 300;

export async function GET() {
  const categories = await CategoryService.getAll();
  return NextResponse.json({ categories });
}
