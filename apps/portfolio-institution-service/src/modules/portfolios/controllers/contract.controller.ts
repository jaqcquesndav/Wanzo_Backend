import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ContractService, CreateContractFromRequestParams, ContractFilterDto } from '../services/contract.service';
import { ContractStatus } from '../entities/contract.entity';

@ApiTags('credit-contracts')
@Controller('portfolio_inst/portfolios/traditional/credit-contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

  @Post('from-request')
  @ApiOperation({ summary: 'Create a new contract from an approved funding request' })
  @ApiResponse({ status: 201, description: 'Contract created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or funding request not in approved status' })
  @ApiResponse({ status: 404, description: 'Funding request not found' })
  async createFromRequest(@Body() createContractDto: CreateContractFromRequestParams, @Req() req: any) {
    const contract = await this.contractService.createFromFundingRequest(createContractDto, req.user.id);
    return {
      success: true,
      data: contract,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all credit contracts' })
  @ApiQuery({ name: 'portfolioId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: Object.values(ContractStatus) })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'productType', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Contracts retrieved successfully' })
  async findAll(@Query() filters: ContractFilterDto) {
    const contracts = await this.contractService.findAll(filters);
    return {
      success: true,
      data: contracts,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get credit contract by ID' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'Contract retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async findOne(@Param('id') id: string) {
    const contract = await this.contractService.findOne(id);
    return {
      success: true,
      data: contract,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update credit contract' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'Contract updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async update(@Param('id') id: string, @Body() updateContractDto: any) {
    const contract = await this.contractService.update(id, updateContractDto);
    return {
      success: true,
      data: contract,
    };
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a draft contract' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'Contract activated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async activate(@Param('id') id: string, @Req() req: any) {
    const contract = await this.contractService.changeStatus(id, ContractStatus.ACTIVE, {});
    return {
      success: true,
      data: contract,
    };
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspend an active contract' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'Contract suspended successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async suspend(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: any) {
    const contract = await this.contractService.changeStatus(id, ContractStatus.SUSPENDED, body);
    return {
      success: true,
      data: contract,
    };
  }

  @Post(':id/default')
  @ApiOperation({ summary: 'Mark a contract as defaulted' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'Contract marked as defaulted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async markAsDefault(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: any) {
    const contract = await this.contractService.changeStatus(id, ContractStatus.DEFAULTED, body);
    return {
      success: true,
      data: contract,
    };
  }

  @Post(':id/restructure')
  @ApiOperation({ summary: 'Restructure a contract' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'Contract restructured successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async restructure(@Param('id') id: string, @Body() restructureDto: any, @Req() req: any) {
    // TODO: Implémenter la logique de restructuration
    const contract = await this.contractService.changeStatus(id, ContractStatus.RESTRUCTURED, restructureDto);
    return {
      success: true,
      data: contract,
    };
  }

  @Post(':id/litigation')
  @ApiOperation({ summary: 'Mark a contract as in litigation' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'Contract marked as in litigation successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async markAsLitigation(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: any) {
    const contract = await this.contractService.changeStatus(id, ContractStatus.LITIGATION, body);
    return {
      success: true,
      data: contract,
    };
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark a contract as completed' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'Contract marked as completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition or unpaid schedules' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async complete(@Param('id') id: string, @Req() req: any) {
    const contract = await this.contractService.changeStatus(id, ContractStatus.COMPLETED, {});
    return {
      success: true,
      data: contract,
    };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a draft contract' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'Contract canceled successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async cancel(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: any) {
    const contract = await this.contractService.changeStatus(id, ContractStatus.CANCELED, body);
    return {
      success: true,
      data: contract,
    };
  }

  @Get(':id/schedule')
  @ApiOperation({ summary: 'Get payment schedule for a contract' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'Payment schedule retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async getSchedule(@Param('id') id: string) {
    const schedule = await this.contractService.getSchedule(id);
    return {
      success: true,
      data: schedule,
    };
  }
}
