import { Controller, Get, Post, Put, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ProspectAnalysisService } from '../services/prospect-analysis.service';
import { CreateAnalysisDto } from '../dto/create-analysis.dto';
import { AnalysisStatus } from '../entities/prospect-analysis.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('prospect-analysis')
@UseGuards(JwtAuthGuard)
export class ProspectAnalysisController {
  constructor(private readonly analysisService: ProspectAnalysisService) {}

  @Post('prospect/:prospectId')
  async create(
    @Param('prospectId') prospectId: string,
    @Body() createAnalysisDto: CreateAnalysisDto,
    @Req() req,
  ) {
    const userId = req.user.id;
    const analysis = await this.analysisService.create(prospectId, createAnalysisDto, userId);
    return {
      success: true,
      analysis,
    };
  }

  @Get('prospect/:prospectId')
  async findByProspect(@Param('prospectId') prospectId: string) {
    const analyses = await this.analysisService.findByProspect(prospectId);
    return {
      success: true,
      analyses,
    };
  }

  @Get('prospect/:prospectId/score')
  async getProspectScore(@Param('prospectId') prospectId: string) {
    const result = await this.analysisService.getProspectScore(prospectId);
    return {
      success: true,
      score: result.score,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const analysis = await this.analysisService.findOne(id);
    return {
      success: true,
      analysis,
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAnalysisDto: Partial<CreateAnalysisDto>,
    @Req() req,
  ) {
    const userId = req.user.id;
    const analysis = await this.analysisService.update(id, updateAnalysisDto, userId);
    return {
      success: true,
      analysis,
    };
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: AnalysisStatus,
    @Req() req,
  ) {
    const userId = req.user.id;
    const analysis = await this.analysisService.updateStatus(id, status, userId);
    return {
      success: true,
      analysis,
    };
  }
}
