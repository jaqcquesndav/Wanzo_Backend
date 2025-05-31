import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column('uuid')
  companyId!: string;

  @Column('jsonb')
  amount!: {
    usd: number;
    cdf: number;
  };

  @Column()
  methodId!: string;

  @Column()
  description!: string;

  @Column({ nullable: true })
  invoiceId!: string;

  @Column()
  status!: string;

  @Column('jsonb')
  method!: {
    id: string;
    type: string;
    provider: string;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}