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
  @PrimaryGeneratedColumn({ name: 'account_id', type: 'int' })
  accountId!: number;

  @Column({ type: 'varchar', unique: true, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', nullable: false, select: false })
  password?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToOne(() => User)
  @JoinColumn({ name: 'account_id' })
  user!: User;
}