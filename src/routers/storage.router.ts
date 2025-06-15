import { Router } from "express";
import UploadController from "../controllers/upload.controller";

const storageRouter = Router();
const uploadController = new UploadController();
const upload = uploadController.getMulterUpload();

storageRouter.post("/upload", upload.single("file"), (req, res) => {
  uploadController.handleSingleUpload(req, res);
});

storageRouter.post("/uploads", upload.array("files", 10), (req, res) => {
  uploadController.handleMultipleUploads(req, res);
});

export default storageRouter;
