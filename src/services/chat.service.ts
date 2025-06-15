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

        if (userId === otherUserId) {
            logger.warn(`Cannot create private chat with self: ${userId}`);
            throw new Error('Cannot create private chat with self');
        }

        try {
            // Create new chat with members
            const chat = await this.chatRepository.createPrivateChat(userId, otherUserId);
            if (!chat) {
                throw new Error('Failed to create private chat');
            }
            logger.info(`Created new private chat with ID ${chat.chatId}`);
            return chat;
        } catch (error) {
            logger.error(`Failed to create private chat: ${error}`);
            throw new Error('Failed to create private chat');
        }
    }

    async createGroupChat(userId: number, request: CreateGroupRequest): Promise<Chat> {
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

    async addUserToChat(ownerId: number, chatId: number, userId: number): Promise<void> {
        try {
            const chat = await this.chatRepository.getChatById(chatId);
            if (!chat) {
                logger.warn(`Chat with ID ${chatId} not found`);
                throw new Error(`Chat with ID ${chatId} not found`);
            }

            if (chat.type !== ChatType.GROUP && chat.type !== ChatType.CHANNEL) {
                logger.warn(`Chat with ID ${chatId} is not a group or channel`);
                throw new Error(`Chat with ID ${chatId} is not a group or channel`);
            }

            const ownerMember = await this.getCurrentMember(ownerId, chatId);
            if (!ownerMember || !ownerMember.isOwner) {
                logger.warn(`User ${ownerId} is not an owner of chat ${chatId}`);
                throw new Error(`User ${ownerId} is not an owner of chat ${chatId}`);
            }

            const memberExists = await this.chatRepository.checkIfUserAlreadyInChat(userId, chatId);
            if (memberExists) {
                logger.warn(`Member with ID ${userId} already exists in chat ${chatId}`);
                return;
            }

            await this.chatRepository.addUserToChat(chatId, userId);
            logger.info(`Added member with ID ${userId} to chat ${chatId}`);
        } catch (error) {
            logger.error(`Failed to add member to chat: ${error}`);
            throw new Error('Failed to add member to chat');
        }
    }

    async kickUserFromChat(ownerId: number, chatId: number, userId: number): Promise<void> {
        const chat = await this.chatRepository.getChatById(chatId);
        if (!chat) {
            logger.warn(`Chat with ID ${chatId} not found`);
            throw new Error(`Chat with ID ${chatId} not found`);
        }
        if (chat.type !== ChatType.GROUP && chat.type !== ChatType.CHANNEL) {
            logger.warn(`Chat with ID ${chatId} is not a group or channel`);
            throw new Error(`Chat with ID ${chatId} is not a group or channel`);
        }
        const ownerMember = await this.getCurrentMember(ownerId, chatId);
        if (!ownerMember || !ownerMember.isOwner) {
            logger.warn(`User ${ownerId} is not an owner of chat ${chatId}`);
            throw new Error(`User ${ownerId} is not an owner of chat ${chatId}`);
        }
        const memberToKick = await this.getCurrentMember(userId, chatId);
        if (!memberToKick) {
            logger.warn(`User ${userId} is not a member of chat ${chatId}`);
            throw new Error(`User ${userId} is not a member of chat ${chatId}`);
        }
        
        if (memberToKick.isOwner) {
            logger.warn(`Cannot kick owner from chat ${chatId}`);
            throw new Error(`Cannot kick owner from chat ${chatId}`);
        }

        await this.chatRepository.kickUserFromChat(ownerId, userId, chatId);
        logger.info(`User ${userId} has been kicked from chat ${chatId}`);
    }

    async leaveChat(userId: number, chatId: number): Promise<void> {
        const chat = await this.chatRepository.getChatById(chatId);
        if (!chat) {
            logger.warn(`Chat with ID ${chatId} not found`);
            throw new Error(`Chat with ID ${chatId} not found`);
        }
        const member = await this.getCurrentMember(userId, chatId);
        if (!member) {
            logger.warn(`User ${userId} is not a member of chat ${chatId}`);
            throw new Error(`User ${userId} is not a member of chat ${chatId}`);
        }
        if (member.isOwner) {
            logger.warn(`Owner cannot leave the chat ${chatId}`);
            throw new Error(`Owner cannot leave the chat ${chatId}`);
        }
        await this.chatRepository.leaveChat(userId, chatId);
        logger.info(`User ${userId} has left chat ${chatId}`);
    }


    async deleteChat(ownerId: number, chatId: number): Promise<void> {
        const chat = await this.chatRepository.getChatById(chatId);
        if (!chat) {
            logger.warn(`Chat with ID ${chatId} not found`);
            throw new Error(`Chat with ID ${chatId} not found`);
        }
        const ownerMember = await this.getCurrentMember(ownerId, chatId);
        if (!ownerMember || !ownerMember.isOwner) {
            logger.warn(`User ${ownerId} is not an owner of chat ${chatId}`);
            throw new Error(`User ${ownerId} is not an owner of chat ${chatId}`);
        }

        await this.chatRepository.deleteChat(chatId);
        logger.info(`Chat with ID ${chatId} has been deleted`);
    }

    async changeChatName(userId: number, chatId: number, newName: string): Promise<Chat> {
        const chat = await this.chatRepository.getChatById(chatId);
        if (!chat) {
            logger.warn(`Chat with ID ${chatId} not found`);
            throw new Error(`Chat with ID ${chatId} not found`);
        }
        
        const chatType = chat.type;
        if (chatType !== ChatType.GROUP && chatType !== ChatType.CHANNEL) {
            logger.warn(`Chat with ID ${chatId} is not a group or channel`);
            throw new Error(`Chat with ID ${chatId} is not a group or channel`);
        }

        const member = await this.getCurrentMember(userId, chatId);

        if (!member) {
            logger.warn(`User ${userId} is not a member of chat ${chatId}`);
            throw new Error(`User ${userId} is not a member of chat ${chatId}`);
        }

        if((chatType === ChatType.CHANNEL && !member.isOwner)) {
            logger.warn(`User ${userId} is not an owner of channel ${chatId}`);
            throw new Error(`User ${userId} is not an owner of channel ${chatId}`);
        }

        const updatedChat = await this.chatRepository.changeChatName(chatId, newName);
        if (!updatedChat) {
            logger.warn(`Failed to change chat name for chat ID ${chatId}`);
            throw new Error(`Failed to change chat name for chat ID ${chatId}`);
        }
        return updatedChat;
    }

    async changeChatCoverImage(userId: number, chatId: number, newCoverImage: string): Promise<Chat> {
        const chat = await this.chatRepository.getChatById(chatId);
        if (!chat) {
            logger.warn(`Chat with ID ${chatId} not found`);
            throw new Error(`Chat with ID ${chatId} not found`);
        }

        const chatType = chat.type;
        if (chatType !== ChatType.GROUP && chatType !== ChatType.CHANNEL) {
            logger.warn(`Chat with ID ${chatId} is not a group or channel`);
            throw new Error(`Chat with ID ${chatId} is not a group or channel`);
        }

        const member = await this.getCurrentMember(userId, chatId);
        if (!member) {
            logger.warn(`User ${userId} is not a member of chat ${chatId}`);
            throw new Error(`User ${userId} is not a member of chat ${chatId}`);
        }

        if((chatType === ChatType.CHANNEL && !member.isOwner)) {
            logger.warn(`User ${userId} is not an owner of channel ${chatId}`);
            throw new Error(`User ${userId} is not an owner of channel ${chatId}`);
        }

        const updatedChat = await this.chatRepository.changeChatCoverImage(chatId, newCoverImage);
        if (!updatedChat) {
            logger.warn(`Failed to change cover image for chat ID ${chatId}`);
            throw new Error(`Failed to change cover image for chat ID ${chatId}`);
        }
        return updatedChat;
    }

    async getChatMembers(chatId: number): Promise<ChatMember[]> {
        const chat = await this.chatRepository.getChatById(chatId);
        if (!chat) {
            logger.warn(`Chat with ID ${chatId} not found`);
            throw new Error(`Chat with ID ${chatId} not found`);
        }
        return await this.chatRepository.getChatMembers(chatId);
    }

    async findChats(
        userId: number,
        searchTerm: string
    ): Promise<{ chats: Chat[]}> {
        const chats = await this.chatRepository.findChats(userId, searchTerm);
        return { chats };
    }



}