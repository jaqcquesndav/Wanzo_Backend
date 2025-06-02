import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { TokenMonitorService } from '../services/token-monitor.service';

@ApiTags('token-analytics')
@Controller('token-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TokenAnalyticsController {
  constructor(private readonly tokenMonitorService: TokenMonitorService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get token usage analytics' })
  @ApiResponse({ status: 200, description: 'Token analytics retrieved successfully' })
  async getTokenAnalytics(@Req() req: any) {
    const analytics = await this.tokenMonitorService.generateTokenUsageAnalytics(
      req.user.institutionId
    );
    
    return {
      success: true,
      analytics
    };
  }
}
