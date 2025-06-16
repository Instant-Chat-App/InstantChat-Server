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
            .leftJoin('message.sender', 'u')
            .leftJoin('message.attachments', 'a')
            .leftJoin('message.reactions', 'r')
            .leftJoin('message.replyToMessage', 'rm')
            .leftJoin('rm.sender', 'ru')
            .leftJoin(
                'message.messageStatus',
                'ms',
                'ms.member_id = :userId', { userId }
            )
            .where('message.chatId = :chatId', { chatId })
            .orderBy('message.createdAt', 'ASC')
            .select([
                // message fields
                'message.messageId',
                'message.chatId',
                'message.senderId',
                'message.content',
                'message.createdAt',
                'message.isEdited',
                'message.isDeleted',
                'message.replyTo',

                // sender fields
                'u.userId',
                'u.fullName',
                'u.avatar',

                // attachments fields
                'a.attachmentId',
                'a.url',
                'a.type',

                // reactions fields
                'r.messageId',
                'r.userId',
                'r.type',
                'r.createdAt',

                // replyToMessage fields
                'rm.messageId',
                'rm.content',

                // replyToMessage sender fields
                'ru.userId',
                'ru.fullName',
                'ru.avatar',

                // messageStatus fields
                'ms.status'
            ]);

        const results = await queryBuilder.getMany();
        if (!results || results.length === 0) {
            return [];
        }
        logger.info(`Found ${results.length} messages for user ${userId} in chat ${chatId}`);
        return results;

    }
}