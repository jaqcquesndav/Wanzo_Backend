import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { LeadsService } from '../services/leads.service';
import { SearchLeadsDto } from '../dto/search-leads.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('prospection/leads')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('search')
  async searchLeads(@Body() searchLeadsDto: SearchLeadsDto): Promise<any> {
    return this.leadsService.searchLeads(searchLeadsDto);
  }
}
