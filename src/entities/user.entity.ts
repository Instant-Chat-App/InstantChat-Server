import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Gender } from './enum';
import { Account } from './account.entity';

@Entity('users')
export class User {
  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ name: 'full_name', nullable: true })
  fullName!: string;

  @Column({ nullable: true })
  email!: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ type: 'date', nullable: true })
  dob?: Date;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender!: Gender;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @OneToOne(() => Account, account => account.user)
  account!: Account;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'contacts',
    joinColumn: { name: 'user_id' },
    inverseJoinColumn: { name: 'contact_id' }
  })
  contacts?: User[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'user_blocked',
    joinColumn: { name: 'blocker_id' },
    inverseJoinColumn: { name: 'blocked_id' }
  })
  blockedUsers?: User[];
}