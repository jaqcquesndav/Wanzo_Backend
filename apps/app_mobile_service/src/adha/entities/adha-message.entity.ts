import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AdhaConversation } from './adha-conversation.entity';

export enum AdhaMessageSender {
  USER = 'user',
  AI = 'ai',
}

@Entity('adha_messages')
export class AdhaMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  conversationId: string;

  @ManyToOne(() => AdhaConversation, conversation => conversation.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: AdhaConversation;

  @Column({ type: 'text' })
  text: string;

  @Column({ type: 'enum', enum: AdhaMessageSender })
  sender: AdhaMessageSender;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  timestamp: Date;

  @Column({ type: 'jsonb', nullable: true })
  contextInfo?: any; // Store the context sent with the message or used for AI response
}
