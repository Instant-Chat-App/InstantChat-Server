import MessageRepository from "../repository/message.repository";

export class MessageService{
    private messageRepository: MessageRepository;
    constructor() {
        this.messageRepository = new MessageRepository();
    }

    async getUserChatMessages(userId: number, chatId: number) {
        return await this.messageRepository.getUserChatMessages(userId, chatId);
    }
}