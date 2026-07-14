import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { requireSession } from "@/lib/require-role";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { session, error } = await requireSession();
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique filename while preserving extension
    const originalName = file.name || "upload.jpg";
    const extension = originalName.split('.').pop() || "jpg";
    const uniqueSuffix = crypto.randomBytes(16).toString("hex");
    const filename = `${uniqueSuffix}.${extension}`;

    // The path should be relative to the public directory of the Next.js app
    // We assume the CWD is running from root, or standard Next.js path resolution
    const uploadDir = join(process.cwd(), "public", "uploads");
    const filePath = join(uploadDir, filename);

    // Save the file
    await writeFile(filePath, buffer);

    // Return the URL that can be used to access the file
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
