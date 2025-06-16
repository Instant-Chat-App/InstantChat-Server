import MessageRepository from "../repository/message.repository";

export class MessageService{
    private messageRepository: MessageRepository;
    constructor() {
        this.messageRepository = new MessageRepository();
    }

    // Retrieves messages for a specific user in a chat
    async getUserChatMessages(userId: number, chatId: number) {
        return await this.messageRepository.getUserChatMessages(userId, chatId);
    }
    
    async sendMessage(userId: number, chatId: number, content: string, attachments: any[] = []) {
        return null;
    }
    
}