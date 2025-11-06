import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ChatConversation } from './chat-conversation.entity';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  ERROR = 'error'
}

/**
 * Entité pour les messages de chat Adha
 */
@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  conversationId!: string;

  @Column()
  content!: string;

  @Column({
    type: 'enum',
    enum: MessageRole
  })
  role!: MessageRole;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.PENDING
  })
  status!: MessageStatus;

  @Column({ nullable: true })
  requestId?: string;

  @Column('jsonb', { nullable: true })
  metadata?: {
    tokens?: number;
    processingTime?: number;
    model?: string;
    temperature?: number;
    contextInfo?: Record<string, any>;
  };

  @Column('jsonb', { nullable: true })
  feedback?: {
    likes?: number;
    dislikes?: number;
    rating?: number;
    comments?: string[];
  };

  @ManyToOne(() => ChatConversation, conversation => conversation.messages)
  @JoinColumn({ name: 'conversationId' })
  conversation!: ChatConversation;

  @CreateDateColumn()
  createdAt!: Date;
}