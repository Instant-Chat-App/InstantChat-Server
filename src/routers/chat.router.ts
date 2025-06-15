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

chatRouter.get("/chat/:chatId", (req, res) => {
    chatController.getChatById(req, res);
});

chatRouter.post("/", (req, res) => {
    chatController.createPrivateChat(req, res);
});
chatRouter.post("/group", (req, res) => {
    chatController.createGroupChat(req, res);
});


export default chatRouter;