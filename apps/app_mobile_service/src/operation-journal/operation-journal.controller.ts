import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { OperationJournalService } from './operation-journal.service';
import { CreateOperationJournalEntryDto } from './dto/create-operation-journal-entry.dto';
import { ListOperationJournalEntriesDto } from './dto/list-operation-journal-entries.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming a global or shared auth guard
import { OperationJournalEntry } from './entities/operation-journal-entry.entity';

@ApiTags('Operation Journal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
@Controller('operation-journal')
export class OperationJournalController {
  constructor(private readonly operationJournalService: OperationJournalService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new operation journal entry' })
  @ApiResponse({ status: 201, description: 'The entry has been successfully created.', type: OperationJournalEntry })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(@Body() createOperationJournalEntryDto: CreateOperationJournalEntryDto): Promise<OperationJournalEntry> {
    return this.operationJournalService.create(createOperationJournalEntryDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all operation journal entries with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by User ID' })
  @ApiQuery({ name: 'operationType', required: false, type: String, description: 'Filter by operation type' })
  @ApiQuery({ name: 'resourceAffected', required: false, type: String, description: 'Filter by resource affected' })
  @ApiQuery({ name: 'resourceId', required: false, type: String, description: 'Filter by resource ID' })
  @ApiQuery({ name: 'status', required: false, enum: ['SUCCESS', 'FAILURE', 'PENDING'], description: 'Filter by operation status' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Filter by start date (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Filter by end date (ISO 8601)' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort by field (e.g., timestamp)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order (ASC or DESC)' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved list of entries.', schema: {
    type: 'object',
    properties: {
      data: { type: 'array', items: { $ref: '#/components/schemas/OperationJournalEntry' } },
      total: { type: 'number' },
      page: { type: 'number' },
      limit: { type: 'number' },
    }
  }})
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAll(@Query() listOperationJournalEntriesDto: ListOperationJournalEntriesDto) {
    return this.operationJournalService.findAll(listOperationJournalEntriesDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific operation journal entry by ID' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved the entry.', type: OperationJournalEntry })
  @ApiResponse({ status: 404, description: 'Entry not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findOne(@Param('id') id: string): Promise<OperationJournalEntry | null> {
    return this.operationJournalService.findOne(id);
  }
}
