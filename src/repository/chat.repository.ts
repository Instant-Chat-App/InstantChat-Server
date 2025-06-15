import { getRepository } from "typeorm";
import { Chat } from "../entities/chat.entity";
import { BaseRepository } from "./base.repository";
import { Message } from "../entities/message.entity";
import { ChatMember } from "../entities/chat-member.entity";
import { logger } from "../utils/logger";
import { MessageStatus } from "../entities/message-status.entity";



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

    async getCurrentMember(
        userId: number,
        chatId: number
    ) {
        const queryBuilder = this.manager
            .createQueryBuilder(ChatMember, 'chatMember')
            .where('chatMember.member_id = :userId', { userId })
            .andWhere('chatMember.chat_id = :chatId', { chatId });

        return await queryBuilder.getOne();
    }
}