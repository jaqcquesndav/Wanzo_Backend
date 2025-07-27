import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Contract } from './contract.entity';
import { FundingRequest } from './funding-request.entity';

export enum GuaranteeStatus {
  PROPOSED = 'proposed',
  VALIDATED = 'validated',
  REGISTERED = 'registered',
  RELEASED = 'released',
  REJECTED = 'rejected'
}

export enum GuaranteeType {
  REAL_ESTATE = 'real_estate',
  EQUIPMENT = 'equipment',
  VEHICLE = 'vehicle',
  INVENTORY = 'inventory',
  THIRD_PARTY = 'third_party',
  DEPOSIT = 'deposit',
  OTHER = 'other'
}

@Entity('guarantees')
export class Guarantee {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  reference!: string;

  @Column({ nullable: true })
  funding_request_id?: string;

  @ManyToOne(() => FundingRequest, { nullable: true })
  @JoinColumn({ name: 'funding_request_id' })
  funding_request?: FundingRequest;

  @Column({ nullable: true })
  contract_id?: string;

  @ManyToOne(() => Contract, { nullable: true })
  @JoinColumn({ name: 'contract_id' })
  contract?: Contract;

  @Column()
  client_id!: string;

  @Column({
    type: 'enum',
    enum: GuaranteeType
  })
  type!: GuaranteeType;

  @Column()
  description!: string;

  @Column('decimal', { precision: 15, scale: 2 })
  value!: number;

  @Column({ default: 'XOF' })
  currency!: string;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  coverage_percentage?: number;

  @Column({
    type: 'enum',
    enum: GuaranteeStatus,
    default: GuaranteeStatus.PROPOSED
  })
  status!: GuaranteeStatus;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  document_reference?: string;

  @Column('jsonb', { nullable: true })
  document_urls?: string[];

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  verified_by?: string;

  @Column({ nullable: true, type: 'timestamp' })
  verification_date?: Date;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
