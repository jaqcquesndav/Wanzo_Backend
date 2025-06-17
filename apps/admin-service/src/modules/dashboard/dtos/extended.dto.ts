import { ApiProperty } from '@nestjs/swagger';
import { KpiDto, ChartDataDto, ActivityDto, QuickStatsDto } from './dashboard.dto';

// Main dashboard data
export class MainDashboardDto {
  @ApiProperty({ description: 'Total number of customers' })
  totalCustomers: number;

  @ApiProperty({ description: 'Total number of SMEs' })
  totalSmes: number;

  @ApiProperty({ description: 'Total number of institutions' })
  totalInstitutions: number;

  @ApiProperty({ description: 'Number of active users' })
  activeUsers: number;

  @ApiProperty({ description: 'Number of pending validations' })
  pendingValidations: number;
}

// KPIs data
export class KpisDto {
  @ApiProperty({ description: 'Customer growth percentage' })
  customerGrowth: number;

  @ApiProperty({ description: 'Revenue growth percentage' })
  revenueGrowth: number;

  @ApiProperty({ description: 'Customer satisfaction rate percentage' })
  satisfactionRate: number;

  @ApiProperty({ description: 'Average response time in hours' })
  averageResponseTime: number;
}

// Financial summary
export class FinancialSummaryDto {
  @ApiProperty({ description: 'Total revenue amount' })
  totalRevenue: number;

  @ApiProperty({ description: 'Total expenses amount' })
  totalExpenses: number;

  @ApiProperty({ description: 'Net profit amount' })
  netProfit: number;

  @ApiProperty({ description: 'List of last transactions' })
  lastTransactions: {
    id: string;
    date: Date | string;
    description: string;
    amount: number;
  }[];
}

// Recent activity
export class RecentActivityDto {
  @ApiProperty({ description: 'Activity ID' })
  id: string;

  @ApiProperty({ description: 'Activity date' })
  date: Date | string;

  @ApiProperty({ description: 'User who performed the action' })
  user: string;

  @ApiProperty({ description: 'Action performed' })
  action: string;
}

// User statistics
export class UserStatisticDto {
  @ApiProperty({ description: 'Total number of users' })
  totalUsers: number;

  @ApiProperty({ description: 'Number of active users' })
  activeUsers: number;

  @ApiProperty({ description: 'Number of inactive users' })
  inactiveUsers: number;

  @ApiProperty({ description: 'Distribution of user roles' })
  userRolesDistribution: {
    admins: number;
    managers: number;
    operators: number;
  };
}

// System health
export class SystemHealthDto {
  @ApiProperty({ description: 'CPU usage percentage' })
  cpuUsage: number;

  @ApiProperty({ description: 'Memory usage percentage' })
  memoryUsage: number;

  @ApiProperty({ description: 'Database connection status' })
  databaseStatus: string;

  @ApiProperty({ description: 'API response time in milliseconds' })
  apiResponseTime: number;
}

// Notification
export class NotificationDto {
  @ApiProperty({ description: 'Notification ID' })
  id: string;

  @ApiProperty({ description: 'Notification message' })
  message: string;

  @ApiProperty({ description: 'Notification date' })
  date: Date | string;

  @ApiProperty({ description: 'Whether the notification has been read' })
  read: boolean;
}
