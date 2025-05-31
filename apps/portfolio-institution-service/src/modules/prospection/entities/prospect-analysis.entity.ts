import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Prospect } from './prospect.entity';

export enum AnalysisType {
  FINANCIAL = 'financial',
  MARKET = 'market',
  OPERATIONAL = 'operational',
  RISK = 'risk'
}

export enum AnalysisStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

@Entity('prospect_analyses')
export class ProspectAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  prospectId!: string;

  @ManyToOne(() => Prospect, prospect => prospect.analyses)
  @JoinColumn({ name: 'prospectId' })
  prospect!: Prospect;

  @Column({
    type: 'enum',
    enum: AnalysisType,
  })
  type!: AnalysisType;

  @Column({
    type: 'enum',
    enum: AnalysisStatus,
    default: AnalysisStatus.IN_PROGRESS
  })
  status!: AnalysisStatus;

  @Column('jsonb')
  criteria!: {
    category: string;
    weight: number;
    score: number;
    notes: string;
  }[];

  @Column('decimal', { precision: 5, scale: 2 })
  overallScore!: number;

  @Column('text')
  summary!: string;

  @Column('text', { array: true })
  strengths!: string[];

  @Column('text', { array: true })
  weaknesses!: string[];

  @Column('text', { array: true })
  opportunities!: string[];

  @Column('text', { array: true })
  threats!: string[];

  @Column('jsonb')
  recommendations!: {
    category: string;
    description: string;
    priority: string;
    timeline: string;
  }[];

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, any>;

  @Column({ nullable: true })
  analyzedBy?: string;

  @Column({ nullable: true })
  reviewedBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}