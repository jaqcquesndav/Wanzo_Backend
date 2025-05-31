import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Workflow } from './workflow.entity';

export enum StepType {
  APPROVAL = 'approval',
  COMMITTEE_REVIEW = 'committee_review',
  EXTERNAL_VALIDATION = 'external_validation',
  DOCUMENT_UPLOAD = 'document_upload',
  SYSTEM_CHECK = 'system_check',
  MANAGER_VALIDATION = 'manager_validation'
}

export enum StepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  SKIPPED = 'skipped'
}

@Entity('workflow_steps')
export class WorkflowStep {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: StepType,
  })
  stepType!: StepType;

  @Column()
  label!: string;

  @Column('text')
  description!: string;

  @Column()
  assignedTo!: string;

  @Column({ nullable: true })
  externalApp?: string;

  @Column({ default: false })
  requireValidationToken!: boolean;

  @Column('jsonb', { nullable: true })
  files?: {
    name: string;
    cloudinaryUrl: string;
    type: string;
    validUntil?: Date;
  }[];

  @Column('jsonb', { nullable: true })
  evaluationCriteria?: string[];

  @Column({
    type: 'enum',
    enum: StepStatus,
    default: StepStatus.PENDING
  })
  status!: StepStatus;

  @Column('uuid')
  workflowId!: string;

  @ManyToOne(() => Workflow, workflow => workflow.steps)
  @JoinColumn({ name: 'workflowId' })
  workflow!: Workflow;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column({ nullable: true })
  validationToken?: string;

  @Column({ nullable: true })
  validationTokenExpires?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}