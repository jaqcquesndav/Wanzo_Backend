import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Location } from './location.entity';

export enum LegalForm {
  SARL = 'SARL',
  SA = 'SA',
  SURL = 'SURL',
  SNC = 'SNC',
  SCS = 'SCS',
  COOP = 'COOP',
  EI = 'EI'
}

export enum LocationType {
  HEADQUARTERS = 'headquarters',
  SITE = 'site',
  STORE = 'store'
}

@Entity('company')
export class Company {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ name: 'rccm_number' })
  rccmNumber: string;

  @Column({ name: 'national_id' })
  nationalId: string;

  @Column({ name: 'tax_number' })
  taxNumber: string;

  @Column({ name: 'cnss_number', nullable: true })
  cnssNumber?: string;

  @Column({ nullable: true })
  logo?: string;

  @Column({
    type: 'enum',
    enum: LegalForm,
    nullable: true,
    name: 'legal_form'
  })
  legalForm?: LegalForm;

  @Column({ nullable: true, name: 'business_sector' })
  businessSector?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column('jsonb')
  address: {
    street: string;
    city: string;
    province: string;
    commune: string;
    quartier: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };

  @OneToMany(() => Location, location => location.company, {
    cascade: true,
    eager: true
  })
  locations: Location[];

  @Column('jsonb')
  documents: {
    rccmFile?: string;
    nationalIdFile?: string;
    taxNumberFile?: string;
    cnssFile?: string;
  };

  @Column({ name: 'contact_email' })
  contactEmail: string;

  @Column('simple-array', { name: 'contact_phone' })
  contactPhone: string[];

  @Column({ name: 'representative_name' })
  representativeName: string;

  @Column({ name: 'representative_role' })
  representativeRole: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
