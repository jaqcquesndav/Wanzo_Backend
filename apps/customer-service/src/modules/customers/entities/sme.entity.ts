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

  @Column({ nullable: true })
  name!: string;

  @Column({ nullable: true })
  logoUrl!: string;

  @Column({ nullable: true })
  registrationNumber!: string;

  @Column({ nullable: true })
  taxIdentificationNumber!: string;

  @Column({ nullable: true })
  nationalId!: string;

  @Column({ nullable: true })
  legalForm!: string;

  @Column({ nullable: true })
  foundingDate!: Date;

  @Column({ default: 0 })
  numberOfEmployees!: number;

  @Column({ nullable: true })
  annualRevenue!: number;

  @Column({ nullable: true })
  industry!: string;

  @Column({ nullable: true })
  size!: string;

  @Column({ nullable: true })
  subIndustry!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ nullable: true })
  website!: string;

  @Column({ nullable: true })
  facebookPage!: string;

  @Column({ type: 'jsonb', default: {} })
  additionalDetails!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
