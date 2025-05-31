import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  companyId!: string;

  @Column()
  plan!: string;

  @Column('jsonb')
  monthlyPrice!: {
    usd: number;
    cdf: number;
  };

  @Column('jsonb')
  yearlyPrice!: {
    usd: number;
    cdf: number;
  };

  @Column()
  status!: string;

  @Column('jsonb')
  applications!: {
    name: string;
    access: string;
  }[];

  @Column('jsonb')
  tokens!: {
    remaining: number;
    used: number;
  };

  @Column()
  validUntil!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}