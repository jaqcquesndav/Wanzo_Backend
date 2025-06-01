import { User } from "../../users/entities";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum ChatSessionStatus {
  ACTIVE = 'active',
  CLOSED = 'closed',
}

export enum ChatPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

@Entity('chat_sessions')
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  subject?: string;

  @Column({ type: 'enum', enum: ChatSessionStatus, default: ChatSessionStatus.ACTIVE })
  status: ChatSessionStatus;

  @Column({ type: 'enum', enum: ChatPriority, default: ChatPriority.MEDIUM })
  priority: ChatPriority;

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endedAt?: Date;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  agentId?: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'agentId' })
  agent?: User;

  @OneToMany(() => ChatMessage, (message) => message.session)
  messages: ChatMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export enum ChatMessageSender {
  USER = 'user',
  SUPPORT = 'support',
}

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ type: 'enum', enum: ChatMessageSender })
  sender: ChatMessageSender;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  timestamp: Date;

  @Column()
  sessionId: string;

  @ManyToOne(() => ChatSession, (session) => session.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: ChatSession;

  @OneToMany(() => ChatAttachment, (attachment) => attachment.message, { cascade: true, nullable: true })
  attachments?: ChatAttachment[];

}

@Entity('chat_attachments')
export class ChatAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  url: string;

  @Column()
  type: string; // e.g., 'image/jpeg', 'application/pdf'

  @Column()
  name: string;

  @Column('bigint')
  size: number; // in bytes

  @Column()
  messageId: string;

  @ManyToOne(() => ChatMessage, (message) => message.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: ChatMessage;

  @CreateDateColumn()
  createdAt: Date;
}
