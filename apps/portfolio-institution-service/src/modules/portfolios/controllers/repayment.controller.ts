import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RepaymentService } from '../services/repayment.service';
import { RepaymentStatus } from '../entities/repayment.entity';

@ApiTags('repayments')
@Controller('portfolios/traditional/repayments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RepaymentController {
  constructor(private readonly repaymentService: RepaymentService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new repayment for a contract' })
  @ApiResponse({ status: 201, description: 'Repayment recorded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or contract not in active status' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async create(@Body() createRepaymentDto: any, @Req() req: any) {
    const repayment = await this.repaymentService.create(
      createRepaymentDto,
      req.user.id
    );
    
    return {
      success: true,
      data: repayment,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all repayments' })
  @ApiQuery({ name: 'contractId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: Object.values(RepaymentStatus) })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiResponse({ status: 200, description: 'Repayments retrieved successfully' })
  async findAll(@Query() filters: any) {
    const repayments = await this.repaymentService.findAll(filters);
    return {
      success: true,
      data: repayments,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get repayment by ID' })
  @ApiParam({ name: 'id', description: 'Repayment ID' })
  @ApiResponse({ status: 200, description: 'Repayment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Repayment not found' })
  async findOne(@Param('id') id: string) {
    const repayment = await this.repaymentService.findOne(id);
    return {
      success: true,
      data: repayment,
    };
  }
}
