import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { DocumentFolder } from './document-folder.entity'; // Import DocumentFolder

export enum DocumentStatus {
  DRAFT = 'draft',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  VERIFIED = 'verified',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export enum DocumentType {
  INVOICE = 'invoice',
  CONTRACT = 'contract',
  RECEIPT = 'receipt',
  REPORT = 'report',
  FORM = 'form',
  LEGAL = 'legal',
  OTHER = 'other'
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.OTHER
  })
  type: DocumentType;

  @Column({ type: 'bigint' })
  size: number; // in bytes

  @Column()
  url: string;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.UPLOADED
  })
  status: DocumentStatus;

  @Column()
  uploadedBy: string;

  @Column('simple-json', { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  folderId: string;

  @ManyToOne(() => DocumentFolder, folder => folder.documents, { nullable: true })
  @JoinColumn({ name: 'folderId' })
  folder: DocumentFolder;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ nullable: true })
  thumbnail: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ nullable: true })
  expiresAt: Date;
}
