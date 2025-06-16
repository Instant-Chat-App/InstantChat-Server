import multer from "multer";
import { storage } from "../config/cloudinary/cloudinary-storage";


export const uploadChatCover = multer({ 
    storage
 }).single("coverImage");
export const uploadMessageAttachment = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }).array("attachments", 10);
export const uploadUserAvatar = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }).single("avatar");