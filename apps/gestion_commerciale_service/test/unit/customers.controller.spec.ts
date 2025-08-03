import { Test, TestingModule } from '@nestjs/testing';
import { CustomersController } from '../../src/modules/customers/customers.controller';
import { CustomersService } from '../../src/modules/customers/customers.service';
import { CreateCustomerDto } from '../../src/modules/customers/dto/create-customer.dto';
import { UpdateCustomerDto } from '../../src/modules/customers/dto/update-customer.dto';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('CustomersController', () => {
  let controller: CustomersController;
  let service: CustomersService;

  const mockCustomersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: mockCustomersService,
        },
      ],
    }).compile();

    controller = module.get<CustomersController>(CustomersController);
    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a customer successfully', async () => {
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

      mockCustomersService.create.mockResolvedValue(mockCustomer);

      const result = await controller.create(createCustomerDto);

      expect(service.create).toHaveBeenCalledWith(createCustomerDto);
      expect(result).toEqual(mockCustomer);
    });

    it('should handle ConflictException when email already exists', async () => {
      const createCustomerDto: CreateCustomerDto = {
        fullName: 'John Doe',
        email: 'existing@example.com',
        phoneNumber: '+1234567890',
      };

      const conflictError = new ConflictException('Un client avec cet email existe déjà.');
      mockCustomersService.create.mockRejectedValue(conflictError);

      await expect(controller.create(createCustomerDto)).rejects.toThrow(ConflictException);
      expect(service.create).toHaveBeenCalledWith(createCustomerDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated customers with default parameters', async () => {
      const mockResponse = {
        customers: [
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
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      mockCustomersService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith({
        page: undefined,
        limit: undefined,
        search: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      });
      expect(result).toEqual({
        customers: mockResponse.customers,
        total: mockResponse.total,
        page: mockResponse.page,
        limit: mockResponse.limit,
      });
    });

    it('should return paginated customers with query parameters', async () => {
      const queryParams = {
        page: 2,
        limit: 5,
        search: 'John',
        sortBy: 'fullName',
        sortOrder: 'ASC' as const,
      };

      const mockResponse = {
        customers: [
          {
            id: 'customer-1',
            fullName: 'John Doe',
            email: 'john@example.com',
          },
        ],
        total: 1,
        page: 2,
        limit: 5,
      };

      mockCustomersService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(
        queryParams.page,
        queryParams.limit,
        queryParams.search,
        queryParams.sortBy,
        queryParams.sortOrder
      );

      expect(service.findAll).toHaveBeenCalledWith(queryParams);
      expect(result.customers).toEqual(mockResponse.customers);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });
  });

  describe('findOne', () => {
    it('should return a customer by id', async () => {
      const customerId = 'customer-123';
      const mockCustomer = {
        id: customerId,
        fullName: 'John Doe',
        email: 'john@example.com',
        phoneNumber: '+1234567890',
      };

      mockCustomersService.findOne.mockResolvedValue(mockCustomer);

      const result = await controller.findOne(customerId);

      expect(service.findOne).toHaveBeenCalledWith(customerId);
      expect(result).toEqual(mockCustomer);
    });

    it('should handle NotFoundException when customer not found', async () => {
      const customerId = 'non-existent-id';
      const notFoundError = new NotFoundException('Customer not found');

      mockCustomersService.findOne.mockRejectedValue(notFoundError);

      await expect(controller.findOne(customerId)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith(customerId);
    });
  });

  describe('update', () => {
    it('should update a customer successfully', async () => {
      const customerId = 'customer-123';
      const updateCustomerDto: UpdateCustomerDto = {
        fullName: 'John Updated',
        email: 'john.updated@example.com',
      };

      const mockUpdatedCustomer = {
        id: customerId,
        fullName: 'John Updated',
        email: 'john.updated@example.com',
        phoneNumber: '+1234567890',
        updatedAt: new Date(),
      };

      mockCustomersService.update.mockResolvedValue(mockUpdatedCustomer);

      const result = await controller.update(customerId, updateCustomerDto);

      expect(service.update).toHaveBeenCalledWith(customerId, updateCustomerDto);
      expect(result).toEqual(mockUpdatedCustomer);
    });

    it('should handle NotFoundException when customer not found', async () => {
      const customerId = 'non-existent-id';
      const updateCustomerDto: UpdateCustomerDto = {
        fullName: 'Updated Name',
      };

      const notFoundError = new NotFoundException('Customer not found');
      mockCustomersService.update.mockRejectedValue(notFoundError);

      await expect(controller.update(customerId, updateCustomerDto)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(customerId, updateCustomerDto);
    });

    it('should handle ConflictException when email already exists', async () => {
      const customerId = 'customer-123';
      const updateCustomerDto: UpdateCustomerDto = {
        email: 'existing@example.com',
      };

      const conflictError = new ConflictException('Email already exists');
      mockCustomersService.update.mockRejectedValue(conflictError);

      await expect(controller.update(customerId, updateCustomerDto)).rejects.toThrow(ConflictException);
      expect(service.update).toHaveBeenCalledWith(customerId, updateCustomerDto);
    });
  });

  describe('remove', () => {
    it('should delete a customer successfully', async () => {
      const customerId = 'customer-123';

      mockCustomersService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(customerId);

      expect(service.remove).toHaveBeenCalledWith(customerId);
      expect(result).toBeUndefined(); // Remove typically returns void/undefined
    });

    it('should handle NotFoundException when customer not found', async () => {
      const customerId = 'non-existent-id';
      const notFoundError = new NotFoundException('Customer not found');

      mockCustomersService.remove.mockRejectedValue(notFoundError);

      await expect(controller.remove(customerId)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith(customerId);
    });
  });
});
