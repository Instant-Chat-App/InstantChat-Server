import CreateGroupRequest from "../dtos/requests/CreateGroupRequest";
import { Chat } from "../entities/chat.entity";
import { ChatMember } from "../entities/chat-member.entity";
import { ChatType } from "../entities/enum";
import ChatRepository from "../repository/chat.repository";
import { logger } from "../utils/logger";

export class ChatService {
    private chatRepository: ChatRepository;
    
    constructor() {
        this.chatRepository = new ChatRepository();
    }

    async getUserChats(userId: number) {
        return await this.chatRepository.getUserChats(userId);
    }

    async getCurrentMember(userId: number, chatId: number) {
        return await this.chatRepository.getCurrentMember(userId, chatId);
    }

    async getChatById(chatId: number): Promise<Chat | null> {
        const chat = await this.chatRepository.getChatById(chatId);
        if (!chat) {
            logger.warn(`Chat with ID ${chatId} not found`);
            return null;
        }
        return chat;
    }

    private async createChatMembers(chatId: number, members: { memberId: number, isOwner: boolean }[]): Promise<void> {
        const membersData = members.map(member => ({
            chatId,
            memberId: member.memberId,
            isOwner: member.isOwner,
            joinedAt: new Date()
        }));

        await this.chatRepository.createChatMembers(membersData);
    }

    async createPrivateChat(userId: number, otherUserId: number): Promise<Chat> {
        // Check for existing chat
        const existingChat = await this.chatRepository.findExistingPrivateChat(userId, otherUserId);
        if (existingChat) {
            logger.info(`Found existing private chat between ${userId} and ${otherUserId}, terminating creation.`);
            return existingChat;
        }

        try {
            // Create new chat
            const chat = await this.chatRepository.createChat({
                type: ChatType.PRIVATE
            });
            logger.info(`Created new private chat with ID ${chat.chatId}`);

            // Add members
            await this.createChatMembers(chat.chatId, [
                { memberId: userId, isOwner: false },
                { memberId: otherUserId, isOwner: false }
            ]);

            return chat;
        } catch (error) {
            logger.error(`Failed to create private chat: ${error}`);
            throw new Error('Failed to create private chat');
        }
    }

    async createGroupChat(userId: number, request: CreateGroupRequest): Promise<Chat> {
        try {
            // Create new chat
            const chat = await this.chatRepository.createChat({
                type: ChatType.GROUP,
                chatName: request.name
            });
            logger.info(`Created new group chat with ID ${chat.chatId} and name ${request.name}`);

            // Add owner and members
            const members = [
                { memberId: userId, isOwner: true },
                ...request.members.map(memberId => ({
                    memberId,
                    isOwner: false
                }))
            ];
            await this.createChatMembers(chat.chatId, members);

            return chat;
        } catch (error) {
            logger.error(`Failed to create group chat: ${error}`);
            throw new Error('Failed to create group chat');
        }
    }

    async createChannel(userId: number, request: CreateGroupRequest): Promise<Chat> {
        try {
            // Create new chat
            const chat = await this.chatRepository.createChat({
                type: ChatType.CHANNEL,
                chatName: request.name
            });
            logger.info(`Created new channel with ID ${chat.chatId} and name ${request.name}`);

            // Add owner and members
            const members = [
                { memberId: userId, isOwner: true },
                ...request.members.map(memberId => ({
                    memberId,
                    isOwner: false
                }))
            ];
            await this.createChatMembers(chat.chatId, members);

            return chat;
        } catch (error) {
            logger.error(`Failed to create channel: ${error}`);
            throw new Error('Failed to create channel');
        }
    }
}