import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChatType } from './enum';
import { ChatMember } from './chat-member.entity';
import { Message } from './message.entity';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn({ name: 'chat_id' })
  chatId!: number;

  @Column({ type: 'enum', enum: ChatType })
  type!: ChatType;

  @Column({ name: 'chat_name', nullable: true })
  chatName!: string;

  @Column({ name: 'cover_image', nullable: true })
  coverImage!: string;

  @OneToMany(() => ChatMember, member => member.chat)
  members!: ChatMember[];

  @OneToMany(() => Message, message => message.chat)
  messages!: Message[];
}
