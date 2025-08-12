import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Customer } from './customer.entity';

/**
 * Types d'institutions financières alignés avec le frontend
 */
export enum InstitutionType {
  BANQUE = 'BANQUE',
  MICROFINANCE = 'MICROFINANCE',
  COOPEC = 'COOPEC',
  FOND_GARANTIE = 'FOND_GARANTIE',
  ENTREPRISE_FINANCIERE = 'ENTREPRISE_FINANCIERE',
  FOND_CAPITAL_INVESTISSEMENT = 'FOND_CAPITAL_INVESTISSEMENT',
  FOND_IMPACT = 'FOND_IMPACT',
  AUTRE = 'AUTRE',
}

/**
 * Types de secteurs alignés avec le frontend
 */
export enum SectorType {
  PRIVE = 'PRIVE',
  PUBLIC = 'PUBLIC',
  PUBLIC_PRIVE = 'PUBLIC_PRIVE',
}

/**
 * Entité Institution - Données spécifiques pour les institutions financières
 * Alignée avec l'interface FinancialInstitution du frontend
 */
@Entity('institutions')
export class Institution {
  @PrimaryColumn()
  customerId!: string;

  @OneToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;
  
  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: InstitutionType,
    default: InstitutionType.AUTRE
  })
  type!: InstitutionType;
  
  @Column({
    type: 'enum',
    enum: SectorType,
    nullable: true
  })
  sector?: SectorType;

  // Informations réglementaires
  @Column({ nullable: true, name: 'approval_number' })
  approvalNumber?: string;
  
  @Column({ nullable: true })
  taxId?: string;
  
  @Column({ nullable: true })
  natId?: string;
  
  @Column({ nullable: true })
  rccm?: string;

  // Détails de l'institution
  @Column({ nullable: true })
  legalForm?: string;
  
  @Column({ nullable: true })
  creationDate?: Date;
  
  @Column({ nullable: true })
  website?: string;
  
  @Column({ nullable: true, name: 'logo_url' })
  logo?: string;
  
  // Capital et activités
  @Column('jsonb', { nullable: true })
  capital?: {
    amount: number;
    currency: 'USD' | 'CDF' | 'EUR';
  };
  
  @Column({ nullable: true })
  primaryActivity?: string;
  
  @Column('simple-array', { nullable: true })
  secondaryActivities?: string[];

  // Adresses et contacts
  @Column('jsonb', { nullable: true })
  headquartersAddress?: {
    street?: string;
    city?: string;
    province?: string;
    country?: string;
    postalCode?: string;
  };
  
  @Column('jsonb', { nullable: true })
  branches?: Array<{
    street?: string;
    city?: string;
    province?: string;
    country?: string;
    postalCode?: string;
  }>;
  
  @Column('jsonb', { nullable: true })
  locations?: Array<{
    id: string;
    name: string;
    type: 'headquarters' | 'branch' | 'store' | 'warehouse' | 'factory' | 'other';
    address?: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  }>;
  
  @Column('jsonb', { nullable: true })
  contactPerson?: {
    name?: string;
    email?: string;
    phone?: string;
    position?: string;
  };

  @Column({ type: 'jsonb', default: {} })
  additionalDetails!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
