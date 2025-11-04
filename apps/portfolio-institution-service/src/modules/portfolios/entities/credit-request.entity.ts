import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { CreditDistribution } from './credit-distribution.entity';

export enum CreditRequestStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  PENDING = 'pending',
  ANALYSIS = 'analysis',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELED = 'canceled',
  DISBURSED = 'disbursed',
  ACTIVE = 'active',
  CLOSED = 'closed',
  DEFAULTED = 'defaulted',
  RESTRUCTURED = 'restructured',
  CONSOLIDATED = 'consolidated',
  IN_LITIGATION = 'in_litigation'
}

export enum Periodicity {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMIANNUAL = 'semiannual',
  ANNUAL = 'annual'
}

export enum ScheduleType {
  CONSTANT = 'constant',
  DEGRESSIVE = 'degressive',
  PROGRESSIVE = 'progressive'
}

@Entity('credit_requests')
export class CreditRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  memberId!: string;

  @Column()
  productId!: string;

  @Column({ type: 'date' })
  receptionDate!: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  requestAmount!: number;

  @Column({
    type: 'enum',
    enum: Periodicity,
    default: Periodicity.MONTHLY
  })
  periodicity!: Periodicity;

  @Column('decimal', { precision: 5, scale: 2 })
  interestRate!: number;

  @Column('text')
  reason!: string;

  @Column({
    type: 'enum',
    enum: ScheduleType,
    default: ScheduleType.CONSTANT
  })
  scheduleType!: ScheduleType;

  @Column('int')
  schedulesCount!: number;

  @Column('int', { default: 0 })
  deferredPaymentsCount!: number;

  @Column('int', { default: 0, nullable: true })
  gracePeriod?: number;

  @Column('text')
  financingPurpose!: string;

  @Column()
  creditManagerId!: string;

  @Column('boolean', { default: false })
  isGroup!: boolean;

  @Column({ nullable: true })
  groupId?: string;

  @Column('text', { nullable: true })
  rejectionReason?: string;

  @Column({
    type: 'enum',
    enum: CreditRequestStatus,
    default: CreditRequestStatus.DRAFT
  })
  status!: CreditRequestStatus;

  // Relation vers le portfolio
  @Column({ nullable: true })
  portfolioId?: string;

  @ManyToOne(() => Portfolio, { nullable: true })
  @JoinColumn({ name: 'portfolioId' })
  portfolio?: Portfolio;

  @OneToMany(() => CreditDistribution, distribution => distribution.creditRequest)
  distributions?: CreditDistribution[];

  @Column({ default: 'XOF' })
  currency!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
