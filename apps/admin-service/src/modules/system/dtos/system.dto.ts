import { 
  IsString, 
  IsOptional, 
  IsBoolean, 
  IsObject, 
  IsUUID, 
  IsEnum, 
  IsDateString, 
  IsIP, 
  IsNumber,
  IsUrl,
  IsIn,
  Min,
  Max,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationPriority } from '../entities/system.entity';

// Audit Log DTOs
export class AuditLogDto {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState: Record<string, any>;
  newState: Record<string, any>;
  userId: string;
  userIp: string;
  userAgent: string;
  timestamp: Date;
}

export class AuditLogQueryDto {
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CreateAuditLogDto {
  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsString()
  entityId?: string;

  @IsOptional()
  @IsObject()
  previousState?: Record<string, any>;

  @IsOptional()
  @IsObject()
  newState?: Record<string, any>;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsIP()
  userIp?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class AuditLogsResponseDto {
  logs: AuditLogDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Notification Template DTOs
export class NotificationTemplateDto {
  id: string;
  name: string;
  type: string;
  subject: string;
  content: string;
  parameters: Record<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateNotificationTemplateDto {
  @IsString()
  name: string;

  @IsString()
  @IsIn(['email', 'sms', 'push', 'in-app'])
  type: string;

  @IsString()
  subject: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsObject()
  parameters?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpdateNotificationTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(['email', 'sms', 'push', 'in-app'])
  type?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsObject()
  parameters?: Record<string, string>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class NotificationTemplatesQueryDto {
  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class NotificationTemplatesResponseDto {
  templates: NotificationTemplateDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// System Notification DTOs
export class SystemNotificationDto {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  isActive: boolean;
  expiresAt: Date;
  actionLink: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateSystemNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority = NotificationPriority.MEDIUM;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsUrl()
  actionLink?: string;
}

export class UpdateSystemNotificationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsUrl()
  actionLink?: string;
}

export class SystemNotificationsQueryDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class SystemNotificationsResponseDto {
  notifications: SystemNotificationDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// User Notification DTOs
export class UserNotificationDto {
  id: string;
  userId: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  actionLink: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CreateUserNotificationDto {
  @IsUUID()
  userId: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority = NotificationPriority.MEDIUM;

  @IsOptional()
  @IsUrl()
  actionLink?: string;
}

export class UpdateUserNotificationDto {
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}

export class UserNotificationsQueryDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class UserNotificationsResponseDto {
  notifications: UserNotificationDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}

// Notification sending DTO
export class SendNotificationDto {
  @IsString()
  templateId: string;

  @IsOptional()
  @IsUUID(undefined, { each: true })
  userIds?: string[];

  @IsOptional()
  @IsString({ each: true })
  roles?: string[];

  @IsObject()
  parameters: Record<string, any>;

  @IsOptional()
  @IsUrl()
  actionLink?: string;
}

export class NotificationSendResponseDto {
  success: boolean;
  sent: number;
  failed: number;
  errors?: string[];
}
