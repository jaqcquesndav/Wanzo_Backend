import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn 
} from 'typeorm';

// Dashboard widget entity
@Entity('dashboard_widgets')
export class DashboardWidget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  type: string; // 'chart', 'kpi', 'table', 'feed'

  @Column({ type: 'jsonb', nullable: true })
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

// Dashboard configuration entity
@Entity('dashboard_configurations')
export class DashboardConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ default: 'default' })
  layoutType: string;

  @Column({ type: 'jsonb', default: {} })
  preferences: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  layout: Array<{
    widgetId: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  widgets: Array<{
    id: string;
    type: string;
    settings: Record<string, any>;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Activity log entity
@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  userName: string;

  @Column()
  action: string; // 'login', 'subscription_purchase', etc.

  @Column({ type: 'jsonb', nullable: true })
  details: Record<string, any>;

  @Column({ nullable: true })
  relatedEntityId: string;

  @Column({ nullable: true })
  relatedEntityType: string;

  @Column({ default: false })
  isHighPriority: boolean;

  @CreateDateColumn()
  timestamp: Date;
}

// System health metrics entity
@Entity('system_metrics')
export class SystemMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('float')
  cpuUsage: number;

  @Column('float')
  memoryUsage: number;

  @Column('float')
  diskUsage: number;

  @Column('int')
  uptime: number;

  @Column('int')
  activeConnections: number;

  @Column('float')
  responseTime: number;

  @Column({ type: 'jsonb', nullable: true })
  databaseMetrics: {
    postgresql?: {
      connectionPoolSize: number;
      activeConnections: number;
      queryPerformance: number;
      storageUsage: number;
    };
    neo4j?: {
      activeConnections: number;
      queryPerformance: number;
      storageUsage: number;
    };
    timescale?: {
      activeConnections: number;
      compressionRatio: number;
      retentionPeriod: number;
      storageUsage: number;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  apiMetrics: {
    totalRequests: number;
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
    requestsByEndpoint?: Record<string, number>;
  };

  @CreateDateColumn()
  timestamp: Date;
}

// Revenue statistics entity
@Entity('revenue_statistics')
export class RevenueStatistics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('float')
  currentMonthRevenue: number;

  @Column('float')
  previousMonthRevenue: number;

  @Column('float')
  yearToDateRevenue: number;

  @Column('float')
  projectedAnnualRevenue: number;

  @Column({ type: 'jsonb', nullable: true })
  revenueBySubscriptionTier: Record<string, number>;

  @Column({ type: 'jsonb', nullable: true })
  revenueByCountry: Record<string, number>;

  @Column({ type: 'jsonb', nullable: true })
  monthlyTrend: Array<{
    month: string;
    amount: number;
  }>;

  @CreateDateColumn()
  timestamp: Date;
}

// Token statistics entity
@Entity('token_statistics')
export class TokenStatistics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  totalTokensIssued: number;

  @Column('int')
  tokensInCirculation: number;

  @Column('int')
  averageMonthlyConsumption: number;

  @Column({ type: 'jsonb', nullable: true })
  consumptionByService: Record<string, number>;

  @Column({ type: 'jsonb', nullable: true })
  consumptionTrend: Array<{
    date: string;
    count: number;
  }>;

  @CreateDateColumn()
  timestamp: Date;
}

// User statistics entity
@Entity('user_statistics')
export class UserStatistics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('int')
  totalUsers: number;

  @Column('int')
  activeUsers: number;

  @Column('int')
  newUsersToday: number;

  @Column({ type: 'jsonb', nullable: true })
  usersByRole: Record<string, number>;

  @Column({ type: 'jsonb', nullable: true })
  usersByCountry: Record<string, number>;

  @Column({ type: 'jsonb', nullable: true })
  userGrowth: Array<{
    date: string;
    count: number;
  }>;

  @CreateDateColumn()
  timestamp: Date;
}
