import { Injectable, NotFoundException, BadRequestException, ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import {
  Customer,
  CustomerStatus,
  CustomerType,
  AccountType
} from '../entities/customer.entity';
import {
  CustomerDocument,
  DocumentType,
  DocumentStatus
} from '../entities/document.entity';
import { CustomerActivity } from '../entities/activity.entity';
import { ValidationProcess, ValidationStep, ValidationStepStatus } from '../entities/validation.entity';
import {
  CustomerDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryParamsDto,
  CustomerListResponseDto,
  CustomerDetailsResponseDto,
  CustomerDocumentDto,
  CustomerActivityDto,
  CustomerStatisticsDto,
  ValidationProcessDto
} from '../dtos';
import { EventsService } from '../../events/events.service';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,    @InjectRepository(CustomerDocument)
    private documentsRepository: Repository<CustomerDocument>,
    @InjectRepository(CustomerActivity)
    private activitiesRepository: Repository<CustomerActivity>,
    @InjectRepository(ValidationProcess)
    private validationProcessRepository: Repository<ValidationProcess>,
    private readonly eventsService: EventsService,
  ) {
    this.logger = new Logger(CustomersService.name);
  }

  private logger: Logger;

  /**
   * Get all customers with pagination and filtering
   */
  async findAll(queryParams: CustomerQueryParamsDto): Promise<CustomerListResponseDto> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      type,
      status,
      search
    } = queryParams;

    const where: FindOptionsWhere<Customer> = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.email = Like(`%${search}%`);
      // Additional search conditions with OR logic
      // In a real implementation, we would use more complex query builder
    }

    const [customers, totalCount] = await this.customersRepository.findAndCount({
      where,
      order: {
        [sortBy]: sortOrder.toUpperCase()
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(totalCount / limit);

    return {
      customers: customers.map(customer => this.mapToDto(customer)),
      totalCount,
      page,
      totalPages
    };
  }

  /**
   * Get a single customer by ID with details
   */
  async findOne(id: string): Promise<CustomerDetailsResponseDto> {
    const customer = await this.customersRepository.findOne({
      where: { id },
      relations: ['documents', 'activities', 'validationProcesses']
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Get customer statistics
    const statistics = await this.getCustomerStatistics(id);

    return {
      customer: {
        ...this.mapToDto(customer),
        documents: customer.documents?.map(doc => this.mapDocumentToDto(doc)),
        validationHistory: customer.validationHistory
      },
      statistics,
      activities: customer.activities?.map(activity => this.mapActivityToDto(activity))
    };
  }

  /**
   * Create a new customer
   */
  async create(createCustomerDto: CreateCustomerDto): Promise<CustomerDto> {
    // Check if email already exists
    const existingCustomer = await this.customersRepository.findOne({
      where: { email: createCustomerDto.email }
    });

    if (existingCustomer) {
      throw new ConflictException('Email already in use');
    }

    // Prepare data for customer creation
    const customerData: any = {
      ...createCustomerDto,
      status: CustomerStatus.PENDING,
      tokenAllocation: 0
    };

    // Handle financial institution data if present
    if (createCustomerDto.type === CustomerType.FINANCIAL && createCustomerDto.financialInstitutionData) {
      const { financialInstitutionData } = createCustomerDto;
      
      // Remove it from the main object as we'll handle it separately
      delete customerData.financialInstitutionData;
      
      // It will be linked via relation after customer is saved
    }

    // Create and save the customer
    const customer = this.customersRepository.create(customerData);
    
    try {      // TypeORM's save returns the saved entity
      const savedEntity = await this.customersRepository.save(customer);
      
      let savedCustomer: Customer;
      
      // Handle possible array result (though it should be a single customer)
      if (Array.isArray(savedEntity)) {
        if (savedEntity.length === 0) {
          throw new Error('No customer was saved');
        }
        savedCustomer = savedEntity[0];
      } else {
        savedCustomer = savedEntity;
      }
      
      // Create activity record for customer creation
      await this.createActivity(savedCustomer.id, 'customer', 'created', 'Customer account created');
      
      await this.eventsService.publishCustomerCreated({
        customerId: savedCustomer.id,
        name: savedCustomer.name,
        email: savedCustomer.email,
        createdBy: 'admin', // Placeholder
        timestamp: new Date().toISOString(),
      });

      return this.mapToDto(savedCustomer);
    } catch (error: any) {
      this.logger.error(`Failed to create customer: ${error.message || 'Unknown error'}`, error.stack || '');
      throw new InternalServerErrorException('Failed to create customer');
    }
  }

  /**
   * Update an existing customer
   */
  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<CustomerDto> {
    const customer = await this.customersRepository.findOne({
      where: { id }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Apply updates
    Object.assign(customer, updateCustomerDto);

    const updatedCustomer = await this.customersRepository.save(customer);

    await this.eventsService.publishCustomerUpdated({
      customerId: updatedCustomer.id,
      updatedFields: updateCustomerDto,
      updatedBy: 'admin', // Placeholder
      timestamp: new Date().toISOString(),
    });

    // Create activity record for update
    await this.createActivity(updatedCustomer.id, 'customer', 'updated', 'Customer information updated');

    return this.mapToDto(updatedCustomer);
  }

  /**
   * Validate a customer (change status to active)
   */
  async validateCustomer(id: string): Promise<CustomerDto> {
    const customer = await this.customersRepository.findOne({
      where: { id }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    if (customer.status !== CustomerStatus.PENDING && 
        customer.status !== CustomerStatus.NEEDS_VALIDATION && 
        customer.status !== CustomerStatus.VALIDATION_IN_PROGRESS) {
      throw new BadRequestException('Customer is not in a validatable state');
    }

    const previousStatus = customer.status;
    
    // Update customer status and validation timestamps
    customer.status = CustomerStatus.ACTIVE;
    customer.validatedAt = new Date();
    customer.validatedBy = 'current-admin-id'; // In real implementation, get from the authenticated user

    // Add to validation history
    if (!customer.validationHistory) {
      customer.validationHistory = [];
    }

    customer.validationHistory.push({
      date: new Date(),
      action: 'validated',
      by: 'current-admin-id', // In real implementation, get from the authenticated user
      notes: 'Customer validated by admin'
    });

    const validatedCustomer = await this.customersRepository.save(customer);

    // Publish status change event
    await this.eventsService.publishCustomerStatusChanged({
      customerId: validatedCustomer.id,
      previousStatus: previousStatus,
      newStatus: validatedCustomer.status,
      changedBy: 'current-admin-id', // In real implementation, get from the authenticated user
      timestamp: new Date().toISOString()
    });

    // Publish specific validation event
    await this.eventsService.publishCustomerValidated({
      customerId: validatedCustomer.id,
      validatedBy: 'current-admin-id', // In real implementation, get from the authenticated user
      timestamp: new Date().toISOString()
    });
    
    // Create activity record for validation
    await this.createActivity(
      validatedCustomer.id, 
      'validation', 
      'validated', 
      'Customer account validated and activated'
    );

    return this.mapToDto(validatedCustomer);
  }

  /**
   * Suspend a customer
   */
  async suspendCustomer(id: string, reason: string): Promise<CustomerDto> {
    const customer = await this.customersRepository.findOne({
      where: { id }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    const previousStatus = customer.status;
    
    customer.status = CustomerStatus.SUSPENDED;
    customer.suspendedAt = new Date();
    customer.suspendedBy = 'current-admin-id'; // In real implementation, get from the authenticated user
    customer.suspensionReason = reason;

    const suspendedCustomer = await this.customersRepository.save(customer);

    // Publish status change event
    await this.eventsService.publishCustomerStatusChanged({
      customerId: suspendedCustomer.id,
      previousStatus: previousStatus,
      newStatus: suspendedCustomer.status,
      changedBy: 'current-admin-id', // In real implementation, get from the authenticated user
      reason: reason,
      timestamp: new Date().toISOString()
    });

    // Publish specific suspension event
    await this.eventsService.publishCustomerSuspended({
      customerId: suspendedCustomer.id,
      suspendedBy: 'current-admin-id', // In real implementation, get from the authenticated user
      reason: reason,
      timestamp: new Date().toISOString()
    });

    // Create activity record for suspension
    await this.createActivity(
      suspendedCustomer.id, 
      'account', 
      'suspended', 
      `Customer account suspended. Reason: ${reason}`
    );

    return this.mapToDto(suspendedCustomer);
  }

  /**
   * Reactivate a suspended customer
   */
  async reactivateCustomer(id: string): Promise<CustomerDto> {
    const customer = await this.customersRepository.findOne({
      where: { id }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    if (customer.status !== CustomerStatus.SUSPENDED) {
      throw new BadRequestException('Customer is not in a suspended state');
    }

    const previousStatus = customer.status;
    
    customer.status = CustomerStatus.ACTIVE;
    customer.reactivatedAt = new Date();
    customer.reactivatedBy = 'current-admin-id'; // In real implementation, get from the authenticated user

    const reactivatedCustomer = await this.customersRepository.save(customer);

    // Publish status change event
    await this.eventsService.publishCustomerStatusChanged({
      customerId: reactivatedCustomer.id,
      previousStatus: previousStatus,
      newStatus: reactivatedCustomer.status,
      changedBy: 'current-admin-id', // In real implementation, get from the authenticated user
      timestamp: new Date().toISOString()
    });

    // Publish specific reactivation event
    await this.eventsService.publishCustomerReactivated({
      customerId: reactivatedCustomer.id,
      reactivatedBy: 'current-admin-id', // In real implementation, get from the authenticated user
      timestamp: new Date().toISOString()
    });

    // Create activity record for reactivation
    await this.createActivity(
      reactivatedCustomer.id, 
      'account', 
      'reactivated', 
      'Customer account reactivated'
    );

    return this.mapToDto(reactivatedCustomer);
  }

  /**
   * Delete a customer
   */
  async remove(id: string): Promise<void> {
    const customer = await this.customersRepository.findOne({
      where: { id },
      relations: ['documents', 'activities', 'validationProcesses']
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Check for dependencies before deletion
    // In a real implementation, check for active subscriptions or other dependencies
    // For example:
    // if (customer.hasActiveSubscriptions) {
    //   throw new ConflictException('Cannot delete customer with active subscriptions');
    // }

    // Store customer info before deletion
    const customerId = customer.id;

    // Delete customer and related records
    await this.customersRepository.remove(customer);

    await this.eventsService.publishCustomerDeleted({
      customerId: customerId,
      deletedBy: 'admin', // Placeholder
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get customer documents
   */
  async getDocuments(customerId: string): Promise<CustomerDocumentDto[]> {
    const customer = await this.customersRepository.findOne({
      where: { id: customerId }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const documents = await this.documentsRepository.find({
      where: { customerId }
    });

    return documents.map(doc => this.mapDocumentToDto(doc));
  }

  /**
   * Upload a document for a customer
   */
  async uploadDocument(
    customerId: string,
    type: DocumentType,
    fileName: string,
    fileUrl: string,
    originalFileName: string
  ): Promise<CustomerDocumentDto> {
    const customer = await this.customersRepository.findOne({
      where: { id: customerId }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const document = this.documentsRepository.create({
      customerId,
      type,
      fileName,
      fileUrl,
      status: DocumentStatus.PENDING,
      uploadedBy: 'current-user-id' // In real implementation, get from the authenticated user
    });

    const savedDocument = await this.documentsRepository.save(document);

    // Create activity record for document upload
    await this.createActivity(
      customerId,
      'document',
      'uploaded',
      `Document ${originalFileName} uploaded`,
      {
        documentId: savedDocument.id,
        documentType: type
      }
    );

    return this.mapDocumentToDto(savedDocument);
  }

  /**
   * Approve a document
   */
  async approveDocument(customerId: string, documentId: string, comments?: string): Promise<CustomerDocumentDto> {
    const document = await this.documentsRepository.findOne({
      where: { id: documentId, customerId }
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found for customer ${customerId}`);
    }

    document.status = DocumentStatus.APPROVED;
    document.reviewedAt = new Date();
    document.reviewedBy = 'current-admin-id'; // In real implementation, get from the authenticated user
    document.reviewComments = comments;

    const approvedDocument = await this.documentsRepository.save(document);

    // Create activity record for document approval
    await this.createActivity(
      customerId,
      'document',
      'approved',
      `Document ${document.fileName} approved`,
      {
        documentId,
        documentType: document.type
      }
    );

    return this.mapDocumentToDto(approvedDocument);
  }

  /**
   * Reject a document
   */
  async rejectDocument(customerId: string, documentId: string, reason: string): Promise<CustomerDocumentDto> {
    const document = await this.documentsRepository.findOne({
      where: { id: documentId, customerId }
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found for customer ${customerId}`);
    }

    document.status = DocumentStatus.REJECTED;
    document.reviewedAt = new Date();
    document.reviewedBy = 'current-admin-id'; // In real implementation, get from the authenticated user
    document.reviewComments = reason;

    const rejectedDocument = await this.documentsRepository.save(document);

    // Create activity record for document rejection
    await this.createActivity(
      customerId,
      'document',
      'rejected',
      `Document ${document.fileName} rejected: ${reason}`,
      {
        documentId,
        documentType: document.type
      }
    );

    return this.mapDocumentToDto(rejectedDocument);
  }

  /**
   * Get customer activities
   */
  async getActivities(customerId: string, options: { page: number; limit: number }): Promise<CustomerActivityDto[]> {
    const customer = await this.customersRepository.findOne({
      where: { id: customerId }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const { page = 1, limit = 10 } = options;

    const activities = await this.activitiesRepository.find({
      where: { customerId },
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit
    });

    return activities.map(activity => this.mapActivityToDto(activity));
  }

  /**
   * Create activity record
   */
  private async createActivity(
    customerId: string,
    type: string,
    action: string,
    description: string,
    details?: Record<string, unknown>
  ): Promise<CustomerActivity> {
    const activity = this.activitiesRepository.create({
      customerId,
      type,
      action,
      description,
      performedBy: 'current-user-id', // In real implementation, get from the authenticated user
      performedByName: 'Admin User', // In real implementation, get from the authenticated user
      details
    });

    return this.activitiesRepository.save(activity);
  }

  /**
   * Get aggregated customer statistics
   */
  async getStatistics(): Promise<CustomerStatisticsDto> {
    const [
      total,
      active,
      inactive,
      pending,
      suspended,
      pmeCount,
      financialCount,
      freemiumCount,
      standardCount,
      premiumCount,
      enterpriseCount
    ] = await Promise.all([
      this.customersRepository.count(),
      this.customersRepository.count({ where: { status: CustomerStatus.ACTIVE } }),
      this.customersRepository.count({ where: { status: CustomerStatus.INACTIVE } }),
      this.customersRepository.count({ where: { status: CustomerStatus.PENDING } }),
      this.customersRepository.count({ where: { status: CustomerStatus.SUSPENDED } }),
      this.customersRepository.count({ where: { type: CustomerType.PME } }),
      this.customersRepository.count({ where: { type: CustomerType.FINANCIAL } }),
      this.customersRepository.count({ where: { accountType: AccountType.FREEMIUM } }),
      this.customersRepository.count({ where: { accountType: AccountType.STANDARD } }),
      this.customersRepository.count({ where: { accountType: AccountType.PREMIUM } }),
      this.customersRepository.count({ where: { accountType: AccountType.ENTERPRISE } }),
    ]);

    return {
      total,
      active,
      inactive,
      pending,
      suspended,
      byType: {
        pme: pmeCount,
        financial: financialCount
      },
      byAccountType: {
        freemium: freemiumCount,
        standard: standardCount,
        premium: premiumCount,
        enterprise: enterpriseCount
      }
    };
  }

  /**
   * Get customer statistics
   */
  private async getCustomerStatistics(customerId: string): Promise<{
    tokensUsed: number;
    lastActivity: Date;
    activeSubscriptions: number;
    totalSpent: number;
  }> {
    // In a real implementation, we would query various services for this data
    // For this example, we'll return mock data
    const activities = await this.activitiesRepository.find({
      where: { customerId },
      order: { timestamp: 'DESC' },
      take: 1
    });

    return {
      tokensUsed: 250, // Mock data
      lastActivity: activities.length > 0 ? activities[0].timestamp : new Date(),
      activeSubscriptions: 1, // Mock data
      totalSpent: 500 // Mock data
    };
  }

  /**
   * Helper method to map Customer entity to CustomerDto
   */
  private mapToDto(customer: Customer): CustomerDto {
    return {
      id: customer.id,
      name: customer.name,
      type: customer.type,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      country: customer.country,
      status: customer.status,
      billingContactName: customer.billingContactName,
      billingContactEmail: customer.billingContactEmail,
      tokenAllocation: customer.tokenAllocation,
      accountType: customer.accountType,
      ownerId: customer.ownerId,
      ownerEmail: customer.ownerEmail,
      validatedAt: customer.validatedAt,
      validatedBy: customer.validatedBy,
      suspendedAt: customer.suspendedAt,
      suspendedBy: customer.suspendedBy,
      suspensionReason: customer.suspensionReason,
      reactivatedAt: customer.reactivatedAt,
      reactivatedBy: customer.reactivatedBy,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    };
  }

  /**
   * Helper method to map CustomerDocument entity to CustomerDocumentDto
   */
  private mapDocumentToDto(document: CustomerDocument): CustomerDocumentDto {
    return {
      id: document.id,
      type: document.type,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      uploadedAt: document.uploadedAt,
      uploadedBy: document.uploadedBy,
      status: document.status,
      reviewedAt: document.reviewedAt,
      reviewedBy: document.reviewedBy,
      reviewComments: document.reviewComments
    };
  }

  /**   * Helper method to map CustomerActivity entity to CustomerActivityDto
   */
  private mapActivityToDto(activity: CustomerActivity): CustomerActivityDto {
    return {
      id: activity.id,
      customerId: activity.customerId,
      type: activity.type,
      action: activity.action,
      description: activity.description,
      performedBy: activity.performedBy,
      performedByName: activity.performedByName,
      timestamp: activity.timestamp.toISOString(), // Convert Date to ISO string
      details: activity.details
    };
  }
}
