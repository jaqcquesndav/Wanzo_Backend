import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Workflow } from './workflow.entity';

export enum OperationType {
  CREDIT = 'credit',
  LEASING = 'leasing',
  EMISSION = 'emission',
  SUBSCRIPTION = 'subscription'
}

export enum OperationStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

@Entity('operations')
export class Operation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  kiotaId!: string;

  @Column({
    type: 'enum',
    enum: OperationType,
  })
  type!: OperationType;

  @Column({
    type: 'enum',
    enum: OperationStatus,
    default: OperationStatus.PENDING
  })
  status!: OperationStatus;

  @Column('uuid')
  portfolioId!: string;

  @Column('uuid', { nullable: true })
  productId?: string;

  @Column('uuid', { nullable: true })
  equipmentId?: string;

  @Column()
  dateEmission!: Date;

  @Column('decimal', { precision: 10, scale: 2 })
  rateOrYield!: number;

  @Column('integer')
  quantity!: number;

  @Column('integer')
  duration!: number;

  @Column('text')
  description!: string;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  requestedAmount?: number;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  initialPayment?: number;

  @Column('jsonb', { nullable: true })
  attachments?: {
    fileName: string;
    cloudinaryUrl: string;
    description?: string;
  }[];

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @OneToOne(() => Workflow, workflow => workflow.operation, {
    cascade: true,
    eager: true
  })
  @JoinColumn()
  workflow!: Workflow;

  @Column({ nullable: true })
  companyId?: string;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}