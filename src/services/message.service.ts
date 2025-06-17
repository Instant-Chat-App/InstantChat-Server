import { send } from "process";
import { Chat } from "../entities/chat.entity";
import { AttachType, MessageStatusEnum, Reaction } from "../entities/enum";
import { Message } from "../entities/message.entity";
import ChatRepository from "../repository/chat.repository";
import MessageRepository from "../repository/message.repository";
import { logger } from "../utils/logger";
import { uploadFromBase64 } from "./upload.service";
import { base64Data } from "../socketio/handlers/message.handler";
import { Attachment } from "../entities/attachment.entity";

export class MessageService {
    private messageRepository: MessageRepository;
    private chatRepository: ChatRepository
    constructor() {
        this.messageRepository = new MessageRepository();
        this.chatRepository = new ChatRepository();
    }

    //utility function
    async checkMemberInChat(userId: number, chatId: number): Promise<boolean> {
        return await this.messageRepository.checkMemberInChat(userId, chatId);
    }

    async markMessageAsRead(messageId: number, userId: number) {
        const message = await this.messageRepository.getMessageById(messageId);
        if (!message) {
            throw new Error("Message not found");
        }
        await this.messageRepository.saveMessageStatus(messageId, userId, MessageStatusEnum.READ);
    }


    // Retrieves messages for a specific user in a chat
    async getUserChatMessages(userId: number, chatId: number) {
        const messages = await this.messageRepository.getUserChatMessages(userId, chatId);

        const unReadMessages = messages.filter(message =>
            message.messageStatus.map(status => status.memberId === userId && status.status === MessageStatusEnum.UNREAD)
        );
        logger.info(`User ${userId} has ${unReadMessages.length} unread messages in chat ${chatId}`);
        if (unReadMessages.length > 0) {
            for (const message of unReadMessages) {
                await this.messageRepository.saveMessageStatus(message.messageId, userId, MessageStatusEnum.READ);
            }
        }
        return messages;
    }

    async sendMessage(
        senderId: number,
        chatId: number,
        content: string,
        attachments?: base64Data[],
        replyTo?: number
    ) {
        if (!(await this.checkMemberInChat(senderId, chatId))) {
            throw new Error("User is not a member of the chat");
        }

        const message = await this.messageRepository.sendMessage(
            senderId,
            chatId,
            content,
            replyTo
        );
        if (attachments && attachments.length > 0) {
            for (const attachment of attachments) {
                const fileName = `${Date.now()}_${attachment.fileName}`;
                const uploadedUrl = await uploadFromBase64(
                    attachment.base64Data,
                    fileName,
                    attachment.mimeType,
                    {
                        resource_type: "auto",
                        folder: "uploads",
                    }
                );
                await this.messageRepository.saveAttachments(
                    message.messageId,
                    uploadedUrl,
                    attachment.mimeType.startsWith("image/") ? AttachType.IMAGE :
                    attachment.mimeType.startsWith("video/") ? AttachType.VIDEO : AttachType.RAW
                );
            }
        }



        if (!message) {
            throw new Error("Failed to send message");
        }
        logger.info(`Message sent successfully by user ${senderId} in chat ${chatId}`);

        // Lưu messageStatus cho những người khác
        const memberInChat = (await this.chatRepository.getChatMembers(chatId)).map(m => m.userId);
        for (const member of memberInChat) {
            if (member === senderId) continue;
            await this.messageRepository.saveMessageStatus(message.messageId, member, MessageStatusEnum.UNREAD);
        }

        return message;
    }

    async editMessage(userId: number, messageId: number, content: string) {
        const message = await this.messageRepository.getMessageById(messageId);
        const senderId = message!.senderId;

        if (senderId !== userId) {
            throw new Error("Only the sender can edit the message");
        }
        if (!message) {
            throw new Error("Message not found");
        }
        if (message.isDeleted) {
            throw new Error("Cannot edit a deleted message");
        }
        if (!message.isEdited) {
            message.isEdited = true;
        }
        if (!content || content.trim() === "") {
            throw new Error("Content cannot be empty");
        }
        if (message.content === content) {
            throw new Error("No changes made to the message content");
        }
        if (message.senderId !== message.senderId) {
            throw new Error("Only the sender can edit the message");
        }

        return await this.messageRepository.editMessage(messageId, content);
    }

    async deleteMessage(messageId: number, userId: number) {
        const message = await this.messageRepository.getMessageById(messageId);

        if (!message) {
            throw new Error("Message not found");
        }
        if (message.isDeleted) {
            throw new Error("Message is already deleted");
        }
        if (message.senderId !== userId) {
            throw new Error("Only the sender can delete the message");
        }

        const reactions = message.reactions;
        if (reactions.length > 0) {
            logger.info(`Deleting reactions for message ${messageId}`);
            for (const reaction of reactions) {
                await this.messageRepository.deleteReactions(messageId, reaction.userId);
            }
        }

        return await this.messageRepository.deleteMessage(messageId);
    }

    async reactToMessage(messageId: number, userId: number, reaction: Reaction) {
        const message = await this.messageRepository.getMessageById(messageId);
        if (!message) {
            throw new Error("Message not found");
        }
        if (message.isDeleted) {
            throw new Error("Cannot react to a deleted message");
        }
        logger.info("testing reaction", reaction);
        let existingReaction = message?.reactions.find(r => r.userId === userId);
        if (existingReaction && existingReaction.type !== reaction) {
            logger.info(`User ${userId} is updating reaction for message ${messageId} from ${existingReaction.type} to ${reaction}`);
            return await this.messageRepository.updateReaction(messageId, userId, reaction);
        }
        if (existingReaction && existingReaction.type === reaction) {
            throw new Error("User has already reacted with this reaction");
        }

        return await this.messageRepository.reactToMessage(messageId, userId, reaction);
    }

    async removeReaction(messageId: number, userId: number) {
        const message = await this.messageRepository.getMessageById(messageId);
        if (!message) {
            throw new Error("Message not found");
        }
        if (message.isDeleted) {
            throw new Error("Cannot remove reaction from a deleted message");
        }
        const existingReaction = message.reactions.find(r => r.userId === userId);
        if (!existingReaction) {
            throw new Error("User has not reacted to this message");
        }

        return await this.messageRepository.deleteReactions(messageId, userId);

    }

}