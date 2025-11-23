import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Chat } from './chat.entity';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

// Type pour l'attachment dans les messages
export interface MessageAttachment {
  name: string;
  type: string;
  content: string; // base64
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

  @Column('text')
  content!: string;

  @Column('int', { default: 0 })
  tokensUsed!: number;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, any>;

  @Column({ nullable: true })
  source?: string;

  // Champs pour la compatibilité avec l'API frontend
  @Column('int', { default: 0 })
  likes!: number;

  @Column('int', { default: 0 })
  dislikes!: number;

  @Column('boolean', { default: false })
  isEditing!: boolean;

  @CreateDateColumn()
  timestamp!: Date;

  // Getter pour l'attachment depuis metadata
  get attachment(): MessageAttachment | undefined {
    return this.metadata?.attachment;
  }

  // Setter pour l'attachment dans metadata
  set attachment(attachment: MessageAttachment | undefined) {
    if (!this.metadata) {
      this.metadata = {};
    }
    this.metadata.attachment = attachment;
  }

  // Getter pour le sender (compatibilité API frontend)
  get sender(): string {
    return this.role === MessageRole.USER ? 'user' : 'bot';
  }
}
