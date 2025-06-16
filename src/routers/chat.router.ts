import { Router } from "express";
import ChatController from "../controllers/chat.controller";
import { DataResponse } from "../dtos/responses/DataResponse";
import { uploadChatCover } from "../middlewares/upload.middleware";

const chatRouter = Router();
const chatController = new ChatController();
// Get user's chats
chatRouter.get("/:userId", (req, res) => {
    chatController.getUserChats(req, res);
});

// Get chat by ID
chatRouter.get("/chat/:chatId", (req, res) => {
    chatController.getChatById(req, res);
});

// Get current member in a chat
chatRouter.get("/:chatId/member/:userId", (req, res) => {
    chatController.getCurrentMember(req, res);
});

// Create new chat (private, group, or channel)
chatRouter.post("/", (req, res) => {
    const chatType = (req.query.chatType as string)?.toUpperCase();
    console.log(req.body)
    if (chatType === "PRIVATE") {
        chatController.createPrivateChat(req, res);
    } else if (chatType === "GROUP") {
        chatController.createGroupChat(req, res);
    } else if (chatType === "CHANNEL") {
        chatController.createChannel(req, res);
    } else {
        res.status(400).json(DataResponse.error("Invalid chat type", "Chat type must be PRIVATE, GROUP, or CHANNEL"));
    }
});

// Add user to chat
chatRouter.post("/chat/:chatId/members", (req, res) => {
    chatController.addUserToChat(req, res);
});

// Kick user from chat
chatRouter.delete("/chat/:chatId/members/:userId", (req, res) => {
    chatController.kickUserFromChat(req, res);
});

// Leave chat
chatRouter.delete("/chat/:chatId/leave", (req, res) => {
    chatController.leaveChat(req, res);
});

// Delete chat
chatRouter.delete("/chat/:chatId", (req, res) => {
    chatController.deleteChat(req, res);
});

// Change chat name
chatRouter.patch("/chat/:chatId/name", (req, res) => {
    chatController.changeChatName(req, res);
});

// Change chat cover image
chatRouter.patch("/chat/:chatId/cover", uploadChatCover, (req, res) => {
    chatController.changeChatCoverImage(req, res);
});

// Get chat members
chatRouter.get("/chat/:chatId/members", (req, res) => {
    chatController.getChatMembers(req, res);
});

// Search chats
chatRouter.get("/search/:userId", (req, res) => {
    chatController.findChats(req, res);
});

export default chatRouter;