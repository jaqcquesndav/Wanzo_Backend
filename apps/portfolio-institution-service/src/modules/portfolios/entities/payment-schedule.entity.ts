import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Contract } from './contract.entity';

export enum PaymentScheduleStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  LATE = 'late',
  DEFAULTED = 'defaulted'
}

@Entity('payment_schedules')
export class PaymentSchedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  contract_id!: string;
  
  @ManyToOne(() => Contract, contract => contract.payment_schedules)
  @JoinColumn({ name: 'contract_id' })
  contract!: Contract;

  @Column({ type: 'date' })
  due_date!: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  principal_amount!: number;

  @Column('decimal', { precision: 15, scale: 2 })
  interest_amount!: number;

  @Column('decimal', { precision: 15, scale: 2 })
  total_amount!: number;

  @Column({
    type: 'enum',
    enum: PaymentScheduleStatus,
    default: PaymentScheduleStatus.PENDING
  })
  status!: PaymentScheduleStatus;

  @Column({ nullable: true })
  payment_date?: Date;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  paid_amount?: number;
  
  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  remaining_amount?: number;

  @Column({ nullable: true })
  payment_id?: string;

  @Column({ nullable: true })
  late_fee_amount?: number;

  @Column()
  installment_number!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
