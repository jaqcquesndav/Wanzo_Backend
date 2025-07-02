import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Entité SmeSpecificData - Données spécifiques aux PME
 */
@Entity('sme_specific_data')
export class SmeSpecificData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  registrationNumber!: string;

  @Column()
  taxId!: string;

  @Column()
  legalForm!: string;

  @Column()
  sector!: string;

  @Column({ nullable: true })
  yearFounded!: number;

  @Column({ nullable: true })
  employeeCount!: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  annualRevenue!: number;

  @Column({ nullable: true })
  websiteUrl!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({ type: 'jsonb', nullable: true })
  financialData!: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  contactPersons!: Array<{
    name: string;
    position: string;
    email: string;
    phone: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  socialMedia!: Record<string, string>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
