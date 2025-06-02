import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SubscriptionTier, SubscriptionTierType } from './entities/subscription-tier.entity';
import { UserSubscription, SubscriptionStatus } from './entities/user-subscription.entity';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { PaymentProof, PaymentProofStatus } from './entities/payment-proof.entity';
import { User } from '../auth/entities/user.entity'; // Assuming User entity from AuthModule
import { ChangeTierDto } from './dto/change-tier.dto';
import { TopUpTokensDto } from './dto/topup-tokens.dto';
import { CreatePaymentProofDto } from './dto/create-payment-proof.dto';
// import { AuthModule } from '../../auth/auth.module'; // For user context

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(SubscriptionTier)
    private readonly tierRepository: Repository<SubscriptionTier>,
    @InjectRepository(UserSubscription)
    private readonly userSubscriptionRepository: Repository<UserSubscription>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepository: Repository<PaymentMethod>,
    @InjectRepository(PaymentProof)
    private readonly paymentProofRepository: Repository<PaymentProof>,
    @InjectRepository(User) // Assuming User repository is available
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async getAvailableTiers(): Promise<SubscriptionTier[]> {
    return this.tierRepository.find({ where: { isActive: true }, order: { price: 'ASC' } });
  }

  async getUserSubscriptionDetails(userId: string): Promise<UserSubscription | null> {
    const subscription = await this.userSubscriptionRepository.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE }, // Or other relevant statuses
      relations: ['tier'],
      order: { createdAt: 'DESC' }, // Get the latest active one if multiple somehow exist
    });
    if (!subscription) {
      // Optionally, create or return a default (e.g., FREE tier) subscription if none exists
      // For now, just returning null if no active subscription.
      return null;
    }
    return subscription;
  }

  async changeSubscriptionTier(userId: string, changeTierDto: ChangeTierDto): Promise<UserSubscription> {
    const { newTierType } = changeTierDto;
    const targetTier = await this.tierRepository.findOne({ where: { type: newTierType as SubscriptionTierType, isActive: true } });

    if (!targetTier) {
      throw new NotFoundException(`Subscription tier "${newTierType}" not found or is inactive.`);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found.`);
    }

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // 1. Deactivate current active subscription(s) for the user
      const currentSubscriptions = await transactionalEntityManager.find(UserSubscription, { where: { userId, status: SubscriptionStatus.ACTIVE } });
      for (const sub of currentSubscriptions) {
        sub.status = SubscriptionStatus.INACTIVE; // Or CANCELLED, depending on logic
        sub.endDate = new Date();
        await transactionalEntityManager.save(UserSubscription, sub);
      }

      // 2. Create new subscription
      const newSubscription = new UserSubscription();
      newSubscription.user = user;
      newSubscription.tier = targetTier;
      newSubscription.userId = userId;
      newSubscription.tierId = targetTier.id;
      newSubscription.status = SubscriptionStatus.ACTIVE; // Assuming immediate activation
      newSubscription.startDate = new Date();
      // endDate could be calculated based on tier (e.g., 1 month from now)
      // newSubscription.endDate = ...;
      newSubscription.remainingAdhaTokens = targetTier.adhaTokens; // Initialize tokens

      // 3. TODO: Payment Processing Logic
      // If targetTier.price > 0, handle payment here.
      // This might involve creating an invoice, charging a payment method, etc.
      // If payment fails, throw BadRequestException and roll back transaction.
      if (targetTier.price > 0) {
        // Placeholder for payment logic
        console.log(`Payment required for tier ${targetTier.name}: ${targetTier.price}`);
        // Create an invoice
        const invoice = transactionalEntityManager.create(Invoice, {
            userId,
            user,
            amount: targetTier.price,
            status: InvoiceStatus.OPEN, // Or PAID if payment is immediate
            dueDate: new Date(), // Set appropriate due date
            description: `Subscription to ${targetTier.name}`,
            userSubscriptionId: newSubscription.id // Link after save or handle differently
        });
        // await transactionalEntityManager.save(Invoice, invoice);
        // For now, we'll assume payment is handled externally or is free
      }

      const savedSubscription = await transactionalEntityManager.save(UserSubscription, newSubscription);
      
      // If an invoice was created and needs linking to the now-saved subscription:
      // if (invoice && !invoice.userSubscriptionId) {
      //   invoice.userSubscription = savedSubscription;
      //   await transactionalEntityManager.save(Invoice, invoice);
      // }

      const resultSubscription = await transactionalEntityManager.findOne(UserSubscription, { 
        where: { id: savedSubscription.id }, 
        relations: ['tier', 'user'] 
      });

      if (!resultSubscription) {
        // This should ideally not happen if the save was successful
        throw new InternalServerErrorException('Failed to retrieve the new subscription after creation.');
      }
      return resultSubscription;
    });
  }

  async topUpAdhaTokens(userId: string, topUpTokensDto: TopUpTokensDto): Promise<UserSubscription> {
    const { tokenPackageId, paymentDetails } = topUpTokensDto;

    // 1. Validate tokenPackageId (assuming a TokenPackage entity or similar lookup)
    // For now, let's assume tokenPackageId directly maps to a number of tokens and a price.
    // This needs to be implemented based on how token packages are defined.
    const tokensToAdd = 1000; // Placeholder
    const packagePrice = 10; // Placeholder

    if (!tokenPackageId) throw new BadRequestException('tokenPackageId is required.');

    const activeSubscription = await this.userSubscriptionRepository.findOne({ 
        where: { userId, status: SubscriptionStatus.ACTIVE },
        relations: ['tier', 'user']
    });

    if (!activeSubscription) {
      throw new NotFoundException('No active subscription found for the user to add tokens to.');
    }

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // 2. TODO: Payment Processing Logic for tokenPackagePrice
      // Use paymentDetails or user's default payment method.
      // If payment fails, throw BadRequestException.
      if (packagePrice > 0) {
        console.log(`Payment required for token package ${tokenPackageId}: ${packagePrice}`);
        // Placeholder for payment logic
        // Create an invoice or charge directly
      }

      // 3. Add tokens to the user's current subscription
      activeSubscription.remainingAdhaTokens += tokensToAdd;
      await transactionalEntityManager.save(UserSubscription, activeSubscription);
      return activeSubscription;
    });
  }

  async submitPaymentProof(userId: string, createPaymentProofDto: CreatePaymentProofDto): Promise<PaymentProof> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found.`);
    }

    // TODO: Validate invoiceId, subscriptionTierId, tokenPackageId if provided
    // e.g., ensure the invoice exists and belongs to the user.

    const newProof = this.paymentProofRepository.create({
      ...createPaymentProofDto,
      userId,
      user,
      status: PaymentProofStatus.PENDING,
      submittedAt: new Date(),
    });
    return this.paymentProofRepository.save(newProof);
  }

  async listUserInvoices(userId: string /*, paginationOptions */): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      // Add pagination later
    });
  }

  async listUserPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'ASC' },
    });
  }
  
  // TODO: Add methods for creating/managing PaymentMethods if needed via API
  // TODO: Add methods for managing Invoices (e.g., admin marking as paid after proof)
  // TODO: Add methods for managing SubscriptionTiers (admin only)
}
