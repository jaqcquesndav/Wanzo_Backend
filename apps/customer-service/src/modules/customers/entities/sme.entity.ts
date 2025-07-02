import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Customer } from './customer.entity';

/**
 * Entité SME - Données spécifiques pour les PME
 */
@Entity('sme')
export class Sme {
  @PrimaryColumn()
  customerId!: string;

  @OneToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column()
  registrationNumber!: string;

  @Column({ nullable: true })
  taxIdentificationNumber!: string;

  @Column()
  legalForm!: string;

  @Column()
  foundingDate!: Date;

  @Column({ default: 0 })
  numberOfEmployees!: number;

  @Column({ nullable: true })
  annualRevenue!: number;

  @Column({ nullable: true })
  industry!: string;

  @Column({ nullable: true })
  subIndustry!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ nullable: true })
  website!: string;

  @Column({ type: 'jsonb', default: {} })
  additionalDetails!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
