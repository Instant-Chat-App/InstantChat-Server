import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Message } from './message.entity';
import { User } from './user.entity';
import { MessageStatusEnum } from './enum';

@Entity('message_status')
export class MessageStatus {
  @PrimaryColumn({ type: 'int', name: 'message_id' })
  messageId!: number;

  @PrimaryColumn({ type: 'int', name: 'member_id' })
  memberId!: number;

  @Column({ type: 'enum', enum: MessageStatusEnum, nullable: false })
  status!: MessageStatusEnum;

  @ManyToOne(() => Message, message => message.messageStatus, { nullable: false })
  @JoinColumn({ name: 'message_id' })
  message!: Message;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'member_id' })
  member!: User;
}