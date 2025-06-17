// services/upload.service.ts
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

export type UploadOptions = {
  resource_type?: "auto" | "image" | "video" | "raw";
  folder?: string;
};

export const uploadFromBase64 = async (
  base64Data: string,
  filename?: string,
  mimeType?: string,
  options?: UploadOptions
): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64Data,
      {
        resource_type: options?.resource_type ?? "auto",
        folder: options?.folder ?? "uploads",
        public_id: filename,
        mime_type: mimeType
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result?.secure_url || "");
      }
    );
  });
};