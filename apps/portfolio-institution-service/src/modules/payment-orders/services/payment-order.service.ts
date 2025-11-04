import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentOrder, PaymentOrderStatus, TraditionalFundingType } from '../entities/payment-order.entity';
import { CreatePaymentOrderDto, UpdatePaymentOrderDto, UpdatePaymentOrderStatusDto } from '../dtos';

@Injectable()
export class PaymentOrderService {
  constructor(
    @InjectRepository(PaymentOrder)
    private paymentOrderRepository: Repository<PaymentOrder>,
  ) {}

  async findAll(
    institutionId: string,
    filters: {
      status?: PaymentOrderStatus;
      fundingType?: TraditionalFundingType;
      portfolioId?: string;
      contractReference?: string;
    } = {},
    page = 1,
    limit = 10,
  ) {
    const queryBuilder = this.paymentOrderRepository
      .createQueryBuilder('paymentOrder')
      .where('paymentOrder.institutionId = :institutionId', { institutionId });

    if (filters.status) {
      queryBuilder.andWhere('paymentOrder.status = :status', { status: filters.status });
    }

    if (filters.fundingType) {
      queryBuilder.andWhere('paymentOrder.fundingType = :fundingType', { fundingType: filters.fundingType });
    }

    if (filters.portfolioId) {
      queryBuilder.andWhere('paymentOrder.portfolioId = :portfolioId', { portfolioId: filters.portfolioId });
    }

    if (filters.contractReference) {
      queryBuilder.andWhere('paymentOrder.contractReference = :contractReference', { 
        contractReference: filters.contractReference 
      });
    }

    queryBuilder
      .orderBy('paymentOrder.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [paymentOrders, total] = await queryBuilder.getManyAndCount();

    return {
      data: paymentOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, institutionId: string): Promise<PaymentOrder> {
    const paymentOrder = await this.paymentOrderRepository.findOne({
      where: { id, institutionId },
      relations: ['disbursements'],
    });

    if (!paymentOrder) {
      throw new NotFoundException(`Payment order with ID ${id} not found`);
    }

    return paymentOrder;
  }

  async create(createPaymentOrderDto: CreatePaymentOrderDto, institutionId: string, userId: string): Promise<PaymentOrder> {
    // Generate unique reference
    const reference = await this.generateReference();

    const paymentOrder = this.paymentOrderRepository.create({
      ...createPaymentOrderDto,
      reference,
      institutionId,
      createdBy: userId,
      date: new Date(createPaymentOrderDto.date),
    });

    return this.paymentOrderRepository.save(paymentOrder);
  }

  async update(id: string, updatePaymentOrderDto: UpdatePaymentOrderDto, institutionId: string, userId: string): Promise<PaymentOrder> {
    const paymentOrder = await this.findById(id, institutionId);

    // Prevent updates on paid orders
    if (paymentOrder.status === PaymentOrderStatus.PAID) {
      throw new BadRequestException(`Cannot update payment order with status: ${paymentOrder.status}`);
    }

    Object.assign(paymentOrder, {
      ...updatePaymentOrderDto,
      modifiedBy: userId,
      date: updatePaymentOrderDto.date ? new Date(updatePaymentOrderDto.date) : paymentOrder.date,
    });

    return this.paymentOrderRepository.save(paymentOrder);
  }

  async updateStatus(id: string, updateStatusDto: UpdatePaymentOrderStatusDto, institutionId: string, userId: string): Promise<PaymentOrder> {
    const paymentOrder = await this.findById(id, institutionId);

    // Validate status transitions
    if (!this.isValidStatusTransition(paymentOrder.status, updateStatusDto.status)) {
      throw new BadRequestException(`Invalid status transition from ${paymentOrder.status} to ${updateStatusDto.status}`);
    }

    const oldStatus = paymentOrder.status;
    paymentOrder.status = updateStatusDto.status;
    paymentOrder.modifiedBy = userId;

    // Add status change to metadata
    if (!paymentOrder.metadata) {
      paymentOrder.metadata = {};
    }

    if (!paymentOrder.metadata.statusHistory) {
      paymentOrder.metadata.statusHistory = [];
    }

    paymentOrder.metadata.statusHistory.push({
      from: oldStatus,
      to: updateStatusDto.status,
      reason: updateStatusDto.reason,
      changedBy: userId,
      changedAt: new Date().toISOString(),
    });

    return this.paymentOrderRepository.save(paymentOrder);
  }

  async delete(id: string, institutionId: string): Promise<void> {
    const paymentOrder = await this.findById(id, institutionId);

    // Only allow deletion of pending orders
    if (paymentOrder.status !== PaymentOrderStatus.PENDING) {
      throw new BadRequestException(`Cannot delete payment order with status: ${paymentOrder.status}`);
    }

    await this.paymentOrderRepository.remove(paymentOrder);
  }

  private async generateReference(): Promise<string> {
    const prefix = 'PO';
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    return `${prefix}-${timestamp}-${random}`;
  }

  private isValidStatusTransition(currentStatus: PaymentOrderStatus, newStatus: PaymentOrderStatus): boolean {
    const validTransitions: Record<PaymentOrderStatus, PaymentOrderStatus[]> = {
      [PaymentOrderStatus.PENDING]: [
        PaymentOrderStatus.APPROVED,
        PaymentOrderStatus.REJECTED,
      ],
      [PaymentOrderStatus.APPROVED]: [
        PaymentOrderStatus.PAID,
        PaymentOrderStatus.REJECTED,
      ],
      [PaymentOrderStatus.REJECTED]: [
        PaymentOrderStatus.PENDING, // Allow resubmission
      ],
      [PaymentOrderStatus.PAID]: [], // Final state
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}