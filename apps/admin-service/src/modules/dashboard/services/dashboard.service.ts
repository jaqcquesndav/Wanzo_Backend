
import { Injectable } from '@nestjs/common';
import { MainDashboardDto, KpisDto, FinancialSummaryDto, RecentActivityDto, UserStatisticDto, SystemHealthDto, NotificationDto } from '../dtos';

@Injectable()
export class DashboardService {
  async getMainDashboardData(companyId: string): Promise<MainDashboardDto> {
    // Mock data, replace with actual data from your database
    return {
      totalCustomers: 1500,
      totalSmes: 800,
      totalInstitutions: 50,
      activeUsers: 1200,
      pendingValidations: 25,
    };
  }

  async getKpis(companyId: string): Promise<KpisDto> {
    // Mock data
    return {
      customerGrowth: 15,
      revenueGrowth: 12,
      satisfactionRate: 95,
      averageResponseTime: 24,
    };
  }

  async getFinancialSummary(companyId: string): Promise<FinancialSummaryDto> {
    // Mock data
    return {
      totalRevenue: 500000,
      totalExpenses: 350000,
      netProfit: 150000,
      lastTransactions: [
        { id: '1', date: new Date(), description: 'Transaction 1', amount: 1000 },
        { id: '2', date: new Date(), description: 'Transaction 2', amount: -500 },
      ],
    };
  }

  async getRecentActivities(companyId: string): Promise<RecentActivityDto[]> {
    // Mock data
    return [
      { id: '1', date: new Date(), user: 'Admin User', action: 'Created a new customer' },
      { id: '2', date: new Date(), user: 'Manager User', action: 'Validated a document' },
    ];
  }

  async getUserStatistics(companyId: string): Promise<UserStatisticDto> {
    // Mock data
    return {
      totalUsers: 200,
      activeUsers: 180,
      inactiveUsers: 20,
      userRolesDistribution: {
        admins: 5,
        managers: 20,
        operators: 175,
      },
    };
  }

  async getSystemHealth(): Promise<SystemHealthDto> {
    // Mock data
    return {
      cpuUsage: 45,
      memoryUsage: 60,
      databaseStatus: 'Connected',
      apiResponseTime: 120,
    };
  }

  async getNotifications(userId: string): Promise<NotificationDto[]> {
    // Mock data
    return [
      { id: '1', message: 'New document to validate', date: new Date(), read: false },
      { id: '2', message: 'Customer account created', date: new Date(), read: true },
    ];
  }
}
