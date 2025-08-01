import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '../enums/notification-type.enum';

export enum NotificationStatusQuery {
  ALL = 'all',
  READ = 'read',
  UNREAD = 'unread',
}

export class ListNotificationsDto {
  @ApiPropertyOptional({ description: 'Page number for pagination', default: 1, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10, type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100) // Max limit to prevent abuse
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter by notification status',
    enum: NotificationStatusQuery,
    default: NotificationStatusQuery.ALL,
  })
  @IsOptional()
  @IsEnum(NotificationStatusQuery)
  status?: NotificationStatusQuery = NotificationStatusQuery.ALL;

  @ApiPropertyOptional({ description: 'Filter by notification type', enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ description: 'Field to sort by', example: 'receivedAt', default: 'receivedAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'receivedAt';

  @ApiPropertyOptional({ description: "Sort order ('ASC' or 'DESC')", enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsOptional()
  @IsString()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
