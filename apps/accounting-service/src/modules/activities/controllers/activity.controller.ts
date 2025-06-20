import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ActivityService } from '../services/activity.service';
import { ActivityFilterDto } from '../dtos/activity.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiTags('activities')
@ApiBearerAuth()
@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get activities and action logs',
    description: 'Retrieve activities and action logs with filtering and pagination'
  })
  @ApiQuery({ name: 'entityType', required: false, description: "Filter by entity type ('journal-entry', 'account', 'fiscal-year', etc.)" })
  @ApiQuery({ name: 'entityId', required: false, description: 'Filter by entity ID' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'actionType', required: false, description: "Filter by action type ('create', 'update', 'delete', 'view', 'login', 'logout', etc.)" })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for filter (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for filter (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Number of activities per page (default: 20)' })
  @ApiQuery({ name: 'export', required: false, description: "Export format ('csv', 'excel', 'pdf')" })
  @ApiResponse({ status: 200, description: 'Activities retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid date range' })
  @ApiResponse({ status: 403, description: "You don't have permission to access these activity logs" })
  async getActivities(
    @Query() filters: ActivityFilterDto,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
  ) {
    const result = await this.activityService.findAll(filters, +page, +pageSize);
    return {
      success: true,
      data: result,
    };
  }
}