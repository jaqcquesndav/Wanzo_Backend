import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ListNotificationsDto, NotificationStatusQuery } from './dto/list-notifications.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Notification, NotificationType } from './entities/notification.entity';
import { UpdateResult } from 'typeorm';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort by field name (e.g., receivedAt)', example: 'receivedAt' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  @ApiQuery({ name: 'status', required: false, enum: NotificationStatusQuery, description: 'Filter by read/unread status' })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType, description: 'Filter by notification type' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved notifications.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(
    @Query() listNotificationsDto: ListNotificationsDto,
    @CurrentUser() user: User,
  ): Promise<{ data: Notification[]; total: number; page: number; limit: number }> {
    return this.notificationsService.findAllForUser(listNotificationsDto, user);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get the count of unread notifications for the current user' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved unread notification count.', type: Number })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  getUnreadCount(@CurrentUser() user: User): Promise<number> {
    return this.notificationsService.countUnread(user.id);
  }

  @Post(':id/mark-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a specific notification as read' })
  @ApiParam({ name: 'id', type: String, description: 'Notification ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Notification marked as read.', type: Notification })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(id, user);
  }

  @Post('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all unread notifications as read for the current user' })
  @ApiResponse({ status: 200, description: 'All unread notifications marked as read.', schema: { example: { affected: 5 } } })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  markAllAsRead(@CurrentUser() user: User): Promise<UpdateResult> { // UpdateResult might be more appropriate here
    return this.notificationsService.markAllAsRead(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Notification ID (UUID)' })
  @ApiResponse({ status: 204, description: 'Notification successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    return this.notificationsService.remove(id, user);
  }
}
