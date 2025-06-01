import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { SystemService } from '../services';
import {
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

@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  // Audit Log Endpoints
  @Post('audit-logs')
  async createAuditLog(@Body() createDto: CreateAuditLogDto) {
    return this.systemService.createAuditLog(createDto);
  }

  @Get('audit-logs')
  async getAuditLogs(@Query() queryDto: AuditLogQueryDto): Promise<AuditLogsResponseDto> {
    return this.systemService.getAuditLogs(queryDto);
  }

  @Get('audit-logs/:id')
  async getAuditLogById(@Param('id', ParseUUIDPipe) id: string) {
    return this.systemService.getAuditLogById(id);
  }

  // Notification Templates Endpoints
  @Post('notification-templates')
  async createNotificationTemplate(@Body() createDto: CreateNotificationTemplateDto): Promise<NotificationTemplateDto> {
    return this.systemService.createNotificationTemplate(createDto);
  }

  @Get('notification-templates')
  async getNotificationTemplates(@Query() queryDto: NotificationTemplatesQueryDto): Promise<NotificationTemplatesResponseDto> {
    return this.systemService.getNotificationTemplates(queryDto);
  }

  @Get('notification-templates/:id')
  async getNotificationTemplateById(@Param('id', ParseUUIDPipe) id: string): Promise<NotificationTemplateDto> {
    return this.systemService.getNotificationTemplateById(id);
  }

  @Put('notification-templates/:id')
  async updateNotificationTemplate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateNotificationTemplateDto
  ): Promise<NotificationTemplateDto> {
    return this.systemService.updateNotificationTemplate(id, updateDto);
  }

  @Delete('notification-templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotificationTemplate(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.systemService.deleteNotificationTemplate(id);
  }

  // System Notifications Endpoints
  @Post('notifications')
  async createSystemNotification(@Body() createDto: CreateSystemNotificationDto): Promise<SystemNotificationDto> {
    return this.systemService.createSystemNotification(createDto);
  }

  @Get('notifications')
  async getSystemNotifications(@Query() queryDto: SystemNotificationsQueryDto): Promise<SystemNotificationsResponseDto> {
    return this.systemService.getSystemNotifications(queryDto);
  }

  @Get('notifications/:id')
  async getSystemNotificationById(@Param('id', ParseUUIDPipe) id: string): Promise<SystemNotificationDto> {
    return this.systemService.getSystemNotificationById(id);
  }

  @Put('notifications/:id')
  async updateSystemNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSystemNotificationDto
  ): Promise<SystemNotificationDto> {
    return this.systemService.updateSystemNotification(id, updateDto);
  }

  @Delete('notifications/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSystemNotification(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.systemService.deleteSystemNotification(id);
  }

  // User Notifications Endpoints
  @Post('user-notifications')
  async createUserNotification(@Body() createDto: CreateUserNotificationDto): Promise<UserNotificationDto> {
    return this.systemService.createUserNotification(createDto);
  }

  @Get('user-notifications')
  async getUserNotifications(@Query() queryDto: UserNotificationsQueryDto): Promise<UserNotificationsResponseDto> {
    return this.systemService.getUserNotifications(queryDto);
  }

  @Get('user-notifications/:id')
  async getUserNotificationById(@Param('id', ParseUUIDPipe) id: string): Promise<UserNotificationDto> {
    return this.systemService.getUserNotificationById(id);
  }

  @Put('user-notifications/:id')
  async updateUserNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateUserNotificationDto
  ): Promise<UserNotificationDto> {
    return this.systemService.updateUserNotification(id, updateDto);
  }

  @Put('user-notifications/mark-all-read/:userId')
  async markAllUserNotificationsAsRead(@Param('userId', ParseUUIDPipe) userId: string): Promise<{ count: number }> {
    const count = await this.systemService.markAllUserNotificationsAsRead(userId);
    return { count };
  }

  @Delete('user-notifications/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserNotification(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.systemService.deleteUserNotification(id);
  }

  // Notification Sending Endpoint
  @Post('send-notification')
  async sendNotification(@Body() sendDto: SendNotificationDto): Promise<NotificationSendResponseDto> {
    return this.systemService.sendNotification(sendDto);
  }
}
