import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { Customer, CustomerType, CustomerStatus } from '../../entities/customer.entity';
import { CustomerEventsService } from './customer-events.service';

export interface CustomerSearchOptions {
  type?: CustomerType;
  status?: CustomerStatus;
  search?: string; // Recherche dans nom, email
  page?: number;
  limit?: number;
  includeRelations?: string[];
}

export interface CustomerRegistryResult<T = Customer> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Service registry global pour tous les types de clients
 * Fournit les opérations CRUD de base utilisées par Company et Financial-Institution modules
 */
@Injectable()
export class CustomerRegistryService {
  private readonly logger = new Logger(CustomerRegistryService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly customerEventsService: CustomerEventsService,
  ) {}

  /**
   * Recherche globale de clients avec options avancées
   */
  async findAll(options: CustomerSearchOptions = {}): Promise<CustomerRegistryResult> {
    const {
      type,
      status,
      search,
      page = 1,
      limit = 10,
      includeRelations = ['users', 'subscriptions'],
    } = options;

    const queryBuilder = this.customerRepository.createQueryBuilder('customer');

    // Filtres
    if (type) {
      queryBuilder.andWhere('customer.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('customer.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(customer.name ILIKE :search OR customer.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Relations
    includeRelations.forEach(relation => {
      queryBuilder.leftJoinAndSelect(`customer.${relation}`, relation);
    });

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Ordre
    queryBuilder.orderBy('customer.createdAt', 'DESC');

    const [data, total] = await queryBuilder.getManyAndCount();

    this.logger.log(`Found ${total} customers with filters: ${JSON.stringify(options)}`);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Trouve un client par ID avec relations optionnelles
   */
  async findById(id: string, includeRelations: string[] = []): Promise<Customer> {
    const queryBuilder = this.customerRepository.createQueryBuilder('customer')
      .where('customer.id = :id', { id });

    // Relations optionnelles
    includeRelations.forEach(relation => {
      queryBuilder.leftJoinAndSelect(`customer.${relation}`, relation);
    });

    const customer = await queryBuilder.getOne();

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  /**
   * Trouve un client par email
   */
  async findByEmail(email: string): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { email },
      relations: ['users', 'subscriptions'],
    });
  }

  /**
   * Trouve tous les clients d'un type spécifique
   */
  async findByType(
    type: CustomerType,
    page = 1,
    limit = 10,
    includeRelations: string[] = [],
  ): Promise<CustomerRegistryResult> {
    const [data, total] = await this.customerRepository.findAndCount({
      where: { type },
      relations: includeRelations,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Trouve tous les clients avec un statut spécifique
   */
  async findByStatus(
    status: CustomerStatus,
    page = 1,
    limit = 10,
  ): Promise<CustomerRegistryResult> {
    const [data, total] = await this.customerRepository.findAndCount({
      where: { status },
      relations: ['users', 'subscriptions'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Création de client de base (utilisé par les sous-modules)
   */
  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    this.logger.log(`Creating customer: ${customerData.name} (${customerData.type})`);

    // Vérification d'unicité email
    if (customerData.email) {
      const existingCustomer = await this.findByEmail(customerData.email);
      if (existingCustomer) {
        throw new Error(`Customer with email ${customerData.email} already exists`);
      }
    }

    const customer = this.customerRepository.create({
      ...customerData,
      status: customerData.status || CustomerStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedCustomer = await this.customerRepository.save(customer);

    // Événement de création
    await this.customerEventsService.emitCustomerCreated({
      customerId: savedCustomer.id,
      customerName: savedCustomer.name,
      customerType: savedCustomer.type,
      userId: 'system',
    });

    this.logger.log(`Customer created successfully: ${savedCustomer.id}`);
    return savedCustomer;
  }

  /**
   * Mise à jour générique de client
   */
  async updateCustomer(
    id: string,
    updateData: Partial<Customer>,
    updatedBy = 'system',
  ): Promise<Customer> {
    this.logger.log(`Updating customer: ${id}`);

    const customer = await this.findById(id);
    
    // Merge des données
    const updatedCustomer = this.customerRepository.merge(customer, {
      ...updateData,
      updatedAt: new Date(),
    });

    const savedCustomer = await this.customerRepository.save(updatedCustomer);

    // Événement de mise à jour
    await this.customerEventsService.emitCustomerUpdated({
      customerId: savedCustomer.id,
      customerName: savedCustomer.name,
      customerType: savedCustomer.type,
      userId: updatedBy,
      changedFields: Object.keys(updateData),
    });

    this.logger.log(`Customer updated successfully: ${id}`);
    return savedCustomer;
  }

  /**
   * Suppression de client avec vérifications
   */
  async deleteCustomer(id: string, deletedBy = 'system'): Promise<void> {
    this.logger.log(`Deleting customer: ${id}`);

    const customer = await this.findById(id, ['users', 'subscriptions']);

    // Vérifications avant suppression
    if (customer.users && customer.users.length > 0) {
      throw new Error(`Cannot delete customer ${id}: has active users`);
    }

    if (customer.subscriptions && customer.subscriptions.some(sub => sub.status === 'active')) {
      throw new Error(`Cannot delete customer ${id}: has active subscriptions`);
    }

    await this.customerRepository.remove(customer);

    // Événement de suppression
    await this.customerEventsService.emitCustomerDeleted({
      customerId: id,
      customerName: customer.name,
      customerType: customer.type,
      userId: deletedBy,
      reason: 'Customer deletion requested',
    });

    this.logger.log(`Customer deleted successfully: ${id}`);
  }

  /**
   * Vérifie l'existence d'un client
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.customerRepository.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Compte le nombre de clients par type
   */
  async countByType(): Promise<Record<CustomerType, number>> {
    const counts = await this.customerRepository
      .createQueryBuilder('customer')
      .select('customer.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('customer.type')
      .getRawMany();

    const result: Record<CustomerType, number> = {
      [CustomerType.SME]: 0,
      [CustomerType.FINANCIAL]: 0,
    };

    counts.forEach(({ type, count }) => {
      result[type as CustomerType] = parseInt(count, 10);
    });

    return result;
  }

  /**
   * Compte le nombre de clients par statut
   */
  async countByStatus(): Promise<Record<CustomerStatus, number>> {
    const counts = await this.customerRepository
      .createQueryBuilder('customer')
      .select('customer.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('customer.status')
      .getRawMany();

    const result: Record<CustomerStatus, number> = {
      [CustomerStatus.ACTIVE]: 0,
      [CustomerStatus.PENDING]: 0,
      [CustomerStatus.SUSPENDED]: 0,
      [CustomerStatus.INACTIVE]: 0,
      [CustomerStatus.NEEDS_VALIDATION]: 0,
      [CustomerStatus.VALIDATION_IN_PROGRESS]: 0,
    };

    counts.forEach(({ status, count }) => {
      result[status as CustomerStatus] = parseInt(count, 10);
    });

    return result;
  }

  /**
   * Recherche de clients avec critères complexes
   */
  async search(criteria: {
    query?: string;
    types?: CustomerType[];
    statuses?: CustomerStatus[];
    dateFrom?: Date;
    dateTo?: Date;
    hasUsers?: boolean;
    hasSubscriptions?: boolean;
  }): Promise<Customer[]> {
    const queryBuilder = this.customerRepository.createQueryBuilder('customer');

    if (criteria.query) {
      queryBuilder.andWhere(
        '(customer.name ILIKE :query OR customer.email ILIKE :query)',
        { query: `%${criteria.query}%` }
      );
    }

    if (criteria.types && criteria.types.length > 0) {
      queryBuilder.andWhere('customer.type IN (:...types)', { types: criteria.types });
    }

    if (criteria.statuses && criteria.statuses.length > 0) {
      queryBuilder.andWhere('customer.status IN (:...statuses)', { statuses: criteria.statuses });
    }

    if (criteria.dateFrom) {
      queryBuilder.andWhere('customer.createdAt >= :dateFrom', { dateFrom: criteria.dateFrom });
    }

    if (criteria.dateTo) {
      queryBuilder.andWhere('customer.createdAt <= :dateTo', { dateTo: criteria.dateTo });
    }

    if (criteria.hasUsers !== undefined) {
      queryBuilder.leftJoin('customer.users', 'users');
      if (criteria.hasUsers) {
        queryBuilder.andWhere('users.id IS NOT NULL');
      } else {
        queryBuilder.andWhere('users.id IS NULL');
      }
    }

    if (criteria.hasSubscriptions !== undefined) {
      queryBuilder.leftJoin('customer.subscriptions', 'subscriptions');
      if (criteria.hasSubscriptions) {
        queryBuilder.andWhere('subscriptions.id IS NOT NULL');
      } else {
        queryBuilder.andWhere('subscriptions.id IS NULL');
      }
    }

    queryBuilder.orderBy('customer.createdAt', 'DESC');

    return queryBuilder.getMany();
  }
}