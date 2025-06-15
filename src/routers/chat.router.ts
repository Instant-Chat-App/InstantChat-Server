import { Router } from "express";
import ChatController from "../controllers/chat.controller";

let chatRouter = Router();

const chatController = new ChatController();

chatRouter.get("/:userId", (req, res) => {
    chatController.getUserChats(req, res);
});

chatRouter.get("/:chatId/:userId", (req, res) => {
    chatController.getCurrentMember(req, res);
});
export default chatRouter;