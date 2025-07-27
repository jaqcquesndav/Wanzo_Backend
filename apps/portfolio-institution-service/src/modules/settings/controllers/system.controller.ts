import { Controller, Get, Post, Delete, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SystemService } from '../services/system.service';
import { SystemInfoResponseDto, SystemLogFilterDto, MaintenanceScheduleDto } from '../dtos/system.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('settings/system')
@Controller('settings/system')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get system information' })
  @ApiResponse({ status: 200, description: 'System information retrieved successfully' })
  async getSystemInfo(): Promise<{ success: boolean; info: SystemInfoResponseDto }> {
    const info = await this.systemService.getSystemInfo();
    return {
      success: true,
      info,
    };
  }

  @Get('logs')
  @Roles('admin')
  @ApiOperation({ summary: 'Get system logs' })
  @ApiResponse({ status: 200, description: 'System logs retrieved successfully' })
  async getLogs(@Query() filter: SystemLogFilterDto) {
    const logs = await this.systemService.getLogs(filter);
    return {
      success: true,
      ...logs,
    };
  }

  @Post('maintenance')
  @Roles('admin')
  @ApiOperation({ summary: 'Schedule system maintenance' })
  @ApiResponse({ status: 201, description: 'Maintenance scheduled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Maintenance already scheduled' })
  async scheduleMaintenance(@Body() maintenanceDto: MaintenanceScheduleDto, @Req() req: any) {
    const maintenance = await this.systemService.scheduleMaintenance(maintenanceDto, req.user.id);
    return {
      success: true,
      maintenance,
    };
  }

  @Delete('maintenance')
  @Roles('admin')
  @ApiOperation({ summary: 'Cancel scheduled maintenance' })
  @ApiResponse({ status: 200, description: 'Maintenance cancelled successfully' })
  @ApiResponse({ status: 404, description: 'No maintenance scheduled' })
  async cancelMaintenance() {
    return await this.systemService.cancelMaintenance();
  }
}
