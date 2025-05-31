import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JournalService } from '../services/journal.service';
import { CreateJournalDto, UpdateJournalStatusDto, JournalFilterDto } from '../dtos/journal.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('journals')
@Controller('journals')
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
      journal,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all journal entries' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiQuery({ name: 'fiscal_year', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['SALES', 'PURCHASES', 'BANK', 'CASH', 'GENERAL'] })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'pending', 'posted', 'rejected', 'cancelled'] })
  @ApiQuery({ name: 'start_date', required: false })
  @ApiQuery({ name: 'end_date', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'account_id', required: false })
  @ApiResponse({ status: 200, description: 'Journal entries retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('per_page') perPage = 20,
    @Query() filters: JournalFilterDto,
  ) {
    const result = await this.journalService.findAll(filters, +page, +perPage);
    return {
      success: true,
      ...result,
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
      journal,
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
      journal,
    };
  }

  @Get('account/:accountId')
  @ApiOperation({ summary: 'Get journal entries by account' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiQuery({ name: 'fiscal_year', required: false })
  @ApiQuery({ name: 'type', required: false, enum: ['SALES', 'PURCHASES', 'BANK', 'CASH', 'GENERAL'] })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'pending', 'posted', 'rejected', 'cancelled'] })
  @ApiQuery({ name: 'start_date', required: false })
  @ApiQuery({ name: 'end_date', required: false })
  @ApiResponse({ status: 200, description: 'Journal entries retrieved successfully' })
  async findByAccount(
    @Param('accountId') accountId: string,
    @Query() filters: JournalFilterDto,
  ) {
    const journals = await this.journalService.findByAccount(accountId, filters);
    return {
      success: true,
      journals,
    };
  }

  @Get('account/:accountId/balance')
  @ApiOperation({ summary: 'Get account balance' })
  @ApiParam({ name: 'accountId', description: 'Account ID' })
  @ApiQuery({ name: 'fiscal_year', required: true })
  @ApiQuery({ name: 'as_of_date', required: false })
  @ApiResponse({ status: 200, description: 'Account balance retrieved successfully' })
  async getAccountBalance(
    @Param('accountId') accountId: string,
    @Query('fiscal_year') fiscalYear: string,
    @Query('as_of_date') asOfDate?: Date,
  ) {
    const balance = await this.journalService.getAccountBalance(accountId, fiscalYear, asOfDate);
    return {
      success: true,
      balance,
    };
  }
}