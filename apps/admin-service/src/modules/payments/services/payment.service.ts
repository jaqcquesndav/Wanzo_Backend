import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { PaymentMethod } from '../entities/payment-method.entity';
import { CreatePaymentDto, PaymentMethodDto } from '../dtos/payment.dto';
import { NotificationService } from '../../notifications/services/notification.service';
import { ActivityService } from '../../activities/services/activity.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
    private notificationService: NotificationService,
    private activityService: ActivityService,
  ) {}

  async createPayment(companyId: string, createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const paymentMethod = await this.paymentMethodRepository.findOne({
      where: { id: createPaymentDto.methodId, companyId },
    });

    if (!paymentMethod) {
      throw new NotFoundException('Payment method not found');
    }

    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      companyId,
      status: 'pending',
      method: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        provider: paymentMethod.provider,
      },
    });

    // Ici, vous intégreriez avec un processeur de paiement
    // Pour l'instant, nous marquons simplement comme complété
    payment.status = 'completed';

    const savedPayment = await this.paymentRepository.save(payment);

    // Log activity
    await this.activityService.logUserActivity(
      payment.userId,
      'PAYMENT_CREATED',
      `Payment of ${payment.amount.usd} USD created`,
      { paymentId: savedPayment.id }
    );

    // Send notification
    await this.notificationService.createPaymentNotification(
      payment.userId,
      payment.amount.usd,
      'completed'
    );

    return savedPayment;
  }

  async getPayments(
    companyId: string,
    page = 1,
    perPage = 10,
  ): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const [payments, total] = await this.paymentRepository.findAndCount({
      where: { companyId },
      skip: (page - 1) * perPage,
      take: perPage,
      order: { createdAt: 'DESC' },
    });

    return {
      payments,
      total,
      page,
      perPage,
    };
  }

  async getPayment(companyId: string, id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id, companyId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async addPaymentMethod(companyId: string, paymentMethodDto: PaymentMethodDto): Promise<PaymentMethod> {
    const paymentMethod = this.paymentMethodRepository.create({
      ...paymentMethodDto,
      companyId,
    });

    const savedMethod = await this.paymentMethodRepository.save(paymentMethod);

    // Log activity
    await this.activityService.logUserActivity(
      paymentMethod.userId ?? 'unknown-user',
      'PAYMENT_METHOD_ADDED',
      `Payment method ${paymentMethod.type} added`,
      { paymentMethodId: savedMethod.id }
    );

    return savedMethod;
  }

  async getPaymentMethods(companyId: string): Promise<PaymentMethod[]> {
    return await this.paymentMethodRepository.find({
      where: { companyId, active: true },
    });
  }
}