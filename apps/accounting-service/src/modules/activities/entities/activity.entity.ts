import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn()
  timestamp!: Date;

  @Column()
  actionType!: string; // 'create' | 'update' | 'delete' | 'view' | 'login' | 'logout' | 'export' | 'ia_generation'

  @Column()
  entityType!: string; // 'journal-entry' | 'account' | 'fiscal-year' | 'user' | 'report' | 'settings'

  @Column()
  entityId!: string;

  @Column()
  description!: string;

  @Column('uuid')
  userId!: string;

  @Column('jsonb', { nullable: true })
  details?: Record<string, any>; // Additional details about the activity

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;
}