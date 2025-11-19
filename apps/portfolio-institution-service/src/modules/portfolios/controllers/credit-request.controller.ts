import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CreditRequestService } from '../services/credit-request.service';
import { CreateCreditRequestDto, UpdateCreditRequestDto, CreditRequestFilterDto } from '../dtos/credit-request.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('credit-requests')
@Controller('portfolios/traditional/credit-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CreditRequestController {
  constructor(private readonly creditRequestService: CreditRequestService) {}

  @Post()
  @Roles('admin', 'credit_manager')
  @ApiOperation({ summary: 'Create new credit request' })
  @ApiResponse({ status: 201, description: 'Credit request created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createCreditRequestDto: CreateCreditRequestDto, @Req() req: any) {
    const creditRequest = await this.creditRequestService.create(createCreditRequestDto, req.user.id);
    return {
      success: true,
      data: creditRequest,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all credit requests' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'portfolioId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'productType', required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiResponse({ status: 200, description: 'Credit requests retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query() filters: CreditRequestFilterDto,
    @Req() req: any,
  ) {
    const result = await this.creditRequestService.findAll(filters, +page, +limit);
    return {
      success: true,
      data: result.creditRequests,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.perPage,
        totalPages: Math.ceil(result.total / result.perPage)
      }
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get credit request by ID' })
  @ApiParam({ name: 'id', description: 'Credit request ID' })
  @ApiResponse({ status: 200, description: 'Credit request retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Credit request not found' })
  async findOne(@Param('id') id: string) {
    const creditRequest = await this.creditRequestService.findById(id);
    return {
      success: true,
      data: creditRequest,
    };
  }

  @Put(':id')
  @Roles('admin', 'credit_manager')
  @ApiOperation({ summary: 'Update credit request' })
  @ApiParam({ name: 'id', description: 'Credit request ID' })
  @ApiResponse({ status: 200, description: 'Credit request updated successfully' })
  @ApiResponse({ status: 404, description: 'Credit request not found' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async update(@Param('id') id: string, @Body() updateCreditRequestDto: UpdateCreditRequestDto) {
    const creditRequest = await this.creditRequestService.update(id, updateCreditRequestDto);
    return {
      success: true,
      data: creditRequest,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete credit request' })
  @ApiParam({ name: 'id', description: 'Credit request ID' })
  @ApiResponse({ status: 200, description: 'Credit request deleted successfully' })
  @ApiResponse({ status: 404, description: 'Credit request not found' })
  async remove(@Param('id') id: string) {
    const result = await this.creditRequestService.delete(id);
    return {
      success: true,
      message: result.message,
    };
  }

  @Post(':id/approve')
  @Roles('admin', 'credit_manager')
  @ApiOperation({ summary: 'Approve credit request' })
  @ApiParam({ name: 'id', description: 'Credit request ID' })
  @ApiResponse({ status: 200, description: 'Credit request approved successfully' })
  @ApiResponse({ status: 404, description: 'Credit request not found' })
  async approve(@Param('id') id: string, @Body() approvalData: { notes?: string }) {
    const result = await this.creditRequestService.approve(id, approvalData);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/reject')
  @Roles('admin', 'credit_manager')
  @ApiOperation({ summary: 'Reject credit request' })
  @ApiParam({ name: 'id', description: 'Credit request ID' })
  @ApiResponse({ status: 200, description: 'Credit request rejected successfully' })
  @ApiResponse({ status: 404, description: 'Credit request not found' })
  async reject(@Param('id') id: string, @Body() rejectionData: { reason: string; notes?: string }) {
    const result = await this.creditRequestService.reject(id, rejectionData);
    return {
      success: true,
      data: result,
    };
  }

  @Post(':id/documents')
  @Roles('admin', 'credit_manager')
  @ApiOperation({ summary: 'Add document to credit request' })
  @ApiParam({ name: 'id', description: 'Credit request ID' })
  @ApiResponse({ status: 201, description: 'Document added successfully' })
  @ApiResponse({ status: 404, description: 'Credit request not found' })
  async addDocument(
    @Param('id') id: string,
    @Body() documentData: { name: string; type: string; content: string; mimeType: string; description?: string },
    @Req() req: any
  ) {
    const result = await this.creditRequestService.addDocument(id, documentData, req.user.id);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Get all documents of a credit request' })
  @ApiParam({ name: 'id', description: 'Credit request ID' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Credit request not found' })
  async getDocuments(@Param('id') id: string) {
    const documents = await this.creditRequestService.getDocuments(id);
    return {
      success: true,
      data: documents,
    };
  }

  @Delete(':id/documents/:documentId')
  @Roles('admin', 'credit_manager')
  @ApiOperation({ summary: 'Delete document from credit request' })
  @ApiParam({ name: 'id', description: 'Credit request ID' })
  @ApiParam({ name: 'documentId', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async deleteDocument(@Param('id') id: string, @Param('documentId') documentId: string) {
    await this.creditRequestService.deleteDocument(id, documentId);
    return {
      success: true,
      message: 'Document deleted successfully',
    };
  }

  @Patch(':id/status')
  @Roles('admin', 'credit_manager')
  @ApiOperation({ summary: 'Change credit request status' })
  @ApiParam({ name: 'id', description: 'Credit request ID' })
  @ApiResponse({ status: 200, description: 'Status changed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 404, description: 'Credit request not found' })
  async changeStatus(@Param('id') id: string, @Body() statusData: { status: string }) {
    const result = await this.creditRequestService.changeStatus(id, statusData.status);
    return {
      success: true,
      data: result,
    };
  }

  @Post('reset')
  @Roles('admin')
  @ApiOperation({ summary: 'Reset credit requests to mock data (development only)' })
  @ApiResponse({ status: 200, description: 'Credit requests reset successfully' })
  async reset() {
    const result = await this.creditRequestService.resetToMockData();
    return {
      success: true,
      data: result,
    };
  }
}
