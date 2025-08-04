import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { Customer, CustomerStatus, CustomerType } from '../entities/customer.entity';
import { User } from '../../system-users/entities/user.entity';
import { CustomerEventsProducer } from '../../kafka/producers/customer-events.producer';

describe('CustomerService', () => {
  let service: CustomerService;
  let customerRepository: Repository<Customer>;
  let customerEventsProducer: CustomerEventsProducer;

  const mockCustomer: Partial<Customer> = {
    id: 'customer-123',
    name: 'Test Company Ltd',
    email: 'contact@testcompany.com',
    phone: '+33123456789',
    address: {
      street: '123 Test Street',
      city: 'Paris',
      country: 'France',
      commune: 'Paris 1er',
      province: 'Ile-de-France',
    },
    type: CustomerType.SME,
    status: CustomerStatus.ACTIVE,
    createdAt: new Date(),
  };

  const mockUser: Partial<User> = {
    id: 'user-123',
    auth0Id: 'auth0|test123',
    email: 'test@example.com',
    customerId: 'customer-123',
  };

  beforeEach(async () => {
    const mockCustomerRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      merge: jest.fn(),
    };

    const mockCustomerEventsProducer = {
      emitUserCreated: jest.fn(),
      emitUserUpdated: jest.fn(),
      emitCustomerCreated: jest.fn(),
      emitCustomerUpdated: jest.fn(),
      publishCustomerCreated: jest.fn(),
      publishCustomerUpdated: jest.fn(),
      customerCreated: jest.fn(),
      customerUpdated: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: CustomerEventsProducer,
          useValue: mockCustomerEventsProducer,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
    customerRepository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
    customerEventsProducer = module.get<CustomerEventsProducer>(CustomerEventsProducer);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create customer successfully', async () => {
      const createDto = {
        name: 'Test Company Ltd',
        email: 'contact@testcompany.com',
        phone: '+33123456789',
        address: {
          street: '123 Test Street',
          city: 'Paris',
          country: 'France',
          commune: 'Paris 1er',
          province: 'Ile-de-France',
        },
        type: CustomerType.SME,
      };

      jest.spyOn(customerRepository, 'create').mockReturnValue(mockCustomer as Customer);
      jest.spyOn(customerRepository, 'save').mockResolvedValue(mockCustomer as Customer);

      const result = await service.create(createDto);

      expect(customerRepository.create).toHaveBeenCalledWith(createDto);
      expect(customerRepository.save).toHaveBeenCalled();
      expect(customerEventsProducer.customerCreated).toHaveBeenCalledWith(mockCustomer);
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('findAll', () => {
    it('should return paginated customers', async () => {
      const mockCustomers = [mockCustomer];
      jest.spyOn(customerRepository, 'findAndCount').mockResolvedValue([mockCustomers as Customer[], 1]);

      const result = await service.findAll(1, 10);

      expect(customerRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
        relations: ['users', 'subscriptions'],
      });
      expect(result[0]).toEqual(mockCustomers);
      expect(result[1]).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return customer by id', async () => {
      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(mockCustomer as Customer);

      const result = await service.findById('customer-123');

      expect(customerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'customer-123' },
        relations: ['users', 'subscriptions', 'tokenUsages'],
      });
      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException when customer not found', async () => {
      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(null);

      await expect(service.findById('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update customer successfully', async () => {
      const updateDto = {
        name: 'Updated Company Name',
        email: 'updated@testcompany.com',
      };

      const updatedCustomer = { ...mockCustomer, ...updateDto };

      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(mockCustomer as Customer);
      jest.spyOn(customerRepository, 'merge').mockReturnValue(updatedCustomer as Customer);
      jest.spyOn(customerRepository, 'save').mockResolvedValue(updatedCustomer as Customer);

      const result = await service.update('customer-123', updateDto);

      expect(customerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'customer-123' },
        relations: ['users', 'subscriptions', 'tokenUsages'],
      });
      expect(customerRepository.merge).toHaveBeenCalledWith(mockCustomer, updateDto);
      expect(customerRepository.save).toHaveBeenCalled();
      expect(customerEventsProducer.customerUpdated).toHaveBeenCalledWith(updatedCustomer);
      expect(result).toEqual(updatedCustomer);
    });

    it('should throw NotFoundException when customer not found', async () => {
      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(null);

      await expect(service.update('nonexistent', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateById', () => {
    it('should update customer by id successfully', async () => {
      const updateFields = {
        name: 'Updated Company Name',
        status: CustomerStatus.ACTIVE,
      };

      const updatedCustomer = { ...mockCustomer, ...updateFields };

      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(mockCustomer as Customer);
      jest.spyOn(customerRepository, 'merge').mockReturnValue(updatedCustomer as Customer);
      jest.spyOn(customerRepository, 'save').mockResolvedValue(updatedCustomer as Customer);

      const result = await service.updateById('customer-123', updateFields);

      expect(customerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'customer-123' },
        relations: ['users', 'subscriptions', 'tokenUsages'],
      });
      expect(customerRepository.merge).toHaveBeenCalledWith(mockCustomer, updateFields);
      expect(customerRepository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedCustomer);
    });

    it('should throw NotFoundException when customer not found', async () => {
      jest.spyOn(customerRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateById('nonexistent', {})).rejects.toThrow(NotFoundException);
    });
  });
});
