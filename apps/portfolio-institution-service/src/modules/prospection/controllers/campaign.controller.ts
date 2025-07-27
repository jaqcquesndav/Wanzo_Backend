import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { CampaignService } from '../services/campaign.service';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { CampaignStatus } from '../entities/campaign.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('prospection/campaigns')
@UseGuards(JwtAuthGuard)
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  async findAll(
    @Query('status') status: CampaignStatus,
    @Query('type') type: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    const result = await this.campaignService.findAll(status, type, page, limit);
    return result;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const campaign = await this.campaignService.findOne(id);
    return campaign;
  }

  @Post()
  async create(@Body() createCampaignDto: CreateCampaignDto, @Req() req) {
    const userId = req.user.id;
    const campaign = await this.campaignService.create(createCampaignDto, userId);
    return campaign;
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateCampaignDto: Partial<CreateCampaignDto>) {
    const campaign = await this.campaignService.update(id, updateCampaignDto);
    return campaign;
  }

  @Put(':id/metrics')
  async updateMetrics(
    @Param('id') id: string,
    @Body() metrics: { reached?: number; responded?: number; converted?: number; roi?: number },
  ) {
    const campaign = await this.campaignService.updateMetrics(id, metrics);
    return campaign;
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.campaignService.remove(id);
    return {
      success: true,
      message: 'Campaign deleted successfully',
    };
  }
}
