import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm'; // Added EntityManager
import { Customer, CustomerCategory } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    // Vérifier si l'email ou le téléphone existent déjà
    if (createCustomerDto.email) {
      const existingByEmail = await this.customerRepository.findOne({ where: { email: createCustomerDto.email } });
      if (existingByEmail) {
        throw new ConflictException(`Un client avec l'email "${createCustomerDto.email}" existe déjà.`);
      }
    }

    if (createCustomerDto.phoneNumber) {
      const existingByPhone = await this.customerRepository.findOne({ where: { phoneNumber: createCustomerDto.phoneNumber } });
      if (existingByPhone) {
        throw new ConflictException(`Un client avec le numéro de téléphone "${createCustomerDto.phoneNumber}" existe déjà.`);
      }
    }

    const newCustomer = this.customerRepository.create(createCustomerDto);
    return this.customerRepository.save(newCustomer);
  }

  async findAll(options?: { 
    page?: number; 
    limit?: number; 
    search?: string; 
    sortBy?: string; 
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<{ customers: Customer[]; total: number; page: number; limit: number }> {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortBy = 'createdAt', 
      sortOrder = 'DESC' 
    } = options || {};

    const skip = (page - 1) * limit;
    let queryBuilder = this.customerRepository.createQueryBuilder('customer');
    
    if (search) {
      queryBuilder = queryBuilder.where(
        'customer.fullName ILIKE :search OR customer.email ILIKE :search OR customer.phoneNumber ILIKE :search',
        { search: `%${search}%` }
      );
    }

    const [customers, total] = await queryBuilder
      .orderBy(`customer.${sortBy}`, sortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      customers,
      total,
      page,
      limit
    };
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    // Vérifier si le client existe
    const existingCustomer = await this.customerRepository.findOne({ where: { id } });
    if (!existingCustomer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }
    
    // Vérifier si l'email est unique (si l'email est fourni et différent de l'actuel)
    if (updateCustomerDto.email && updateCustomerDto.email !== existingCustomer.email) {
      const existingByEmail = await this.customerRepository.findOne({ where: { email: updateCustomerDto.email } });
      if (existingByEmail && existingByEmail.id !== id) {
        throw new ConflictException(`Un client avec l'email "${updateCustomerDto.email}" existe déjà.`);
      }
    }
    
    // Vérifier si le téléphone est unique (si le téléphone est fourni et différent de l'actuel)
    if (updateCustomerDto.phoneNumber && updateCustomerDto.phoneNumber !== existingCustomer.phoneNumber) {
      const existingByPhone = await this.customerRepository.findOne({ where: { phoneNumber: updateCustomerDto.phoneNumber } });
      if (existingByPhone && existingByPhone.id !== id) {
        throw new ConflictException(`Un client avec le numéro de téléphone "${updateCustomerDto.phoneNumber}" existe déjà.`);
      }
    }
    
    // Find existing customer
    const customer = await this.findOne(id);
    
    // Use repository.update as expected by tests
    await this.customerRepository.update(id, updateCustomerDto);
    
    // Return updated customer by fetching from database
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    // First check if customer exists
    await this.findOne(id);
    
    const result = await this.customerRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }
  }
  
  // Method to update totalPurchases, potentially called from SalesService
  async updateTotalPurchases(customerId: string, amount: number, manager?: EntityManager): Promise<void> {
    const customerRepository = manager ? manager.getRepository(Customer) : this.customerRepository;
    const customer = await customerRepository.findOneBy({ id: customerId });
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${customerId}" not found`);
    }
    customer.totalPurchases = (customer.totalPurchases || 0) + amount;
    customer.lastPurchaseDate = new Date(); // Mise à jour de la date du dernier achat
    
    // Mise à jour de la catégorie en fonction du total des achats
    this.updateCustomerCategory(customer);
    
    await customerRepository.save(customer);
  }
  
  // Helper method to determine the customer category based on purchase history
  private updateCustomerCategory(customer: Customer): void {
    const totalPurchases = Number(customer.totalPurchases);
    
    if (totalPurchases >= 2000000) { // 2 million FC ou plus
      customer.category = CustomerCategory.VIP;
    } else if (totalPurchases >= 500000) { // 500,000 FC ou plus
      customer.category = CustomerCategory.BUSINESS;
    } else if (totalPurchases >= 200000) { // 200,000 FC ou plus
      customer.category = CustomerCategory.REGULAR;
    } else if (totalPurchases > 0 && (
      !customer.lastPurchaseDate || 
      new Date().getTime() - customer.lastPurchaseDate.getTime() > 90 * 24 * 60 * 60 * 1000 // 90 jours
    )) {
      customer.category = CustomerCategory.OCCASIONAL;
    } else if (totalPurchases === 0 || 
      (customer.createdAt && new Date().getTime() - customer.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000) // 30 jours
    ) {
      customer.category = CustomerCategory.NEW_CUSTOMER;
    } else {
      customer.category = CustomerCategory.REGULAR;
    }
  }

  /**
   * Trouve ou crée automatiquement un client basé sur son numéro de téléphone
   * Si le client existe avec ce numéro, il est retourné
   * Sinon, un nouveau client est créé automatiquement
   */
  async findOrCreateByPhoneNumber(
    phoneNumber: string,
    customerName?: string,
    email?: string
  ): Promise<Customer> {
    // Normaliser le numéro de téléphone (enlever espaces, tirets, etc.)
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    
    // Chercher un client existant avec ce numéro
    const existingCustomer = await this.customerRepository.findOne({
      where: { phoneNumber: normalizedPhone }
    });

    if (existingCustomer) {
      // Mettre à jour le nom et l'email si fournis et différents
      let needsUpdate = false;
      
      if (customerName && customerName !== existingCustomer.fullName) {
        existingCustomer.fullName = customerName;
        needsUpdate = true;
      }
      
      if (email && email !== existingCustomer.email) {
        // Vérifier que l'email n'est pas déjà utilisé par un autre client
        const emailCheck = await this.customerRepository.findOne({
          where: { email }
        });
        if (!emailCheck || emailCheck.id === existingCustomer.id) {
          existingCustomer.email = email;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        return this.customerRepository.save(existingCustomer);
      }
      
      return existingCustomer;
    }

    // Créer un nouveau client
    const newCustomer = this.customerRepository.create({
      phoneNumber: normalizedPhone,
      fullName: customerName || `Client ${normalizedPhone}`,
      email: email || null,
      category: CustomerCategory.NEW_CUSTOMER,
      totalPurchases: 0,
    });

    return this.customerRepository.save(newCustomer);
  }

  /**
   * Trouve un client par numéro de téléphone
   */
  async findByPhoneNumber(phoneNumber: string): Promise<Customer | null> {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    return this.customerRepository.findOne({
      where: { phoneNumber: normalizedPhone }
    });
  }

  /**
   * Normalise un numéro de téléphone en enlevant tous les caractères non numériques
   * sauf le + au début
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    if (!phoneNumber) return '';
    
    // Garder le + au début s'il existe, enlever tous les autres caractères non numériques
    const hasPlus = phoneNumber.startsWith('+');
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    
    return hasPlus ? `+${digitsOnly}` : digitsOnly;
  }
}
