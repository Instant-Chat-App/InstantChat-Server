import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Chat } from './chat.entity';
import { User } from './user.entity';

@Entity('chat_members')
export class ChatMember {
  @PrimaryColumn({ type: 'int', name: 'chat_id' })
  chatId!: number;

  @PrimaryColumn({ type: 'int', name: 'member_id' })
  memberId!: number;

  @Column({ type: 'boolean', name: 'is_owner' })
  isOwner!: boolean;

  @Column({ type: 'date', name: 'joined_at', default: () => 'CURRENT_DATE' })
  joinedAt!: Date;

  @ManyToOne(() => Chat, chat => chat.members)
  @JoinColumn({ name: 'chat_id' })
  chat!: Chat;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'member_id' })
  member!: User;
}
