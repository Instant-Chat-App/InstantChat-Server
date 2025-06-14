import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn({ name: 'account_id' })
  accountId!: number;

  @Column({ unique: true, nullable: true })
  phone!: string;

  @Column({ nullable: true })
  password!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToOne(() => User)
  @JoinColumn({ name: 'account_id' })
  user!: User;
}