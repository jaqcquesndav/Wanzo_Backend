
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';

// Enums from documentation
export enum LogLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum AiModelType {
  TEXT = 'text',
  IMAGE = 'image',
  VOICE = 'voice',
  EMBEDDING = 'embedding',
  OTHER = 'other',
}

// Entities based on documentation

@Entity('system_logs')
export class SystemLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'enum', enum: LogLevel })
  level: LogLevel;

  @Column()
  service: string;

  @Column('text')
  message: string;

  @Column('jsonb', { nullable: true })
  details?: Record<string, any>;

  @Column({ nullable: true })
  correlationId?: string;

  @Column({ nullable: true })
  userId?: string;

  @Column({ nullable: true })
  ipAddress?: string;
}

@Entity('system_alerts')
export class SystemAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ type: 'enum', enum: AlertLevel })
  level: AlertLevel;

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column()
  service: string;

  @Column({ default: false })
  isResolved: boolean;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @Column({ nullable: true })
  resolvedBy?: string;

  @Column('text', { nullable: true })
  resolutionNotes?: string;
}

@Entity('ai_model_configs')
export class AiModelConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  provider: string;

  @Column({ type: 'enum', enum: AiModelType })
  type: AiModelType;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', nullable: true })
  tokensPerRequest: number;

  @Column('decimal', { precision: 10, scale: 8, nullable: true })
  costPerToken: number;

  @Column({ type: 'int', nullable: true })
  maxTokens: number;

  @Column('float', { nullable: true })
  temperature: number;

  @Column({ nullable: true })
  apiEndpoint?: string;

  @Column({ nullable: true })
  apiVersion?: string;
}

@Entity('system_maintenance')
export class SystemMaintenance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ default: false })
    inMaintenance: boolean;

    @Column({ type: 'timestamp', nullable: true })
    estimatedEndTime: Date | null;

    @Column('text', { nullable: true })
    message: string | null;

    @Column({ nullable: true })
    enabledBy: string;

    @Column({ type: 'timestamp', nullable: true })
    enabledAt: Date;
}
