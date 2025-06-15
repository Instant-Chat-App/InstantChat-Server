import { Router } from "express";
import MessageController from "../controllers/message.controller";
import { logger } from "../utils/logger";

let messageRouter = Router();

const messageController = new MessageController();
messageRouter.get("/:chatId/:userId", async (req, res) => {
    const chatId = parseInt(req.params.chatId);
    const userId = parseInt(req.params.userId);
    try {
        const messages: any = await messageController.getUserChatMessages(userId, chatId);
        logger.info(`Retrieved messages for chatId: ${chatId}, userId: ${userId}`);
        res.status(200).json(messages);
    } catch (error) {
        logger.error(`Failed to retrieve messages for chatId: ${chatId}, userId: ${userId}`, error);
        res.status(500).json({ error: "Failed to retrieve messages" });
    }
});
export default messageRouter;