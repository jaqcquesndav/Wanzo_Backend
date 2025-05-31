import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity()
export class TimeseriesData {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('timestamp with time zone')
  @Index()
  timestamp!: Date;

  @Column('jsonb')
  data!: Record<string, any>;

  @Column({ length: 50 })
  @Index()
  metricType!: string;

  @Column({ length: 50 })
  @Index()
  sourceService!: string;

  @Column('uuid')
  @Index()
  entityId!: string;
}