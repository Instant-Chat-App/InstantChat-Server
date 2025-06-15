import { Chat } from "../entities/chat.entity";
import { BaseRepository } from "./base.repository";
import { Message } from "../entities/message.entity";
import { ChatMember } from "../entities/chat-member.entity";

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
            .addSelect([
                `chat.chat_id`,
                `chat.chat_name`,
                `chat.type`,
                `chat.cover_image`,
                `message.message_id`,
                `message.content`,
                `message.created_at`,
                `message.sender_id`,
            ])
            .orderBy('message.createdAt', 'DESC');

        const results = await queryBuilder.getRawMany();
        if (!results || results.length === 0) {
            return [];
        }
        return results;
    }
}
