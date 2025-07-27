import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatsService } from '../services/stats.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('prospection/stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getProspectionStats(
    @Query('period') period: 'week' | 'month' | 'quarter' | 'year' = 'month',
  ) {
    return this.statsService.getProspectionStats(period);
  }
}
