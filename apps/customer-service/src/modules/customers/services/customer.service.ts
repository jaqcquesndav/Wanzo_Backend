import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerStatus } from '../entities/customer.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly customerEventsProducer: CustomerEventsProducer,
  ) {}

  async findAll(page = 1, limit = 10): Promise<[Customer[], number]> {
    return this.customerRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['users', 'subscriptions'],
    });
  }

  async findById(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['users', 'subscriptions', 'tokenUsages'],
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async create(createCustomerDto: any): Promise<Customer> {
    const customer = this.customerRepository.create(createCustomerDto);
    const result = await this.customerRepository.save(customer);
    const savedCustomer = Array.isArray(result) ? result[0] : result;

    // Publish event to Kafka
    await this.customerEventsProducer.customerCreated(savedCustomer);

    return savedCustomer;
  }

  async update(id: string, updateCustomerDto: any): Promise<Customer> {
    const customer = await this.findById(id);
    const updatedCustomer = this.customerRepository.merge(customer, updateCustomerDto);
    const result = await this.customerRepository.save(updatedCustomer);
    const savedCustomer = Array.isArray(result) ? result[0] : result;

    // Publish event to Kafka
    await this.customerEventsProducer.customerUpdated(savedCustomer);

    return savedCustomer;
  }

  async remove(id: string): Promise<void> {
    const customer = await this.findById(id);
    await this.customerRepository.remove(customer);

    // Publish event to Kafka
    await this.customerEventsProducer.customerDeleted(id);
  }

  async validate(id: string): Promise<Customer> {
    const customer = await this.findById(id);
    
    customer.status = CustomerStatus.ACTIVE;
    customer.validatedAt = new Date();
    customer.validatedBy = 'system'; // Typically this would come from the authenticated user
    
    const result = await this.customerRepository.save(customer);
    const savedCustomer = Array.isArray(result) ? result[0] : result;
    
    // Publish event to Kafka
    await this.customerEventsProducer.customerValidated(savedCustomer);
    
    return savedCustomer;
  }

  async suspend(id: string, reason: string): Promise<Customer> {
    const customer = await this.findById(id);
    
    customer.status = CustomerStatus.SUSPENDED;
    customer.suspendedAt = new Date();
    customer.suspendedBy = 'system'; // Typically this would come from the authenticated user
    customer.suspensionReason = reason;
    
    const savedCustomer = await this.customerRepository.save(customer);
    
    // Publish event to Kafka
    await this.customerEventsProducer.customerSuspended(savedCustomer);
    
    return savedCustomer;
  }

  async reactivate(id: string): Promise<Customer> {
    const customer = await this.findById(id);
    
    customer.status = CustomerStatus.ACTIVE;
    customer.reactivatedAt = new Date();
    customer.reactivatedBy = 'system'; // Typically this would come from the authenticated user
    
    const savedCustomer = await this.customerRepository.save(customer);
    
    // Publish event to Kafka
    await this.customerEventsProducer.customerReactivated(savedCustomer);
    
    return savedCustomer;
  }

  /**
   * Met à jour un client par son ID avec les champs spécifiés
   */
  async updateById(id: string, updateFields: Record<string, any>): Promise<Customer> {
    const customer = await this.findById(id);
    
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    
    const updatedCustomer = this.customerRepository.merge(customer, updateFields);
    const result = await this.customerRepository.save(updatedCustomer);
    const savedCustomer = Array.isArray(result) ? result[0] : result;
    
    // Publier l'événement de mise à jour
    await this.customerEventsProducer.emitCustomerUpdated({
      customerId: savedCustomer.id,
      updatedFields: Object.keys(updateFields),
    });
    
    return savedCustomer;
  }

  /**
   * Valide un client
   */
  async validateCustomer(
    customerId: string, 
    adminId: string,
    details?: Record<string, any>,
    requestingService?: string,
  ): Promise<Customer> {
    const customer = await this.findById(customerId);
    
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }
    
    customer.status = CustomerStatus.ACTIVE;
    customer.validatedAt = new Date();
    customer.validatedBy = adminId;
    
    // Ajouter à l'historique de validation
    if (!customer.validationHistory) {
      customer.validationHistory = [];
    }
    
    customer.validationHistory.push({
      date: new Date(),
      action: 'validated',
      by: adminId,
      notes: details?.notes || 'Validated by administrator',
    });
    
    const result = await this.customerRepository.save(customer);
    const savedCustomer = Array.isArray(result) ? result[0] : result;
    
    // Publier l'événement de validation
    await this.customerEventsProducer.emitCustomerValidated({
      customerId: savedCustomer.id,
      adminId,
      timestamp: savedCustomer.validatedAt.toISOString(),
      targetService: requestingService,
    });
    
    return savedCustomer;
  }

  /**
   * Suspend un client
   */
  async suspendCustomer(
    customerId: string, 
    adminId: string,
    reason: string,
    requestingService?: string,
  ): Promise<Customer> {
    const customer = await this.findById(customerId);
    
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }
    
    customer.status = CustomerStatus.SUSPENDED;
    customer.suspendedAt = new Date();
    customer.suspendedBy = adminId;
    customer.suspensionReason = reason;
    
    const result = await this.customerRepository.save(customer);
    const savedCustomer = Array.isArray(result) ? result[0] : result;
    
    // Publier l'événement de suspension
    await this.customerEventsProducer.emitCustomerSuspended({
      customerId: savedCustomer.id,
      adminId,
      reason,
      timestamp: savedCustomer.suspendedAt.toISOString(),
      targetService: requestingService,
    });
    
    return savedCustomer;
  }

  /**
   * Réactive un client
   */
  async reactivateCustomer(
    customerId: string, 
    adminId: string,
    requestingService?: string,
  ): Promise<Customer> {
    const customer = await this.findById(customerId);
    
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }
    
    customer.status = CustomerStatus.ACTIVE;
    customer.reactivatedAt = new Date();
    customer.reactivatedBy = adminId;
    
    const result = await this.customerRepository.save(customer);
    const savedCustomer = Array.isArray(result) ? result[0] : result;
    
    // Publier l'événement de réactivation
    await this.customerEventsProducer.emitCustomerReactivated({
      customerId: savedCustomer.id,
      adminId,
      timestamp: savedCustomer.reactivatedAt.toISOString(),
      targetService: requestingService,
    });
    
    return savedCustomer;
  }
}
