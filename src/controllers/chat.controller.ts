import { DataResponse } from "../dtos/responses/DataResponse";
import { ChatService } from "../services/chat.service";
import { logger } from "../utils/logger";
import { Request, Response } from "express";
import CreateGroupRequest from "../dtos/requests/CreateGroupRequest";

export default class ChatController {
    private chatService: ChatService;

    constructor() {
        this.chatService = new ChatService();
    }

    private validateId(id: any, paramName: string): number | null {
        const parsedId = parseInt(id);
        if (isNaN(parsedId)) {
            return null;
        }
        return parsedId;
    }

    public async getUserChats(req: Request, res: Response) {
        try {
            const userId = req.user!.accountId;
            logger.info(`Fetching chats for userId: ${userId}`);
            if (userId === null) {
                return res.status(400).json(DataResponse.error("Invalid userId", "userId must be a valid number"));
            }
            const chats = await this.chatService.getUserChats(userId);
            res.json(DataResponse.success(chats, "Chats retrieved successfully"));
        } catch (error: any) {
            res.status(500).json(DataResponse.error("Failed to get user chats", error.message));
        }
    }

    public async getCurrentMember(req: Request, res: Response) {
        try {
            const userId = req.user!.accountId;
            const chatId = this.validateId(req.params.chatId, 'chatId');

            if (userId === null) {
                return res.status(400).json(DataResponse.error("Invalid userId", "userId must be a valid number"));
            }
            if (chatId === null) {
                return res.status(400).json(DataResponse.error("Invalid chatId", "chatId must be a valid number"));
            }

            const member = await this.chatService.getCurrentMember(userId, chatId);
            if (!member) {
                return res.status(404).json(DataResponse.notFound("Member not found"));
            }
            res.json(DataResponse.success(member, "Member retrieved successfully"));
        } catch (error: any) {
            res.status(500).json(DataResponse.error("Failed to get current member", error.message));
        }
    }

    public async getChatById(req: Request, res: Response) {
        try {
            const chatId = this.validateId(req.params.chatId, 'chatId');
            if (chatId === null) {
                return res.status(400).json(DataResponse.error("Invalid chatId", "chatId must be a valid number"));
            }

            const chat = await this.chatService.getChatById(chatId);
            if (!chat) {
                return res.status(404).json(DataResponse.notFound("Chat not found"));
            }
            res.json(DataResponse.success(chat, "Chat retrieved successfully"));
        } catch (error: any) {
            res.status(500).json(DataResponse.error("Failed to get chat", error.message));
        }
    }

    public async createPrivateChat(req: Request, res: Response) {
        try {
            const userId = req.user!.accountId;
            const otherUserId = this.validateId(req.body.otherUserId, 'otherUserId');
            if (userId === null) {
                return res.status(400).json(DataResponse.error("Invalid userId", "userId must be a valid number"));
            }
            if (otherUserId === null) {
                return res.status(400).json(DataResponse.error("Invalid otherUserId", "otherUserId must be a valid number"));
            }

            const chat = await this.chatService.createPrivateChat(userId, otherUserId);
            res.json(DataResponse.success(chat, "Private chat created successfully"));
        } catch (error: any) {
            res.status(500).json(DataResponse.error("Failed to create private chat", error.message));
        }
    }

    public async createGroupChat(req: Request, res: Response) {
        try {
            const userId = req.user!.accountId;
            if (userId === null) {
                return res.status(400).json(DataResponse.error("Invalid userId", "userId must be a valid number"));
            }

            const rawMembers = JSON.parse(req.body.members);

            if (!Array.isArray(rawMembers)) {
                return res.status(400).json(DataResponse.error("Invalid members", "members must be an array"));
            }

            const members = rawMembers.map((id: string | number) => parseInt(id.toString()));

            if (members.length < 1) {
                return res.status(400).json(DataResponse.error("Invalid members", "at least two members are required to create a group chat"));
            }


            if (members.some((id: number) => isNaN(id))) {
                return res.status(400).json(DataResponse.error("Invalid members", "all member IDs must be valid numbers"));
            }
            const cloudinaryFile = req.file as Express.Multer.File & {
                path: string;
            };

            const groupRequest: CreateGroupRequest = {
                name: req.body.name,
                members: members,
                description: req.body.description,
                coverImage: cloudinaryFile.path
            };

            const chat = await this.chatService.createGroupChat(userId, groupRequest);
            res.json(DataResponse.success(chat, "Group chat created successfully"));
        } catch (error: any) {
            res.status(500).json(DataResponse.error("Failed to create group chat", error.message));
        }
    }

    public async createChannel(req: Request, res: Response) {
        try {
            const userId = req.user!.accountId;
            if (userId === null) {
                return res.status(400).json(DataResponse.error("Invalid userId", "userId must be a valid number"));
            }

            const rawMembers = JSON.parse(req.body.members);

            if (!Array.isArray(rawMembers)) {
                return res.status(400).json(DataResponse.error("Invalid members", "members must be an array"));
            }

            const members = rawMembers.map((id: string | number) => parseInt(id.toString()));
            if (members.length < 1) {
                return res.status(400).json(DataResponse.error("Invalid members", "at least two members are required to create a group chat"));
            }
            const cloudinaryFile = req.file as Express.Multer.File & {
                path: string;
            };
            if (members.some((id: number) => isNaN(id))) {
                return res.status(400).json(DataResponse.error("Invalid members", "all member IDs must be valid numbers"));
            }

            const channelRequest: CreateGroupRequest = {
                name: req.body.name,
                members: members,
                coverImage: cloudinaryFile.path,
                description: req.body.description || "",
            };

            const chat = await this.chatService.createChannel(userId, channelRequest);
            res.json(DataResponse.success(chat, "Channel created successfully"));
        } catch (error: any) {
            res.status(500).json(DataResponse.error("Failed to create channel", error.message));
        }
    }

    public async addUserToChat(req: Request, res: Response) {
        try {
            const ownerId = req.user!.accountId;
            const chatId = this.validateId(req.params.chatId, 'chatId');
            const members: number[] = req.body.members;

            if (ownerId === null) {
                return res.status(400).json(DataResponse.error("Invalid ownerId", "ownerId must be a valid number"));
            }
            if (chatId === null) {
                return res.status(400).json(DataResponse.error("Invalid chatId", "chatId must be a valid number"));
            }
            if (!Array.isArray(members) || members.length === 0) {
                return res.status(400).json(DataResponse.error("Invalid members", "members must be a non-empty array of user IDs"));
            }

            await this.chatService.addUserToChat(ownerId, chatId, members);
            res.json(DataResponse.success(null, "User added to chat successfully"));
        } catch (error: any) {
            res.status(500).json(DataResponse.error("Failed to add user to chat", error.message));
        }
    }

    public async kickUserFromChat(req: Request, res: Response) {
        try {
            const ownerId = req.user!.accountId;
            const chatId = this.validateId(req.params.chatId, 'chatId');
            const member = req.body.member;

            if (ownerId === null) {
                return res.status(400).json(DataResponse.error("Invalid ownerId", "ownerId must be a valid number"));
            }
            if (chatId === null) {
                return res.status(400).json(DataResponse.error("Invalid chatId", "chatId must be a valid number"));
            }
            if (!member || typeof member !== 'number') {
                return res.status(400).json(DataResponse.error("Invalid member", "member must be a valid user ID"));
            }

            await this.chatService.kickUserFromChat(ownerId, chatId, member);
            res.json(DataResponse.success(null, "User kicked from chat successfully"));
        } catch (error: any) {
            res.status(500).json(DataResponse.error("Failed to kick user from chat", error.message));
        }
    }

    public async leaveChat(req: Request, res: Response) {
        try {
            const userId = this.validateId(req.body.userId, 'userId');
            const chatId = this.validateId(req.params.chatId, 'chatId');

            if (userId === null) {
                return res.status(400).json(DataResponse.error("Invalid userId", "userId must be a valid number"));
            }
            if (chatId === null) {
                return res.status(400).json(DataResponse.error("Invalid chatId", "chatId must be a valid number"));
            }

            await this.chatService.leaveChat(userId, chatId);
            res.json(DataResponse.success(null, "Left chat successfully"));
        } catch (error: any) {
            res.status(500).json(DataResponse.error("Failed to leave chat", error.message));
        }
    }

    public async deleteChat(req: Request, res: Response) {
        try {
            const ownerId = this.validateId(req.body.ownerId, 'ownerId');
            const chatId = this.validateId(req.params.chatId, 'chatId');

            if (ownerId === null) {
                return res.status(400).json(DataResponse.error("Invalid ownerId", "ownerId must be a valid number"));
            }
            if (chatId === null) {
                return res.status(400).json(DataResponse.error("Invalid chatId", "chatId must be a valid number"));
            }

            await this.chatService.deleteChat(ownerId, chatId);
            res.json(DataResponse.success(null, "Chat deleted successfully"));
        } catch (error: any) {
            res.status(500).json(DataResponse.error("Failed to delete chat", error.message));
        }
    }

    public async changeChatName(req: Request, res: Response) {
        try {
            const userId = req.user!.accountId;
            const chatId = this.validateId(req.params.chatId, 'chatId');

            if (userId === null) {
                return res.status(400).json(DataResponse.error("Invalid userId", "userId must be a valid number"));
            }
            if (chatId === null) {
                return res.status(400).json(DataResponse.error("Invalid chatId", "chatId must be a valid number"));
            }
            if (!req.body.name || typeof req.body.name !== 'string') {
                return res.status(400).json(DataResponse.error("Invalid name", "name must be a non-empty string"));
            }

            const chat = await this.chatService.changeChatName(userId, chatId, req.body.name);
            res.json(DataResponse.success(chat, "Chat name changed successfully"));
        } catch (error: any) {
            res.status(500).json(DataResponse.error("Failed to change chat name", error.message));
        }
    }

    public async changeChatCoverImage(req: Request, res: Response) {
        try {
            const userId = req.user!.accountId;
            const chatId = this.validateId(req.params.chatId, 'chatId');
            const coverImage = req.file?.path;
            logger.info(coverImage);
            if (!coverImage) {
                return res.status(400).json(DataResponse.error("Invalid coverImage", "coverImage must be a valid file"));
            }
            if (userId === null) {
                return res.status(400).json(DataResponse.error("Invalid userId", "userId must be a valid number"));
            }
            if (chatId === null) {
                return res.status(400).json(DataResponse.error("Invalid chatId", "chatId must be a valid number"));
            }


            const chat = await this.chatService.changeChatCoverImage(userId, chatId, coverImage);
            res.json(DataResponse.success(chat, "Chat cover image changed successfully"));
        } catch (error: any) {
            res.status(500).json(DataResponse.error("Failed to change chat cover image", error.message));
        }
    }

    public async getChatMembers(req: Request, res: Response) {
        try {
            const userId = req.user!.accountId;
            const chatId = this.validateId(req.params.chatId, 'chatId');
            if (chatId === null) {
                return res.status(400).json(DataResponse.error("Invalid chatId", "chatId must be a valid number"));
            }

            const members = await this.chatService.getChatMembers(userId, chatId);
            res.json(DataResponse.success(members, "Chat members retrieved successfully"));
        } catch (error: any) {
            res.status(500).json(DataResponse.error("Failed to get chat members", error.message));
        }
    }

    public async findChats(req: Request, res: Response) {
        try {
            const userId = req.user!.accountId;
            if (userId === null) {
                return res.status(400).json(DataResponse.error("Invalid userId", "userId must be a valid number"));
            }

            const searchTerm = req.query.searchTerm as string || "";
            const result = await this.chatService.findChats(userId, searchTerm);
            res.json(DataResponse.success(result, "Chats found successfully"));
        } catch (error: any) {
            res.status(400).json(DataResponse.badRequest("Failed to find chats", error.message));
        }
    }
}