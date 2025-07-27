import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { EquipmentService } from '../services/equipment.service';
import { CreateEquipmentDto, UpdateEquipmentDto, EquipmentFilterDto } from '../dtos/equipment.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('equipment')
@Controller('equipment')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create new equipment' })
  @ApiResponse({ status: 201, description: 'Equipment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createEquipmentDto: CreateEquipmentDto) {
    const equipment = await this.equipmentService.create(createEquipmentDto);
    return {
      success: true,
      equipment,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all equipment' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiQuery({ name: 'portfolio_id', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'condition', required: false })
  @ApiQuery({ name: 'availability', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Equipment retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
    @Query() filters: EquipmentFilterDto,
  ) {
    const result = await this.equipmentService.findAll(filters, +page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get equipment by ID' })
  @ApiParam({ name: 'id', description: 'Equipment ID' })
  @ApiResponse({ status: 200, description: 'Equipment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async findOne(@Param('id') id: string) {
    const equipment = await this.equipmentService.findById(id);
    return {
      success: true,
      equipment,
    };
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update equipment' })
  @ApiParam({ name: 'id', description: 'Equipment ID' })
  @ApiResponse({ status: 200, description: 'Equipment updated successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async update(
    @Param('id') id: string,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
  ) {
    const equipment = await this.equipmentService.update(id, updateEquipmentDto);
    return {
      success: true,
      equipment,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete equipment' })
  @ApiParam({ name: 'id', description: 'Equipment ID' })
  @ApiResponse({ status: 200, description: 'Equipment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Equipment not found' })
  async remove(@Param('id') id: string) {
    return await this.equipmentService.delete(id);
  }
}