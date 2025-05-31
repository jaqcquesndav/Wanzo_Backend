import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Prospect } from './prospect.entity';

export enum DocumentType {
  FINANCIAL_STATEMENT = 'financial_statement',
  TAX_RETURN = 'tax_return',
  BUSINESS_PLAN = 'business_plan',
  MARKET_STUDY = 'market_study',
  LEGAL_DOCUMENT = 'legal_document',
  OTHER = 'other'
}

@Entity('prospect_documents')
export class ProspectDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  prospectId!: string;

  @ManyToOne(() => Prospect, prospect => prospect.documents)
  @JoinColumn({ name: 'prospectId' })
  prospect!: Prospect;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
  })
  type!: DocumentType;

  @Column()
  cloudinaryUrl!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  validUntil?: Date;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, any>;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}