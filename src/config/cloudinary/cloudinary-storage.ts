import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary";
import multer from "multer";

export const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "uploads",
    allowed_formats: [
      // Image
      "jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "ico", "svg", "psd", "heic", "heif",
      // Video
      "mp4", "mov", "avi", "flv", "mpeg", "mkv", "3gp", "webm", "wmv", "m4v",
      // Audio
      "mp3", "wav", "ogg", "aac", "flac", "m4a",
      // Document
      "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "rtf", "odt"
    ],
    transformation:
      file.mimetype.startsWith("image/")
        ? { width: 500, height: 500, crop: "limit" }
        : undefined,
    resource_type: "auto",
  }),
});

const upload = multer({storage});
