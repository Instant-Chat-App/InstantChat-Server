import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Chat } from './chat.entity';
import { User } from './user.entity';
import { JoinStatus } from './enum';

@Entity('chat_join_requests')
export class ChatJoinRequest {
  @PrimaryGeneratedColumn({ name: 'request_id' })
  requestId!: number;

  @Column({ name: 'chat_id' })
  chatId!: number;

  @Column({ name: 'requester_id' })
  requesterId!: number;

  @Column({ name: 'requested_at', type: 'timestamp' })
  requestedAt!: Date;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy?: number;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'enum', enum: JoinStatus })
  status!: JoinStatus;

  @ManyToOne(() => Chat)
  @JoinColumn({ name: 'chat_id' })
  chat!: Chat;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requester_id' })
  requester!: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approver!: User;
}