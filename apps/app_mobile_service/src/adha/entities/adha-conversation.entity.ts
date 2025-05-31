import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { AdhaMessage } from './adha-message.entity';

@Entity('adha_conversations')
export class AdhaConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ nullable: true })
  title?: string;

  @OneToMany(() => AdhaMessage, message => message.conversation, { cascade: true })
  messages: AdhaMessage[];

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastMessageTimestamp?: Date;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
