import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CreateFundingRequestDto, UpdateFundingRequestDto, FundingRequestFilterDto } from '../dtos/funding-request.dto';
import { FundingRequestService } from '../services/funding-request.service';
import { FundingRequestStatus } from '../entities/funding-request.entity';

@ApiTags('funding-requests')
@Controller('portfolios/traditional/funding-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FundingRequestController {
  constructor(private readonly fundingRequestService: FundingRequestService) {}

  @Post()
  @ApiOperation({ summary: 'Create new funding request' })
  @ApiResponse({ status: 201, description: 'Funding request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createFundingRequestDto: CreateFundingRequestDto, @Req() req: any) {
    const fundingRequest = await this.fundingRequestService.create(createFundingRequestDto, req.user.id);
    return {
      success: true,
      data: fundingRequest,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all funding requests' })
  @ApiQuery({ name: 'portfolioId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: Object.values(FundingRequestStatus) })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'productType', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['created_at', 'amount', 'client_name'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Funding requests retrieved successfully' })
  async findAll(@Query() filters: FundingRequestFilterDto) {
    const fundingRequests = await this.fundingRequestService.findAll(filters);
    return {
      success: true,
      data: fundingRequests,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get funding request by ID' })
  @ApiParam({ name: 'id', description: 'Funding request ID' })
  @ApiResponse({ status: 200, description: 'Funding request retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Funding request not found' })
  async findOne(@Param('id') id: string) {
    const fundingRequest = await this.fundingRequestService.findById(id);
    return {
      success: true,
      data: fundingRequest,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update funding request' })
  @ApiParam({ name: 'id', description: 'Funding request ID' })
  @ApiResponse({ status: 200, description: 'Funding request updated successfully' })
  @ApiResponse({ status: 404, description: 'Funding request not found' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async update(@Param('id') id: string, @Body() updateFundingRequestDto: UpdateFundingRequestDto) {
    const fundingRequest = await this.fundingRequestService.update(id, updateFundingRequestDto);
    return {
      success: true,
      data: fundingRequest,
    };
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update funding request status' })
  @ApiParam({ name: 'id', description: 'Funding request ID' })
  @ApiResponse({ status: 200, description: 'Funding request status updated successfully' })
  @ApiResponse({ status: 404, description: 'Funding request not found' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async updateStatus(
    @Param('id') id: string, 
    @Body('status') status: FundingRequestStatus,
    @Body('notes') notes: string,
    @Req() req: any
  ) {
    const fundingRequest = await this.fundingRequestService.updateStatus(id, status, notes, req.user.id);
    return {
      success: true,
      data: fundingRequest,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete funding request' })
  @ApiParam({ name: 'id', description: 'Funding request ID' })
  @ApiResponse({ status: 200, description: 'Funding request deleted successfully' })
  @ApiResponse({ status: 404, description: 'Funding request not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete funding request in current state' })
  async remove(@Param('id') id: string) {
    const result = await this.fundingRequestService.delete(id);
    return {
      success: true,
      message: result.message,
    };
  }
}
