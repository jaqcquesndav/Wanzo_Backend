import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Chat } from './chat.entity';
import { ChatMessage } from './chat-message.entity';

export enum AttachmentStatus {
  PENDING_UPLOAD = 'pending_upload',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED_FOR_AI = 'processed_for_ai',
  PROCESSING_FAILED = 'processing_failed',
  DELETED = 'deleted',
}

@Entity('chat_attachments')
export class ChatAttachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  chatId!: string;

  @ManyToOne(() => Chat)
  @JoinColumn({ name: 'chatId' })
  chat!: Chat;

  @Column({ nullable: true })
  messageId?: string;

  @ManyToOne(() => ChatMessage, { nullable: true })
  @JoinColumn({ name: 'messageId' })
  message?: ChatMessage;

  @Column()
  companyId!: string; // Added companyId

  @Column()
  fileName!: string;

  @Column('int')
  fileSize!: number;

  @Column()
  mimeType!: string;

  @Column()
  filePath!: string;

  @Column({ nullable: true })
  publicUrl?: string;

  @Column({
    type: 'enum',
    enum: AttachmentStatus,
    default: AttachmentStatus.PENDING_UPLOAD,
  })
  status!: AttachmentStatus;

  @Column()
  uploadedByUserId!: string; // Storing as string ID

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date; // Added processedAt
}
