import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { 
  DashboardWidget, 
  DashboardConfiguration, 
  ActivityLog 
} from '../entities';
import {
  DashboardQueryParamsDto,
  DashboardDataDto,
  WidgetQueryParamsDto,
  WidgetDataDto,
  CreateWidgetDto,
  UpdateWidgetDto,
  UpdateDashboardLayoutDto,
  WidgetListDto,
  CreateActivityLogDto,
  ActivityLogQueryDto,
  ActivityDto
} from '../dtos';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(DashboardWidget)
    private widgetRepository: Repository<DashboardWidget>,
    @InjectRepository(DashboardConfiguration)
    private configRepository: Repository<DashboardConfiguration>,
    @InjectRepository(ActivityLog)
    private activityLogRepository: Repository<ActivityLog>
  ) {}

  async getDashboardData(queryParams: DashboardQueryParamsDto): Promise<DashboardDataDto> {
    const { userId, dateRange, timeZone } = queryParams;
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    if (dateRange === 'last7days') {
      startDate.setDate(now.getDate() - 7);
    } else if (dateRange === 'last30days') {
      startDate.setDate(now.getDate() - 30);
    } else if (dateRange === 'monthToDate') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      // Default to last 30 days
      startDate.setDate(now.getDate() - 30);
    }

    // Sample data for demonstration - in a real implementation, these would be fetched from repositories
    return {
      kpis: {
        totalUsers: 1500,
        activeSubscriptions: 350,
        monthlyRecurringRevenue: 15000,
        newCustomersToday: 5
      },
      charts: {
        userSignups: [
          { date: '2023-05-01', count: 10 },
          { date: '2023-05-02', count: 12 }
        ],
        revenueTrend: [
          { month: 'Jan', amount: 12000 },
          { month: 'Feb', amount: 13500 }
        ]
      },
      recentActivities: await this.getRecentActivities(userId, 5),
      quickStats: {
        pendingApprovals: 3,
        openSupportTickets: 12
      }
    };
  }

  async getWidgetData(widgetId: string, queryParams: WidgetQueryParamsDto): Promise<WidgetDataDto> {
    const { userId, params } = queryParams;
    
    // Find the widget in the database
    const widget = await this.widgetRepository.findOne({
      where: { 
        id: widgetId,
        ...(userId && { userId })
      }
    });

    if (!widget) {
      throw new NotFoundException(`Widget with ID ${widgetId} not found`);
    }

    // Generate sample content based on widget type
    let content: any[] = [];
    
    if (widget.type === 'feed') {
      content = [
        { message: 'You updated your profile.', timestamp: '2023-06-01T09:00:00Z' },
        { message: 'New chat message from Admin.', timestamp: '2023-06-01T08:30:00Z' }
      ];
    } else if (widget.type === 'chart') {
      content = [
        { date: '2023-05-01', value: 10 },
        { date: '2023-05-02', value: 12 },
        { date: '2023-05-03', value: 8 }
      ];
    } else if (widget.type === 'kpi') {
      content = [
        { label: 'Total Users', value: 1500 },
        { label: 'Active Today', value: 230 }
      ];
    }

    return {
      widgetId: widget.id,
      title: widget.title,
      type: widget.type,
      content
    };
  }

  async getUserWidgets(userId?: string): Promise<WidgetListDto[]> {
    const widgets = await this.widgetRepository.find({
      where: userId ? { userId } : {},
      order: { sortOrder: 'ASC' }
    });

    return widgets.map(widget => ({
      id: widget.id,
      title: widget.title,
      type: widget.type,
      isVisible: widget.isVisible,
      sortOrder: widget.sortOrder,
      configuration: widget.configuration
    }));
  }

  async createWidget(createDto: CreateWidgetDto): Promise<DashboardWidget> {
    const widget = this.widgetRepository.create(createDto);
    return this.widgetRepository.save(widget);
  }

  async updateWidget(id: string, updateDto: UpdateWidgetDto): Promise<DashboardWidget> {
    const widget = await this.widgetRepository.findOne({
      where: { id }
    });

    if (!widget) {
      throw new NotFoundException(`Widget with ID ${id} not found`);
    }

    Object.assign(widget, updateDto);
    return this.widgetRepository.save(widget);
  }

  async deleteWidget(id: string): Promise<void> {
    const widget = await this.widgetRepository.findOne({
      where: { id }
    });

    if (!widget) {
      throw new NotFoundException(`Widget with ID ${id} not found`);
    }

    await this.widgetRepository.remove(widget);
  }

  async getDashboardLayout(userId?: string): Promise<DashboardConfiguration> {
    let config = await this.configRepository.findOne({
      where: userId ? { userId } : { userId: null }
    });

    if (!config) {
      // Create default configuration
      config = this.configRepository.create({
        userId: userId || null,
        layoutType: 'default',
        preferences: {}
      });
      await this.configRepository.save(config);
    }

    return config;
  }

  async updateDashboardLayout(userId: string | null, updateDto: UpdateDashboardLayoutDto): Promise<DashboardConfiguration> {
    let config = await this.configRepository.findOne({
      where: { userId }
    });

    if (!config) {
      config = this.configRepository.create({
        userId,
        layoutType: updateDto.layoutType,
        preferences: updateDto.preferences
      });
    } else {
      config.layoutType = updateDto.layoutType;
      config.preferences = updateDto.preferences;
    }

    return this.configRepository.save(config);
  }

  // Activity Log methods
  async createActivityLog(createDto: CreateActivityLogDto): Promise<ActivityLog> {
    const log = this.activityLogRepository.create(createDto);
    return this.activityLogRepository.save(log);
  }

  async getActivityLogs(queryDto: ActivityLogQueryDto): Promise<{
    logs: ActivityDto[];
    total: number;
    page: number;
    pages: number;
  }> {
    const { userId, type, startDate, endDate, page = 1, limit = 20 } = queryDto;
    const where: FindOptionsWhere<ActivityLog> = {};

    if (userId) where.userId = userId;
    if (type) where.type = type;
    
    // Date range filtering
    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : new Date(0);
      const end = endDate ? new Date(endDate) : new Date();
      where.timestamp = Between(start, end);
    }

    const [logs, total] = await this.activityLogRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { timestamp: 'DESC' }
    });

    return {
      logs: logs.map(log => ({
        id: log.id,
        type: log.type,
        description: log.description,
        timestamp: log.timestamp.toISOString()
      })),
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  async getRecentActivities(userId?: string, limit: number = 5): Promise<ActivityDto[]> {
    const where: FindOptionsWhere<ActivityLog> = {};
    if (userId) where.userId = userId;

    const logs = await this.activityLogRepository.find({
      where,
      order: { timestamp: 'DESC' },
      take: limit
    });

    return logs.map(log => ({
      id: log.id,
      type: log.type,
      description: log.description,
      timestamp: log.timestamp.toISOString()
    }));
  }
}
