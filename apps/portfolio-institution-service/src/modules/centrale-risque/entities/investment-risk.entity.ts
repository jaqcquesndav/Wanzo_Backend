import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('investment_risks')
export class InvestmentRisk {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 36 })
  @Index()
  companyId: string;

  @Column({ length: 255 })
  companyName: string;

  @Column({ length: 100 })
  sector: string;

  @Column({ length: 255 })
  institution: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  investmentAmount: number;

  @Column({ length: 50 })
  investmentType: string;

  @Column({ length: 50 })
  status: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  expectedReturn: number;

  @Column({ length: 36, nullable: true })
  institutionId: string;

  @Column({ length: 255, nullable: true })
  investmentDescription: string;

  @Column({ type: 'int' })
  riskScore: number;

  @Column({ length: 36, nullable: true })
  createdBy: string;

  @Column({ length: 36, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUpdated: Date;
}
