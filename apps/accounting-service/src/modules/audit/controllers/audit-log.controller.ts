import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AuditLogService } from '../services/audit-log.service';
import { AuditLogFilterDto } from '../dtos/audit-log-filter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles('admin', 'accountant', 'auditor')
  @ApiOperation({ 
    summary: 'Get audit logs',
    description: 'Retrieve audit logs for the specified entity or for the entire system'
  })
  @ApiQuery({ name: 'id', required: false, description: 'Retrieve a specific audit log by its ID' })
  @ApiQuery({ name: 'entityType', required: false, description: "Type of entity to filter logs (e.g., 'journal-entry', 'account', 'fiscal-year')" })
  @ApiQuery({ name: 'entityId', required: false, description: 'ID of the specific entity to filter logs' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for the period (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for the period (format: YYYY-MM-DD)' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter logs by user ID' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Number of logs per page (default: 20)' })
  @ApiQuery({ name: 'export', required: false, description: "Export format ('csv', 'excel', 'pdf')" })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid date range' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions to access audit logs' })
  async findAll(
    @Query() filters: AuditLogFilterDto,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
  ) {
    const result = await this.auditLogService.findAll(filters, +page, +pageSize);
    return {
      success: true,
      data: result,
    };
  }

  @Get(':id')
  @Roles('admin', 'accountant', 'auditor')
  @ApiOperation({ summary: 'Get audit log by ID' })
  @ApiParam({ name: 'id', description: 'Audit log ID' })
  @ApiResponse({ status: 200, description: 'Audit log retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async findOne(@Param('id') id: string) {
    const log = await this.auditLogService.findById(id);
    return {
      success: true,
      data: log,
    };
  }
}
