import { MessageService } from "../services/message.service";


export default class MessageController {
    private messageService: MessageService;

    constructor() {
        this.messageService = new MessageService();
    }

    async getUserChatMessages(userId: number, chatId: number) {
        return await this.messageService.getUserChatMessages(userId, chatId);
    }
}