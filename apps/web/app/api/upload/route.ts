import { NextRequest, NextResponse } from "next/server";
import { UploadService } from "@bikie/services";
import { requireSession } from "@/lib/require-role";

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * Sniffs the actual file content instead of trusting the client-supplied `file.type` alone —
 * a renamed/relabeled file would otherwise sail through the Content-Type allow-list below.
 */
function detectImageMimeType(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (buffer.length >= 6 && buffer.toString("ascii", 0, 3) === "GIF") {
    return "image/gif";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

// Uploads (bike/trip cover images, profile photos — see apps/web/components/dashboard/ProfileSettings.tsx
// and the trips create/edit pages) go straight to Cloudinary instead of the local filesystem: Vercel's
// serverless functions get a fresh, read-only-except-/tmp filesystem per invocation, so writing to
// `public/uploads` never actually persisted across requests in production.
export async function POST(req: NextRequest) {
  const { error } = await requireSession();
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "File exceeds the 10MB size limit" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, and GIF images are allowed" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const detectedType = detectImageMimeType(buffer);
    if (!detectedType || !ALLOWED_MIME_TYPES.has(detectedType)) {
      return NextResponse.json(
        { error: "File content doesn't match a supported image type" },
        { status: 400 },
      );
    }

    const { url } = await UploadService.uploadImage(buffer, detectedType);
    return NextResponse.json({ url });
  } catch (e: unknown) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "File upload failed" }, { status: 500 });
  }
}
