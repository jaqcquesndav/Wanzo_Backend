import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { DisbursementService } from '../services/disbursement.service';
import { DisbursementStatus } from '../entities/disbursement.entity';

@ApiTags('disbursements')
@Controller('portfolios/traditional/disbursements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DisbursementController {
  constructor(private readonly disbursementService: DisbursementService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new disbursement for a contract' })
  @ApiResponse({ status: 201, description: 'Disbursement created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or contract not in active status' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async create(@Body() createDisbursementDto: any, @Req() req: any) {
    const disbursement = await this.disbursementService.create(
      createDisbursementDto,
      req.user.id
    );
    
    return {
      success: true,
      data: disbursement,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all disbursements' })
  @ApiQuery({ name: 'contractId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: Object.values(DisbursementStatus) })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Disbursements retrieved successfully' })
  async findAll(@Query() filters: any) {
    const disbursements = await this.disbursementService.findAll(filters);
    return {
      success: true,
      data: disbursements,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get disbursement by ID' })
  @ApiParam({ name: 'id', description: 'Disbursement ID' })
  @ApiResponse({ status: 200, description: 'Disbursement retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Disbursement not found' })
  async findOne(@Param('id') id: string) {
    const disbursement = await this.disbursementService.findOne(id);
    return {
      success: true,
      data: disbursement,
    };
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a pending disbursement' })
  @ApiParam({ name: 'id', description: 'Disbursement ID' })
  @ApiResponse({ status: 200, description: 'Disbursement approved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Disbursement not found' })
  @Roles('admin', 'finance-manager')
  async approve(@Param('id') id: string, @Body() approveDto: any, @Req() req: any) {
    const disbursement = await this.disbursementService.approve(
      id, 
      approveDto,
      req.user.id
    );
    
    return {
      success: true,
      data: disbursement,
    };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject a pending disbursement' })
  @ApiParam({ name: 'id', description: 'Disbursement ID' })
  @ApiResponse({ status: 200, description: 'Disbursement rejected successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Disbursement not found' })
  @Roles('admin', 'finance-manager')
  async reject(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: any) {
    const disbursement = await this.disbursementService.reject(
      id, 
      body.reason,
      req.user.id
    );
    
    return {
      success: true,
      data: disbursement,
    };
  }

  @Post(':id/process')
  @ApiOperation({ summary: 'Mark an approved disbursement as processed/executed' })
  @ApiParam({ name: 'id', description: 'Disbursement ID' })
  @ApiResponse({ status: 200, description: 'Disbursement processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Disbursement not found' })
  @Roles('admin', 'finance-manager')
  async process(@Param('id') id: string, @Body() executeDto: any, @Req() req: any) {
    const disbursement = await this.disbursementService.execute(
      id, 
      executeDto,
      req.user.id
    );
    
    return {
      success: true,
      data: disbursement,
    };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a pending or approved disbursement' })
  @ApiParam({ name: 'id', description: 'Disbursement ID' })
  @ApiResponse({ status: 200, description: 'Disbursement canceled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Disbursement not found' })
  @Roles('admin', 'finance-manager')
  async cancel(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: any) {
    const disbursement = await this.disbursementService.cancel(
      id, 
      body.reason,
      req.user.id
    );
    
    return {
      success: true,
      data: disbursement,
    };
  }
}
