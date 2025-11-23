import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum IdentityDocumentType {
  NATIONAL_ID = 'national_id',
  PASSPORT = 'passport',
  DRIVER_LICENSE = 'driver_license',
  RESIDENCE_PERMIT = 'residence_permit',
  OTHER = 'other'
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

/**
 * Entité IdentityDocument - Documents d'identité utilisateur
 */
@Entity('identity_documents')
export class IdentityDocument {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column({
    type: 'enum',
    enum: IdentityDocumentType,
    default: IdentityDocumentType.NATIONAL_ID
  })
  type!: IdentityDocumentType;

  @Column()
  number!: string;

  @Column({ nullable: true })
  issuedDate?: Date;

  @Column({ nullable: true })
  expiryDate?: Date;

  @Column({ nullable: true })
  issuingAuthority?: string;

  @Column({ nullable: true })
  documentUrl?: string;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING
  })
  status!: VerificationStatus;

  @Column({ nullable: true })
  verifiedAt?: Date;

  @Column({ nullable: true })
  verifiedBy?: string;

  @Column({ nullable: true })
  rejectionReason?: string;

  @Column('jsonb', { nullable: true })
  metadata?: {
    confidence?: number;
    documentQuality?: string;
    faceMatch?: boolean;
    dataConsistency?: boolean;
    extractedData?: Record<string, any>;
  };

  @ManyToOne(() => User, user => user.identityDocuments)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}