import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerStatus, CustomerType } from '../entities/customer.entity';
import { Sme } from '../entities/sme.entity';
import { SmeSpecificData } from '../entities/sme-specific-data.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';

@Injectable()
export class SmeService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Sme)
    private readonly smeRepository: Repository<Sme>,
    @InjectRepository(SmeSpecificData)
    private readonly smeDataRepository: Repository<SmeSpecificData>,
    private readonly customerEventsProducer: CustomerEventsProducer,
  ) {}

  async findAll(page = 1, limit = 10): Promise<[Sme[], number]> {
    return this.smeRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['customer', 'customer.users'],
    });
  }

  async findById(id: string): Promise<Sme> {
    const sme = await this.smeRepository.findOne({
      where: { customerId: id },
      relations: ['customer', 'customer.users', 'customer.subscriptions'],
    });

    if (!sme) {
      throw new NotFoundException(`SME with ID ${id} not found`);
    }

    return sme;
  }

  async create(createSmeDto: any): Promise<Sme> {
    // Create base customer entity
    const customer = this.customerRepository.create({
      ...createSmeDto.customer,
      type: CustomerType.SME,
      status: CustomerStatus.PENDING,
    });
    
    const savedCustomerResult = await this.customerRepository.save(customer);
    const savedCustomer = Array.isArray(savedCustomerResult) ? savedCustomerResult[0] : savedCustomerResult;
    
    // Create SME specific entity
    const sme = this.smeRepository.create({
      ...createSmeDto,
      customerId: savedCustomer.id,
    });
    
    const savedSmeResult = await this.smeRepository.save(sme);
    const savedSme = Array.isArray(savedSmeResult) ? savedSmeResult[0] : savedSmeResult;
    
    // Create SME specific data
    const smeData = this.smeDataRepository.create({
      registrationNumber: savedSme.registrationNumber,
      taxId: savedSme.taxIdentificationNumber || '',
      legalForm: savedSme.legalForm,
      sector: savedSme.industry || 'Other',
      yearFounded: savedSme.foundingDate ? new Date(savedSme.foundingDate).getFullYear() : new Date().getFullYear(),
      employeeCount: savedSme.numberOfEmployees || 0,
      annualRevenue: savedSme.annualRevenue || 0,
      websiteUrl: savedSme.website || '',
      description: savedSme.description || '',
    });
    
    const savedSmeDataResult = await this.smeDataRepository.save(smeData);
    const savedSmeData = Array.isArray(savedSmeDataResult) ? savedSmeDataResult[0] : savedSmeDataResult;
    
    // Update customer with SME data reference
    savedCustomer.smeData = savedSmeData;
    await this.customerRepository.save(savedCustomer);
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitSmeCreated({
      customer: savedCustomer,
      sme: savedSme,
    });
    
    return savedSme;
  }

  async update(id: string, updateSmeDto: any): Promise<Sme> {
    const sme = await this.findById(id);
    
    // Update SME specific data
    const updatedSme = this.smeRepository.merge(sme, updateSmeDto);
    const savedSmeResult = await this.smeRepository.save(updatedSme);
    const savedSme = Array.isArray(savedSmeResult) ? savedSmeResult[0] : savedSmeResult;
    
    // Update customer data if provided
    if (updateSmeDto.customer) {
      const customerResult = await this.customerRepository.findOneBy({ id: sme.customerId });
      
      if (customerResult) {
        const updatedCustomer = this.customerRepository.merge(customerResult, updateSmeDto.customer);
        await this.customerRepository.save(updatedCustomer);
      }
    }
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitSmeUpdated({
      sme: savedSme,
    });
    
    return savedSme;
  }

  async remove(id: string): Promise<void> {
    const sme = await this.findById(id);
    
    // First, get the customer ID
    const customerId = sme.customerId;
    
    // Remove the SME
    await this.smeRepository.remove(sme);
    
    // Now remove the customer
    const customer = await this.customerRepository.findOneBy({ id: customerId });
    if (customer) {
      await this.customerRepository.remove(customer);
    }
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitSmeDeleted({
      id,
      customerId,
    });
  }

  async validate(id: string): Promise<Sme> {
    const sme = await this.findById(id);
    
    // Get the customer and update status
    const customerResult = await this.customerRepository.findOneBy({ id: sme.customerId });
    
    if (!customerResult) {
      throw new NotFoundException(`Customer with ID ${sme.customerId} not found`);
    }
    
    customerResult.status = CustomerStatus.ACTIVE;
    customerResult.validatedAt = new Date();
    customerResult.validatedBy = 'system'; // Typically this would come from the authenticated user
    
    const savedCustomerResult = await this.customerRepository.save(customerResult);
    const savedCustomer = Array.isArray(savedCustomerResult) ? savedCustomerResult[0] : savedCustomerResult;
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitSmeValidated({
      sme,
      customer: savedCustomer,
    });
    
    return sme;
  }

  async suspend(id: string, reason: string): Promise<Sme> {
    const sme = await this.findById(id);
    
    // Get the customer and update status
    const customerResult = await this.customerRepository.findOneBy({ id: sme.customerId });
    
    if (!customerResult) {
      throw new NotFoundException(`Customer with ID ${sme.customerId} not found`);
    }
    
    customerResult.status = CustomerStatus.SUSPENDED;
    customerResult.suspendedAt = new Date();
    customerResult.suspendedBy = 'system'; // Typically this would come from the authenticated user
    customerResult.suspensionReason = reason;
    
    const savedCustomerResult = await this.customerRepository.save(customerResult);
    const savedCustomer = Array.isArray(savedCustomerResult) ? savedCustomerResult[0] : savedCustomerResult;
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitSmeSuspended({
      sme,
      customer: savedCustomer,
      reason,
    });
    
    return sme;
  }

  async getBusinessData(id: string): Promise<any> {
    const sme = await this.findById(id);
    
    // Get the related SME specific data
    const smeSpecificData = await this.smeDataRepository.findOne({
      where: { id: sme.customer?.smeData?.id }
    });
    
    // Return both SME and business data
    return {
      sme,
      businessData: smeSpecificData || {},
    };
  }
}
