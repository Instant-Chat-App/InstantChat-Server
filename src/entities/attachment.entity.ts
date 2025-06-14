import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Message } from './message.entity';
import { AttachType } from './enum';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn({ name: 'attachment_id' })
  attachmentId!: number;

  @Column({ name: 'message_id' })
  messageId!: number;

  @Column()
  url!: string;

  @Column({ type: 'enum', enum: AttachType })
  type!: AttachType;

  @ManyToOne(() => Message)
  @JoinColumn({ name: 'message_id' })
  message?: Message;
} 