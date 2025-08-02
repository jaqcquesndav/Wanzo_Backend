
import { Injectable } from '@nestjs/common';
import { 
  MainDashboardDto, 
  KpisDto, 
  FinancialSummaryDto, 
  RecentActivityDto, 
  UserStatisticDto, 
  SystemHealthDto, 
  NotificationDto,
  DashboardCompleteDataDto,
  DashboardConfigurationDto,
  UpdateDashboardConfigurationDto,
  WidgetResponseDto,
  DashboardQueryParamsDto
} from '../dtos';

@Injectable()
export class DashboardService {
  async getMainDashboardData(companyId: string, queryParams?: DashboardQueryParamsDto): Promise<DashboardCompleteDataDto> {
    // Mock data according to documentation structure
    return {
      userStatistics: {
        totalUsers: 1500,
        activeUsers: 1250,
        newUsersToday: 12,
        usersByRole: {
          super_admin: 5,
          cto: 2,
          growth_finance: 8,
          customer_support: 15,
          content_manager: 10,
          company_admin: 120,
          company_user: 1340
        },
        usersByCountry: {
          RDC: 850,
          Rwanda: 240,
          Kenya: 150,
          France: 120,
          Other: 140
        },
        userGrowth: [
          { date: "2025-05-01", count: 1420 },
          { date: "2025-05-08", count: 1450 },
          { date: "2025-05-15", count: 1475 },
          { date: "2025-05-22", count: 1490 },
          { date: "2025-05-29", count: 1500 }
        ]
      },
      systemMetrics: {
        serverHealth: {
          cpuUsage: 32.5,
          memoryUsage: 60.2,
          diskUsage: 45.0,
          uptime: 1209600,
          activeConnections: 85,
          responseTime: 120
        },
        databaseMetrics: {
          postgresql: {
            connectionPoolSize: 20,
            activeConnections: 12,
            queryPerformance: 15.3,
            storageUsage: 25.4
          },
          neo4j: {
            activeConnections: 5,
            queryPerformance: 32.1,
            storageUsage: 18.6
          },
          timescale: {
            activeConnections: 8,
            compressionRatio: 4.2,
            retentionPeriod: 90,
            storageUsage: 35.7
          }
        },
        apiMetrics: {
          totalRequests: 125000,
          requestsPerMinute: 86.4,
          averageResponseTime: 156.2,
          errorRate: 0.24,
          requestsByEndpoint: {
            "/api/users": 12500,
            "/api/auth": 15000,
            "/api/dashboard": 8500
          }
        }
      },
      revenueStatistics: {
        currentMonthRevenue: 25000,
        previousMonthRevenue: 23500,
        yearToDateRevenue: 145000,
        projectedAnnualRevenue: 300000,
        revenueBySubscriptionTier: {
          basic: 5000,
          standard: 12000,
          premium: 8000
        },
        revenueByCountry: {
          RDC: 12500,
          Rwanda: 5000,
          Kenya: 3500,
          France: 2500,
          Other: 1500
        },
        monthlyTrend: [
          { month: "2025-01", amount: 18500 },
          { month: "2025-02", amount: 19200 },
          { month: "2025-03", amount: 20500 },
          { month: "2025-04", amount: 22000 },
          { month: "2025-05", amount: 23500 },
          { month: "2025-06", amount: 25000 }
        ]
      },
      tokenStatistics: {
        totalTokensIssued: 500000,
        tokensInCirculation: 350000,
        averageMonthlyConsumption: 75000,
        consumptionByService: {
          chat: 45000,
          document_analysis: 15000,
          market_intelligence: 10000,
          other: 5000
        },
        consumptionTrend: [
          { date: "2025-05-01", count: 2500 },
          { date: "2025-05-08", count: 2600 },
          { date: "2025-05-15", count: 2450 },
          { date: "2025-05-22", count: 2700 },
          { date: "2025-05-29", count: 2800 }
        ]
      },
      recentActivities: [
        {
          id: "act-123456",
          userId: "user-123",
          userName: "John Doe",
          action: "login",
          timestamp: "2025-06-17T08:30:00Z",
          details: {
            ip: "192.168.1.1",
            userAgent: "Mozilla/5.0..."
          }
        },
        {
          id: "act-123457",
          userId: "user-456",
          userName: "Jane Smith",
          action: "subscription_purchase",
          timestamp: "2025-06-17T09:15:00Z",
          details: {
            plan: "premium",
            amount: 99.99
          }
        }
      ]
    };
  }

  async getWidgetData(widgetId: string, userId: string): Promise<WidgetResponseDto> {
    // Mock widget data
    return {
      data: {
        widgetId,
        title: "Sample Widget",
        type: "feed",
        content: [
          { message: "Sample widget content", timestamp: new Date().toISOString() }
        ]
      }
    };
  }

  async getDashboardConfiguration(userId: string): Promise<DashboardConfigurationDto> {
    // Mock configuration
    return {
      userId,
      layout: [
        { widgetId: "kpiSummary", x: 0, y: 0, w: 12, h: 2 },
        { widgetId: "userSignupsChart", x: 0, y: 2, w: 6, h: 4 },
        { widgetId: "revenueTrendChart", x: 6, y: 2, w: 6, h: 4 }
      ],
      widgets: [
        { id: "kpiSummary", type: "kpi", settings: {} },
        { id: "userSignupsChart", type: "chart", settings: { chartType: "line", dataSource: "/api/stats/user-signups" } }
      ]
    };
  }

  async updateDashboardConfiguration(userId: string, updateData: UpdateDashboardConfigurationDto): Promise<DashboardConfigurationDto> {
    // Mock update - in real implementation, save to database
    return {
      userId,
      layout: updateData.layout,
      widgets: updateData.widgets
    };
  }

  async getSalesStatistics(companyId: string, query: any): Promise<any> {
    // Mock sales statistics
    return {
      data: {
        totalSales: 50000,
        averageOrderValue: 120,
        salesByRegion: [
          { region: "North America", amount: 25000 },
          { region: "Europe", amount: 15000 }
        ]
      }
    };
  }

  async getUserEngagementStatistics(companyId: string, query: any): Promise<any> {
    // Mock user engagement statistics
    return {
      data: {
        dailyActiveUsers: 1200,
        monthlyActiveUsers: 8000,
        averageSessionDurationMinutes: 15
      }
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
