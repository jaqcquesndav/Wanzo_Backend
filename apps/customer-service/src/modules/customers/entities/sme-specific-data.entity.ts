import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Entité SmeSpecificData - Données spécifiques aux PME (entreprises)
 */
@Entity('sme_specific_data')
export class SmeSpecificData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ nullable: true })
  legalForm!: string;

  @Column({ nullable: true })
  industry!: string;

  @Column({ nullable: true })
  size!: string;

  @Column({ nullable: true })
  rccm!: string;

  @Column({ nullable: true })
  taxId!: string;

  @Column({ nullable: true })
  natId!: string;

  @Column({ type: 'jsonb', nullable: true })
  activities?: {
    primary?: string;
    secondary?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  capital?: {
    isApplicable?: boolean;
    amount?: number;
    currency?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  financials?: {
    revenue?: number;
    netIncome?: number;
    totalAssets?: number;
    equity?: number;
  };

  @Column({ type: 'jsonb', nullable: true })
  affiliations?: {
    cnss?: string;
    inpp?: string;
    onem?: string;
    intraCoop?: string;
    interCoop?: string;
    partners?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  address?: {
    street?: string;
    commune?: string;
    city?: string;
    province?: string;
    country?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  contacts?: {
    email?: string;
    phone?: string;
    altPhone?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  owner?: {
    id?: string;
    name?: string;
    gender?: string;
    email?: string;
    phone?: string;
    cv?: string;
    hasOtherJob?: boolean;
    linkedin?: string;
    facebook?: string;
    cvUrl?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  associates?: Array<{
    id?: string;
    name?: string;
    gender?: string;
    role?: string;
    shares?: number;
    email?: string;
    phone?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  locations?: Array<{
    id?: string;
    name: string;
    type: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }>;

  @Column({ nullable: true })
  yearFounded!: number;

  @Column({ nullable: true })
  employeeCount!: number;

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
