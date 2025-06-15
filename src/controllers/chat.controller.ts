import { DataResponse } from "../dtos/responses/DataResponse";
import { ChatService } from "../services/chat.service";
import { logger } from "../utils/logger";


export default class ChatController {
    private chatService: ChatService;

    constructor() {
        this.chatService = new ChatService();
    }

    async getUserChats(req: any, res: any) {
        try {
            const userId = Number(req.params.userId);
            const chats = await this.chatService.getUserChats(userId);
            res.status(200).json(DataResponse.success(chats, "User chats fetched successfully"));
        } catch (error:any) {
            logger.error("Error fetching user chats:", error);
            res.status(500).json(DataResponse.error("Internal server error", error.message));
        }
    }

    async getChatById(req: any, res: any) {
        try {
            const chatId = Number(req.params.chatId);
            const chat = await this.chatService.getChatById(chatId);
            if (!chat) {
                return res.status(404).json(DataResponse.notFound("Chat not found"));
            }
            res.status(200).json(DataResponse.success(chat, "Chat fetched successfully"));
        } catch (error:any) {
            logger.error("Error fetching chat by ID:", error);
            res.status(500).json(DataResponse.error("Internal server error", error.message));
        }
    }

    async getCurrentMember(req: any, res: any) {
        try {
            const userId = Number(req.params.userId);
            const chatId = Number(req.params.chatId);
            const member = await this.chatService.getCurrentMember(userId, chatId);
            res.status(200).json(DataResponse.success(member, "Current member fetched successfully"));
        } catch (error:any) {
            logger.error("Error fetching current member:", error);
            res.status(500).json(DataResponse.error("Internal server error", error.message));
        }
    }

    async createPrivateChat(req: any, res: any) {
        try {
            const userId = Number(req.params.userId);
            const otherUserId = Number(req.params.otherUserId);
            const chat = await this.chatService.createPrivateChat(userId, otherUserId);
            res.status(201).json(DataResponse.success(chat, "Private chat created successfully"));
        } catch (error:any) {
            logger.error("Error creating private chat:", error);
            res.status(500).json(DataResponse.error("Internal server error", error.message));
        }
    }

    async createGroupChat(req: any, res: any) {
        try {
            const userId = Number(req.params.userId);
            const groupRequest = req.body;
            const chat = await this.chatService.createGroupChat(userId, groupRequest);
            res.status(201).json(DataResponse.success(chat, "Group chat created successfully"));
        } catch (error:any) {
            logger.error("Error creating group chat:", error);
            res.status(500).json(DataResponse.error("Internal server error", error.message));
        }
    }

    async createChannel(req: any, res: any) {
        try {
            const userId = Number(req.params.userId);
            const channelRequest = req.body;
            const chat = await this.chatService.createChannel(userId, channelRequest);
            res.status(201).json(DataResponse.success(chat, "Channel created successfully"));
        } catch (error:any) {
            logger.error("Error creating channel:", error);
            res.status(500).json(DataResponse.error("Internal server error", error.message));
        }
    }
    
}