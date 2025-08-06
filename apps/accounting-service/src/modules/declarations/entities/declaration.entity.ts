import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DeclarationType, DeclarationStatus, Periodicity } from '../dtos/declaration.dto';

@Entity('declarations')
export class Declaration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: DeclarationType
  })
  type: DeclarationType;

  @Column()
  period: string; // ISO date format (YYYY-MM-DD)

  @Column({
    type: 'enum',
    enum: Periodicity
  })
  periodicity: Periodicity;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: DeclarationStatus,
    default: DeclarationStatus.DRAFT
  })
  status: DeclarationStatus;

  @Column('decimal', { precision: 20, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 20, scale: 2, nullable: true })
  additionalFees?: number;

  @Column('decimal', { precision: 20, scale: 2, nullable: true })
  penalties?: number;

  @Column({ nullable: true })
  submittedAt?: Date;

  @Column({ nullable: true })
  submittedBy?: string;

  @Column({ nullable: true })
  reference?: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: any[];

  @Column({ nullable: true })
  justificationDocument?: string;

  @Column({ nullable: true })
  declarationForm?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  validatedAt?: Date;

  @Column({ nullable: true })
  validatedBy?: string;

  @Column({ nullable: true })
  rejectedAt?: Date;
  
  @Column({ nullable: true })
  rejectionReason?: string;

  @Column()
  companyId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
