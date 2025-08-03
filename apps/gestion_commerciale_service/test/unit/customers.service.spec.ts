import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CustomersService } from '../../src/modules/customers/customers.service';
import { Customer } from '../../src/modules/customers/entities/customer.entity';
import { CreateCustomerDto } from '../../src/modules/customers/dto/create-customer.dto';
import { UpdateCustomerDto } from '../../src/modules/customers/dto/update-customer.dto';

describe('CustomersService', () => {
  let service: CustomersService;
  let repository: Repository<Customer>;

  const mockCustomerRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    repository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      const createCustomerDto: CreateCustomerDto = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
        address: '123 Main St',
      };

      const mockCustomer = {
        id: 'customer-123',
        ...createCustomerDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findOne.mockResolvedValue(null); // No existing customer
      mockCustomerRepository.create.mockReturnValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue(mockCustomer);

      const result = await service.create(createCustomerDto);

      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({
        where: { email: createCustomerDto.email },
      });
      expect(mockCustomerRepository.create).toHaveBeenCalledWith(createCustomerDto);
      expect(mockCustomerRepository.save).toHaveBeenCalledWith(mockCustomer);
      expect(result).toEqual(mockCustomer);
    });

    it('should throw ConflictException when email already exists', async () => {
      const createCustomerDto: CreateCustomerDto = {
        fullName: 'John Doe',
        email: 'existing@example.com',
        phoneNumber: '+1234567890',
        address: '123 Main St',
      };

      const existingCustomer = {
        id: 'existing-customer',
        email: 'existing@example.com',
      };

      mockCustomerRepository.findOne.mockResolvedValue(existingCustomer);

      await expect(service.create(createCustomerDto)).rejects.toThrow(ConflictException);
      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({
        where: { email: createCustomerDto.email },
      });
    });

    it('should throw ConflictException when phone number already exists', async () => {
      const createCustomerDto: CreateCustomerDto = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1111111111',
        address: '123 Main St',
      };

      const existingCustomer = {
        id: 'existing-customer',
        phoneNumber: '+1111111111',
      };

      mockCustomerRepository.findOne
        .mockResolvedValueOnce(null) // No customer with this email
        .mockResolvedValueOnce(existingCustomer); // Customer with this phone exists

      await expect(service.create(createCustomerDto)).rejects.toThrow(ConflictException);
    });

    it('should create customer without email', async () => {
      const createCustomerDto: CreateCustomerDto = {
        fullName: 'John Doe',
        phoneNumber: '+1234567890',
        address: '123 Main St',
      };

      const mockCustomer = {
        id: 'customer-123',
        ...createCustomerDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findOne.mockResolvedValue(null);
      mockCustomerRepository.create.mockReturnValue(mockCustomer);
      mockCustomerRepository.save.mockResolvedValue(mockCustomer);

      const result = await service.create(createCustomerDto);

      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({
        where: { phoneNumber: createCustomerDto.phoneNumber },
      });
      expect(result).toEqual(mockCustomer);
    });
  });

  describe('findAll', () => {
    it('should return paginated customers with default options', async () => {
      const mockCustomers = [
        {
          id: 'customer-1',
          fullName: 'John Doe',
          email: 'john@example.com',
        },
        {
          id: 'customer-2',
          fullName: 'Jane Smith',
          email: 'jane@example.com',
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockCustomers, 2]),
      };

      mockCustomerRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll();

      expect(result).toEqual({
        customers: mockCustomers,
        total: 2,
        page: 1,
        limit: 10,
      });
    });

    it('should apply search filter when provided', async () => {
      const mockCustomers = [
        {
          id: 'customer-1',
          fullName: 'John Doe',
          email: 'john@example.com',
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockCustomers, 1]),
      };

      mockCustomerRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        search: 'John',
      });

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'customer.fullName ILIKE :search OR customer.email ILIKE :search OR customer.phoneNumber ILIKE :search',
        { search: '%John%' }
      );
      expect(result.customers).toEqual(mockCustomers);
    });

    it('should apply custom sorting', async () => {
      const mockCustomers = [
        {
          id: 'customer-1',
          fullName: 'Jane Smith',
        },
        {
          id: 'customer-2',
          fullName: 'John Doe',
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([mockCustomers, 2]),
      };

      mockCustomerRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'ASC',
      });

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('customer.name', 'ASC');
      expect(result.customers).toEqual(mockCustomers);
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      const customerId = 'customer-123';
      const mockCustomer = {
        id: customerId,
        fullName: 'John Doe',
        email: 'john@example.com',
      };

      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findOne(customerId);

      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({
        where: { id: customerId },
      });
      expect(result).toEqual(mockCustomer);
    });

    it('should throw NotFoundException when customer not found', async () => {
      const customerId = 'non-existent-id';

      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(customerId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a customer', async () => {
      const customerId = 'customer-123';
      const updateCustomerDto: UpdateCustomerDto = {
        fullName: 'John Updated',
        email: 'john.updated@example.com',
      };

      const existingCustomer = {
        id: customerId,
        fullName: 'John Doe',
        email: 'john@example.com',
      };

      const updatedCustomer = {
        ...existingCustomer,
        ...updateCustomerDto,
      };

      // Mock multiple findOne calls in the update method:
      // 1. Initial validation check (line 84)
      // 2. Email uniqueness check (line 91) - should return null (no conflict)
      // 3. Check for existing customer before update (this.findOne call at line 104)  
      // 4. Return updated customer (this.findOne call at line 113)
      mockCustomerRepository.findOne
        .mockResolvedValueOnce(existingCustomer) // First call for validation
        .mockResolvedValueOnce(null) // Email uniqueness check - no conflict
        .mockResolvedValueOnce(existingCustomer) // Third call before update
        .mockResolvedValueOnce(updatedCustomer); // Fourth call to return updated data
      mockCustomerRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update(customerId, updateCustomerDto);

      expect(mockCustomerRepository.update).toHaveBeenCalledWith(customerId, updateCustomerDto);
      expect(result).toEqual(updatedCustomer);
    });

    it('should throw NotFoundException when customer not found', async () => {
      const customerId = 'non-existent-id';
      const updateCustomerDto: UpdateCustomerDto = {
        fullName: 'Updated Name',
      };

      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(service.update(customerId, updateCustomerDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when email already exists for another customer', async () => {
      const customerId = 'customer-123';
      const updateCustomerDto: UpdateCustomerDto = {
        email: 'existing@example.com',
      };

      const existingCustomer = {
        id: customerId,
        email: 'john@example.com',
      };

      const customerWithSameEmail = {
        id: 'other-customer',
        email: 'existing@example.com',
      };

      mockCustomerRepository.findOne
        .mockResolvedValueOnce(existingCustomer) // Customer exists
        .mockResolvedValueOnce(customerWithSameEmail); // Email exists for another customer

      await expect(service.update(customerId, updateCustomerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a customer', async () => {
      const customerId = 'customer-123';
      const mockCustomer = {
        id: customerId,
        fullName: 'John Doe',
      };

      mockCustomerRepository.findOne.mockResolvedValue(mockCustomer);
      mockCustomerRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(customerId);

      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({
        where: { id: customerId },
      });
      expect(mockCustomerRepository.delete).toHaveBeenCalledWith(customerId);
    });

    it('should throw NotFoundException when customer not found', async () => {
      const customerId = 'non-existent-id';

      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(customerId)).rejects.toThrow(NotFoundException);
    });
  });
});
