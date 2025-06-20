import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AccountService } from '../services/account.service';
import { CreateAccountDto, UpdateAccountDto, AccountFilterDto } from '../dtos/account.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Create new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Account code already exists' })
  async create(@Body() createAccountDto: CreateAccountDto, @Req() req: any) {
    const account = await this.accountService.create(createAccountDto, req.user.id);
    return {
      success: true,
      data: account,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all accounts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['asset', 'liability', 'equity', 'revenue', 'expense'] })
  @ApiQuery({ name: 'isAnalytic', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Accounts retrieved successfully' })
  async findAll(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query() filters: AccountFilterDto,
  ) {
    const result = await this.accountService.findAll(filters, +page, +pageSize);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async findOne(@Param('id') id: string) {
    const account = await this.accountService.findById(id);
    return {
      success: true,
      data: account,
    };
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get account by code' })
  @ApiParam({ name: 'code', description: 'Account code' })
  @ApiResponse({ status: 200, description: 'Account retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async findByCode(@Param('code') code: string) {
    const account = await this.accountService.findByCode(code);
    return {
      success: true,
      data: account,
    };
  }

  @Put(':id')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Update account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account updated successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async update(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    const account = await this.accountService.update(id, updateAccountDto);
    return {
      success: true,
      data: account,
    };
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 204, description: 'Account deleted successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete account with child accounts' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.accountService.delete(id);
  }

  @Get('hierarchy/:rootId?')
  @ApiOperation({ summary: 'Get account hierarchy' })
  @ApiParam({ name: 'rootId', description: 'Root account ID', required: false })
  @ApiResponse({ status: 200, description: 'Account hierarchy retrieved successfully' })
  async getHierarchy(@Param('rootId') rootId?: string) {
    const hierarchy = await this.accountService.getAccountHierarchy(rootId);
    return {
      success: true,
      data: hierarchy,
    };
  }
}