import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn 
} from 'typeorm';

@Entity('dashboard_widgets')
export class DashboardWidget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  type: string; // 'chart', 'kpi', 'table', 'feed'

  @Column({ type: 'json', nullable: true })
  configuration: Record<string, any>;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('dashboard_configurations')
export class DashboardConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ default: 'default' })
  layoutType: string;

  @Column({ type: 'json', default: {} })
  preferences: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string; // e.g., 'new_subscription', 'login', etc.

  @Column()
  description: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  relatedEntityId: string;

  @Column({ nullable: true })
  relatedEntityType: string;

  @Column({ default: false })
  isHighPriority: boolean;

  @CreateDateColumn()
  timestamp: Date;
}
