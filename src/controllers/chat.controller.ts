import { ChatService } from "../services/chat.service";


export default class ChatController {
    private chatService: ChatService;

    constructor() {
        this.chatService = new ChatService();
    }

    async getUserChats(req: any, res: any) {
        try {
            const userId = Number(req.params.userId);
            const chats = await this.chatService.getUserChats(userId);
            res.status(200).json(chats);
        } catch (error) {
            console.error("Error fetching user chats:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
    async getCurrentMember(req: any, res: any) {
        try {
            const userId = Number(req.params.userId);
            const chatId = Number(req.params.chatId);
            const member = await this.chatService.getCurrentMember(userId, chatId);
            res.status(200).json(member);
        } catch (error) {
            console.error("Error fetching current member:", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}