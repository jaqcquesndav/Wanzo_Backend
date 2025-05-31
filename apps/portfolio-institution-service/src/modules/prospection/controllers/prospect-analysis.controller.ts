import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ProspectAnalysisService } from '../services/prospect-analysis.service';
import { CreateAnalysisDto, UpdateAnalysisDto, AnalysisFilterDto } from '../dtos/prospect-analysis.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SubscriptionGuard } from '../../institution/guards/subscription.guard';
import { TokenGuard } from '../../institution/guards/token.guard';

@ApiTags('prospect-analysis')
@Controller('prospect-analysis')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionGuard)
@ApiBearerAuth()
export class ProspectAnalysisController {
  constructor(private readonly analysisService: ProspectAnalysisService) {}

  @Post(':prospectId')
  @UseGuards(TokenGuard)
  @Roles('admin', 'manager', 'analyst')
  @ApiOperation({ summary: 'Create new prospect analysis' })
  @ApiParam({ name: 'prospectId', description: 'Prospect ID' })
  @ApiResponse({ status: 201, description: 'Analysis created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(
    @Param('prospectId') prospectId: string,
    @Body() createAnalysisDto: CreateAnalysisDto,
    @Req() req: any,
  ) {
    const analysis = await this.analysisService.create(
      prospectId,
      createAnalysisDto,
      req.user.id,
    );
    return {
      success: true,
      analysis,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all analyses' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['financial', 'market', 'operational', 'risk'] })
  @ApiQuery({ name: 'status', required: false, enum: ['in_progress', 'completed', 'rejected'] })
  @ApiQuery({ name: 'min_score', required: false, type: Number })
  @ApiQuery({ name: 'max_score', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Analyses retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
    @Query() filters: AnalysisFilterDto,
  ) {
    const result = await this.analysisService.findAll(filters, +page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get analysis by ID' })
  @ApiParam({ name: 'id', description: 'Analysis ID' })
  @ApiResponse({ status: 200, description: 'Analysis retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Analysis not found' })
  async findOne(@Param('id') id: string) {
    const analysis = await this.analysisService.findById(id);
    return {
      success: true,
      analysis,
    };
  }

  @Put(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Update analysis' })
  @ApiParam({ name: 'id', description: 'Analysis ID' })
  @ApiResponse({ status: 200, description: 'Analysis updated successfully' })
  @ApiResponse({ status: 404, description: 'Analysis not found' })
  async update(
    @Param('id') id: string,
    @Body() updateAnalysisDto: UpdateAnalysisDto,
    @Req() req: any,
  ) {
    const analysis = await this.analysisService.update(id, updateAnalysisDto, req.user.id);
    return {
      success: true,
      analysis,
    };
  }

  @Get('prospect/:prospectId')
  @ApiOperation({ summary: 'Get analyses by prospect' })
  @ApiParam({ name: 'prospectId', description: 'Prospect ID' })
  @ApiResponse({ status: 200, description: 'Analyses retrieved successfully' })
  async findByProspect(@Param('prospectId') prospectId: string) {
    const analyses = await this.analysisService.findByProspect(prospectId);
    return {
      success: true,
      analyses,
    };
  }

  @Get('prospect/:prospectId/latest')
  @ApiOperation({ summary: 'Get latest analysis for prospect' })
  @ApiParam({ name: 'prospectId', description: 'Prospect ID' })
  @ApiResponse({ status: 200, description: 'Latest analysis retrieved successfully' })
  async getLatestAnalysis(@Param('prospectId') prospectId: string) {
    const analysis = await this.analysisService.getLatestAnalysis(prospectId);
    return {
      success: true,
      analysis,
    };
  }

  @Get('prospect/:prospectId/score')
  @ApiOperation({ summary: 'Get aggregate analysis score for prospect' })
  @ApiParam({ name: 'prospectId', description: 'Prospect ID' })
  @ApiResponse({ status: 200, description: 'Aggregate score calculated successfully' })
  async getAggregateScore(@Param('prospectId') prospectId: string) {
    const score = await this.analysisService.calculateAggregateScore(prospectId);
    return {
      success: true,
      score,
    };
  }
}