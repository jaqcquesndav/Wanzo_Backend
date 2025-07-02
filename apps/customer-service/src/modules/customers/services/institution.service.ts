import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerStatus, CustomerType } from '../entities/customer.entity';
import { Institution, InstitutionType as InstitutionEntityType } from '../entities/institution.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';
import { FinancialInstitutionSpecificData, InstitutionType } from '../entities/financial-institution-specific-data.entity';

@Injectable()
export class InstitutionService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Institution)
    private readonly institutionRepository: Repository<Institution>,
    @InjectRepository(FinancialInstitutionSpecificData)
    private readonly financialDataRepository: Repository<FinancialInstitutionSpecificData>,
    private readonly customerEventsProducer: CustomerEventsProducer,
  ) {}

  async findAll(page = 1, limit = 10): Promise<[Institution[], number]> {
    return this.institutionRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['customer', 'customer.users'],
    });
  }

  async findById(id: string): Promise<Institution> {
    const institution = await this.institutionRepository.findOne({
      where: { customerId: id },
      relations: ['customer', 'customer.users', 'customer.subscriptions'],
    });

    if (!institution) {
      throw new NotFoundException(`Financial institution with ID ${id} not found`);
    }

    return institution;
  }

  async create(createInstitutionDto: any): Promise<Institution> {
    // Create base customer entity
    const customer = this.customerRepository.create({
      ...createInstitutionDto.customer,
      type: CustomerType.FINANCIAL,
      status: CustomerStatus.PENDING,
    });
    
    const savedCustomerResult = await this.customerRepository.save(customer);
    const savedCustomer = Array.isArray(savedCustomerResult) ? savedCustomerResult[0] : savedCustomerResult;
    
    // Create institution specific entity
    const institution = this.institutionRepository.create({
      ...createInstitutionDto,
      customerId: savedCustomer.id,
    });
    
    const savedInstitutionResult = await this.institutionRepository.save(institution);
    const savedInstitution = Array.isArray(savedInstitutionResult) ? savedInstitutionResult[0] : savedInstitutionResult;
    
    // Create financial data record
    const financialData = this.financialDataRepository.create({
      institutionType: savedInstitution.institutionType === InstitutionEntityType.BANK 
        ? InstitutionType.BANK 
        : savedInstitution.institutionType === InstitutionEntityType.INSURANCE
        ? InstitutionType.INSURANCE
        : InstitutionType.OTHER,
      licenseNumber: savedInstitution.licenseNumber,
      regulatoryAuthority: savedInstitution.regulatoryAuthority || '',
      yearEstablished: new Date().getFullYear(),
      branchCount: savedInstitution.numberOfBranches || 0,
    });
    
    const savedFinancialDataResult = await this.financialDataRepository.save(financialData);
    const savedFinancialData = Array.isArray(savedFinancialDataResult) 
      ? savedFinancialDataResult[0] 
      : savedFinancialDataResult;
    
    // Update customer with financial data reference
    savedCustomer.financialData = savedFinancialData;
    await this.customerRepository.save(savedCustomer);
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitInstitutionCreated({
      customer: savedCustomer,
      institution: savedInstitution
    });
    
    return savedInstitution;
  }

  async update(id: string, updateInstitutionDto: any): Promise<Institution> {
    const institution = await this.findById(id);
    
    // Update institution specific data
    const updatedInstitution = this.institutionRepository.merge(institution, updateInstitutionDto);
    const savedInstitutionResult = await this.institutionRepository.save(updatedInstitution);
    const savedInstitution = Array.isArray(savedInstitutionResult) ? savedInstitutionResult[0] : savedInstitutionResult;
    
    // Update customer data if provided
    if (updateInstitutionDto.customer) {
      const customerResult = await this.customerRepository.findOneBy({ id: institution.customerId });
      
      if (customerResult) {
        const updatedCustomer = this.customerRepository.merge(customerResult, updateInstitutionDto.customer);
        await this.customerRepository.save(updatedCustomer);
      }
    }
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitInstitutionUpdated({
      institution: savedInstitution,
    });
    
    return savedInstitution;
  }

  async remove(id: string): Promise<void> {
    const institution = await this.findById(id);
    
    // First, get the customer ID
    const customerId = institution.customerId;
    
    // Remove the institution
    await this.institutionRepository.remove(institution);
    
    // Now remove the customer
    const customer = await this.customerRepository.findOneBy({ id: customerId });
    if (customer) {
      await this.customerRepository.remove(customer);
    }
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitInstitutionDeleted({
      id,
      customerId,
    });
  }

  async validate(id: string): Promise<Institution> {
    const institution = await this.findById(id);
    
    // Get the customer and update status
    const customerResult = await this.customerRepository.findOneBy({ id: institution.customerId });
    
    if (!customerResult) {
      throw new NotFoundException(`Customer with ID ${institution.customerId} not found`);
    }
    
    customerResult.status = CustomerStatus.ACTIVE;
    customerResult.validatedAt = new Date();
    customerResult.validatedBy = 'system'; // Typically this would come from the authenticated user
    
    const savedCustomerResult = await this.customerRepository.save(customerResult);
    const savedCustomer = Array.isArray(savedCustomerResult) ? savedCustomerResult[0] : savedCustomerResult;
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitInstitutionValidated({
      institution,
      customer: savedCustomer,
    });
    
    return institution;
  }

  async suspend(id: string, reason: string): Promise<Institution> {
    const institution = await this.findById(id);
    
    // Get the customer and update status
    const customerResult = await this.customerRepository.findOneBy({ id: institution.customerId });
    
    if (!customerResult) {
      throw new NotFoundException(`Customer with ID ${institution.customerId} not found`);
    }
    
    customerResult.status = CustomerStatus.SUSPENDED;
    customerResult.suspendedAt = new Date();
    customerResult.suspendedBy = 'system'; // Typically this would come from the authenticated user
    customerResult.suspensionReason = reason;
    
    const savedCustomerResult = await this.customerRepository.save(customerResult);
    const savedCustomer = Array.isArray(savedCustomerResult) ? savedCustomerResult[0] : savedCustomerResult;
    
    // Publish event to Kafka
    await this.customerEventsProducer.emitInstitutionSuspended({
      institution,
      customer: savedCustomer,
      reason,
    });
    
    return institution;
  }

  async getFinancialData(id: string): Promise<any> {
    const institution = await this.findById(id);
    
    // Get related financial data
    const financialData = await this.financialDataRepository.findOne({
      where: { id: institution.customer?.financialData?.id }
    });
    
    // Here you would implement logic to get financial specific data
    return {
      institution,
      financialData: financialData || {},
    };
  }
}
