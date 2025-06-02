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
} from '@nestjs/common';
import { FinancingService } from './financing.service';
import { CreateFinancingRecordDto } from './dto/create-financing-record.dto';
import { UpdateFinancingRecordDto } from './dto/update-financing-record.dto';
import { ListFinancingRecordsDto } from './dto/list-financing-records.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { FinancingRecord, FinancingRecordType, FinancingRecordStatus } from './entities/financing-record.entity';

@ApiTags('Financing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('financing')
export class FinancingController {
  constructor(private readonly financingService: FinancingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new financing record' })
  @ApiResponse({ status: 201, description: 'The financing record has been successfully created.', type: FinancingRecord })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  create(
    @Body() createFinancingRecordDto: CreateFinancingRecordDto,
    @CurrentUser() user: User,
  ): Promise<FinancingRecord> {
    return this.financingService.create(createFinancingRecordDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List all financing records for the current user with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort by field name' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order' })
  @ApiQuery({ name: 'type', required: false, enum: FinancingRecordType, description: 'Filter by financing type' })
  @ApiQuery({ name: 'status', required: false, enum: FinancingRecordStatus, description: 'Filter by financing status' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String, description: 'Filter from date (ISO8601)' })
  @ApiQuery({ name: 'dateTo', required: false, type: String, description: 'Filter to date (ISO8601)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for source/purpose or terms' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved financing records.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@Query() listFinancingRecordsDto: ListFinancingRecordsDto, @CurrentUser() user: User) {
    // The return type of financingService.findAll is { data: FinancingRecord[], total: number, page: number, limit: number }
    return this.financingService.findAll(listFinancingRecordsDto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific financing record by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Financing Record ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved financing record.', type: FinancingRecord })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Financing record not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User): Promise<FinancingRecord> {
    return this.financingService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a financing record by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Financing Record ID (UUID)' })
  @ApiResponse({ status: 200, description: 'The financing record has been successfully updated.', type: FinancingRecord })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Financing record not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFinancingRecordDto: UpdateFinancingRecordDto,
    @CurrentUser() user: User,
  ): Promise<FinancingRecord> {
    return this.financingService.update(id, updateFinancingRecordDto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a financing record by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Financing Record ID (UUID)' })
  @ApiResponse({ status: 204, description: 'The financing record has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Financing record not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User): Promise<void> {
    return this.financingService.remove(id, user);
  }
}
