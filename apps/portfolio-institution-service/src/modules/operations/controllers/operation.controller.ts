import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { OperationService } from '../services/operation.service';
import { CreateOperationDto, UpdateOperationDto, OperationFilterDto } from '../dtos/operation.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiTags('operations')
@Controller('operations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OperationController {
  constructor(private readonly operationService: OperationService) {}

  @Post()
  @ApiOperation({ summary: 'Create new operation' })
  @ApiResponse({ status: 201, description: 'Operation created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createOperationDto: CreateOperationDto, @Req() req: any) {
    const operation = await this.operationService.create(createOperationDto, req.user.id);
    return {
      success: true,
      operation,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all operations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['credit', 'leasing', 'emission', 'subscription'] })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'active', 'completed', 'rejected', 'cancelled'] })
  @ApiQuery({ name: 'portfolio_id', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Operations retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 10,
    @Query() filters: OperationFilterDto,
    @Req() req: any,
  ) {
    // Si l'utilisateur n'est pas admin, forcer le filtrage par son entreprise
    if (req.user.role !== 'admin') {
      filters.companyId = req.user.companyId;
    }

    const result = await this.operationService.findAll(filters, +page, +perPage);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get operation by ID' })
  @ApiParam({ name: 'id', description: 'Operation ID' })
  @ApiResponse({ status: 200, description: 'Operation retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Operation not found' })
  async findOne(@Param('id') id: string) {
    const operation = await this.operationService.findById(id);
    return {
      success: true,
      operation,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update operation' })
  @ApiParam({ name: 'id', description: 'Operation ID' })
  @ApiResponse({ status: 200, description: 'Operation updated successfully' })
  @ApiResponse({ status: 404, description: 'Operation not found' })
  async update(
    @Param('id') id: string,
    @Body() updateOperationDto: UpdateOperationDto,
  ) {
    const operation = await this.operationService.update(id, updateOperationDto);
    return {
      success: true,
      operation,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete operation' })
  @ApiParam({ name: 'id', description: 'Operation ID' })
  @ApiResponse({ status: 200, description: 'Operation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Operation not found' })
  async remove(@Param('id') id: string) {
    return await this.operationService.delete(id);
  }
}