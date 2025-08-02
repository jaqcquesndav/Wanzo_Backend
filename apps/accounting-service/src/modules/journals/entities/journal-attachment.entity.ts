import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Journal } from './journal.entity';

export enum AttachmentStatus {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  UPLOADED = 'uploaded',
  ERROR = 'error'
}

@Entity('journal_attachments')
export class JournalAttachment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  url?: string;

  @Column({ nullable: true })
  localUrl?: string;

  @Column({
    type: 'enum',
    enum: AttachmentStatus,
    default: AttachmentStatus.PENDING
  })
  status!: AttachmentStatus;

  @Column({ nullable: true })
  fileSize?: number;

  @Column({ nullable: true })
  mimeType?: string;

  @Column()
  journalId!: string;

  @ManyToOne(() => Journal, journal => journal.attachments)
  @JoinColumn({ name: 'journalId' })
  journal!: Journal;

  @Column({ nullable: true })
  uploadedBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
