import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('company_engagements')
export class CompanyEngagement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 36 })
  @Index()
  companyId: string;

  @Column({ length: 255 })
  companyName: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  totalEngagement: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  creditEngagement: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  leasingEngagement: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  investmentEngagement: number;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  otherEngagement: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  globalRiskScore: number;

  @Column({ length: 36, nullable: true })
  institutionId: string;

  @Column({ length: 255, nullable: true })
  institution: string;

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
