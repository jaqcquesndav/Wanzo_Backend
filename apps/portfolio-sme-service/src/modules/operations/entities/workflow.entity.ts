import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { Operation } from './operation.entity';
import { WorkflowStep } from './workflow-step.entity';

export enum WorkflowType {
  VALIDATION = 'validation',
  APPROVAL = 'approval',
  REVIEW = 'review'
}

export enum WorkflowStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: WorkflowType,
  })
  type!: WorkflowType;

  @Column({
    type: 'enum',
    enum: WorkflowStatus,
    default: WorkflowStatus.PENDING
  })
  status!: WorkflowStatus;

  @Column('uuid')
  currentStepId!: string;

  @OneToOne(() => Operation, operation => operation.workflow)
  operation!: Operation;

  @OneToMany(() => WorkflowStep, step => step.workflow, {
    cascade: true,
    eager: true
  })
  steps!: WorkflowStep[];

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}