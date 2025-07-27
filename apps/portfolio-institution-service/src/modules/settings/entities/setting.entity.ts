import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum SettingCategory {
  GENERAL = 'general',
  SECURITY = 'security',
  NOTIFICATIONS = 'notifications',
  INTEGRATION = 'integration',
  SYSTEM = 'system'
}

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  key!: string;

  @Column({
    type: 'enum',
    enum: SettingCategory,
    default: SettingCategory.GENERAL
  })
  category!: SettingCategory;

  @Column('jsonb')
  value!: any;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isPublic!: boolean;

  @Column({ default: false })
  isSystem!: boolean;

  @Column({ nullable: true })
  institutionId?: string;

  @Column({ nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}