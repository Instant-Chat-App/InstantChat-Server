import { Socket, Server } from 'socket.io';
import MessageController from '../../controllers/message.controller';
import { logger } from '../../utils/logger';
import { uploadFromBuffer } from '../../services/upload.service';
import { MessageService } from '../../services/message.service';

const messageService = new MessageService();

interface MessageEvent {
    senderId: number;
    chatId: number;
    content: string;
    attachments?: {
        fileName: string;
        mimeType: string;
        buffer: ArrayBuffer;
    }[];
}

export function handleMessageEvents(socket: Socket, io: Server) {
    socket.on("joinChat", (chatId: number) => {
        const user = socket.data.user;
        if (!user) {
            return socket.emit("joinError", { error: "User not authenticated" });
        }

        const isMember = messageService.checkMemberInChat(user.accountId, chatId);
        if (!isMember) {
            logger.warn(`User ${user.accountId} is not a member of chat ${chatId}`);
            return socket.emit("joinError", { error: "You are not a member of this chat" });
        }

        socket.join(`chat_${chatId}`);
        logger.info(`Client ${socket.id} joined chat: ${chatId}`);
        socket.emit("joinSuccess", { chatId });
    });

    socket.on("sendMessage", async (message: MessageEvent) => {
        try{
            logger.info(`Received message from user ${message.senderId} in chat ${message.chatId}`);
            const uploadedFiles: Partial<Express.Multer.File>[] = [];

            if (message.attachments && message.attachments.length > 0) {
                for (const attachment of message.attachments) {
                    const buffer = Buffer.from(attachment.buffer);
                    const fileName = `${Date.now()}_${attachment.fileName}`;
                    
                    const url = await uploadFromBuffer(buffer, fileName, {
                        resource_type: "auto",
                        folder: "uploads"
                    });
                    uploadedFiles.push({
                        path: url,
                        mimetype: attachment.mimeType,
                        originalname: attachment.fileName,
                        filename: fileName,
                        size: buffer.length,
                    });
                }
            }   

            await messageService.sendMessage(
                message.senderId,
                message.chatId,
                message.content,
                uploadedFiles as Express.Multer.File[]
            );
            logger.info(`Message sent successfully from user ${message.senderId} in chat ${message.chatId}`);
        }catch (error) {
            logger.error(`Error sending message: ${error}`);
            socket.emit("messageError", { error: "Failed to send message" });
            return;
        }
    });
}