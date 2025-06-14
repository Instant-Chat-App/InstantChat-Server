import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Chat } from './chat.entity';
import { User } from './user.entity';
import { MessageStatus } from './message-status.entity';
import { Reaction } from './enum';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn({ name: 'message_id' })
  messageId!: number;

  @Column({ name: 'chat_id' })
  chatId!: number;

  @Column({ name: 'sender_id' })
  senderId!: number;

  @Column({ type: 'text' })
  content?: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ name: 'is_edited' })
  isEdited?: boolean;

  @Column({ name: 'is_deleted' })
  isDeleted?: boolean;

  @Column({ name: 'reply_to', nullable: true })
  replyTo?: number;

  @Column({ name: 'is_pin', type: 'boolean', default: false })
  isPin!: boolean;

  @ManyToOne(() => Chat, chat => chat.messages)
  @JoinColumn({ name: 'chat_id' })
  chat!: Chat;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender!: User;

  @ManyToOne(() => Message)
  @JoinColumn({ name: 'reply_to' })
  replyToMessage?: Message;

  @OneToMany(() => MessageStatus, status => status.message)
  messageStatus?: MessageStatus[];
}
