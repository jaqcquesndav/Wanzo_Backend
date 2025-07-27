import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Prospect } from './prospect.entity';

export enum AnalysisType {
  FINANCIAL = 'financial',
  MARKET = 'market',
  OPERATIONAL = 'operational',
  RISK = 'risk',
}

export enum AnalysisStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  NEEDS_REVIEW = 'needs_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('prospect_analyses')
export class ProspectAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AnalysisType,
  })
  type: AnalysisType;

  @Column({
    type: 'enum',
    enum: AnalysisStatus,
    default: AnalysisStatus.IN_PROGRESS,
  })
  status: AnalysisStatus;

  @Column('jsonb')
  criteria: any[];

  @Column('decimal', { precision: 5, scale: 2 })
  overallScore: number;

  @Column('text')
  summary: string;

  @Column('simple-array', { nullable: true })
  strengths: string[];

  @Column('simple-array', { nullable: true })
  weaknesses: string[];

  @Column('simple-array', { nullable: true })
  opportunities: string[];

  @Column('simple-array', { nullable: true })
  threats: string[];

  @Column('jsonb', { nullable: true })
  recommendations: any[];

  @Column()
  createdBy: string;

  @Column({ nullable: true })
  reviewedBy: string;

  @ManyToOne(() => Prospect, (prospect: any) => prospect.analyses)
  @JoinColumn({ name: 'prospectId' })
  prospect: Prospect;

  @Column()
  prospectId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
