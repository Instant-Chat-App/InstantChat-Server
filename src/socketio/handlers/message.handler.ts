import { Socket, Server } from 'socket.io';
import MessageController from '../../controllers/message.controller';
import { logger } from '../../utils/logger';
import { uploadFromBase64 } from '../../services/upload.service';
import { MessageService } from '../../services/message.service';
import { Reaction } from '../../entities/enum';
import { ChatService } from '../../services/chat.service';

const messageService = new MessageService();
const chatService = new ChatService();

interface MessageEvent {
    chatId: number;
    content: string;
    replyTo?: number;
    attachments?: base64Data[];
}
export interface base64Data{
    fileName: string;
    mimeType: string;
    base64Data: string;
}

export function handleMessageEvents(socket: Socket, io: Server) {
    socket.on("joinMultipleChats", async (chatIds: number[]) => {
        const user = socket.data.user;
        if (!user) {
            return socket.emit("joinError", { error: "UNAUTHORIZED" });
        }

        for (const chatId of chatIds) {
            const isMember = await messageService.checkMemberInChat(user.accountId, chatId);
            if (!isMember) {
                logger.warn(`User ${user.accountId} is not a member of chat ${chatId}`);
                return socket.emit("joinError", { error: "You are not a member of this chat" });
            }
        }
        for (const chatId of chatIds) {
            socket.join(`chat_${chatId}`);
            logger.info(`Client ${socket.id} joined chat: ${chatId}`);
            socket.emit("joinSuccess", { chatId });
        }
    });

    socket.on("sendMessage", async (message: MessageEvent) => {
        try{
            const user = socket.data.user;
            if (!user) {
                logger.warn("Unauthorized user attempted to send a message");
                return socket.emit("messageError", { error: "UNAUTHORIZED" });
            }
            if (!(await messageService.checkMemberInChat(user.accountId, message.chatId))) {
                logger.warn(`User ${user.accountId} is not a member of chat ${message.chatId}`);
                return socket.emit("messageError", { error: "You are not a member of this chat" });
            }

            if (!message.content && (!message.attachments || message.attachments.length === 0)) {
                logger.warn("Message content and attachments are both empty");
                return socket.emit("messageError", { error: "Message content cannot be empty" });
            }

            await messageService.sendMessage(
                user.accountId,
                message.chatId,
                message.content,
                message.attachments,
                message.replyTo ? message.replyTo : undefined
            );

            // Emit the message to all members of the chat
            io.to(`chat_${message.chatId}`).emit("newMessage", {
                chatId: message.chatId,
                content: message.content,
                attachments: message.attachments,
                senderId: user.accountId,
                timestamp: new Date().toISOString(),
                replyTo: message.replyTo,
                isEdited: false,
                isDeleted: false,

            });
            logger.info(`Message sent successfully from user ${user.accountId} in chat ${message.chatId}`);
        }catch (error) {
            logger.error(`Error sending message: ${error}`);
            socket.emit("messageError", { error: "Failed to send message" });
            return;
        }
    });

    socket.on("readMessages", async (chatId: number) => {
        const user = socket.data.user;
        if (!user) {
            return socket.emit("readError", { error: "UNAUTHORIZED" });
        }

        try {
            await messageService.getUserChatMessages(user.accountId, chatId);
            logger.info(`User ${user.accountId} marked messages as read in chat ${chatId}`);
            socket.emit("readSuccess", { chatId });
        } catch (error) {
            logger.error(`Error marking messages as read: ${error}`);
            socket.emit("readError", { error: "Failed to mark messages as read" });
        }
    });

    socket.on("deleteMessage", async (chatId: number, messageId: number) => {
        const user = socket.data.user;
        if (!user) {
            return socket.emit("deleteError", { error: "UNAUTHORIZED" });
        }

        try {
            await messageService.deleteMessage(messageId, user.accountId);
            logger.info(`User ${user.accountId} deleted message ${messageId}`);
            socket.emit("deleteSuccess", { messageId });
            // Optionally, you can emit an event to notify other users in the chat
            io.to(`chat_${chatId}`).emit("messageDeleted", { messageId });
        } catch (error) {
            logger.error(`Error deleting message: ${error}`);
            socket.emit("deleteError", { error: "Failed to delete message" });
        }
    });
    socket.on("editMessage", async (chatId: number, messageId: number, content: string) => {
        const user = socket.data.user;
        if (!user) {
            return socket.emit("editError", { error: "UNAUTHORIZED" });
        }
        try {
            await messageService.editMessage(user.accountId, messageId, content);
            logger.info(`User ${user.accountId} edited message ${messageId}`);
            socket.emit("editSuccess", { messageId, content });
            // Optionally, you can emit an event to notify other users in the chat
            io.to(`chat_${chatId}`).emit("messageEdited", { messageId, content });
        } catch (error) {
            logger.error(`Error editing message: ${error}`);
            socket.emit("editError", { error: "Failed to edit message" });
        }
    });

    socket.on("reactMessage", async (chatId: number, messageId: number, reaction: Reaction) => {
        const user = socket.data.user;
        if (!user) {
            return socket.emit("reactError", { error: "UNAUTHORIZED" });
        }

        try {
            await messageService.reactToMessage(messageId, user.accountId, reaction);
            logger.info(`User ${user.accountId} reacted to message ${messageId} with ${reaction}`);
            socket.emit("reactSuccess", { messageId, reaction });
            // Optionally, you can emit an event to notify other users in the chat
            io.to(`chat_${chatId}`).emit("messageReacted", { messageId, userId: user.accountId, reaction });
        } catch (error) {
            logger.error(`Error reacting to message: ${error}`);
            socket.emit("reactError", { error: "Failed to react to message" });
        }
    });

    socket.on("deleteReaction", async (chatId: number, messageId: number) => {
        const user = socket.data.user;
        if (!user) {
            return socket.emit("deleteReactionError", { error: "UNAUTHORIZED" });
        }

        try {
            await messageService.removeReaction(messageId, user.accountId);
            logger.info(`User ${user.accountId} removed reaction from message ${messageId}`);
            socket.emit("deleteReactionSuccess", { messageId });
            // Optionally, you can emit an event to notify other users in the chat
            io.to(`chat_${chatId}`).emit("reactionDeleted", { messageId, userId: user.accountId });
        } catch (error) {
            logger.error(`Error deleting reaction: ${error}`);
            socket.emit("deleteReactionError", { error: "Failed to delete reaction" });
        }
    });

    socket.on("memberJoined", async (chatId: number, memberId: number[]) => {
        const user = socket.data.user;
        if (!user) {
            return socket.emit("memberJoinError", { error: "UNAUTHORIZED" });
        }
        if( await messageService.checkMemberInChat(user.accountId, chatId)) {
            logger.warn(`User ${user.accountId} is already a member of chat ${chatId}`);
            return socket.emit("memberJoinError", { error: "You are already a member of this chat" });
        }

        chatService.addUserToChat(user.accountId, chatId, memberId);

        logger.info(`User ${user.accountId} joined chat ${chatId}`);
        io.to(`chat_${chatId}`).emit("memberJoined", { chatId, memberId });
    });

    socket.on("memberLeft", async (chatId: number) => {
        const user = socket.data.user;
        if (!user) {
            return socket.emit("memberLeaveError", { error: "UNAUTHORIZED" });
        }

        try {
            await chatService.leaveChat(user.accountId, chatId);
            logger.info(`User ${user.accountId} left chat ${chatId}`);
            socket.emit("memberLeaveSuccess", { chatId });
            // Optionally, you can emit an event to notify other users in the chat
            io.to(`chat_${chatId}`).emit("memberLeft", { chatId, userId: user.accountId });
        } catch (error) {
            logger.error(`Error leaving chat: ${error}`);
            socket.emit("memberLeaveError", { error: "Failed to leave chat" });
        }
    });

    socket.on("changeGroupName", async (chatId: number, newName: string) => {
        const user = socket.data.user;
        if (!user) {
            return socket.emit("changeGroupNameError", { error: "UNAUTHORIZED" });
        }

        try {
            await chatService.changeChatName(user.accountId, chatId, newName);
            logger.info(`User ${user.accountId} changed group name in chat ${chatId} to ${newName}`);
            socket.emit("changeGroupNameSuccess", { chatId, newName });
            // Optionally, you can emit an event to notify other users in the chat
            io.to(`chat_${chatId}`).emit("groupNameChanged", { chatId, newName });
        } catch (error) {
            logger.error(`Error changing group name: ${error}`);
            socket.emit("changeGroupNameError", { error: "Failed to change group name" });
        }
    });

    socket.on("changeGroupCover", async (chatId: number, coverImage: { fileName: string; mimeType: string; base64Data: string }) => {
        const user = socket.data.user;
        if (!user) {
            return socket.emit("changeGroupCoverError", { error: "UNAUTHORIZED" });
        }

        try {
            const url = await uploadFromBase64(coverImage.base64Data, coverImage.fileName, coverImage.mimeType, {
                resource_type: "auto",
                folder: "uploads"
            });

            await chatService.changeChatCoverImage(user.accountId, chatId, url);

            logger.info(`User ${user.accountId} changed group cover in chat ${chatId}`);
            socket.emit("changeGroupCoverSuccess", { chatId, coverImage: url });
            // Optionally, you can emit an event to notify other users in the chat
            io.to(`chat_${chatId}`).emit("groupCoverChanged", { chatId, coverImage: url });
        } catch (error) {
            logger.error(`Error changing group cover: ${error}`);
            socket.emit("changeGroupCoverError", { error: "Failed to change group cover" });
        }
    });
}