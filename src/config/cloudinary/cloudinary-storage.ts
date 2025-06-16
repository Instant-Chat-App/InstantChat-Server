import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary";
import multer from "multer";
import path from "path";
import { access } from "fs";

export const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let resource_type = "image";
    if (file.mimetype.startsWith("video/")) resource_type = "video";
    else if (!file.mimetype.startsWith("image/")) resource_type = "raw";

    
    let ext = path.extname(file.originalname).toLowerCase();
    if (resource_type !== "raw") {
      ext = ""
    }
    const name = path.basename(file.originalname, ext);
    const public_id = `uploads/${name}-${Date.now()}${ext}`;


    return {
      folder: "uploads",
      allowed_formats: [
        "jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "ico", "svg", "psd", "heic", "heif",
        "mp4", "mov", "avi", "flv", "mpeg", "mkv", "3gp", "webm", "wmv", "m4v",
        "mp3", "wav", "ogg", "aac", "flac", "m4a",
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "rtf", "odt"
      ],
      resource_type,
      type: "upload",
      public_id,
      transformation:
        file.mimetype.startsWith("image/")
          ? { width: 500, height: 500, crop: "limit" }
          : undefined,
    };
  },
});


const upload = multer({storage});
