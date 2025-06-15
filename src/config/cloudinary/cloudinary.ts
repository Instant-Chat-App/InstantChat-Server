import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dm868w0ib",
  api_key: process.env.CLOUDINARY_API_KEY || "186617721122458",
  api_secret: process.env.CLOUDINARY_API_SECRET || "aLMrdjw6WRR3RN09EivFc8WPoyM",
});

export default cloudinary;
