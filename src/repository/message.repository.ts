import { Message } from "../entities/message.entity";
import { logger } from "../utils/logger";
import { BaseRepository } from "./base.repository";


export default class MessageRepository extends BaseRepository<Message> {
    constructor() {
        super(Message);
    }

    async getUserChatMessages(userId: number, chatId: number): Promise<Message[]> {
        const queryBuilder = this.manager
            .createQueryBuilder(Message, 'message')
            .leftJoinAndSelect('message.sender', 'u')
            .leftJoinAndSelect('message.attachments', 'a')
            .leftJoinAndSelect('message.reactions', 'r')
            .leftJoinAndSelect('message.replyToMessage', 'rm')
            .leftJoinAndSelect('rm.sender', 'ru')
            .leftJoinAndSelect(
                'message.messageStatus',
                'ms',
                'ms.member_id = :userId', { userId }
            )
            .where('message.chatId = :chatId', { chatId })
            .orderBy('message.createdAt', 'ASC');

        const results = await queryBuilder.getMany();
        if (!results || results.length === 0) {
            return [];
        }
        logger.info(`Found ${results.length} messages for user ${userId} in chat ${chatId}`);
        return results;

    }
}