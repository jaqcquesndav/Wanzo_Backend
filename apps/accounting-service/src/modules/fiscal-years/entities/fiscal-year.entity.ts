import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum FiscalYearStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

@Entity('fiscal_years')
export class FiscalYear {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  code!: string;

  @Column()
  startDate!: Date;

  @Column()
  endDate!: Date;

  @Column({
    type: 'enum',
    enum: FiscalYearStatus,
    default: FiscalYearStatus.OPEN
  })
  status!: FiscalYearStatus;

  @Column('jsonb', { nullable: true })
  auditStatus?: {
    isAudited: boolean;
    auditor: {
      name: string;
      registrationNumber: string;
    };
    auditedAt: string;
  };

  @Column({ nullable: true })
  companyId?: string;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
