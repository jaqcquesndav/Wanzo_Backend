import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

export enum FileEntityType {
  JOURNAL_ENTRY = 'journal-entry',
  ACCOUNT = 'account',
  COMPANY = 'company',
  FISCAL_YEAR = 'fiscal-year',
  OTHER = 'other',
}

export enum FileCategory {
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  STATEMENT = 'statement',
  CONTRACT = 'contract',
  OTHER = 'other',
}

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  originalName!: string;

  @Column()
  mimeType!: string;

  @Column('bigint')
  size!: number;

  @Column()
  url!: string;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @CreateDateColumn()
  uploadedAt!: Date;

  @Index()
  @Column({ type: 'enum', enum: FileEntityType, nullable: true })
  entityType?: FileEntityType;

  @Index()
  @Column({ nullable: true })
  entityId?: string;

  @Column({ type: 'enum', enum: FileCategory, nullable: true })
  category?: FileCategory;

  @Column('text', { nullable: true })
  description?: string;

  @Index()
  @Column()
  companyId!: string;

  @Column()
  uploadedBy!: string;
}
