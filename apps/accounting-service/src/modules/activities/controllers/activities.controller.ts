import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { ActivityFilterDto } from '../dtos/activity-filter.dto';
import { ActivityService } from '../services/activity.service';

@ApiTags('activities')
@Controller('activities')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ActivitiesController {
  constructor(private readonly activityService: ActivityService) {}  @Get()
  @ApiOperation({ summary: 'Get activities and action logs' })
  @ApiResponse({ status: 200, description: 'Activities retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid date range' })
  @ApiResponse({ status: 403, description: "You don't have permission to access these activity logs" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
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
