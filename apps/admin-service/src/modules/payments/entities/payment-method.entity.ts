import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  companyId!: string;

  @Column()
  type!: string;

  @Column()
  provider!: string;

  @Column('jsonb')
  details!: {
    [key: string]: string;
  };

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
  userId?: string;
}