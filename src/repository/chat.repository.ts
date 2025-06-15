import { getRepository } from "typeorm";
import { Chat } from "../entities/chat.entity";
import { BaseRepository } from "./base.repository";
import { Message } from "../entities/message.entity";
import { ChatMember } from "../entities/chat-member.entity";
import { logger } from "../utils/logger";
import { MessageStatus } from "../entities/message-status.entity";
import { ChatType } from "../entities/enum";
import CreateGroupRequest from "../dtos/requests/CreateGroupRequest";


export default class ChatRepository extends BaseRepository<Chat> {
    constructor() {
        super(Chat);
    }

    async getUserChats(
        userId: number
    ): Promise<Chat[]> {

        const subQuery = this.manager
            .createQueryBuilder(Message, 'message')
            .select('MAX(message.createdAt)', 'maxCreatedAt')
            .where('message.chatId = chat.chatId');

        let queryBuilder = this.manager
            .createQueryBuilder(Chat, 'chat')
            .innerJoin(
                ChatMember,
                'chatMember',
                'chatMember.chat_id = chat.chat_id AND chatMember.member_id = :userId', { userId })
            .leftJoin(
                Message,
                'message',
                `message.chatId = chat.chatId AND message.createdAt = (${subQuery.getQuery()})`
            )
            .leftJoin(
                MessageStatus,
                'messageStatus',
                'messageStatus.messageId = message.messageId AND messageStatus.memberId = :userId', { userId }
            )
            .select([])
            .addSelect('chat.chat_id', 'chatId')
            .addSelect('chat.chat_name', 'chatName')
            .addSelect('chat.type', 'chatType')
            .addSelect('chat.cover_image', 'coverImage')
            .addSelect('message.message_id', 'messageId')
            .addSelect('message.content', 'messageContent')
            .addSelect('message.created_at', 'messageCreatedAt')
            .addSelect('message.sender_id', 'messageSenderId')
            .addSelect('messageStatus.status', 'readStatus')
            .orderBy('message.createdAt', 'DESC');

        const results = await queryBuilder.getRawMany();
        if (!results || results.length === 0) {
            return [];
        }
        return results;
    }

    async findExistingPrivateChat(userId: number, otherUserId: number): Promise<Chat | null> {
        return await this.manager
            .createQueryBuilder(Chat, 'chat')
            .innerJoin(ChatMember, 'chatMember', 'chatMember.chat_id = chat.chat_id')
            .where('chat.type = :type', { type: 'private' })
            .andWhere('chatMember.member_id IN (:...memberIds)', { memberIds: [userId, otherUserId] })
            .getOne();
    }

    async getChatById(chatId: number): Promise<Chat | null> {
        return await this.manager
            .createQueryBuilder(Chat, 'chat')
            .where('chat.chat_id = :chatId', { chatId })
            .getOne();
    }

    async createChat(chatData: Partial<Chat>): Promise<Chat> {
        const chat = this.manager.create(Chat, chatData);
        return await this.manager.save(chat);
    }

    async createChatMember(memberData: Partial<ChatMember>): Promise<ChatMember> {
        const chatMember = this.manager.create(ChatMember, memberData);
        return await this.manager.save(ChatMember, chatMember);
    }

    async createChatMembers(membersData: Partial<ChatMember>[]): Promise<ChatMember[]> {
        const chatMembers = membersData.map(data => this.manager.create(ChatMember, data));
        return await this.manager.save(ChatMember, chatMembers);
    }

    async getCurrentMember(
        userId: number,
        chatId: number
    ): Promise<ChatMember | null> {
        return await this.manager
            .createQueryBuilder(ChatMember, 'chatMember')
            .where('chatMember.member_id = :userId', { userId })
            .andWhere('chatMember.chat_id = :chatId', { chatId })
            .getOne();
    }

    // Create 1-1 private chat between two users
    async createPrivateChat(
        userId: number,
        otherUserId: number
    ): Promise<Chat | null> {
       
        const existingChat = await this.manager
            .createQueryBuilder(Chat, 'chat')
            .innerJoin(ChatMember, 'chatMember', 'chatMember.chat_id = chat.chat_id')
            .where('chat.type = :type', { type: 'private' })
            .andWhere('chatMember.member_id IN (:...memberIds)', { memberIds: [userId, otherUserId] })
            .getOne();

        logger.info(`Searching for existing private chat between ${userId} and ${otherUserId}`);


        if (existingChat) {
            logger.info(`Found existing private chat between ${userId} and ${otherUserId}`);
            return existingChat;
        }

        const chat = new Chat();
        chat.type = ChatType.PRIVATE;
        chat.chatName = undefined;
        chat.coverImage = undefined;

        const savedChat = await this.manager.save(chat);

        const chatMembers = [
            this.manager.create(ChatMember, { 
                chatId: savedChat.chatId,
                memberId: userId,
                isOwner: false,
                joinedAt: new Date()
            }),
            this.manager.create(ChatMember, { 
                chatId: savedChat.chatId,
                memberId: otherUserId,
                isOwner: false,
                joinedAt: new Date()
            })
        ];

        await this.manager.save(ChatMember, chatMembers);
        return savedChat;
    }

    // Create group chat with multiple members
    async createGroupChat(
        userId: number,
        request: CreateGroupRequest
    ): Promise<Chat> {
        const chat = new Chat();
        chat.type = ChatType.GROUP;
        chat.chatName = request.name;

        const savedChat = await this.manager.save(chat);

        logger.info(`Creating group chat with ID ${savedChat.chatId} and name ${request.name}`);
        const ownerMember = this.manager.create(ChatMember, {
            chatId: savedChat.chatId,
            memberId: userId,
            isOwner: true,
            joinedAt: new Date()
        });
        await this.manager.save(ownerMember);
        for (const memberId of request.members) {
            const chatMember = this.manager.create(ChatMember, {
                chatId: savedChat.chatId,
                memberId: memberId,
                isOwner: false,
                joinedAt: new Date()
            });

            await this.manager.save(chatMember);
        }
        return savedChat;
    }

    // Create channel with multiple members but only owner can message
    async createChatChannel(
        userId: number,
        request: CreateGroupRequest
    ): Promise<Chat> {
        const chat = new Chat();
        chat.type = ChatType.CHANNEL;
        chat.chatName = request.name;

        const savedChat = await this.manager.save(chat);

        logger.info(`Creating channel with ID ${savedChat.chatId} and name ${request.name}`);
        const ownerMember = this.manager.create(ChatMember, {
            chatId: savedChat.chatId,
            memberId: userId,
            isOwner: true,
            joinedAt: new Date()
        });
        await this.manager.save(ownerMember);
        for (const memberId of request.members) {
            const chatMember = this.manager.create(ChatMember, {
                chatId: savedChat.chatId,
                memberId: memberId,
                isOwner: false,
                joinedAt: new Date()
            });

            await this.manager.save(chatMember);
        }
        return savedChat;
    }


}