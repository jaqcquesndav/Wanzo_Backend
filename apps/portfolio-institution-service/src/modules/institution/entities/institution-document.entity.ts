import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Institution } from './institution.entity';

export enum DocumentType {
  LICENSE = 'license',
  TAX_CERTIFICATE = 'tax_certificate',
  REGULATORY_APPROVAL = 'regulatory_approval',
  FINANCIAL_STATEMENT = 'financial_statement',
  OTHER = 'other'
}

@Entity('institution_documents')
export class InstitutionDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  institutionId!: string;

  @ManyToOne(() => Institution, institution => institution.documents)
  @JoinColumn({ name: 'institutionId' })
  institution!: Institution;

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
