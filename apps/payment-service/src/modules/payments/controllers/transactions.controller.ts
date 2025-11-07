import { Controller, Get, Param, Query, DefaultValuePipe, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTransaction } from '../entities/payment-transaction.entity';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly txRepo: Repository<PaymentTransaction>,
  ) {}

  @Get()
  @ApiOkResponse({ description: 'List transactions', type: Object })
  @ApiQuery({ name: 'status', required: false, description: "Filter by status: pending|success|failed" })
  @ApiQuery({ name: 'clientPhone', required: false })
  @ApiQuery({ name: 'telecom', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async list(
    @Query('status') status?: 'pending' | 'success' | 'failed',
    @Query('clientPhone') clientPhone?: string,
    @Query('telecom') telecom?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (clientPhone) where.clientPhone = clientPhone;
    if (telecom) where.telecom = telecom;

    const [items, total] = await this.txRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit ?? 50, 1), 200),
      skip: Math.max(offset ?? 0, 0),
    });

    return {
      meta: {
        total,
        limit: Math.min(Math.max(limit ?? 50, 1), 200),
        offset: Math.max(offset ?? 0, 0),
      },
      items,
    };
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Get transaction by id', type: Object })
  async getOne(@Param('id') id: string) {
    const tx = await this.txRepo.findOne({ where: { id } });
    if (!tx) throw new NotFoundException('Transaction not found');
    return tx;
  }
}
