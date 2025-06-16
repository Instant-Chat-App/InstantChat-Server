// services/upload.service.ts
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

export type UploadOptions = {
  resource_type?: "auto" | "image" | "video" | "raw";
  folder?: string;
};

export const uploadFromBuffer = (
  buffer: Buffer,
  filename?: string,
  options?: UploadOptions
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: options?.resource_type ?? "auto",
        folder: options?.folder ?? "chat_app_uploads",
        public_id: filename?.split(".")[0],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result?.secure_url || "");
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};
