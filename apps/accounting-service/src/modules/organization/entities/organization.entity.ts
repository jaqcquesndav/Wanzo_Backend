import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AccountingMode {
  SYSCOHADA = 'SYSCOHADA',
  IFRS = 'IFRS',
}

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  registrationNumber?: string;

  @Column({ nullable: true })
  taxId?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  country?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ nullable: true })
  legalForm?: string;

  @Column({ nullable: true })
  capital?: string;

  @Column({ default: 'CDF' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: AccountingMode,
    default: AccountingMode.SYSCOHADA
  })
  accountingMode!: AccountingMode;

  @Column({ nullable: true })
  logo?: string;

  @Column({ nullable: true })
  industry?: string;

  @Column({ nullable: true })
  description?: string;

  @Column('jsonb', { nullable: true })
  productsAndServices?: {
    products: Array<{
      name: string;
      description: string;
      category: string;
    }>;
    services: Array<{
      name: string;
      description: string;
      category: string;
    }>;
  };

  @Column('jsonb', { nullable: true })
  businessHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };

  @Column('jsonb', { nullable: true })
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  
  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
