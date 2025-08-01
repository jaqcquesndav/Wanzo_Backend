import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Put,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FinancingService } from './financing.service';
import { CreateFinancingRecordDto } from './dto/create-financing-record.dto';
import { UpdateFinancingRecordDto } from './dto/update-financing-record.dto';
import { ListFinancingRecordsDto } from './dto/list-financing-records.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FinancingRecord, FinancingType, FinancingRequestStatus } from './entities/financing-record.entity';
import { FinancingRequestResponseDto } from './dto/financing-request-response.dto';

@ApiTags('financing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/financing/requests')
export class FinancingController {
  constructor(private readonly financingService: FinancingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new financing request' })
  @ApiResponse({ status: 201, description: 'The financing request has been successfully created.', type: FinancingRequestResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(
    @Body() createFinancingRecordDto: CreateFinancingRecordDto,
    @CurrentUser() user: User,
  ) {
    const record = await this.financingService.create(createFinancingRecordDto, user);
    return {
      success: true,
      message: 'Financing request created successfully',
      data: FinancingRequestResponseDto.fromEntity(record),
      statusCode: 201
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all financing requests for the current user with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort by field name' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  @ApiQuery({ name: 'type', required: false, enum: FinancingType, description: 'Filter by financing type' })
  @ApiQuery({ name: 'status', required: false, enum: FinancingRequestStatus, description: 'Filter by financing status' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Filter from date (ISO8601)' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'Filter to date (ISO8601)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for source/purpose or terms' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved financing requests.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAll(@Query() listFinancingRecordsDto: ListFinancingRecordsDto, @CurrentUser() user: User) {
    const { data, total, page, limit } = await this.financingService.findAll(listFinancingRecordsDto, user);
    
    const transformedData = data.map(record => FinancingRequestResponseDto.fromEntity(record));
    
    return {
      success: true,
      message: 'Financing requests retrieved successfully',
      data: transformedData,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      statusCode: 200
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific financing request by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Financing Request ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved financing request.', type: FinancingRequestResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Financing request not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    const record = await this.financingService.findOne(id, user);
    return {
      success: true,
      message: 'Financing request retrieved successfully',
      data: FinancingRequestResponseDto.fromEntity(record),
      statusCode: 200
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a financing request by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Financing Request ID (UUID)' })
  @ApiResponse({ status: 200, description: 'The financing request has been successfully updated.', type: FinancingRequestResponseDto })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Financing request not found.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFinancingRecordDto: UpdateFinancingRecordDto,
    @CurrentUser() user: User,
  ) {
    const record = await this.financingService.update(id, updateFinancingRecordDto, user);
    return {
      success: true,
      message: 'Financing request updated successfully',
      data: FinancingRequestResponseDto.fromEntity(record),
      statusCode: 200
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a financing request by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Financing Request ID (UUID)' })
  @ApiResponse({ status: 200, description: 'The financing request has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Financing request not found.' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    await this.financingService.remove(id, user);
    return {
      success: true,
      message: 'Financing request deleted successfully',
      statusCode: 200
    };
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a financing request' })
  @ApiParam({ name: 'id', type: String, description: 'Financing Request ID (UUID)' })
  @ApiResponse({ status: 200, description: 'The financing request has been successfully submitted.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Financing request not found.' })
  async submitRequest(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    const record = await this.financingService.findOne(id, user);
    
    if (!record) {
      throw new NotFoundException(`Financing request with ID ${id} not found`);
    }
    
    if (record.status !== FinancingRequestStatus.DRAFT) {
      throw new BadRequestException('Only requests in draft status can be submitted');
    }
    
    const updatedRecord = await this.financingService.update(id, {
      status: FinancingRequestStatus.SUBMITTED,
      applicationDate: new Date()
    }, user);
    
    return {
      success: true,
      message: 'Demande de financement soumise avec succès',
      data: {
        id: updatedRecord.id,
        status: updatedRecord.status,
        applicationDate: updatedRecord.applicationDate
      },
      statusCode: 200
    };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a financing request' })
  @ApiParam({ name: 'id', type: String, description: 'Financing Request ID (UUID)' })
  @ApiResponse({ status: 200, description: 'The financing request has been successfully cancelled.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Financing request not found.' })
  async cancelRequest(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body('reason') reason: string,
    @CurrentUser() user: User
  ) {
    const record = await this.financingService.findOne(id, user);
    
    if (!record) {
      throw new NotFoundException(`Financing request with ID ${id} not found`);
    }
    
    // Cannot cancel completed, disbursed or already cancelled requests
    if ([FinancingRequestStatus.COMPLETED, FinancingRequestStatus.DISBURSED, FinancingRequestStatus.CANCELLED].includes(record.status)) {
      throw new BadRequestException(`Cannot cancel a request with status ${record.status}`);
    }
    
    const updatedRecord = await this.financingService.update(id, {
      status: FinancingRequestStatus.CANCELLED,
      notes: reason ? `${record.notes ? record.notes + '\n\n' : ''}Annulation: ${reason}` : record.notes
    }, user);
    
    return {
      success: true,
      message: 'Demande de financement annulée avec succès',
      data: {
        id: updatedRecord.id,
        status: updatedRecord.status
      },
      statusCode: 200
    };
  }
}
