import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Institution } from '../../institution/entities/institution.entity';
import { Disbursement } from '../../virements/entities/disbursement.entity';

export enum PaymentOrderType {
  DISBURSEMENT = 'disbursement',
  TRANSFER = 'transfer',
  REFUND = 'refund',
  FEE = 'fee',
  OTHER = 'other',
}

export enum PaymentOrderStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Entity('payment_orders')
export class PaymentOrder {
  @ApiProperty({ description: 'Unique identifier for the payment order' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Type of payment order', enum: PaymentOrderType })
  @Column({
    type: 'enum',
    enum: PaymentOrderType,
    default: PaymentOrderType.TRANSFER,
  })
  type: PaymentOrderType;

  @ApiProperty({ description: 'Payment amount' })
  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;

  @ApiProperty({ description: 'Payment currency', default: 'XOF' })
  @Column({ default: 'XOF' })
  currency: string;

  @ApiProperty({ description: 'Current status of the payment order', enum: PaymentOrderStatus })
  @Column({
    type: 'enum',
    enum: PaymentOrderStatus,
    default: PaymentOrderStatus.PENDING,
  })
  status: PaymentOrderStatus;

  @ApiProperty({ description: 'Due date for the payment' })
  @Column({ type: 'date', nullable: true })
  dueDate: Date | null;

  @ApiProperty({ description: 'Description of the payment order' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Beneficiary information' })
  @Column({ type: 'json', nullable: true })
  beneficiary: {
    name: string;
    accountNumber?: string;
    bankCode?: string;
    iban?: string;
    address?: string;
  };

  @ApiProperty({ description: 'Reference number for the payment' })
  @Column({ unique: true })
  reference: string;

  @ApiProperty({ description: 'Institution ID' })
  @Column()
  institutionId: string;

  @ManyToOne(() => Institution)
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  @ApiProperty({ description: 'Related portfolio ID', required: false })
  @Column({ nullable: true })
  portfolioId: string;

  @ApiProperty({ description: 'Related contract reference', required: false })
  @Column({ nullable: true })
  contractReference: string;

  @ApiProperty({ description: 'Additional metadata' })
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Disbursement, disbursement => disbursement.paymentOrder)
  disbursements: Disbursement[];

  @ApiProperty({ description: 'Created date' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Updated date' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ApiProperty({ description: 'Created by user ID' })
  @Column()
  createdBy: string;

  @ApiProperty({ description: 'Last modified by user ID' })
  @Column({ nullable: true })
  modifiedBy: string;
}