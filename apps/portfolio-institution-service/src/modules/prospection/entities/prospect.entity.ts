import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ProspectAnalysis } from './prospect-analysis.entity';
import { ProspectDocument } from './prospect-document.entity';

export enum ProspectStatus {
  NEW = 'new',
  IN_ANALYSIS = 'in_analysis',
  QUALIFIED = 'qualified',
  REJECTED = 'rejected',
  CONVERTED = 'converted'
}

export enum CompanySize {
  MICRO = 'micro',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export enum CompanySector {
  AGRICULTURE = 'agriculture',
  MANUFACTURING = 'manufacturing',
  CONSTRUCTION = 'construction',
  RETAIL = 'retail',
  TRANSPORT = 'transport',
  TECHNOLOGY = 'technology',
  SERVICES = 'services',
  OTHER = 'other'
}

@Entity('prospects')
export class Prospect {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  kiotaId!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: CompanySize,
  })
  size!: CompanySize;

  @Column({
    type: 'enum',
    enum: CompanySector,
  })
  sector!: CompanySector;

  @Column()
  rccm!: string;

  @Column()
  idnat!: string;

  @Column()
  nif!: string;

  @Column()
  address!: string;

  @Column()
  phone!: string;

  @Column()
  email!: string;

  @Column()
  website!: string;

  @Column()
  legalRepresentative!: string;

  @Column('decimal', { precision: 15, scale: 2 })
  annualRevenue!: number;

  @Column('integer')
  employeeCount!: number;

  @Column('text')
  description!: string;

  @Column({
    type: 'enum',
    enum: ProspectStatus,
    default: ProspectStatus.NEW
  })
  status!: ProspectStatus;

  @Column('jsonb')
  financialData!: {
    lastAuditDate?: Date;
    auditFirm?: string;
    keyMetrics: {
      currentRatio?: number;
      quickRatio?: number;
      debtToEquity?: number;
      profitMargin?: number;
      assetTurnover?: number;
    };
    historicalPerformance: {
      year: number;
      revenue: number;
      profit: number;
      assets: number;
      liabilities: number;
    }[];
  };

  @Column('jsonb')
  contactHistory!: {
    date: Date;
    type: string;
    notes: string;
    outcome: string;
    nextSteps?: string;
    assignedTo?: string;
  }[];

  @OneToMany(() => ProspectAnalysis, analysis => analysis.prospect)
  analyses!: ProspectAnalysis[];

  @OneToMany(() => ProspectDocument, document => document.prospect)
  documents!: ProspectDocument[];

  @Column('jsonb', { nullable: true })
  consentData?: {
    shareWithAll: boolean;
    targetInstitutionTypes?: string[];
    lastUpdatedBy: string;
    lastUpdatedAt: Date;
  };

  @Column('uuid')
  institutionId!: string;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}