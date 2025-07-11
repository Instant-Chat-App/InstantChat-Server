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
import { Attachment } from './attachment.entity';
import { MessageReaction } from './message-reaction.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn({ name: 'message_id', type: 'int' })
  messageId!: number;

  @Column({ type: 'int', name: 'chat_id' })
  chatId!: number;

  @Column({ type: 'int', name: 'sender_id' })
  senderId!: number;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ name: 'is_edited', type: 'boolean', default: false })
  isEdited!: boolean;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ type: 'int', name: 'reply_to', nullable: true })
  replyTo?: number;

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
  messageStatus!: MessageStatus[];

  @OneToMany(() => Attachment, attachment => attachment.message)
  attachments!: Attachment[];

  @OneToMany(() => MessageReaction, reaction => reaction.message)
  reactions!: MessageReaction[];
}
