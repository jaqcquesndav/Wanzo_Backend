import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Customer } from './customer.entity';

/**
 * Entité SME - Données spécifiques pour les PME
 * Alignée avec l'interface CompanyResponse du frontend
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

  @Column({ nullable: true, name: 'logo_url' })
  logoUrl!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ nullable: true })
  website!: string;
  
  @Column({ nullable: true })
  facebookPage!: string;

  // Legal & Tax Identifiers
  @Column({ nullable: true })
  rccm!: string; // Registre de Commerce et du Crédit Mobilier
  
  @Column({ nullable: true })
  taxId!: string; // Numéro d'impôt
  
  @Column({ nullable: true })
  natId!: string; // ID National
  
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
  
  // Structure JSON pour l'adresse
  @Column({ type: 'jsonb', nullable: true })
  address!: {
    street?: string;
    commune?: string;
    city?: string;
    province?: string;
    country?: string;
  };
  
  // Structure JSON pour les contacts
  @Column({ type: 'jsonb', nullable: true })
  contacts!: {
    email?: string;
    phone?: string;
    altPhone?: string;
  };
  
  // Structure JSON pour le propriétaire
  @Column({ type: 'jsonb', nullable: true })
  owner!: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    cv?: string;
  };
  
  // Structure JSON pour les activités
  @Column({ type: 'jsonb', nullable: true })
  activities!: {
    primary?: string;
    secondary?: string[];
  };
  
  // Structure JSON pour le capital
  @Column({ type: 'jsonb', nullable: true })
  capital!: {
    isApplicable?: boolean;
    amount?: number;
    currency?: string;
  };
  
  // Structure JSON pour les données financières
  @Column({ type: 'jsonb', nullable: true })
  financials!: {
    revenue?: number;
    netIncome?: number;
    totalAssets?: number;
    equity?: number;
  };
  
  // Structure JSON pour les affiliations
  @Column({ type: 'jsonb', nullable: true })
  affiliations!: {
    cnss?: string;
    inpp?: string;
    onem?: string;
    intraCoop?: string;
    interCoop?: string;
    partners?: string[];
  };
  
  // Structure JSON pour les associés
  @Column({ type: 'jsonb', nullable: true })
  associates!: Array<{
    id?: string;
    name?: string;
    gender?: string;
    role?: string;
    shares?: number;
    email?: string;
    phone?: string;
  }>;
  
  // Stockage des emplacements au format JSON
  @Column('jsonb', { nullable: true })
  locations!: Array<{
    id: string;
    name: string;
    type: string;
    address?: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  }>;
  
  // Autres métadonnées
  @Column({ type: 'jsonb', default: {} })
  additionalDetails!: Record<string, any>;
  
  // Relations avec d'autres modules
  @Column({ type: 'jsonb', nullable: true })
  subscription?: {
    plan?: {
      name?: string;
    };
    status?: string;
    currentPeriodEnd?: Date;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
  
  @Column({ nullable: true })
  createdBy?: string;
}
