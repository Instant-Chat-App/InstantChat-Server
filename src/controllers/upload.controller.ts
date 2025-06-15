import { Request, Response } from "express";
import { DataResponse } from "../dtos/responses/DataResponse";
import multer from "multer";
import { storage } from "../config/cloudinary/cloudinary-storage";

interface MulterCloudinaryFile extends Express.Multer.File {
  path: string;      // url cloudinary
  filename: string;  // public_id cloudinary
}

export default class UploadController {
  private upload = multer({ storage });

  public getMulterUpload() {
    return this.upload;
  }

  public handleSingleUpload(req: Request, res: Response) {
    const file = req.file as MulterCloudinaryFile | undefined;
    if (!file) {
      return res.status(400).json(DataResponse.error("No file uploaded", "Please provide a file to upload"));
    }
    res.json(DataResponse.success({
      url: file.path,
      public_id: file.filename,
    }, "File uploaded successfully"));
  }

  public handleMultipleUploads(req: Request, res: Response) {
    const files = req.files as MulterCloudinaryFile[] | undefined;
    if (!files || files.length === 0) {
      return res.status(400).json(DataResponse.error("No files uploaded", "Please provide files to upload"));
    }
    const urls = files.map((f) => f.path);
    res.json(DataResponse.success({ urls }, "Files uploaded successfully"));
  }
} 