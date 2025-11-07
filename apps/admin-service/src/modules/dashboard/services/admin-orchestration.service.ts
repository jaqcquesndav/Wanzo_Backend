import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AdminCalculatorService } from '../calculators/admin-calculator.service';
import { User } from '../../users/entities/user.entity';
import { Customer, CustomerType, CustomerStatus } from '../../customers/entities/customer.entity';
import { DashboardQueryParamsDto } from '../dtos';

export interface AdminMetrics {
  // Métriques utilisateurs
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  usersByRole: Record<string, number>;
  usersByCountry: Record<string, number>;
  userGrowthRate: number;
  
  // Métriques clients
  totalCustomers: number;
  activeCustomers: number;
  customersByType: Record<string, number>;
  customersByStatus: Record<string, number>;
  customerRetentionRate: number;
  
  // Métriques revenus
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  yearToDateRevenue: number;
  projectedAnnualRevenue: number;
  revenueBySubscriptionTier: Record<string, number>;
  revenueGrowthRate: number;
  
  // Métriques tokens
  totalTokensIssued: number;
  tokensInCirculation: number;
  averageMonthlyConsumption: number;
  consumptionByService: Record<string, number>;
  tokenUtilizationRate: number;
  
  // Métriques ADHA (Credit AI Service)
  adhaMetrics?: {
    totalCreditApplications: number;
    pendingApplications: number;
    approvedApplications: number;
    rejectedApplications: number;
    approvalRate: number;
    averageProcessingTime: number; // en minutes
    averageCreditScore: number;
    applicationsByRiskLevel: Record<string, number>; // low, medium, high
    monthlyApplicationTrend: Array<{ month: string; count: number }>;
  };
  
  // Métriques système
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  uptime: number;
  activeConnections: number;
  responseTime: number;
  
  // Métriques API
  totalRequests: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  
  // Métriques de performance
  systemHealthScore: number;
  customerSatisfactionScore: number;
  platformStabilityScore: number;
  
  // Timestamps
  calculatedAt: Date;
  period: string;
}

@Injectable()
export class AdminOrchestrationService {
  private readonly logger = new Logger(AdminOrchestrationService.name);
  private metricsCache = new Map<string, AdminMetrics>();
  private readonly cacheExpiration = 10 * 60 * 1000; // 10 minutes pour l'admin (plus fréquent)

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private calculatorService: AdminCalculatorService,
  ) {}

  /**
   * Obtenir les métriques administratives
   */
  async getAdminMetrics(companyId?: string, queryParams?: DashboardQueryParamsDto): Promise<AdminMetrics> {
    const cacheKey = this.generateCacheKey(companyId, queryParams);
    
    // Vérifier le cache d'abord
    const cached = this.getCachedMetrics(cacheKey);
    if (cached) {
      this.logger.debug(`Returning cached admin metrics`);
      return cached;
    }

    this.logger.debug(`Calculating fresh admin metrics`);
    
    try {
      // Calculer les métriques en temps réel
      const metrics = await this.calculateAdminMetrics(companyId, queryParams);
      
      // Mettre en cache
      this.cacheMetrics(cacheKey, metrics);
      
      return metrics;
    } catch (error) {
      this.logger.error(`Error calculating admin metrics:`, error);
      throw error;
    }
  }

  /**
   * Calculer toutes les métriques administratives
   */
  private async calculateAdminMetrics(companyId?: string, queryParams?: DashboardQueryParamsDto): Promise<AdminMetrics> {
    const dateRange = this.getDateRange(queryParams);

    // Calculer les métriques en parallèle
    const [
      userMetrics,
      customerMetrics,
      revenueMetrics,
      tokenMetrics,
      adhaMetrics,
      systemMetrics,
      apiMetrics,
      performanceMetrics,
    ] = await Promise.all([
      this.calculatorService.calculateUserMetrics(dateRange, companyId),
      this.calculatorService.calculateCustomerMetrics(dateRange, companyId),
      this.calculatorService.calculateRevenueMetrics(dateRange, companyId),
      this.calculatorService.calculateTokenMetrics(dateRange, companyId),
      this.calculatorService.calculateAdhaMetrics(dateRange, companyId),
      this.calculatorService.calculateSystemMetrics(dateRange),
      this.calculatorService.calculateAPIMetrics(dateRange, companyId),
      this.calculatorService.calculatePerformanceMetrics(dateRange, companyId),
    ]);

    return {
      // Métriques utilisateurs
      totalUsers: userMetrics.totalUsers,
      activeUsers: userMetrics.activeUsers,
      newUsersToday: userMetrics.newUsersToday,
      usersByRole: userMetrics.usersByRole,
      usersByCountry: userMetrics.usersByCountry,
      userGrowthRate: userMetrics.userGrowthRate,
      
      // Métriques clients
      totalCustomers: customerMetrics.totalCustomers,
      activeCustomers: customerMetrics.activeCustomers,
      customersByType: customerMetrics.customersByType,
      customersByStatus: customerMetrics.customersByStatus,
      customerRetentionRate: customerMetrics.customerRetentionRate,
      
      // Métriques revenus
      currentMonthRevenue: revenueMetrics.currentMonthRevenue,
      previousMonthRevenue: revenueMetrics.previousMonthRevenue,
      yearToDateRevenue: revenueMetrics.yearToDateRevenue,
      projectedAnnualRevenue: revenueMetrics.projectedAnnualRevenue,
      revenueBySubscriptionTier: revenueMetrics.revenueBySubscriptionTier,
      revenueGrowthRate: revenueMetrics.revenueGrowthRate,
      
      // Métriques tokens
      totalTokensIssued: tokenMetrics.totalTokensIssued,
      tokensInCirculation: tokenMetrics.tokensInCirculation,
      averageMonthlyConsumption: tokenMetrics.averageMonthlyConsumption,
      consumptionByService: tokenMetrics.consumptionByService,
      tokenUtilizationRate: tokenMetrics.tokenUtilizationRate,
      
      // Métriques ADHA
      adhaMetrics: adhaMetrics || undefined,
      
      // Métriques système
      cpuUsage: systemMetrics.cpuUsage,
      memoryUsage: systemMetrics.memoryUsage,
      diskUsage: systemMetrics.diskUsage,
      uptime: systemMetrics.uptime,
      activeConnections: systemMetrics.activeConnections,
      responseTime: systemMetrics.responseTime,
      
      // Métriques API
      totalRequests: apiMetrics.totalRequests,
      requestsPerMinute: apiMetrics.requestsPerMinute,
      averageResponseTime: apiMetrics.averageResponseTime,
      errorRate: apiMetrics.errorRate,
      
      // Métriques de performance
      systemHealthScore: performanceMetrics.systemHealthScore,
      customerSatisfactionScore: performanceMetrics.customerSatisfactionScore,
      platformStabilityScore: performanceMetrics.platformStabilityScore,
      
      // Metadata
      calculatedAt: new Date(),
      period: this.formatPeriod(dateRange),
    };
  }

  /**
   * Job planifié pour recalculer les métriques administratives
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduledMetricsRecalculation() {
    this.logger.debug('Starting scheduled admin metrics recalculation');
    
    try {
      // Recalculer les métriques globales
      const cacheKey = this.generateCacheKey();
      this.metricsCache.delete(cacheKey);
      
      await this.getAdminMetrics();
      
      this.logger.debug('Scheduled admin metrics recalculation completed');
    } catch (error) {
      this.logger.error('Error in scheduled admin metrics recalculation:', error);
    }
  }

  /**
   * Nettoyer le cache des métriques expirées
   */
  @Cron(CronExpression.EVERY_30_MINUTES)
  async cleanupExpiredCache() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, metrics] of this.metricsCache.entries()) {
      if (now - metrics.calculatedAt.getTime() > this.cacheExpiration) {
        this.metricsCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned up ${cleanedCount} expired admin cache entries`);
    }
  }

  /**
   * Utilitaires privés
   */
  private generateCacheKey(companyId?: string, queryParams?: DashboardQueryParamsDto): string {
    const params = queryParams || {};
    return `admin_metrics_${companyId || 'global'}_${JSON.stringify(params)}`;
  }

  private getCachedMetrics(cacheKey: string): AdminMetrics | null {
    const cached = this.metricsCache.get(cacheKey);
    if (!cached) return null;

    const age = Date.now() - cached.calculatedAt.getTime();
    if (age > this.cacheExpiration) {
      this.metricsCache.delete(cacheKey);
      return null;
    }

    return cached;
  }

  private cacheMetrics(cacheKey: string, metrics: AdminMetrics): void {
    this.metricsCache.set(cacheKey, metrics);
  }

  private getDateRange(queryParams?: DashboardQueryParamsDto): { startDate: Date; endDate: Date } {
    // Vérifier si period est défini
    if (queryParams?.period) {
      const now = new Date();
      let startDate = new Date();
      
      switch (queryParams.period) {
        case 'daily':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'weekly':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'monthly':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarterly':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'yearly':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      return { startDate, endDate: now };
    }

    // Par défaut, utiliser le mois courant
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return { startDate: startOfMonth, endDate: endOfMonth };
  }

  private formatPeriod(dateRange: { startDate: Date; endDate: Date }): string {
    const start = dateRange.startDate.toISOString().split('T')[0];
    const end = dateRange.endDate.toISOString().split('T')[0];
    return `${start}_to_${end}`;
  }

  /**
   * Méthodes utilitaires pour l'agrégation de données
   */
  async getUserStatistics(dateRange: { startDate: Date; endDate: Date }, companyId?: string): Promise<any> {
    return await this.calculatorService.getUserStatistics(dateRange, companyId);
  }

  async getCustomerStatistics(dateRange: { startDate: Date; endDate: Date }, companyId?: string): Promise<any> {
    return await this.calculatorService.getCustomerStatistics(dateRange, companyId);
  }

  async getRevenueStatistics(dateRange: { startDate: Date; endDate: Date }, companyId?: string): Promise<any> {
    return await this.calculatorService.getRevenueStatistics(dateRange, companyId);
  }

  async getTokenStatistics(dateRange: { startDate: Date; endDate: Date }, companyId?: string): Promise<any> {
    return await this.calculatorService.getTokenStatistics(dateRange, companyId);
  }

  async getSystemHealth(): Promise<any> {
    return await this.calculatorService.getSystemHealth();
  }

  async getRecentActivities(limit: number = 20, companyId?: string): Promise<any[]> {
    return await this.calculatorService.getRecentActivities(limit, companyId);
  }

  async getTrendData(
    metric: string,
    dateRange: { startDate: Date; endDate: Date },
    granularity: 'day' | 'week' | 'month' = 'day',
    companyId?: string
  ): Promise<Array<{ date: string; value: number }>> {
    return await this.calculatorService.getTrendData(metric, dateRange, granularity, companyId);
  }

  async getTopCustomers(
    limit: number = 10,
    orderBy: 'revenue' | 'activity' | 'tokens' = 'revenue',
    companyId?: string
  ): Promise<Array<{ customer: Customer; value: number; rank: number }>> {
    return await this.calculatorService.getTopCustomers(limit, orderBy, companyId);
  }

  async getAlerts(severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'): Promise<Array<{ 
    id: string; 
    type: string; 
    message: string; 
    severity: string; 
    timestamp: Date; 
    data?: any; 
  }>> {
    return await this.calculatorService.getAlerts(severity);
  }
}
