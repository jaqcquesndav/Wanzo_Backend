import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from './company.entity';

export enum MeetingType {
  PHYSICAL = 'physical',
  VIRTUAL = 'virtual'
}

export enum MeetingStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

@Entity('meetings')
export class Meeting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  company_id!: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company!: Company;

  @Column()
  portfolio_manager_id!: string;

  @Column({ type: 'date' })
  meeting_date!: Date;

  @Column({ type: 'time' })
  meeting_time!: string;

  @Column({
    type: 'enum',
    enum: MeetingType
  })
  meeting_type!: MeetingType;

  @Column({
    type: 'enum',
    enum: MeetingStatus,
    default: MeetingStatus.SCHEDULED
  })
  status!: MeetingStatus;

  @Column({ nullable: true })
  location?: string;

  @Column('text', { nullable: true })
  notes?: string;

  @Column()
  institution_id!: string;

  @Column({ nullable: true })
  created_by?: string;

  @CreateDateColumn()
  created_at!: Date;
}