import { Chat } from "../entities/chat.entity";
import { BaseRepository } from "./base.repository";
import { Message } from "../entities/message.entity";
import { ChatMember } from "../entities/chat-member.entity";
import { logger } from "../utils/logger";
import { MessageStatus } from "../entities/message-status.entity";
import { ChatType } from "../entities/enum";
import CreateGroupRequest from "../dtos/requests/CreateGroupRequest";
import { User } from "../entities/user.entity";


export default class ChatRepository extends BaseRepository<Chat> {
    constructor() {
        super(Chat);
    }

    async getUserChats(
        userId: number
    ): Promise<Chat[]> {

        const subQuery = this.manager
            .createQueryBuilder(Message, 'message')
            .select('MAX(message.createdAt)', 'maxCreatedAt')
            .where('message.chatId = chat.chatId');

        let queryBuilder = this.manager
            .createQueryBuilder(Chat, 'chat')
            .innerJoin(
                ChatMember,
                'chatMember',
                'chatMember.chat_id = chat.chat_id AND chatMember.member_id = :userId', { userId })
            .leftJoin(
                Message,
                'message',
                `message.chatId = chat.chatId AND message.createdAt = (${subQuery.getQuery()})`
            )
            .leftJoin(
                MessageStatus,
                'messageStatus',
                'messageStatus.messageId = message.messageId AND messageStatus.memberId = :userId', { userId }
            )
            .leftJoin(
                User,
                'user',
                'user.user_id = message.sender_id'
            )
            .select([])
            .addSelect('chat.chat_id', 'chatId')
            .addSelect('chat.chat_name', 'chatName')
            .addSelect('chat.type', 'chatType')
            .addSelect('chat.cover_image', 'coverImage')
            .addSelect('message.message_id', 'messageId')
            .addSelect('user.full_name', 'senderName')
            .addSelect('message.content', 'messageContent')
            .addSelect('message.created_at', 'messageCreatedAt')
            .addSelect('message.sender_id', 'messageSenderId')
            .addSelect('messageStatus.status', 'readStatus')
            .orderBy('message.createdAt', 'DESC');

        const results = await queryBuilder.getRawMany();
        if (!results || results.length === 0) {
            return [];
        }
        return results;
    }

    async findExistingPrivateChat(userId: number, otherUserId: number): Promise<Chat | null> {
        return await this.manager
            .createQueryBuilder(Chat, 'chat')
            .innerJoin(ChatMember, 'chatMember', 'chatMember.chat_id = chat.chat_id')
            .where('chat.type = :type', { type: ChatType.PRIVATE })
            .andWhere('chatMember.member_id IN (:...memberIds)', { memberIds: [userId, otherUserId] })
            .groupBy('chat.chat_id')
            .having('COUNT(DISTINCT chatMember.member_id) = 2')
            .getOne();
    }

    async getChatById(chatId: number): Promise<Chat | null> {
        return await this.manager
            .createQueryBuilder(Chat, 'chat')
            .where('chat.chat_id = :chatId', { chatId })
            .getOne();
    }

    async createChat(chatData: Partial<Chat>): Promise<Chat> {
        const chat = this.manager.create(Chat, chatData);
        return await this.manager.save(chat);
    }

    async createChatMember(memberData: Partial<ChatMember>): Promise<ChatMember> {
        const chatMember = this.manager.create(ChatMember, memberData);
        return await this.manager.save(ChatMember, chatMember);
    }

    async createChatMembers(membersData: Partial<ChatMember>[]): Promise<ChatMember[]> {
        const chatMembers = membersData.map(data => this.manager.create(ChatMember, data));
        return await this.manager.save(ChatMember, chatMembers);
    }

    async getCurrentMember(
        userId: number,
        chatId: number
    ): Promise<ChatMember | null> {
        return await this.manager
            .createQueryBuilder(ChatMember, 'chatMember')
            .where('chatMember.member_id = :userId', { userId })
            .andWhere('chatMember.chat_id = :chatId', { chatId })
            .getOne();
    }

    // Create 1-1 private chat between two users
    async createPrivateChat(
        userId: number,
        otherUserId: number
    ): Promise<Chat | null> {
        return await this.manager.transaction(async transactionalEntityManager => {
            const chat = new Chat();
            chat.type = ChatType.PRIVATE;
            chat.chatName = undefined;
            chat.coverImage = undefined;

            const savedChat = await transactionalEntityManager.save(chat);

            const chatMembers = [
                transactionalEntityManager.create(ChatMember, {
                    chatId: savedChat.chatId,
                    memberId: userId,
                    isOwner: false,
                    joinedAt: new Date()
                }),
                transactionalEntityManager.create(ChatMember, {
                    chatId: savedChat.chatId,
                    memberId: otherUserId,
                    isOwner: false,
                    joinedAt: new Date()
                })
            ];
            await transactionalEntityManager.save(ChatMember, chatMembers);
            return savedChat;
        });
    }

    // Create group chat with multiple members
    async createGroupChat(
        userId: number,
        request: CreateGroupRequest
    ): Promise<Chat> {
        const chat = new Chat();
        chat.type = ChatType.GROUP;
        chat.chatName = request.name;

        const savedChat = await this.manager.save(chat);

        //Create owner chat member
        const ownerMember = this.manager.create(ChatMember, {
            chatId: savedChat.chatId,
            memberId: userId,
            isOwner: true,
            joinedAt: new Date()
        });
        await this.manager.save(ownerMember);

        // Create other members
        for (const memberId of request.members) {
            const chatMember = this.manager.create(ChatMember, {
                chatId: savedChat.chatId,
                memberId: memberId,
                isOwner: false,
                joinedAt: new Date()
            });

            await this.manager.save(chatMember);
        }
        return savedChat;
    }

    // Create channel with multiple members but only owner can message
    async createChatChannel(
        userId: number,
        request: CreateGroupRequest
    ): Promise<Chat> {
        const chat = new Chat();
        chat.type = ChatType.CHANNEL;
        chat.chatName = request.name;

        const savedChat = await this.manager.save(chat);

        const ownerMember = this.manager.create(ChatMember, {
            chatId: savedChat.chatId,
            memberId: userId,
            isOwner: true,
            joinedAt: new Date()
        });
        await this.manager.save(ownerMember);
        for (const memberId of request.members) {
            const chatMember = this.manager.create(ChatMember, {
                chatId: savedChat.chatId,
                memberId: memberId,
                isOwner: false,
                joinedAt: new Date()
            });

            await this.manager.save(chatMember);
        }
        return savedChat;
    }

    async checkIfUserAlreadyInChat(
        userId: number,
        chatId: number
    ): Promise<boolean> {
        const chatMember = await this.manager
            .createQueryBuilder(ChatMember, 'chatMember')
            .where('chatMember.member_id = :userId', { userId })
            .andWhere('chatMember.chat_id = :chatId', { chatId })
            .getOne();

        return !!chatMember;
    }

    async addUserToChat(
        userId: number,
        chatId: number
    ): Promise<ChatMember | null> {
        const newMember = this.manager.create(ChatMember, {
            chatId: chatId,
            memberId: userId,
            isOwner: false,
            joinedAt: new Date()
        });
        return await this.manager.save(ChatMember, newMember);
    }

    async kickUserFromChat(
        ownerId: number,
        userId: number,
        chatId: number
    ): Promise<void> {
        await this.manager.delete(ChatMember, { chatId: chatId, memberId: userId });
    }

    async leaveChat(
        userId: number,
        chatId: number
    ): Promise<void> {
        await this.manager.delete(ChatMember, { chatId: chatId, memberId: userId });
    }

    async deleteChat(
        chatId: number
    ): Promise<void> {
        await this.manager.delete(ChatMember, { chatId: chatId });
        await this.manager.delete(Message, { chatId: chatId });
        await this.manager.delete(MessageStatus, { chatId: chatId });
        await this.manager.delete(Chat, { chatId: chatId });
    }

    async changeChatName(
        chatId: number,
        newName: string
    ): Promise<Chat | null> {
        const chat = await this.getChatById(chatId);
        chat!.chatName = newName;
        return await this.manager.save(chat);
    }

    async changeChatCoverImage(
        chatId: number,
        newCoverImage: string
    ): Promise<Chat | null> {
        const chat = await this.getChatById(chatId);
        chat!.coverImage = newCoverImage;
        return await this.manager.save(chat);
    }

    async getChatMembers(
        chatId: number
    ): Promise<User[]> {
        const users = await this.manager
            .createQueryBuilder(User, "user")
            .innerJoin(ChatMember, "cm", "cm.memberId = user.userId")
            .where("cm.chatId = :chatId", { chatId })
            .getMany();

        return users;
    }

    async findChats(
        userId: number,
        searchTerm: string
    ) {
        return await this.manager
            .createQueryBuilder(Chat, 'chat')
            .innerJoin(ChatMember, 'chatMember', 'chatMember.chat_id = chat.chat_id AND chatMember.member_id = :userId', { userId })
            .innerJoin(User, 'user', 'user.user_id = chatMember.member_id')
            .where('chat.chat_name LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
            .orWhere('user.full_name LIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
            .getMany();
    }
}
