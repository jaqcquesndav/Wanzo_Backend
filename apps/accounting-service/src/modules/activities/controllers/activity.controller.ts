import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ActivityService } from '../services/activity.service';
import { ActivityFilterDto } from '../dtos/activity.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('activities')
@ApiBearerAuth()
@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all activities',
    description: 'Retrieve a paginated list of system activities'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'per_page', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Activities retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
    @Query() filters: ActivityFilterDto,
  ) {
    const result = await this.activityService.findAll(filters, +page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user activities' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'per_page', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'User activities retrieved successfully' })
  async findUserActivities(
    @Param('userId') userId: string,
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
  ) {
    const result = await this.activityService.findUserActivities(userId, +page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get('companies/:companyId')
  @ApiOperation({ summary: 'Get company activities' })
  @ApiParam({ name: 'companyId', description: 'Company ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'per_page', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiResponse({ status: 200, description: 'Company activities retrieved successfully' })
  async findCompanyActivities(
    @Param('companyId') companyId: string,
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
  ) {
    const result = await this.activityService.findCompanyActivities(companyId, +page, +perPage);
    return {
      success: true,
      ...result,
    };
  }
}