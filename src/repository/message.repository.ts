import { Timestamp } from "typeorm";
import { AttachType, MessageStatusEnum, Reaction } from "../entities/enum";
import { MessageStatus } from "../entities/message-status.entity";
import { Message } from "../entities/message.entity";
import { logger } from "../utils/logger";
import { BaseRepository } from "./base.repository";


export default class MessageRepository extends BaseRepository<Message> {
    constructor() {
        super(Message);
    }

    async getMessageById(messageId: number): Promise<Message | null> {
        const message = await this.manager.findOne(Message, {
            where: { messageId },
            relations: [
                'sender',
                'attachments',
                'reactions',
                'replyToMessage',
                'replyToMessage.sender',
                'messageStatus'
            ]
        });

        return message;
    }

    async saveAttachments(messageId: number, attachment: string, fileType: AttachType): Promise<void> {

        await this.manager
            .createQueryBuilder()
            .insert()
            .into('attachments')
            .values({
                messageId,
                url: attachment,
                type: fileType
            })
            .execute();
        logger.info(`Attachments saved for message ID ${messageId}`);
    }

    async checkMemberInChat(userId: number, chatId: number): Promise<boolean> {
        const count = await this.manager
            .createQueryBuilder()
            .select('COUNT(*)', 'count')
            .from('chat_members', 'cm')
            .where('cm.memberId = :userId', { userId })
            .andWhere('cm.chatId = :chatId', { chatId })
            .getRawOne();

        const isMember = count && count.count > 0;
        logger.info(`User ${userId} is ${isMember ? '' : 'not '}a member of chat ${chatId}`);
        return isMember;
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

    async sendMessage(senderId: number, chatId: number, content: string, attachments: string[], replyTo?: number): Promise<Message> {
        const message = this.manager.create(Message, {
            senderId,
            chatId,
            content,
            attachments: attachments.map(url => ({ url })),
            ...(replyTo ? { replyTo: replyTo } : null)
        });

        const savedMessage = await this.manager.save(message);
        logger.info(`Message sent successfully by user ${senderId} in chat ${chatId}`);
        return savedMessage;
    }


    async saveMessageStatus(messageId: number, memberId: number, status: MessageStatusEnum): Promise<void> {
        const messageStatus = this.manager.create(MessageStatus, {
            messageId,
            memberId,
            status
        });
        await this.manager.save(messageStatus);
    }

    async editMessage(messageId: number, newContent: string): Promise<void> {
        await this.manager.update(Message, messageId, {
            content: newContent,
            isEdited: true,
        });
    }

    async deleteMessage(messageId: number): Promise<void> {
        await this.manager.update(Message, messageId, {
            content: "",
            isDeleted: true,
        });
        logger.info(`Message with ID ${messageId} marked as deleted`);
    }

    async deleteReactions(messageId: number, userId: number): Promise<void> {
        await this.manager
            .createQueryBuilder()
            .delete()
            .from('message_reactions')
            .where('message_id = :messageId', { messageId })
            .andWhere('user_id = :userId', { userId })
            .execute();
        logger.info(`Reactions deleted for message ID ${messageId} by user ${userId}`);
    }

    async updateReaction(messageId: number, userId: number, reactionType: Reaction): Promise<void> {
        await this.manager
            .createQueryBuilder()
            .update('message_reactions')
            .set({ type: reactionType,
                createdAt: new Date().toISOString() 
             })
            .where('message_id = :messageId', { messageId })
            .andWhere('user_id = :userId', { userId })
            .execute();
        logger.info(`Reaction updated for message ID ${messageId} by user ${userId}`);
    }

    async reactToMessage(messageId: number, userId: number, reactionType: Reaction): Promise<void> {
        await this.manager
            .createQueryBuilder()
            .insert()
            .into('message_reactions')
            .values({
                messageId,
                userId,
                type: reactionType
            })
            .execute();
        logger.info(`User ${userId} reacted with ${reactionType} to message ${messageId}`);
    }

}