import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { Customer, CustomerDocument, CustomerStatus, DocumentStatus, DocumentType } from '../entities';
import {
  CustomerDto,
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerQueryParamsDto,
  CustomerDocumentDto,
  VerifyDocumentDto
} from '../dtos';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(CustomerDocument)
    private documentsRepository: Repository<CustomerDocument>,
  ) {}

  /**
   * Get all customers with pagination and filtering
   */
  async findAll(queryParams: CustomerQueryParamsDto): Promise<{ 
    customers: CustomerDto[]; 
    total: number; 
    page: number; 
    limit: number; 
    pages: number;
  }> {
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
      // Additional search conditions could be added here with OR logic
    }

    const [customers, total] = await this.customersRepository.findAndCount({
      where,
      order: {
        [sortBy]: sortOrder.toUpperCase()
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const pages = Math.ceil(total / limit);

    return {
      customers: customers.map(customer => this.mapToDto(customer)),
      total,
      page,
      limit,
      pages
    };
  }

  /**
   * Get a single customer by ID
   */
  async findOne(id: string, includeDocuments = false): Promise<CustomerDto> {
    const customer = await this.customersRepository.findOne({
      where: { id },
      relations: includeDocuments ? ['documents'] : []
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return this.mapToDto(customer, includeDocuments);
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
      throw new BadRequestException('Email already in use');
    }

    const customer = this.customersRepository.create({
      ...createCustomerDto,
      status: CustomerStatus.PENDING,
      isOnboarded: false,
      emailVerified: false,
      phoneVerified: false,
      // Convert date string to Date object if provided
      dateOfBirth: createCustomerDto.dateOfBirth ? new Date(createCustomerDto.dateOfBirth) : null
    });

    const savedCustomer = await this.customersRepository.save(customer);
    return this.mapToDto(savedCustomer);
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

    // Check if email is being changed and if it's already in use
    if (updateCustomerDto.email && updateCustomerDto.email !== customer.email) {
      const existingCustomer = await this.customersRepository.findOne({
        where: { email: updateCustomerDto.email }
      });

      if (existingCustomer) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Update customer fields
    Object.assign(customer, {
      ...updateCustomerDto,
      // Convert date string to Date object if provided
      dateOfBirth: updateCustomerDto.dateOfBirth ? new Date(updateCustomerDto.dateOfBirth) : customer.dateOfBirth
    });

    const updatedCustomer = await this.customersRepository.save(customer);
    return this.mapToDto(updatedCustomer);
  }

  /**
   * Delete a customer
   */
  async remove(id: string): Promise<void> {
    const customer = await this.customersRepository.findOne({
      where: { id }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    await this.customersRepository.remove(customer);
  }

  /**
   * Update customer status
   */
  async updateStatus(id: string, status: CustomerStatus): Promise<CustomerDto> {
    const customer = await this.customersRepository.findOne({
      where: { id }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    customer.status = status;
    const updatedCustomer = await this.customersRepository.save(customer);
    return this.mapToDto(updatedCustomer);
  }

  /**
   * Get customer documents
   */
  async getDocuments(customerId: string): Promise<CustomerDocumentDto[]> {
    const documents = await this.documentsRepository.find({
      where: { customerId }
    });

    return documents.map(doc => this.mapDocumentToDto(doc));
  }

  /**
   * Get a specific document
   */
  async getDocument(id: string): Promise<CustomerDocumentDto> {
    const document = await this.documentsRepository.findOne({
      where: { id }
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return this.mapDocumentToDto(document);
  }

  /**
   * Upload a document
   */
  async uploadDocument(
    customerId: string, 
    type: DocumentType, 
    name: string, 
    fileUrl: string, 
    expiryDate?: string
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
      name,
      fileUrl,
      status: DocumentStatus.PENDING,
      expiryDate: expiryDate ? new Date(expiryDate) : null
    });

    const savedDocument = await this.documentsRepository.save(document);
    return this.mapDocumentToDto(savedDocument);
  }

  /**
   * Verify or reject a document
   */
  async verifyDocument(
    id: string, 
    verifyDocumentDto: VerifyDocumentDto
  ): Promise<CustomerDocumentDto> {
    const document = await this.documentsRepository.findOne({
      where: { id }
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    document.status = verifyDocumentDto.status;
    
    if (verifyDocumentDto.status === DocumentStatus.VERIFIED) {
      document.verifiedAt = new Date();
      document.rejectionReason = null;
    } else if (verifyDocumentDto.status === DocumentStatus.REJECTED) {
      document.rejectionReason = verifyDocumentDto.rejectionReason;
    }

    const updatedDocument = await this.documentsRepository.save(document);
    return this.mapDocumentToDto(updatedDocument);
  }

  /**
   * Delete a document
   */
  async removeDocument(id: string): Promise<void> {
    const document = await this.documentsRepository.findOne({
      where: { id }
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    await this.documentsRepository.remove(document);
  }

  /**
   * Helper method to map Customer entity to CustomerDto
   */
  private mapToDto(customer: Customer, includeDocuments = false): CustomerDto {
    const dto: CustomerDto = {
      id: customer.id,
      type: customer.type,
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      companyName: customer.companyName,
      registrationNumber: customer.registrationNumber,
      status: customer.status,
      address: customer.address,
      dateOfBirth: customer.dateOfBirth,
      nationality: customer.nationality,
      taxId: customer.taxId,
      isOnboarded: customer.isOnboarded,
      emailVerified: customer.emailVerified,
      phoneVerified: customer.phoneVerified,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    };

    if (includeDocuments && customer.documents) {
      (dto as any).documents = customer.documents.map(doc => this.mapDocumentToDto(doc));
    }

    return dto;
  }

  /**
   * Helper method to map CustomerDocument entity to CustomerDocumentDto
   */
  private mapDocumentToDto(document: CustomerDocument): CustomerDocumentDto {
    return {
      id: document.id,
      customerId: document.customerId,
      type: document.type,
      name: document.name,
      fileUrl: document.fileUrl,
      status: document.status,
      verifiedAt: document.verifiedAt,
      rejectionReason: document.rejectionReason,
      expiryDate: document.expiryDate,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt
    };
  }
}
