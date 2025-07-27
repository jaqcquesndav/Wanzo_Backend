import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ProspectService } from '../services/prospect.service';
import { CreateProspectDto, UpdateProspectDto, ProspectFilterDto } from '../dtos/prospect.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('prospects')
@Controller('prospects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProspectController {
  constructor(private readonly prospectService: ProspectService) {}

  @Post()
  @Roles('admin', 'manager', 'analyst')
  @ApiOperation({ summary: 'Create new prospect' })
  @ApiResponse({ status: 201, description: 'Prospect created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createProspectDto: CreateProspectDto, @Req() req: any) {
    const prospect = await this.prospectService.create(
      createProspectDto,
      req.user.institutionId,
      req.user.id,
    );
    return {
      success: true,
      prospect,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all prospects' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Prospects retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
    @Query() filters: ProspectFilterDto,
  ) {
    const result = await this.prospectService.findAll(filters, +page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get prospect by ID' })
  @ApiParam({ name: 'id', description: 'Prospect ID' })
  @ApiResponse({ status: 200, description: 'Prospect retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Prospect not found' })
  async findOne(@Param('id') id: string) {
    const prospect = await this.prospectService.findById(id);
    return {
      success: true,
      prospect,
    };
  }

  @Put(':id')
  @Roles('admin', 'manager', 'analyst')
  @ApiOperation({ summary: 'Update prospect' })
  @ApiParam({ name: 'id', description: 'Prospect ID' })
  @ApiResponse({ status: 200, description: 'Prospect updated successfully' })
  @ApiResponse({ status: 404, description: 'Prospect not found' })
  async update(
    @Param('id') id: string,
    @Body() updateProspectDto: UpdateProspectDto,
  ) {
    const prospect = await this.prospectService.update(id, updateProspectDto);
    return {
      success: true,
      prospect,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete prospect' })
  @ApiParam({ name: 'id', description: 'Prospect ID' })
  @ApiResponse({ status: 200, description: 'Prospect deleted successfully' })
  @ApiResponse({ status: 404, description: 'Prospect not found' })
  async remove(@Param('id') id: string) {
    return await this.prospectService.delete(id);
  }
}