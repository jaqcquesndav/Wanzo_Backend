import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Entity to store analytics configuration for different entities in the system
 */
@Entity('analytics_config')
export class AnalyticsConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'entity_id' })
  entityId!: string;

  @Column({ name: 'entity_type' })
  entityType!: string;

  @Column({ name: 'data_sharing_enabled', default: false })
  dataSharingEnabled!: boolean;

  @Column({ name: 'data_sharing_scope', type: 'json', nullable: true })
  dataSharingScope: any;

  @Column({ nullable: true })
  description!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
