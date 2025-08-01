import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Chat } from './chat.entity';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export enum MessageDirection {
  OUTGOING = 'outgoing',  // De l'utilisateur vers l'assistant
  INCOMING = 'incoming'   // De l'assistant vers l'utilisateur
}

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  chatId!: string;

  @ManyToOne(() => Chat, chat => chat.messages)
  @JoinColumn({ name: 'chatId' })
  chat!: Chat;

  @Column({
    type: 'enum',
    enum: MessageRole,
  })
  role!: MessageRole;
  
  @Column({
    type: 'enum',
    enum: MessageDirection,
    default: MessageDirection.OUTGOING
  })
  direction!: MessageDirection;
  
  @Column({ nullable: true })
  contentType?: string;

  @Column('text')
  content!: string;

  @Column('int', { default: 0 })
  likes!: number;

  @Column('int', { default: 0 })
  dislikes!: number;

  @Column('int', { default: 0 })
  tokensUsed!: number;

  @Column('jsonb', { nullable: true })
  attachment?: {
    name: string;
    type: string;
    content: string;
  };

  @Column({ default: false })
  error!: boolean;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, any>;

  @Column({ nullable: true })
  source?: string;

  @CreateDateColumn()
  timestamp!: Date;
}
