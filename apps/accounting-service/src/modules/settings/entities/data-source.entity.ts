import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum DataSourceType {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}

export enum DataSourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('data_sources')
export class DataSource {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  companyId!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: DataSourceType,
  })
  type!: DataSourceType;

  @Column({
    type: 'enum',
    enum: DataSourceStatus,
    default: DataSourceStatus.ACTIVE
  })
  status!: DataSourceStatus;

  @Column({ nullable: true })
  lastUpdated?: Date;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
