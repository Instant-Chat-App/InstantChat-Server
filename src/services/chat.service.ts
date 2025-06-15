import { Chat } from "../entities/chat.entity";
import ChatRepository from "../repository/chat.repository";


export class ChatService{
    private chatRepository: ChatRepository;
    constructor() {
        this.chatRepository = new ChatRepository();
    }

    async getUserChats(userId: number) {
        return await this.chatRepository.getUserChats(userId);
    }

    async getCurrentMember(userId: number, chatId: number) {
        return await this.chatRepository.getCurrentMember(userId, chatId);
    }

    async createPrivateChat(userId: number, memberId: number) {
        



    }
}