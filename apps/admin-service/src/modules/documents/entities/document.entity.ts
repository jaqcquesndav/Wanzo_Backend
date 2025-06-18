import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { DocumentFolder } from './document-folder.entity';

export enum DocumentStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

export enum DocumentType {
  RCCM = 'rccm',
  NATIONAL_ID = 'nationalId',
  TAX_NUMBER = 'taxNumber'
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  companyId: string;

  @Column({
    type: 'enum',
    enum: DocumentType
  })
  type: DocumentType;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column()
  mimeType: string;

  @Column('bigint')
  fileSize: number; // in bytes

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.PENDING
  })
  status: DocumentStatus;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ nullable: true })
  verifiedBy?: string;

  @Column({ nullable: true, type: 'timestamp' })
  verifiedAt?: Date;

  @Column({ nullable: true })
  folderId: string;

  @ManyToOne(() => DocumentFolder, folder => folder.documents, { nullable: true })
  @JoinColumn({ name: 'folderId' })
  folder: DocumentFolder;
}
