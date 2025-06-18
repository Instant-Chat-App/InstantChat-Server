import { DataResponse } from "../dtos/responses/DataResponse";
import { MessageService } from "../services/message.service";
import { Request, Response } from "express";

export default class MessageController {
    private messageService: MessageService;

    constructor() {
        this.messageService = new MessageService();
    }

    async getUserChatMessages(req: Request, res: Response) {
        const chatId = parseInt(req.params.chatId);
        const userId = req.user!.accountId;
        try {
            const messages = await this.messageService.getUserChatMessages(userId, chatId);
            res.json(DataResponse.success(messages, "Messages retrieved successfully"));
        } catch (error: any) {
            res.status(500).json(DataResponse.error("Failed to retrieve messages", error.message));
        }
    }

    async sendMessage(req: Request, res: Response) {
        const senderId = req.user!.accountId;
        const { chatId, content } = req.body;
        const attachments = req.files ? req.files as Express.Multer.File[] : [];
        if (!chatId) {
            return res.status(400).json(DataResponse.error("Chat ID is required", "Validation error"));
        }
        if (content.trim() === "" && attachments.length === 0) {
            return res.status(400).json(DataResponse.error("Content or attachments are required", "Validation error"));
        }

        return res.json(DataResponse.success(
            await this.messageService.sendMessage(senderId, chatId, content),
            "Message sent successfully"
        ));
    }

    async editMessage(req: Request, res: Response) {
        const messageId = parseInt(req.params.messageId);
        const content = req.body.content;

        if (!content || content.trim() === "") {
            return res.status(400).json(DataResponse.error("Content cannot be empty", "Validation error"));
        }

        try {
            const updatedMessage = await this.messageService.editMessage(req.user!.accountId, messageId, content);
            res.json(DataResponse.success(updatedMessage, "Message edited successfully"));
        } catch (error: any) {
            res.status(500).json(DataResponse.error("Failed to edit message", error.message));
        }
    }

    async deleteMessage(req: Request, res: Response) {
        const messageId = parseInt(req.params.messageId);
        try {
            await this.messageService.deleteMessage(messageId, req.user!.accountId);
            res.json(DataResponse.success(null, "Message deleted successfully"));
        } catch (error: any) {
            res.status(400).json(DataResponse.badRequest("Failed to delete message", error.message));
        }
    }

    async reactToMessage(req: Request, res: Response) {
        const userId = req.user!.accountId;
        const { messageId, reaction } = req.body;

        if (!reaction) {
            return res.status(400).json(DataResponse.error("Reaction is required", "Validation error"));
        }

        try {
            await this.messageService.reactToMessage(messageId, userId, reaction);
            res.json(DataResponse.success(null, "Reaction added successfully"));
        } catch (error: any) {
            res.status(500).json(DataResponse.error("Failed to add reaction", error.message));
        }
    }

}