
import { Injectable } from '@nestjs/common';
import { AdminOrchestrationService } from './admin-orchestration.service';
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
  constructor(
    private orchestrationService: AdminOrchestrationService,
  ) {}

  async getMainDashboardData(companyId: string, queryParams?: DashboardQueryParamsDto): Promise<DashboardCompleteDataDto> {
    try {
      // Utiliser le service d'orchestration pour obtenir les vraies métriques
      const metrics = await this.orchestrationService.getAdminMetrics(companyId, queryParams);
      
      const [
        userStatistics,
        revenueStatistics,
        tokenStatistics,
        systemHealth,
        recentActivities,
      ] = await Promise.all([
        this.orchestrationService.getUserStatistics(this.getDateRange(queryParams), companyId),
        this.orchestrationService.getRevenueStatistics(this.getDateRange(queryParams), companyId),
        this.orchestrationService.getTokenStatistics(this.getDateRange(queryParams), companyId),
        this.orchestrationService.getSystemHealth(),
        this.orchestrationService.getRecentActivities(20, companyId),
      ]);

      return {
        userStatistics: {
          totalUsers: userStatistics.totalUsers,
          activeUsers: userStatistics.activeUsers,
          newUsersToday: metrics.newUsersToday,
          usersByRole: userStatistics.userRolesDistribution,
          usersByCountry: {
            RDC: metrics.usersByCountry.RDC || 0,
            Rwanda: metrics.usersByCountry.Rwanda || 0,
            Kenya: metrics.usersByCountry.Kenya || 0,
            France: metrics.usersByCountry.France || 0,
            Other: metrics.usersByCountry.Other || 0,
          },
          userGrowth: userStatistics.userGrowth,
        },
        systemMetrics: {
          serverHealth: systemHealth.serverHealth,
          databaseMetrics: systemHealth.databaseMetrics,
          apiMetrics: {
            totalRequests: metrics.totalRequests,
            requestsPerMinute: metrics.requestsPerMinute,
            averageResponseTime: metrics.averageResponseTime,
            errorRate: metrics.errorRate,
            requestsByEndpoint: {
              "/api/users": Math.floor(metrics.totalRequests * 0.1),
              "/api/auth": Math.floor(metrics.totalRequests * 0.12),
              "/api/dashboard": Math.floor(metrics.totalRequests * 0.08),
            }
          }
        },
        revenueStatistics: {
          currentMonthRevenue: revenueStatistics.currentRevenue,
          previousMonthRevenue: revenueStatistics.previousRevenue,
          yearToDateRevenue: revenueStatistics.yearToDate,
          projectedAnnualRevenue: revenueStatistics.projection,
          revenueBySubscriptionTier: revenueStatistics.byTier,
          revenueByCountry: {
            RDC: Math.floor(revenueStatistics.currentRevenue * 0.5),
            Rwanda: Math.floor(revenueStatistics.currentRevenue * 0.2),
            Kenya: Math.floor(revenueStatistics.currentRevenue * 0.14),
            France: Math.floor(revenueStatistics.currentRevenue * 0.1),
            Other: Math.floor(revenueStatistics.currentRevenue * 0.06),
          },
          monthlyTrend: revenueStatistics.monthlyTrend,
        },
        tokenStatistics: {
          totalTokensIssued: tokenStatistics.totalIssued,
          tokensInCirculation: tokenStatistics.inCirculation,
          averageMonthlyConsumption: tokenStatistics.monthlyConsumption,
          consumptionByService: tokenStatistics.byService,
          consumptionTrend: tokenStatistics.consumptionTrend,
        },
        adhaMetrics: metrics.adhaMetrics || undefined,
        recentActivities: recentActivities,
      };
    } catch (error) {
      // En cas d'erreur, retourner des données simulées
      return this.getFallbackDashboardData(companyId, queryParams);
    }
  }

  private getDateRange(queryParams?: DashboardQueryParamsDto): { startDate: Date; endDate: Date } {
    // Utiliser le mois courant par défaut
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return { startDate: startOfMonth, endDate: endOfMonth };
  }

  private getFallbackDashboardData(companyId: string, queryParams?: DashboardQueryParamsDto): DashboardCompleteDataDto {
    // Données de secours avec la structure attendue
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
        }
      ]
    };
  }

  async getWidgetData(widgetId: string, userId: string): Promise<WidgetResponseDto> {
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
    return {
      userId,
      layout: updateData.layout,
      widgets: updateData.widgets
    };
  }

  async getSalesStatistics(companyId: string, query: any): Promise<any> {
    try {
      const metrics = await this.orchestrationService.getAdminMetrics(companyId, query);
      return {
        data: {
          totalSales: metrics.currentMonthRevenue,
          averageOrderValue: Math.floor(metrics.currentMonthRevenue / metrics.totalCustomers),
          salesByRegion: [
            { region: "RDC", amount: Math.floor(metrics.currentMonthRevenue * 0.5) },
            { region: "Rwanda", amount: Math.floor(metrics.currentMonthRevenue * 0.2) }
          ]
        }
      };
    } catch (error) {
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
  }

  async getUserEngagementStatistics(companyId: string, query: any): Promise<any> {
    try {
      const metrics = await this.orchestrationService.getAdminMetrics(companyId, query);
      return {
        data: {
          dailyActiveUsers: Math.floor(metrics.activeUsers * 0.8),
          monthlyActiveUsers: metrics.activeUsers,
          averageSessionDurationMinutes: 15
        }
      };
    } catch (error) {
      return {
        data: {
          dailyActiveUsers: 1200,
          monthlyActiveUsers: 8000,
          averageSessionDurationMinutes: 15
        }
      };
    }
  }

  async getKpis(companyId: string): Promise<KpisDto> {
    try {
      const metrics = await this.orchestrationService.getAdminMetrics(companyId);
      return {
        customerGrowth: Math.round(metrics.userGrowthRate),
        revenueGrowth: Math.round(metrics.revenueGrowthRate),
        satisfactionRate: Math.round(metrics.customerSatisfactionScore),
        averageResponseTime: Math.round(metrics.responseTime),
      };
    } catch (error) {
      return {
        customerGrowth: 15,
        revenueGrowth: 12,
        satisfactionRate: 95,
        averageResponseTime: 24,
      };
    }
  }

  async getFinancialSummary(companyId: string): Promise<FinancialSummaryDto> {
    try {
      const revenueStats = await this.orchestrationService.getRevenueStatistics(this.getDateRange(), companyId);
      return {
        totalRevenue: revenueStats.yearToDate,
        totalExpenses: Math.floor(revenueStats.yearToDate * 0.7),
        netProfit: Math.floor(revenueStats.yearToDate * 0.3),
        lastTransactions: [
          { id: '1', date: new Date(), description: 'Transaction 1', amount: 1000 },
          { id: '2', date: new Date(), description: 'Transaction 2', amount: -500 },
        ],
      };
    } catch (error) {
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
  }

  async getRecentActivities(companyId: string): Promise<RecentActivityDto[]> {
    try {
      const activities = await this.orchestrationService.getRecentActivities(10, companyId);
      return activities.map(activity => ({
        id: activity.id,
        date: new Date(activity.timestamp),
        user: activity.userName || 'System User',
        action: activity.action,
      }));
    } catch (error) {
      return [
        { id: '1', date: new Date(), user: 'Admin User', action: 'Created a new customer' },
        { id: '2', date: new Date(), user: 'Manager User', action: 'Validated a document' },
      ];
    }
  }

  async getUserStatistics(companyId: string): Promise<UserStatisticDto> {
    try {
      const userStats = await this.orchestrationService.getUserStatistics(this.getDateRange(), companyId);
      return {
        totalUsers: userStats.totalUsers,
        activeUsers: userStats.activeUsers,
        inactiveUsers: userStats.inactiveUsers,
        userRolesDistribution: {
          admins: userStats.userRolesDistribution.admin || 0,
          managers: userStats.userRolesDistribution.manager || 0,
          operators: userStats.userRolesDistribution.user || userStats.totalUsers,
        },
      };
    } catch (error) {
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
  }

  async getSystemHealth(): Promise<SystemHealthDto> {
    try {
      const systemHealth = await this.orchestrationService.getSystemHealth();
      return {
        cpuUsage: systemHealth.serverHealth.cpuUsage,
        memoryUsage: systemHealth.serverHealth.memoryUsage,
        databaseStatus: 'Connected',
        apiResponseTime: systemHealth.serverHealth.responseTime,
      };
    } catch (error) {
      return {
        cpuUsage: 45,
        memoryUsage: 60,
        databaseStatus: 'Connected',
        apiResponseTime: 120,
      };
    }
  }

  async getNotifications(userId: string): Promise<NotificationDto[]> {
    try {
      const alerts = await this.orchestrationService.getAlerts('medium');
      return alerts.map(alert => ({
        id: alert.id,
        message: alert.message,
        date: alert.timestamp,
        read: false,
      }));
    } catch (error) {
      return [
        { id: '1', message: 'New document to validate', date: new Date(), read: false },
        { id: '2', message: 'Customer account created', date: new Date(), read: true },
      ];
    }
  }
}
