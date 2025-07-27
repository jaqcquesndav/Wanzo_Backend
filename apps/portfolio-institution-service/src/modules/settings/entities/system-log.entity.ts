import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum LogLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

@Entity('system_logs')
export class SystemLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: LogLevel,
    default: LogLevel.INFO
  })
  level!: LogLevel;

  @Column()
  service!: string;

  @Column()
  message!: string;

  @Column('jsonb', { nullable: true })
  details?: any;

  @Column({ nullable: true })
  institutionId?: string;

  @Column({ nullable: true })
  userId?: string;

  @CreateDateColumn()
  timestamp!: Date;
}
