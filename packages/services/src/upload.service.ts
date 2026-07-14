import { v2 as cloudinary } from "cloudinary";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
}

export const UploadService = {
  /**
   * Uploads an already-validated image buffer to Cloudinary (see apps/web/app/api/upload/route.ts
   * for the MIME/size/magic-byte checks that must happen before this is called — this service
   * assumes its input is trusted, matching the layering rule of Route Handler owning input
   * validation and Service owning the actual side effect).
   */
  async uploadImage(buffer: Buffer, mimeType: string, folder = "bikie/uploads"): Promise<{ url: string; publicId: string }> {
    ensureConfigured();
    const dataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "image",
    });
    return { url: result.secure_url, publicId: result.public_id };
  },
};
