import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VirementsService } from '../services/virements.service';
import { CreateDisbursementDto, UpdateDisbursementDto } from '../dtos/disbursement.dto';
import { Disbursement, DisbursementStatus } from '../entities/disbursement.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

@ApiTags('virements')
@Controller('virements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VirementsController {
  constructor(private readonly virementsService: VirementsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all disbursements' })
  @ApiResponse({ status: 200, description: 'Returns all disbursements with pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status', enum: DisbursementStatus })
  @ApiQuery({ name: 'portfolioId', required: false, description: 'Filter by portfolio ID' })
  async findAll(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: DisbursementStatus,
    @Query('portfolioId') portfolioId?: string,
  ) {
    const filters: any = {};
    
    // Add institutionId from the JWT token
    filters.institutionId = req.user.institutionId;
    
    if (status) {
      filters.status = status;
    }
    
    if (portfolioId) {
      filters.portfolioId = portfolioId;
    }
    
    const result = await this.virementsService.findAll(filters, +page, +limit);
    
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get disbursement by ID' })
  @ApiResponse({ status: 200, description: 'Returns the disbursement' })
  @ApiResponse({ status: 404, description: 'Disbursement not found' })
  async findOne(@Param('id') id: string) {
    const disbursement = await this.virementsService.findOne(id);
    return {
      success: true,
      data: disbursement,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new disbursement' })
  @ApiResponse({ status: 201, description: 'Disbursement created successfully' })
  async create(@Body() createDisbursementDto: CreateDisbursementDto, @Req() req: any) {
    // Create the disbursement
    const disbursement = await this.virementsService.create(createDisbursementDto);
    
    return {
      success: true,
      data: disbursement,
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a disbursement' })
  @ApiResponse({ status: 200, description: 'Disbursement updated successfully' })
  @ApiResponse({ status: 404, description: 'Disbursement not found' })
  async update(@Param('id') id: string, @Body() updateDisbursementDto: UpdateDisbursementDto) {
    const disbursement = await this.virementsService.update(id, updateDisbursementDto);
    return {
      success: true,
      data: disbursement,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a disbursement' })
  @ApiResponse({ status: 200, description: 'Disbursement deleted successfully' })
  @ApiResponse({ status: 404, description: 'Disbursement not found' })
  async remove(@Param('id') id: string) {
    await this.virementsService.remove(id);
    return {
      success: true,
      message: 'Disbursement deleted successfully',
    };
  }

  @Get('portfolio/:portfolioId')
  @ApiOperation({ summary: 'Get disbursements by portfolio ID' })
  @ApiResponse({ status: 200, description: 'Returns all disbursements for the specified portfolio' })
  async findByPortfolio(@Param('portfolioId') portfolioId: string) {
    const disbursements = await this.virementsService.findByPortfolio(portfolioId);
    return {
      success: true,
      data: disbursements,
    };
  }

  @Get('contract/:contractReference')
  @ApiOperation({ summary: 'Get disbursements by contract reference' })
  @ApiResponse({ status: 200, description: 'Returns all disbursements for the specified contract' })
  async findByContract(@Param('contractReference') contractReference: string) {
    const disbursements = await this.virementsService.findByContract(contractReference);
    return {
      success: true,
      data: disbursements,
    };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update disbursement status' })
  @ApiResponse({ status: 200, description: 'Disbursement status updated successfully' })
  @ApiResponse({ status: 404, description: 'Disbursement not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: DisbursementStatus,
  ) {
    const disbursement = await this.virementsService.updateStatus(id, status);
    return {
      success: true,
      data: disbursement,
    };
  }
}
