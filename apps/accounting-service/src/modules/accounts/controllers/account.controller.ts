import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
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
  @ApiQuery({ name: 'search', required: false, description: 'Search term for code or name' })
  @ApiQuery({ name: 'type', required: false, enum: ['asset', 'liability', 'equity', 'revenue', 'expense', 'all'], description: 'Filter by account type' })
  @ApiQuery({ name: 'standard', required: false, enum: ['SYSCOHADA', 'IFRS', 'all'], description: 'Filter by accounting standard' })
  @ApiQuery({ name: 'isAnalytic', required: false, type: Boolean, description: 'Filter by analytic accounts' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['code', 'name', 'type'], description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Number of accounts per page' })
  @ApiResponse({ status: 200, description: 'Accounts retrieved successfully' })
  async findAll(@Query() filters: AccountFilterDto) {
    const result = await this.accountService.findAll(filters);
    
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
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete account with child accounts' })
  async remove(@Param('id') id: string) {
    await this.accountService.delete(id);
    return {
      success: true
    };
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

  @Post('batch')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Import or export accounts' })
  @ApiQuery({ name: 'action', required: true, enum: ['import', 'export'], description: 'The action to perform' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'excel'], description: 'Export format (required for export)' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Batch operation completed successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async batchOperation(
    @Query('action') action: 'import' | 'export',
    @Req() req: any,
    @Query('format') format?: 'csv' | 'excel',
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (action === 'import') {
      if (!file) {
        return {
          success: false,
          error: 'File is required for import operation'
        };
      }
      // TODO: Implement importAccounts method
      const result = { imported: 0, errors: [] };
      return {
        success: true,
        data: result
      };
    } else if (action === 'export') {
      if (!format) {
        return {
          success: false,
          error: 'Format is required for export operation'
        };
      }
      // TODO: Implement exportAccounts method
      return {
        success: true,
        data: { message: 'Export functionality to be implemented' }
      };
    } else {
      return {
        success: false,
        error: 'Invalid action. Must be import or export'
      };
    }
  }

  @Post('batch/create')
  @Roles('admin', 'accountant')
  @ApiOperation({ summary: 'Create multiple accounts' })
  @ApiResponse({ status: 201, description: 'Accounts created successfully' })
  async createMultiple(@Body() createAccountsDto: CreateAccountDto[], @Req() req: any) {
    // TODO: Implement createMultiple method
    const result = { created: 0, errors: [] };
    return {
      success: true,
      data: result
    };
  }
}