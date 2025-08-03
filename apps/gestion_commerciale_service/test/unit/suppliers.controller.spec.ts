import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersController } from '../../src/modules/suppliers/suppliers.controller';
import { SuppliersService } from '../../src/modules/suppliers/suppliers.service';
import { CreateSupplierDto } from '../../src/modules/suppliers/dto/create-supplier.dto';
import { UpdateSupplierDto } from '../../src/modules/suppliers/dto/update-supplier.dto';
import { SupplierCategory } from '../../src/modules/suppliers/enums/supplier-category.enum';
import { User, UserRole } from '../../src/modules/auth/entities/user.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('SuppliersController', () => {
  let controller: SuppliersController;
  let service: SuppliersService;

  const mockSuppliersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.ADMIN,
    isActive: true,
    companyId: 'company-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController],
      providers: [
        {
          provide: SuppliersService,
          useValue: mockSuppliersService,
        },
      ],
    }).compile();

    controller = module.get<SuppliersController>(SuppliersController);
    service = module.get<SuppliersService>(SuppliersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a supplier successfully', async () => {
      const createSupplierDto: CreateSupplierDto = {
        name: 'Acme Supplies Corp',
        contactPerson: 'Jean Dupont',
        email: 'contact@acme-supplies.com',
        phoneNumber: '+1234567890',
        address: '123 Business St',
        category: SupplierCategory.STRATEGIC,
        deliveryTimeInDays: 5,
        paymentTerms: 'Net 30',
      };

      const mockSupplier = {
        id: 'supplier-123',
        ...createSupplierDto,
        companyId: mockUser.companyId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSuppliersService.create.mockResolvedValue(mockSupplier);

      const result = await controller.create(createSupplierDto, mockUser);

      expect(service.create).toHaveBeenCalledWith(createSupplierDto, mockUser.companyId);
      expect(result).toEqual(mockSupplier);
    });

    it('should handle ConflictException when email already exists', async () => {
      const createSupplierDto: CreateSupplierDto = {
        name: 'Acme Supplies Corp',
        email: 'existing@example.com',
        phoneNumber: '+1234567890',
        category: SupplierCategory.REGULAR,
        deliveryTimeInDays: 3,
        paymentTerms: 'Net 15',
      };

      const conflictError = new ConflictException('Supplier with this email already exists');
      mockSuppliersService.create.mockRejectedValue(conflictError);

      await expect(controller.create(createSupplierDto, mockUser)).rejects.toThrow(ConflictException);
      expect(service.create).toHaveBeenCalledWith(createSupplierDto, mockUser.companyId);
    });
  });

  describe('findAll', () => {
    it('should return paginated suppliers with default parameters', async () => {
      const mockResponse = {
        suppliers: [
          {
            id: 'supplier-1',
            name: 'Acme Supplies',
            email: 'acme@example.com',
            category: SupplierCategory.STRATEGIC,
          },
          {
            id: 'supplier-2',
            name: 'Tech Services',
            email: 'tech@example.com',
            category: SupplierCategory.REGULAR,
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      mockSuppliersService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(mockUser);

      expect(service.findAll).toHaveBeenCalledWith(mockUser.companyId, { page: 1, limit: 10 });
      expect(result).toEqual(mockResponse);
    });

    it('should return paginated suppliers with query parameters', async () => {
      const page = 2;
      const limit = 5;

      const mockResponse = {
        suppliers: [
          {
            id: 'supplier-1',
            name: 'Tech Services',
            email: 'tech@example.com',
            category: SupplierCategory.REGULAR,
          },
        ],
        total: 1,
        page: 2,
        limit: 5,
      };

      mockSuppliersService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(mockUser, page, limit);

      expect(service.findAll).toHaveBeenCalledWith(mockUser.companyId, { page, limit });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('findOne', () => {
    it('should return a supplier by id', async () => {
      const supplierId = 'supplier-123';
      const mockSupplier = {
        id: supplierId,
        name: 'Acme Supplies Corp',
        email: 'contact@acme-supplies.com',
        phoneNumber: '+1234567890',
        category: SupplierCategory.STRATEGIC,
      };

      mockSuppliersService.findOne.mockResolvedValue(mockSupplier);

      const result = await controller.findOne(supplierId, mockUser);

      expect(service.findOne).toHaveBeenCalledWith(supplierId, mockUser.companyId);
      expect(result).toEqual(mockSupplier);
    });

    it('should handle NotFoundException when supplier not found', async () => {
      const supplierId = 'non-existent-id';
      const notFoundError = new NotFoundException('Supplier not found');

      mockSuppliersService.findOne.mockRejectedValue(notFoundError);

      await expect(controller.findOne(supplierId, mockUser)).rejects.toThrow(NotFoundException);
      expect(service.findOne).toHaveBeenCalledWith(supplierId, mockUser.companyId);
    });
  });

  describe('update', () => {
    it('should update a supplier successfully', async () => {
      const supplierId = 'supplier-123';
      const updateSupplierDto: UpdateSupplierDto = {
        name: 'Acme Supplies Updated',
        email: 'updated@acme-supplies.com',
        deliveryTimeInDays: 3,
      };

      const mockUpdatedSupplier = {
        id: supplierId,
        name: 'Acme Supplies Updated',
        email: 'updated@acme-supplies.com',
        phoneNumber: '+1234567890',
        category: SupplierCategory.STRATEGIC,
        deliveryTimeInDays: 3,
        updatedAt: new Date(),
      };

      mockSuppliersService.update.mockResolvedValue(mockUpdatedSupplier);

      const result = await controller.update(supplierId, updateSupplierDto, mockUser);

      expect(service.update).toHaveBeenCalledWith(supplierId, updateSupplierDto, mockUser.companyId);
      expect(result).toEqual(mockUpdatedSupplier);
    });

    it('should handle NotFoundException when supplier not found', async () => {
      const supplierId = 'non-existent-id';
      const updateSupplierDto: UpdateSupplierDto = {
        name: 'Updated Name',
      };

      const notFoundError = new NotFoundException('Supplier not found');
      mockSuppliersService.update.mockRejectedValue(notFoundError);

      await expect(controller.update(supplierId, updateSupplierDto, mockUser)).rejects.toThrow(NotFoundException);
      expect(service.update).toHaveBeenCalledWith(supplierId, updateSupplierDto, mockUser.companyId);
    });

    it('should handle ConflictException when email already exists', async () => {
      const supplierId = 'supplier-123';
      const updateSupplierDto: UpdateSupplierDto = {
        email: 'existing@example.com',
      };

      const conflictError = new ConflictException('Email already exists');
      mockSuppliersService.update.mockRejectedValue(conflictError);

      await expect(controller.update(supplierId, updateSupplierDto, mockUser)).rejects.toThrow(ConflictException);
      expect(service.update).toHaveBeenCalledWith(supplierId, updateSupplierDto, mockUser.companyId);
    });
  });

  describe('remove', () => {
    it('should delete a supplier successfully', async () => {
      const supplierId = 'supplier-123';

      mockSuppliersService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(supplierId, mockUser);

      expect(service.remove).toHaveBeenCalledWith(supplierId, mockUser.companyId);
      expect(result).toBeUndefined(); // Remove typically returns void/undefined
    });

    it('should handle NotFoundException when supplier not found', async () => {
      const supplierId = 'non-existent-id';
      const notFoundError = new NotFoundException('Supplier not found');

      mockSuppliersService.remove.mockRejectedValue(notFoundError);

      await expect(controller.remove(supplierId, mockUser)).rejects.toThrow(NotFoundException);
      expect(service.remove).toHaveBeenCalledWith(supplierId, mockUser.companyId);
    });
  });
});
