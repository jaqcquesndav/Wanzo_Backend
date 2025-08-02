import { Controller, Get, Post, Put, Delete, Patch, Body, Param, Query, UseGuards, Req, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JournalService } from '../services/journal.service';
import { CreateJournalDto, UpdateJournalStatusDto, JournalFilterDto, UpdateJournalDto, ValidateJournalDto } from '../dtos/journal.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JournalType, JournalStatus } from '../entities/journal.entity';

@ApiTags('journal-entries')
@Controller('journal-entries')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post()
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Create new journal entry' })
  @ApiResponse({ status: 201, description: 'Journal entry created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async create(@Body() createJournalDto: CreateJournalDto, @Req() req: any) {
    const journal = await this.journalService.create(createJournalDto, req.user.id);
    return {
      success: true,
      data: journal,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all journal entries' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Number of entries per page (default: 20)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for description, reference, etc.' })
  @ApiQuery({ name: 'journalType', required: false, enum: JournalType, description: 'Filter by journal type' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for filtering (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for filtering (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'status', required: false, enum: JournalStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'source', required: false, enum: ['manual', 'agent'], description: 'Filter by source' })
  @ApiResponse({ status: 200, description: 'Journal entries retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query() filters: JournalFilterDto,
    @Req() req: any
  ) {
    const result = await this.journalService.findAll(
      {
        ...filters,
        type: filters.journalType || filters.type,
        fiscalYear: filters.fiscalYear,
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
        source: filters.source,
        search: filters.search,
        companyId: req.user.companyId
      }, 
      +page, 
      +pageSize
    );
    
    return {
      success: true,
      data: {
        data: result.journals,
        total: result.total,
        page: result.page,
        pageSize: result.perPage,
        totalPages: Math.ceil(result.total / result.perPage)
      }
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get journal entry by ID' })
  @ApiParam({ name: 'id', description: 'Journal ID' })
  @ApiResponse({ status: 200, description: 'Journal entry retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Journal entry not found' })
  async findOne(@Param('id') id: string) {
    const journal = await this.journalService.findById(id);
    return {
      success: true,
      data: journal,
    };
  }

  @Put(':id/status')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Update journal entry status' })
  @ApiParam({ name: 'id', description: 'Journal ID' })
  @ApiResponse({ status: 200, description: 'Journal status updated successfully' })
  @ApiResponse({ status: 404, description: 'Journal entry not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateJournalStatusDto,
    @Req() req: any,
  ) {
    const journal = await this.journalService.updateStatus(id, updateStatusDto, req.user.id);
    return {
      success: true,
      data: journal,
    };
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: 'Get journal entries by account' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiQuery({ name: 'fiscalYear', required: false, description: 'Filter by fiscal year' })
  @ApiQuery({ name: 'journalType', required: false, enum: JournalType, description: 'Filter by journal type' })
  @ApiQuery({ name: 'status', required: false, enum: JournalStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for filtering' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for filtering' })
  @ApiResponse({ status: 200, description: 'Journal entries retrieved successfully' })
  async findByAccount(
    @Param('accountId') accountId: string,
    @Query() filters: JournalFilterDto,
    @Req() req: any
  ) {
    const journals = await this.journalService.findByAccount(
      accountId, 
      { 
        ...filters,
        companyId: req.user.companyId 
      }
    );
    return {
      success: true,
      data: journals,
    };
  }

  @Get('account/:accountId/balance')
  @ApiOperation({ summary: 'Get account balance' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiQuery({ name: 'fiscal_year', required: true, description: 'Fiscal year ID' })
  @ApiQuery({ name: 'as_of_date', required: false, description: 'Date to calculate balance up to (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Account balance retrieved successfully' })
  async getAccountBalance(
    @Param('accountId') accountId: string,
    @Query('fiscal_year') fiscalYear: string,
    @Req() req: any,
    @Query('as_of_date') asOfDate?: string,
  ) {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new BadRequestException('Company ID not found in request.');
    }
    const balance = await this.journalService.getAccountBalance(
      accountId, 
      fiscalYear, 
      companyId, 
      asOfDate ? new Date(asOfDate) : undefined
    );
    return {
      success: true,
      data: {
        balance,
      },
    };
  }

  @Put(':id')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Update journal entry' })
  @ApiParam({ name: 'id', description: 'Journal ID' })
  @ApiResponse({ status: 200, description: 'Journal entry updated successfully' })
  @ApiResponse({ status: 404, description: 'Journal entry not found' })
  async update(
    @Param('id') id: string,
    @Body() updateJournalDto: UpdateJournalDto,
    @Req() req: any
  ) {
    const journal = await this.journalService.update(id, updateJournalDto, req.user.id);
    return {
      success: true,
      data: journal,
    };
  }

  @Delete(':id')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Delete journal entry' })
  @ApiParam({ name: 'id', description: 'Journal ID' })
  @ApiResponse({ status: 200, description: 'Journal entry deleted successfully' })
  @ApiResponse({ status: 404, description: 'Journal entry not found' })
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.journalService.remove(id, req.user.id);
    return {
      success: true
    };
  }

  @Patch(':id/validate')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Validate or reject an AI-generated journal entry' })
  @ApiParam({ name: 'id', description: 'Journal ID' })
  @ApiResponse({ status: 200, description: 'Journal entry validation updated successfully' })
  @ApiResponse({ status: 404, description: 'Journal entry not found' })
  async validateEntry(
    @Param('id') id: string,
    @Body() validateDto: ValidateJournalDto,
    @Req() req: any
  ) {
    const journal = await this.journalService.validateEntry(id, validateDto, req.user.id);
    return {
      success: true,
      data: {
        id: journal.id,
        status: journal.status,
        validationStatus: journal.validationStatus,
        validatedBy: journal.validatedBy,
        validatedAt: journal.validatedAt
      }
    };
  }
}
