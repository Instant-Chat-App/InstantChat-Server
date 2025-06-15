import {
  Entity,
  Column,
  OneToOne,
  ManyToMany,
  JoinTable,
  PrimaryColumn,
} from 'typeorm';
import { Gender } from './enum';
import { Account } from './account.entity';

@Entity('users')
export class User {
  @PrimaryColumn({ name: 'user_id', type: 'int' })
  userId!: number;

  @Column({ type: 'varchar', name: 'first_name', nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', name: 'last_name', nullable: true })
  lastName?: string;

  @Column({ type: 'varchar', nullable: true })
  email?: string;

  @Column({ type: 'varchar', nullable: true })
  avatar?: string;

  @Column({ type: 'date', nullable: true })
  dob?: Date;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender?: Gender;

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