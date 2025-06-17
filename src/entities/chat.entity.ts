import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChatType } from './enum';
import { ChatMember } from './chat-member.entity';
import { Message } from './message.entity';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn({ name: 'chat_id', type: 'int' })
  chatId!: number;

  @Column({ type: 'enum', enum: ChatType, nullable: false })
  type!: ChatType;

  @Column({ type: 'varchar', name: 'chat_name', nullable: true })
  chatName?: string;

  @Column({ type: 'varchar', name: 'cover_image', nullable: true })
  coverImage?: string;

  @Column({ type: 'text', name: 'description', nullable: true })
  description?: string;

  @OneToMany(() => ChatMember, member => member.chat)
  members!: ChatMember[];

  @OneToMany(() => Message, message => message.chat)
  messages!: Message[];
}
