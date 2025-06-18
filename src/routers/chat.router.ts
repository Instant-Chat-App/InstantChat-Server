import { Router } from "express";
import ChatController from "../controllers/chat.controller";
import { DataResponse } from "../dtos/responses/DataResponse";
import { uploadChatCover } from "../middlewares/upload.middleware";
import multer from "multer";
import { authMiddleware } from "../middlewares/auth.middleware";
import { log } from "console";

const chatRouter = Router();
const chatController = new ChatController();
// Get user's chats
chatRouter.get("", authMiddleware, (req, res) => {
    chatController.getUserChats(req, res);
});

// Get chat by ID
chatRouter.get("/:chatId", authMiddleware, (req, res) => {
    chatController.getChatById(req, res);
});

// Get current member in a chat
chatRouter.get("/:chatId/me", authMiddleware, (req, res) => {
    chatController.getCurrentMember(req, res);
});



chatRouter.post("/", authMiddleware, (req, res) => {
    chatController.createPrivateChat(req, res);
});


chatRouter.post("/create", authMiddleware, uploadChatCover, (req, res) => {
    const type = (req.query.type as string)?.toUpperCase();
    if (type === "GROUP") {
        chatController.createGroupChat(req, res);
    } else if (type === "CHANNEL") {
        chatController.createChannel(req, res);
    } else {
        return res.status(400).json(DataResponse.badRequest("Invalid chat type"));
    }
});

// Add user to chat
chatRouter.post("/:chatId/members", authMiddleware, (req, res) => {
    chatController.addUserToChat(req, res);
});

// Kick user from chat
chatRouter.delete("/:chatId/members", authMiddleware, (req, res) => {
    chatController.kickUserFromChat(req, res);
});

// Leave chat
chatRouter.delete("/:chatId/leave", authMiddleware, (req, res) => {
    chatController.leaveChat(req, res);
});

// Delete chat
chatRouter.delete("/:chatId", authMiddleware, (req, res) => {
    chatController.deleteChat(req, res);
});

// Change chat name
chatRouter.patch("/:chatId/name", authMiddleware, (req, res) => {
    chatController.changeChatName(req, res);
});

// Change chat cover image
chatRouter.patch("/:chatId/cover", (req, res, next) => {
    uploadChatCover(req, res, err => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json(DataResponse.badRequest("File too large, max 10MB", err.message));
        }
        next();
    });
},
    authMiddleware,
    (req, res) => {
        chatController.changeChatCoverImage(req, res);
    });

// Get chat members
chatRouter.get("/:chatId/members", authMiddleware, (req, res) => {
    chatController.getChatMembers(req, res);
});

// Search chats
chatRouter.get("/search/query", authMiddleware, (req, res) => {
    chatController.findChats(req, res);
});

export default chatRouter;