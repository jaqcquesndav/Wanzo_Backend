import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export enum CompanySize {
  MICRO = 'micro',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  ENTERPRISE = 'enterprise',
}

export enum CompanySector {
  AGRICULTURE = 'agriculture',
  MANUFACTURING = 'manufacturing',
  TECHNOLOGY = 'technology',
  FINANCE = 'finance',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  RETAIL = 'retail',
  ENERGY = 'energy',
  CONSTRUCTION = 'construction',
  TRANSPORTATION = 'transportation',
  HOSPITALITY = 'hospitality',
  REAL_ESTATE = 'real_estate',
  MEDIA = 'media',
  TELECOM = 'telecom',
  SERVICES = 'services',
  OTHER = 'other',
}

export enum ProspectStatus {
  NEW = 'new',
  IN_ANALYSIS = 'in_analysis',
  QUALIFIED = 'qualified',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost',
}

export enum PortfolioType {
  TRADITIONAL = 'traditional',
  INVESTMENT = 'investment',
  LEASING = 'leasing',
}

@Entity('prospects')
export class Prospect {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: CompanySize,
    default: CompanySize.SMALL,
  })
  size: CompanySize;

  @Column({
    type: 'enum',
    enum: CompanySector,
  })
  sector: CompanySector;

  @Column({ nullable: true })
  rccm: string;

  @Column({ nullable: true })
  idnat: string;

  @Column({ nullable: true })
  nif: string;

  @Column()
  address: string;

  @Column()
  phone: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  website: string;

  @Column()
  legalRepresentative: string;

  @Column('decimal', { precision: 15, scale: 2 })
  annualRevenue: number;

  @Column()
  employeeCount: number;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ProspectStatus,
    default: ProspectStatus.NEW,
  })
  status: ProspectStatus;

  @Column({
    type: 'enum',
    enum: PortfolioType,
    nullable: true,
  })
  portfolioType: PortfolioType;

  @Column('decimal', { precision: 15, scale: 2, nullable: true })
  amount: number;

  @Column('int', { nullable: true })
  probability: number;

  @Column({ nullable: true })
  expectedCloseDate: Date;

  @Column({ nullable: true })
  assignedTo: string;

  @Column('jsonb', { nullable: true })
  financialData: any;

  @OneToMany(() => Document, (document: any) => document.prospect, { cascade: true })
  documents: Document[];

  @OneToMany(() => ContactHistory, (contactHistory: any) => contactHistory.prospect, { cascade: true })
  contactHistory: ContactHistory[];

  @OneToMany(() => ProspectAnalysis, (analysis: any) => analysis.prospect, { cascade: true })
  analyses: ProspectAnalysis[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Import types after the class definition to avoid circular dependencies
import { Document } from './document.entity';
import { ContactHistory } from './contact-history.entity';
import { ProspectAnalysis } from './prospect-analysis.entity';
