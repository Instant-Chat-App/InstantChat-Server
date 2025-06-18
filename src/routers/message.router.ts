import { Router } from "express";
import MessageController from "../controllers/message.controller";
import { logger } from "../utils/logger";
import { authMiddleware } from "../middlewares/auth.middleware";
import { uploadMessageAttachment } from "../middlewares/upload.middleware";

let messageRouter = Router();

const messageController = new MessageController();
messageRouter.get("/:chatId", authMiddleware, async (req, res) => {
    messageController.getUserChatMessages(req, res);
});

messageRouter.post("", uploadMessageAttachment, authMiddleware, async (req, res) => {
    messageController.sendMessage(req, res);
});

messageRouter.patch("/:messageId", authMiddleware, async (req, res) => {
    messageController.editMessage(req, res);
});

messageRouter.delete("/:messageId", authMiddleware, async (req, res) => {
    messageController.deleteMessage(req, res);
});

messageRouter.post("/react", authMiddleware, async (req, res) => {
    messageController.reactToMessage(req, res);
});



export default messageRouter;