import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, PrimaryColumn } from 'typeorm';
import { Message } from './message.entity';
import { User } from './user.entity';
import { Reaction } from './enum';

@Entity('message_reactions')
export class MessageReaction {
    @PrimaryColumn({ name: 'message_id' })
    messageId!: number;

    @PrimaryColumn({ name: 'user_id' })
    userId!: number;

    @Column({ type: 'enum', enum: Reaction })
    type!: Reaction;

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @ManyToOne(() => Message, message => message.reactions)
    @JoinColumn({ name: 'message_id' })
    message!: Message;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;
}