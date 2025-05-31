import { Controller, Get, Put, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { NotificationService } from '../services/notification.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Notification } from '../entities/notification.entity';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

interface NotificationResponse {
  success: boolean;
  notifications?: Notification[];
  notification?: Notification;
  message?: string;
  unreadCount?: number;
  page?: number;
  perPage?: number;
  total?: number;
}

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get user notifications',
    description: 'Retrieve a paginated list of notifications for the authenticated user'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'per_page', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
    @Req() req: AuthenticatedRequest,
  ): Promise<NotificationResponse> {
    const result = await this.notificationService.findAll(req.user.id, +page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@Req() req: AuthenticatedRequest): Promise<NotificationResponse> {
    const result = await this.notificationService.getUnreadCount(req.user.id);
    return {
      success: true,
      ...result,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification marked as read successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async markAsRead(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<NotificationResponse> {
    const notification = await this.notificationService.markAsRead(id, req.user.id);
    return {
      success: true,
      notification,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async remove(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<NotificationResponse> {
    return await this.notificationService.delete(id, req.user.id);
  }
}