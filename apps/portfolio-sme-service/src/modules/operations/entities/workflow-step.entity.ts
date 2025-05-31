import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Workflow } from './workflow.entity';

export enum StepType {
  APPROVAL = 'approval',
  EXTERNAL_VALIDATION = 'external_validation',
  SYSTEM_CHECK = 'system_check',
  DOCUMENT_UPLOAD = 'document_upload',
  MANAGER_VALIDATION = 'manager_validation'
}

export enum StepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
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

  @Column('text', { nullable: true })
  description?: string;

  @Column()
  assignedTo!: string;

  @Column()
  externalApp!: string;

  @Column({ default: false })
  requiresValidationToken!: boolean;

  @Column('jsonb', { nullable: true })
  files?: {
    name: string;
    cloudinaryUrl: string;
    type: string;
  }[];

  @Column('jsonb', { nullable: true })
  evaluationCriteria?: Record<string, any>;

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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}