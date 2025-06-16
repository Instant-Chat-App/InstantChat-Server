import multer from "multer";
import { storage } from "../config/cloudinary/cloudinary-storage";


export const uploadChatCover = multer({ storage }).single("coverImage");
export const uploadMessageAttachment = multer({ storage }).array("attachments", 10);
export const uploadUserAvatar = multer({ storage }).single("avatar");