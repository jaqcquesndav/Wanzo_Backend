import { Injectable, NotFoundException } from '@nestjs/common';
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
    const newCustomer = this.customerRepository.create(createCustomerDto);
    // Potentially add logic here, e.g., hashing passwords if they were part of a customer model
    return this.customerRepository.save(newCustomer);
  }

  async findAll(): Promise<Customer[]> {
    // Add pagination, filtering, sorting based on query params from controller
    return this.customerRepository.find();
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOneBy({ id });
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
    }
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.customerRepository.preload({
      id: id,
      ...updateCustomerDto,
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID "${id}" not found`);
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
