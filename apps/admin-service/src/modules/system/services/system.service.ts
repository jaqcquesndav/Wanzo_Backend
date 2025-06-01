import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { 
  AuditLog, 
  NotificationTemplate, 
  SystemNotification, 
  UserNotification,
  NotificationPriority
} from '../entities';
import {
  AuditLogDto,
  AuditLogQueryDto,
  CreateAuditLogDto,
  AuditLogsResponseDto,
  NotificationTemplateDto,
  CreateNotificationTemplateDto,
  UpdateNotificationTemplateDto,
  NotificationTemplatesQueryDto,
  NotificationTemplatesResponseDto,
  SystemNotificationDto,
  CreateSystemNotificationDto,
  UpdateSystemNotificationDto,
  SystemNotificationsQueryDto,
  SystemNotificationsResponseDto,
  UserNotificationDto,
  CreateUserNotificationDto,
  UpdateUserNotificationDto,
  UserNotificationsQueryDto,
  UserNotificationsResponseDto,
  SendNotificationDto,
  NotificationSendResponseDto
} from '../dtos';

@Injectable()
export class SystemService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(NotificationTemplate)
    private notificationTemplateRepository: Repository<NotificationTemplate>,
    @InjectRepository(SystemNotification)
    private systemNotificationRepository: Repository<SystemNotification>,
    @InjectRepository(UserNotification)
    private userNotificationRepository: Repository<UserNotification>
  ) {}

  // Audit Log Methods
  async createAuditLog(createDto: CreateAuditLogDto): Promise<AuditLogDto> {
    const auditLog = this.auditLogRepository.create(createDto);
    return this.auditLogRepository.save(auditLog);
  }

  async getAuditLogs(queryDto: AuditLogQueryDto): Promise<AuditLogsResponseDto> {
    const { 
      action, 
      entityType, 
      entityId, 
      userId, 
      startDate, 
      endDate, 
      page = 1, 
      limit = 20 
    } = queryDto;

    const where: FindOptionsWhere<AuditLog> = {};

    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;

    // Date range filtering
    if (startDate && endDate) {
      where.timestamp = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      where.timestamp = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      where.timestamp = LessThanOrEqual(new Date(endDate));
    }

    const [logs, total] = await this.auditLogRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { timestamp: 'DESC' }
    });

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getAuditLogById(id: string): Promise<AuditLogDto> {
    const log = await this.auditLogRepository.findOne({
      where: { id }
    });

    if (!log) {
      throw new NotFoundException(`Audit log with ID ${id} not found`);
    }

    return log;
  }

  // Notification Templates Methods
  async createNotificationTemplate(createDto: CreateNotificationTemplateDto): Promise<NotificationTemplateDto> {
    // Check if template with same name already exists
    const existing = await this.notificationTemplateRepository.findOne({
      where: { name: createDto.name }
    });

    if (existing) {
      throw new BadRequestException(`Notification template with name "${createDto.name}" already exists`);
    }

    const template = this.notificationTemplateRepository.create(createDto);
    return this.notificationTemplateRepository.save(template);
  }

  async getNotificationTemplates(queryDto: NotificationTemplatesQueryDto): Promise<NotificationTemplatesResponseDto> {
    const { type, isActive, page = 1, limit = 20 } = queryDto;
    const where: FindOptionsWhere<NotificationTemplate> = {};

    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    const [templates, total] = await this.notificationTemplateRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' }
    });

    return {
      templates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getNotificationTemplateById(id: string): Promise<NotificationTemplateDto> {
    const template = await this.notificationTemplateRepository.findOne({
      where: { id }
    });

    if (!template) {
      throw new NotFoundException(`Notification template with ID ${id} not found`);
    }

    return template;
  }

  async updateNotificationTemplate(id: string, updateDto: UpdateNotificationTemplateDto): Promise<NotificationTemplateDto> {
    const template = await this.getNotificationTemplateById(id);

    // Check name uniqueness if changing name
    if (updateDto.name && updateDto.name !== template.name) {
      const existing = await this.notificationTemplateRepository.findOne({
        where: { name: updateDto.name }
      });

      if (existing) {
        throw new BadRequestException(`Notification template with name "${updateDto.name}" already exists`);
      }
    }

    // Update the template with new values
    Object.assign(template, updateDto);
    return this.notificationTemplateRepository.save(template);
  }

  async deleteNotificationTemplate(id: string): Promise<void> {
    const template = await this.getNotificationTemplateById(id);
    await this.notificationTemplateRepository.remove(template);
  }

  // System Notification Methods
  async createSystemNotification(createDto: CreateSystemNotificationDto): Promise<SystemNotificationDto> {
    const notification = this.systemNotificationRepository.create({
      ...createDto,
      expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : null
    });
    
    return this.systemNotificationRepository.save(notification);
  }

  async getSystemNotifications(queryDto: SystemNotificationsQueryDto): Promise<SystemNotificationsResponseDto> {
    const { isActive, priority, page = 1, limit = 20 } = queryDto;
    const where: FindOptionsWhere<SystemNotification> = {};

    if (isActive !== undefined) where.isActive = isActive;
    if (priority) where.priority = priority;

    const [notifications, total] = await this.systemNotificationRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getSystemNotificationById(id: string): Promise<SystemNotificationDto> {
    const notification = await this.systemNotificationRepository.findOne({
      where: { id }
    });

    if (!notification) {
      throw new NotFoundException(`System notification with ID ${id} not found`);
    }

    return notification;
  }

  async updateSystemNotification(id: string, updateDto: UpdateSystemNotificationDto): Promise<SystemNotificationDto> {
    const notification = await this.getSystemNotificationById(id);

    // Handle date conversion for expiresAt
    if (updateDto.expiresAt) {
      updateDto.expiresAt = new Date(updateDto.expiresAt) as any;
    }

    // Update the notification with new values
    Object.assign(notification, updateDto);
    return this.systemNotificationRepository.save(notification);
  }

  async deleteSystemNotification(id: string): Promise<void> {
    const notification = await this.getSystemNotificationById(id);
    await this.systemNotificationRepository.remove(notification);
  }

  // User Notification Methods
  async createUserNotification(createDto: CreateUserNotificationDto): Promise<UserNotificationDto> {
    const notification = this.userNotificationRepository.create(createDto);
    return this.userNotificationRepository.save(notification);
  }

  async createUserNotifications(userIds: string[], notificationData: Omit<CreateUserNotificationDto, 'userId'>): Promise<number> {
    const notifications = userIds.map(userId => 
      this.userNotificationRepository.create({
        userId,
        ...notificationData
      })
    );
    
    const savedNotifications = await this.userNotificationRepository.save(notifications);
    return savedNotifications.length;
  }

  async getUserNotifications(queryDto: UserNotificationsQueryDto): Promise<UserNotificationsResponseDto> {
    const { userId, isRead, priority, page = 1, limit = 20 } = queryDto;
    const where: FindOptionsWhere<UserNotification> = { userId };

    if (isRead !== undefined) where.isRead = isRead;
    if (priority) where.priority = priority;

    const [notifications, total] = await this.userNotificationRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    // Count unread notifications
    const unreadCount = await this.userNotificationRepository.count({
      where: {
        userId,
        isRead: false
      }
    });

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount
    };
  }

  async getUserNotificationById(id: string): Promise<UserNotificationDto> {
    const notification = await this.userNotificationRepository.findOne({
      where: { id }
    });

    if (!notification) {
      throw new NotFoundException(`User notification with ID ${id} not found`);
    }

    return notification;
  }

  async updateUserNotification(id: string, updateDto: UpdateUserNotificationDto): Promise<UserNotificationDto> {
    const notification = await this.getUserNotificationById(id);

    // Update the notification with new values
    Object.assign(notification, updateDto);
    return this.userNotificationRepository.save(notification);
  }

  async markAllUserNotificationsAsRead(userId: string): Promise<number> {
    const result = await this.userNotificationRepository.update(
      { userId, isRead: false },
      { isRead: true }
    );

    return result.affected || 0;
  }

  async deleteUserNotification(id: string): Promise<void> {
    const notification = await this.getUserNotificationById(id);
    await this.userNotificationRepository.remove(notification);
  }

  // Notification Sending Logic
  async sendNotification(sendDto: SendNotificationDto): Promise<NotificationSendResponseDto> {
    const { templateId, userIds, roles, parameters, actionLink } = sendDto;
    
    // Get the notification template
    const template = await this.getNotificationTemplateById(templateId);
    
    if (!template.isActive) {
      throw new BadRequestException(`Notification template with ID ${templateId} is inactive`);
    }

    // Mock user IDs for demonstration purposes - in a real application, this would be fetched based on roles
    const mockUserIds = ['user1', 'user2', 'user3'];
    const targetUserIds = userIds || mockUserIds;
    
    try {
      // Replace template parameters
      let message = template.content;
      let title = template.subject;
      
      for (const [key, value] of Object.entries(parameters)) {
        const placeholder = `{{${key}}}`;
        message = message.replace(new RegExp(placeholder, 'g'), value as string);
        title = title.replace(new RegExp(placeholder, 'g'), value as string);
      }

      // Create notifications for each user
      const notificationData = {
        title,
        message,
        priority: NotificationPriority.MEDIUM,
        actionLink
      };

      const sent = await this.createUserNotifications(targetUserIds, notificationData);
      
      return {
        success: true,
        sent,
        failed: 0
      };
    } catch (error) {      return {
        success: false,
        sent: 0,
        failed: targetUserIds.length,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }
}
