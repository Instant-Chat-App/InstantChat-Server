import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Message } from './message.entity';
import { User } from './user.entity';
import { MessageStatusEnum } from './enum';

@Entity('message_status')
export class MessageStatus {
  @PrimaryColumn({ name: 'message_id' })
  messageId!: number;

  @PrimaryColumn({ name: 'member_id' })
  memberId!: number;

  @Column({ type: 'enum', enum: MessageStatusEnum })
  status!: MessageStatusEnum;

  @ManyToOne(() => Message, message => message.messageStatus)
  @JoinColumn({ name: 'message_id' })
  message?: Message;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'member_id' })
  member?: User;
}