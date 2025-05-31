import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column('uuid',{ nullable: true })
  companyId?: string;

  @Column()
  action!: string;

  @Column()
  description!: string;

  @Column('jsonb', { nullable: true })
  metadata!: Record<string, any>;

  @Column({ nullable: true })
  ipAddress!: string;

  @Column({ nullable: true })
  userAgent!: string;

  @CreateDateColumn()
  timestamp!: Date;
}