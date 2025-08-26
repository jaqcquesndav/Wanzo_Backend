import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Customer, CustomerType, CustomerStatus } from '../../customers/entities/customer.entity';

// Interfaces pour les métriques calculées
export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  usersByRole: Record<string, number>;
  usersByCountry: Record<string, number>;
  userGrowthRate: number;
}

export interface CustomerMetrics {
  totalCustomers: number;
  activeCustomers: number;
  customersByType: Record<string, number>;
  customersByStatus: Record<string, number>;
  customerRetentionRate: number;
}

export interface RevenueMetrics {
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  yearToDateRevenue: number;
  projectedAnnualRevenue: number;
  revenueBySubscriptionTier: Record<string, number>;
  revenueGrowthRate: number;
}

export interface TokenMetrics {
  totalTokensIssued: number;
  tokensInCirculation: number;
  averageMonthlyConsumption: number;
  consumptionByService: Record<string, number>;
  tokenUtilizationRate: number;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: number;
  activeConnections: number;
  responseTime: number;
}

export interface APIMetrics {
  totalRequests: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
}

export interface PerformanceMetrics {
  systemHealthScore: number;
  customerSatisfactionScore: number;
  platformStabilityScore: number;
}

@Injectable()
export class AdminCalculatorService {
  private readonly logger = new Logger(AdminCalculatorService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  /**
   * Calculer les métriques utilisateurs
   */
  async calculateUserMetrics(
    dateRange: { startDate: Date; endDate: Date },
    companyId?: string
  ): Promise<UserMetrics> {
    const query = this.userRepository.createQueryBuilder('user');
    
    if (companyId) {
      query.where('user.customerAccountId = :companyId', { companyId });
    }

    // Total des utilisateurs
    const totalUsers = await query.getCount();

    // Utilisateurs actifs (connectés dans les 30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeUsers = await this.userRepository.count({
      where: {
        updatedAt: MoreThanOrEqual(thirtyDaysAgo),
        ...(companyId && { customerAccountId: companyId }),
      },
    });

    // Nouveaux utilisateurs aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const newUsersToday = await this.userRepository.count({
      where: {
        createdAt: Between(today, tomorrow),
        ...(companyId && { customerAccountId: companyId }),
      },
    });

    // Répartition par rôle
    const usersByRoleQuery = this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role');
    
    if (companyId) {
      usersByRoleQuery.where('user.customerAccountId = :companyId', { companyId });
    }

    const usersByRoleResult = await usersByRoleQuery.getRawMany();
    const usersByRole: Record<string, number> = {};
    
    usersByRoleResult.forEach(row => {
      usersByRole[row.role] = parseInt(row.count);
    });

    // Répartition par pays (simulé pour l'exemple)
    const usersByCountry = {
      'RDC': Math.floor(totalUsers * 0.45),
      'Rwanda': Math.floor(totalUsers * 0.25),
      'Kenya': Math.floor(totalUsers * 0.15),
      'France': Math.floor(totalUsers * 0.10),
      'Autres': Math.floor(totalUsers * 0.05),
    };

    // Taux de croissance (simplifié)
    const previousPeriod = this.getPreviousPeriod(dateRange);
    const previousUserCount = await this.userRepository.count({
      where: {
        createdAt: Between(previousPeriod.startDate, previousPeriod.endDate),
        ...(companyId && { customerAccountId: companyId }),
      },
    });

    const userGrowthRate = previousUserCount > 0 
      ? ((totalUsers - previousUserCount) / previousUserCount) * 100 
      : 0;

    return {
      totalUsers,
      activeUsers,
      newUsersToday,
      usersByRole,
      usersByCountry,
      userGrowthRate,
    };
  }

  /**
   * Calculer les métriques clients
   */
  async calculateCustomerMetrics(
    dateRange: { startDate: Date; endDate: Date },
    companyId?: string
  ): Promise<CustomerMetrics> {
    // Total des clients
    const totalCustomers = await this.customerRepository.count();

    // Clients actifs
    const activeCustomers = await this.customerRepository.count({
      where: { status: CustomerStatus.ACTIVE },
    });

    // Répartition par type
    const customersByTypeResult = await this.customerRepository
      .createQueryBuilder('customer')
      .select('customer.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('customer.type')
      .getRawMany();

    const customersByType: Record<string, number> = {};
    customersByTypeResult.forEach(row => {
      customersByType[row.type] = parseInt(row.count);
    });

    // Répartition par statut
    const customersByStatusResult = await this.customerRepository
      .createQueryBuilder('customer')
      .select('customer.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('customer.status')
      .getRawMany();

    const customersByStatus: Record<string, number> = {};
    customersByStatusResult.forEach(row => {
      customersByStatus[row.status] = parseInt(row.count);
    });

    // Taux de rétention (simplifié)
    const customerRetentionRate = totalCustomers > 0 
      ? (activeCustomers / totalCustomers) * 100 
      : 0;

    return {
      totalCustomers,
      activeCustomers,
      customersByType,
      customersByStatus,
      customerRetentionRate,
    };
  }

  /**
   * Calculer les métriques de revenus
   */
  async calculateRevenueMetrics(
    dateRange: { startDate: Date; endDate: Date },
    companyId?: string
  ): Promise<RevenueMetrics> {
    // Pour l'instant, simuler les données de revenus
    // Dans une vraie implémentation, cela viendrait des entités Invoice/Payment
    
    const currentMonthRevenue = 25000;
    const previousMonthRevenue = 23500;
    const yearToDateRevenue = 145000;
    const projectedAnnualRevenue = 300000;

    const revenueBySubscriptionTier = {
      'basic': 5000,
      'standard': 12000,
      'premium': 8000,
    };

    const revenueGrowthRate = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;

    return {
      currentMonthRevenue,
      previousMonthRevenue,
      yearToDateRevenue,
      projectedAnnualRevenue,
      revenueBySubscriptionTier,
      revenueGrowthRate,
    };
  }

  /**
   * Calculer les métriques de tokens
   */
  async calculateTokenMetrics(
    dateRange: { startDate: Date; endDate: Date },
    companyId?: string
  ): Promise<TokenMetrics> {
    // Pour l'instant, simuler les données de tokens
    // Dans une vraie implémentation, cela viendrait de l'entité Token
    
    const totalTokensIssued = 500000;
    const tokensInCirculation = 350000;
    const averageMonthlyConsumption = 75000;

    const consumptionByService = {
      'chat': 45000,
      'document_analysis': 15000,
      'market_intelligence': 10000,
      'other': 5000,
    };

    const tokenUtilizationRate = totalTokensIssued > 0 
      ? (tokensInCirculation / totalTokensIssued) * 100 
      : 0;

    return {
      totalTokensIssued,
      tokensInCirculation,
      averageMonthlyConsumption,
      consumptionByService,
      tokenUtilizationRate,
    };
  }

  /**
   * Calculer les métriques système
   */
  async calculateSystemMetrics(
    dateRange: { startDate: Date; endDate: Date }
  ): Promise<SystemMetrics> {
    // Simuler les métriques système
    // Dans une vraie implémentation, cela viendrait des outils de monitoring
    
    return {
      cpuUsage: this.generateRealisticMetric(30, 5),
      memoryUsage: this.generateRealisticMetric(65, 10),
      diskUsage: this.generateRealisticMetric(45, 8),
      uptime: 1209600, // 14 jours en secondes
      activeConnections: this.generateRealisticMetric(85, 15),
      responseTime: this.generateRealisticMetric(120, 30),
    };
  }

  /**
   * Calculer les métriques API
   */
  async calculateAPIMetrics(
    dateRange: { startDate: Date; endDate: Date },
    companyId?: string
  ): Promise<APIMetrics> {
    // Simuler les métriques API
    // Dans une vraie implémentation, cela viendrait des logs d'API
    
    return {
      totalRequests: 125000,
      requestsPerMinute: this.generateRealisticMetric(86.4, 20),
      averageResponseTime: this.generateRealisticMetric(156.2, 50),
      errorRate: this.generateRealisticMetric(0.24, 0.1),
    };
  }

  /**
   * Calculer les métriques de performance
   */
  async calculatePerformanceMetrics(
    dateRange: { startDate: Date; endDate: Date },
    companyId?: string
  ): Promise<PerformanceMetrics> {
    // Calculer des scores composites basés sur d'autres métriques
    const systemMetrics = await this.calculateSystemMetrics(dateRange);
    const apiMetrics = await this.calculateAPIMetrics(dateRange, companyId);
    
    // Score de santé système (basé sur CPU, mémoire, temps de réponse)
    const systemHealthScore = this.calculateSystemHealthScore(systemMetrics);
    
    // Score de satisfaction client (simplifié)
    const customerSatisfactionScore = 85; // À calculer sur base de feedback réel
    
    // Score de stabilité plateforme (basé sur uptime, taux d'erreur)
    const platformStabilityScore = this.calculatePlatformStabilityScore(systemMetrics, apiMetrics);

    return {
      systemHealthScore,
      customerSatisfactionScore,
      platformStabilityScore,
    };
  }

  /**
   * Méthodes utilitaires
   */
  async getUserStatistics(dateRange: { startDate: Date; endDate: Date }, companyId?: string): Promise<any> {
    const userMetrics = await this.calculateUserMetrics(dateRange, companyId);
    
    return {
      totalUsers: userMetrics.totalUsers,
      activeUsers: userMetrics.activeUsers,
      inactiveUsers: userMetrics.totalUsers - userMetrics.activeUsers,
      userRolesDistribution: userMetrics.usersByRole,
      userGrowth: await this.getUserGrowthTrend(dateRange, companyId),
    };
  }

  async getCustomerStatistics(dateRange: { startDate: Date; endDate: Date }, companyId?: string): Promise<any> {
    const customerMetrics = await this.calculateCustomerMetrics(dateRange, companyId);
    
    return {
      totalCustomers: customerMetrics.totalCustomers,
      activeCustomers: customerMetrics.activeCustomers,
      customersByType: customerMetrics.customersByType,
      customersByStatus: customerMetrics.customersByStatus,
      retentionRate: customerMetrics.customerRetentionRate,
    };
  }

  async getRevenueStatistics(dateRange: { startDate: Date; endDate: Date }, companyId?: string): Promise<any> {
    const revenueMetrics = await this.calculateRevenueMetrics(dateRange, companyId);
    
    return {
      currentRevenue: revenueMetrics.currentMonthRevenue,
      previousRevenue: revenueMetrics.previousMonthRevenue,
      growthRate: revenueMetrics.revenueGrowthRate,
      yearToDate: revenueMetrics.yearToDateRevenue,
      projection: revenueMetrics.projectedAnnualRevenue,
      byTier: revenueMetrics.revenueBySubscriptionTier,
      monthlyTrend: await this.getRevenueTrend(dateRange, companyId),
    };
  }

  async getTokenStatistics(dateRange: { startDate: Date; endDate: Date }, companyId?: string): Promise<any> {
    const tokenMetrics = await this.calculateTokenMetrics(dateRange, companyId);
    
    return {
      totalIssued: tokenMetrics.totalTokensIssued,
      inCirculation: tokenMetrics.tokensInCirculation,
      monthlyConsumption: tokenMetrics.averageMonthlyConsumption,
      byService: tokenMetrics.consumptionByService,
      utilizationRate: tokenMetrics.tokenUtilizationRate,
      consumptionTrend: await this.getTokenConsumptionTrend(dateRange, companyId),
    };
  }

  async getSystemHealth(): Promise<any> {
    const systemMetrics = await this.calculateSystemMetrics({ startDate: new Date(), endDate: new Date() });
    
    return {
      serverHealth: {
        cpuUsage: systemMetrics.cpuUsage,
        memoryUsage: systemMetrics.memoryUsage,
        diskUsage: systemMetrics.diskUsage,
        uptime: systemMetrics.uptime,
        activeConnections: systemMetrics.activeConnections,
        responseTime: systemMetrics.responseTime,
      },
      databaseMetrics: {
        postgresql: {
          connectionPoolSize: 20,
          activeConnections: 12,
          queryPerformance: 15.3,
          storageUsage: 25.4,
        },
      },
    };
  }

  async getRecentActivities(limit: number = 20, companyId?: string): Promise<any[]> {
    // Dans une vraie implémentation, récupérer depuis une table d'audit
    return [
      {
        id: "act-123456",
        userId: "user-123",
        userName: "John Doe",
        action: "login",
        timestamp: new Date().toISOString(),
        details: { ip: "192.168.1.1" }
      },
      {
        id: "act-123457",
        userId: "user-456",
        userName: "Jane Smith",
        action: "subscription_purchase",
        timestamp: new Date().toISOString(),
        details: { plan: "premium", amount: 99.99 }
      }
    ];
  }

  async getTrendData(
    metric: string,
    dateRange: { startDate: Date; endDate: Date },
    granularity: 'day' | 'week' | 'month' = 'day',
    companyId?: string
  ): Promise<Array<{ date: string; value: number }>> {
    // Simuler des données de tendance
    const data: Array<{ date: string; value: number }> = [];
    const current = new Date(dateRange.startDate);
    let baseValue = 1000;

    while (current <= dateRange.endDate) {
      const variation = (Math.random() - 0.5) * 0.2; // ±10% de variation
      const value = Math.round(baseValue * (1 + variation));
      
      data.push({
        date: current.toISOString().split('T')[0],
        value: value
      });

      // Incrémenter selon la granularité
      if (granularity === 'day') {
        current.setDate(current.getDate() + 1);
      } else if (granularity === 'week') {
        current.setDate(current.getDate() + 7);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
      
      baseValue = value; // Utiliser la valeur précédente comme base
    }

    return data;
  }

  async getTopCustomers(
    limit: number = 10,
    orderBy: 'revenue' | 'activity' | 'tokens' = 'revenue',
    companyId?: string
  ): Promise<Array<{ customer: Customer; value: number; rank: number }>> {
    const customers = await this.customerRepository.find({
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return customers.map((customer, index) => ({
      customer,
      value: Math.random() * 10000, // Simuler une valeur
      rank: index + 1,
    }));
  }

  async getAlerts(severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<Array<{ 
    id: string; 
    type: string; 
    message: string; 
    severity: string; 
    timestamp: Date; 
    data?: any; 
  }>> {
    // Simuler des alertes système
    return [
      {
        id: 'alert-001',
        type: 'performance',
        message: 'CPU usage above 80% for 10 minutes',
        severity: 'high',
        timestamp: new Date(),
        data: { cpuUsage: 85 }
      }
    ];
  }

  /**
   * Méthodes privées utilitaires
   */
  private getPreviousPeriod(dateRange: { startDate: Date; endDate: Date }): { startDate: Date; endDate: Date } {
    const duration = dateRange.endDate.getTime() - dateRange.startDate.getTime();
    const startDate = new Date(dateRange.startDate.getTime() - duration);
    const endDate = new Date(dateRange.startDate.getTime());
    return { startDate, endDate };
  }

  private generateRealisticMetric(base: number, variance: number): number {
    const variation = (Math.random() - 0.5) * variance * 2;
    return Math.max(0, Math.round((base + variation) * 100) / 100);
  }

  private calculateSystemHealthScore(systemMetrics: SystemMetrics): number {
    let score = 100;
    
    // Pénaliser selon les métriques
    if (systemMetrics.cpuUsage > 80) score -= 20;
    else if (systemMetrics.cpuUsage > 60) score -= 10;
    
    if (systemMetrics.memoryUsage > 90) score -= 25;
    else if (systemMetrics.memoryUsage > 75) score -= 15;
    
    if (systemMetrics.responseTime > 500) score -= 20;
    else if (systemMetrics.responseTime > 200) score -= 10;
    
    return Math.max(0, score);
  }

  private calculatePlatformStabilityScore(systemMetrics: SystemMetrics, apiMetrics: APIMetrics): number {
    let score = 100;
    
    // Pénaliser selon le taux d'erreur API
    if (apiMetrics.errorRate > 5) score -= 30;
    else if (apiMetrics.errorRate > 1) score -= 15;
    
    // Pénaliser selon l'uptime
    const expectedUptime = 30 * 24 * 60 * 60; // 30 jours
    const uptimeRatio = systemMetrics.uptime / expectedUptime;
    if (uptimeRatio < 0.99) score -= 20;
    else if (uptimeRatio < 0.995) score -= 10;
    
    return Math.max(0, score);
  }

  private async getUserGrowthTrend(dateRange: { startDate: Date; endDate: Date }, companyId?: string): Promise<Array<{ date: string; count: number }>> {
    // Simuler une tendance de croissance des utilisateurs
    return [
      { date: "2025-05-01", count: 1420 },
      { date: "2025-05-08", count: 1450 },
      { date: "2025-05-15", count: 1475 },
      { date: "2025-05-22", count: 1490 },
      { date: "2025-05-29", count: 1500 }
    ];
  }

  private async getRevenueTrend(dateRange: { startDate: Date; endDate: Date }, companyId?: string): Promise<Array<{ month: string; amount: number }>> {
    // Simuler une tendance de revenus mensuels
    return [
      { month: "2025-01", amount: 18500 },
      { month: "2025-02", amount: 19200 },
      { month: "2025-03", amount: 20500 },
      { month: "2025-04", amount: 22000 },
      { month: "2025-05", amount: 23500 },
      { month: "2025-06", amount: 25000 }
    ];
  }

  private async getTokenConsumptionTrend(dateRange: { startDate: Date; endDate: Date }, companyId?: string): Promise<Array<{ date: string; count: number }>> {
    // Simuler une tendance de consommation de tokens
    return [
      { date: "2025-05-01", count: 2500 },
      { date: "2025-05-08", count: 2600 },
      { date: "2025-05-15", count: 2450 },
      { date: "2025-05-22", count: 2700 },
      { date: "2025-05-29", count: 2800 }
    ];
  }
}
