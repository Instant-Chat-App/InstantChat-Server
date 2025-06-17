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

    async getUserChats(userId: number): Promise<Chat[]> {
        // Subquery lấy tin nhắn mới nhất trong mỗi chat
        const latestMsgSubquery = this.manager
            .createQueryBuilder(Message, 'm')
            .select('m.message_id')
            .where('m.chat_id = chat.chat_id')
            .orderBy('m.created_at', 'DESC')
            .limit(1);

        const raw = await this.manager
            .createQueryBuilder(Chat, 'chat')
            // lọc ra các chat mà người dùng là thành viên
            .innerJoin(
                ChatMember,
                'cm',
                'cm.chat_id = chat.chat_id AND cm.member_id = :userId',
                { userId }
            )
            // lấy ra các chat có tin nhắn mới nhất
            .leftJoin(
                Message,
                'message',
                `message.message_id = (${latestMsgSubquery.getQuery()})`
            )
            .setParameters(latestMsgSubquery.getParameters())
            // lấy status của tin nhắn
            .leftJoin(
                MessageStatus,
                'ms',
                'ms.message_id = message.message_id AND ms.member_id = :userId',
                { userId }
            )
            // in4 người gửi
            .leftJoin(
                User,
                'sender',
                'sender.user_id = message.sender_id'
            )
            // lấy in4 private chat
            .leftJoin(
                ChatMember,
                'pm',
                `pm.chat_id = chat.chat_id AND pm.member_id != :userId AND chat.type = 'PRIVATE'`,
                { userId }
            )
            .leftJoin(
                User,
                'partner',
                'partner.user_id = pm.member_id'
            )
            .select([
                'chat.chat_id AS "chatId"',
                'chat.type    AS "chatType"',
                'chat.description AS "chatDescription"',
                `CASE
                    WHEN chat.type = 'PRIVATE' AND partner.full_name IS NOT NULL
                    THEN partner.full_name
                ELSE chat.chat_name
                END AS "displayName"`,
                `CASE
                    WHEN chat.type = 'PRIVATE' AND partner.avatar IS NOT NULL
                    THEN partner.avatar
                ELSE chat.cover_image
                END AS "displayAvatar"`,
                'message.message_id    AS "messageId"',
                'sender.full_name      AS "senderName"',
                'message.content       AS "messageContent"',
                'message.created_at    AS "messageCreatedAt"',
                'message.sender_id     AS "messageSenderId"',
                'ms.status             AS "readStatus"'
            ])
            .orderBy('message.created_at', 'DESC');

        const results = await raw.getRawMany();
        return results || [];
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
            chat.description = undefined;
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
        chat.description = request.description || '';

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
        chat.description = request.description || '';

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
            isOwner: false
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
