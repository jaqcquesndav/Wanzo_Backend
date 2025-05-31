import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('data_sharing_history')
export class DataSharingHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  configId!: string;

  @Column()
  action!: string;

  @Column('jsonb', { nullable: true })
  previousState?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  newState?: Record<string, any>;

  @Column({ nullable: true })
  performedBy?: string;

  @CreateDateColumn()
  performedAt!: Date;
}