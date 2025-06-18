import { Timestamp } from "typeorm";
import { AttachType, MessageStatusEnum, Reaction } from "../entities/enum";
import { MessageStatus } from "../entities/message-status.entity";
import { Message } from "../entities/message.entity";
import { logger } from "../utils/logger";
import { BaseRepository } from "./base.repository";
import { Attachment } from "../entities/attachment.entity";


export default class MessageRepository extends BaseRepository<Message> {
    constructor() {
        super(Message);
    }

    async getMessageById(messageId: number): Promise<Message | null> {
        return await this.manager.findOne(Message, {
            where: { messageId },
            relations: {
                sender: true,
                attachments: true,
                reactions: {
                    user: true
                },
                replyToMessage: {
                    sender: true
                },
                messageStatus: true
            }
        });
    }

    async getUserChatMessages(userId: number, chatId: number): Promise<Message[]> {
        // Get chat owner status once
        const ownerStatus = await this.manager
            .createQueryBuilder()
            .select('cm.is_owner', 'isOwner')
            .from('chat_members', 'cm')
            .where('cm.chat_id = :chatId AND cm.member_id = :userId', { chatId, userId })
            .getRawOne();

        // Get messages with optimized relations
        const messages = await this.manager.find(Message, {
            where: { chatId },
            relations: {
                sender: true,
                attachments: true,
                reactions: {
                    user: true
                },
                replyToMessage: {
                    sender: true
                },
                messageStatus: true
            },
            order: {
                createdAt: 'ASC'
            }
        });

        // Transform and add owner status
        return messages.map(message => ({
            ...message,
            isOwner: ownerStatus?.isOwner || false
        }));
    }

    async saveAttachments(messageId: number, attachments: string, fileType: AttachType): Promise<void> {
        await this.manager
            .createQueryBuilder()
            .insert()
            .into(Attachment)
            .values({
                messageId,
                url: attachments,
                type: fileType
            })
            .execute();
        logger.info(`Attachments saved for message ID ${messageId}`);
    }

    async checkMemberInChat(userId: number, chatId: number): Promise<boolean> {
        const result = await this.manager
            .createQueryBuilder('chat_members', 'cm')
            .where('cm.member_id = :userId AND cm.chat_id = :chatId', { userId, chatId })
            .getExists();

        logger.info(`User ${userId} is ${result ? '' : 'not '}a member of chat ${chatId}`);
        return result;
    }

    async sendMessage(senderId: number, chatId: number, content: string, replyTo?: number): Promise<Message> {
        const message = this.manager.create(Message, {
            senderId,
            chatId,
            content,
            ...(replyTo ? { replyTo } : {})
        });

        const savedMessage = await this.manager.save(message);
        logger.info(`Message sent successfully by user ${senderId} in chat ${chatId}`);
        return savedMessage;
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
            .where('message_id = :messageId AND user_id = :userId', { messageId, userId })
            .execute();
        logger.info(`Reactions deleted for message ID ${messageId} by user ${userId}`);
    }

    async updateReaction(messageId: number, userId: number, reactionType: Reaction): Promise<void> {
        await this.manager
            .createQueryBuilder()
            .insert()
            .into('message_reactions')
            .values({
                messageId,
                userId,
                type: reactionType,
                createdAt: new Date()
            })
            .orUpdate(['type', 'created_at'], ['message_id', 'user_id'])
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


    async markMessageUnRead(messageId: number, memberId: number[]): Promise<void> {
        await this.manager
            .createQueryBuilder()
            .insert()
            .into(MessageStatus)
            .values(
                memberId.map(id => ({
                    messageId,
                    memberId: id,
                    status: MessageStatusEnum.UNREAD
                }))
            )
            .execute();
        logger.info(`Marked message ${messageId} as UNREAD for member ${memberId}`);
    }

    async markMessageAsRead(messageId: number, memberId: number): Promise<void> {
        await this.manager
            .createQueryBuilder()
            .update(MessageStatus)
            .set({ status: MessageStatusEnum.READ })
            .where(`message_id = :messageId AND member_id = :memberId`, { messageId, memberId })
            .execute();
        logger.info(`Marked message ${messageId} as READ by member ${memberId}`);
    }

}