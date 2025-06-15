import { Router } from "express";
import ChatController from "../controllers/chat.controller";
import { ChatService } from "../services/chat.service";

let chatRouter = Router();

const chatService = new ChatService();
const chatController = new ChatController();

chatRouter.get("/:userId", (req, res) => {
    chatController.getUserChats(req, res);
});

export default chatRouter;