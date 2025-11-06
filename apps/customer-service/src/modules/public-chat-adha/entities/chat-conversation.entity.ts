import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ChatMessage } from './chat-message.entity';

export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

/**
 * Entité pour les conversations de chat Adha
 */
@Entity('chat_conversations')
export class ChatConversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  title?: string;

  @Column({
    type: 'enum',
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE
  })
  status!: ConversationStatus;

  @Column({ nullable: true })
  modelId?: string;

  @Column({ nullable: true })
  modelName?: string;

  @Column('jsonb', { nullable: true })
  metadata?: {
    lastActivity?: string;
    messageCount?: number;
    tags?: string[];
    context?: Record<string, any>;
  };

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt?: Date;

  @OneToMany(() => ChatMessage, (message: ChatMessage) => message.conversation)
  messages!: ChatMessage[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}