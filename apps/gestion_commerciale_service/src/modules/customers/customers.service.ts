import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm'; // Added EntityManager
import { Customer } from './entities/customer.entity';
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
    const customer = await this.customerRepository.findOneBy({ id });
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
    
    // Précharger l'entité avec les modifications
    const customer = await this.customerRepository.preload({
      id: id,
      ...updateCustomerDto,
    });
    
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found during preload`);
    }
    
    return this.customerRepository.save(customer);
  }

  async remove(id: string): Promise<void> {
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
    await customerRepository.save(customer);
  }
}
