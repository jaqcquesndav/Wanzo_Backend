import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SuppliersService } from '../../src/modules/suppliers/suppliers.service';
import { Supplier } from '../../src/modules/suppliers/entities/supplier.entity';
import { SupplierCategory } from '../../src/modules/suppliers/enums/supplier-category.enum';
import { CreateSupplierDto } from '../../src/modules/suppliers/dto/create-supplier.dto';
import { UpdateSupplierDto } from '../../src/modules/suppliers/dto/update-supplier.dto';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let repository: Repository<Supplier>;

  const mockSupplierRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserCompanyId = 'company-123';

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: getRepositoryToken(Supplier),
          useValue: mockSupplierRepository,
        },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    repository = module.get<Repository<Supplier>>(getRepositoryToken(Supplier));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new supplier', async () => {
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
        companyId: mockUserCompanyId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSupplierRepository.findOne.mockResolvedValue(null); // No existing supplier
      mockSupplierRepository.create.mockReturnValue(mockSupplier);
      mockSupplierRepository.save.mockResolvedValue(mockSupplier);

      const result = await service.create(createSupplierDto, mockUserCompanyId);

      expect(mockSupplierRepository.findOne).toHaveBeenCalledWith({
        where: { email: createSupplierDto.email },
      });
      expect(mockSupplierRepository.create).toHaveBeenCalledWith({
        name: createSupplierDto.name,
        contactPerson: createSupplierDto.contactPerson,
        email: createSupplierDto.email,
        phoneNumber: createSupplierDto.phoneNumber,
        address: createSupplierDto.address,
        category: createSupplierDto.category,
        totalPurchases: 0,
        lastPurchaseDate: undefined,
      });
      expect(mockSupplierRepository.save).toHaveBeenCalledWith(mockSupplier);
      expect(result).toEqual(mockSupplier);
    });

    it('should throw ConflictException when email already exists', async () => {
      const createSupplierDto: CreateSupplierDto = {
        name: 'Acme Supplies Corp',
        email: 'existing@example.com',
        phoneNumber: '+1234567890',
        category: SupplierCategory.REGULAR,
        deliveryTimeInDays: 3,
        paymentTerms: 'Net 15',
      };

      const existingSupplier = {
        id: 'existing-supplier',
        email: 'existing@example.com',
      };

      mockSupplierRepository.findOne.mockResolvedValue(existingSupplier);

      await expect(service.create(createSupplierDto, mockUserCompanyId)).rejects.toThrow(ConflictException);
      expect(mockSupplierRepository.findOne).toHaveBeenCalledWith({
        where: { email: createSupplierDto.email },
      });
    });

    it('should create supplier without email', async () => {
      const createSupplierDto: CreateSupplierDto = {
        name: 'Local Supplier',
        phoneNumber: '+1234567890',
        category: SupplierCategory.NEW_SUPPLIER,
        deliveryTimeInDays: 7,
        paymentTerms: 'Cash on delivery',
      };

      const mockSupplier = {
        id: 'supplier-123',
        ...createSupplierDto,
        companyId: mockUserCompanyId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockSupplierRepository.create.mockReturnValue(mockSupplier);
      mockSupplierRepository.save.mockResolvedValue(mockSupplier);

      const result = await service.create(createSupplierDto, mockUserCompanyId);

      expect(mockSupplierRepository.findOne).not.toHaveBeenCalled();
      expect(result).toEqual(mockSupplier);
    });
  });

  describe('findAll', () => {
    it('should return paginated suppliers', async () => {
      const mockSuppliers = [
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
      ];

      mockSupplierRepository.findAndCount.mockResolvedValue([mockSuppliers, 2]);

      const result = await service.findAll(mockUserCompanyId, { page: 1, limit: 10 });

      expect(mockSupplierRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['products'],
        skip: 0,
        take: 10,
        order: {
          name: 'ASC',
        },
      });
      expect(result).toEqual({
        items: mockSuppliers,
        total: 2,
        page: 1,
        limit: 10,
      });
    });

    it('should apply pagination correctly', async () => {
      const mockSuppliers = [
        {
          id: 'supplier-3',
          name: 'Third Supplier',
        },
      ];

      mockSupplierRepository.findAndCount.mockResolvedValue([mockSuppliers, 15]);

      const result = await service.findAll(mockUserCompanyId, { page: 2, limit: 5 });

      expect(mockSupplierRepository.findAndCount).toHaveBeenCalledWith({
        relations: ['products'],
        skip: 5, // (page - 1) * limit = (2 - 1) * 5 = 5
        take: 5,
        order: { name: 'ASC' },
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(result.total).toBe(15);
    });
  });

  describe('findOne', () => {
    it('should return a supplier by id', async () => {
      const supplierId = 'supplier-123';
      const mockSupplier = {
        id: supplierId,
        name: 'Acme Supplies',
        email: 'acme@example.com',
        companyId: mockUserCompanyId,
      };

      mockSupplierRepository.findOne.mockResolvedValue(mockSupplier);

      const result = await service.findOne(supplierId, mockUserCompanyId);

      expect(mockSupplierRepository.findOne).toHaveBeenCalledWith({
        where: { id: supplierId },
        relations: ['products'],
      });
      expect(result).toEqual(mockSupplier);
    });

    it('should throw NotFoundException when supplier not found', async () => {
      const supplierId = 'non-existent-id';

      mockSupplierRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(supplierId, mockUserCompanyId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a supplier', async () => {
      const supplierId = 'supplier-123';
      const updateSupplierDto: UpdateSupplierDto = {
        name: 'Updated Supplier Name',
        email: 'updated@example.com',
      };

      const existingSupplier = {
        id: supplierId,
        name: 'Original Name',
        email: 'original@example.com',
        companyId: mockUserCompanyId,
      };

      const updatedSupplier = {
        ...existingSupplier,
        ...updateSupplierDto,
      };

      mockSupplierRepository.findOne
        .mockResolvedValueOnce(existingSupplier) // For findOne check
        .mockResolvedValueOnce(null); // For email conflict check

      mockSupplierRepository.save.mockResolvedValue(updatedSupplier);

      const result = await service.update(supplierId, updateSupplierDto, mockUserCompanyId);

      expect(mockSupplierRepository.save).toHaveBeenCalledWith(expect.objectContaining(updateSupplierDto));
      expect(result).toEqual(updatedSupplier);
    });

    it('should throw NotFoundException when supplier not found', async () => {
      const supplierId = 'non-existent-id';
      const updateSupplierDto: UpdateSupplierDto = {
        name: 'Updated Name',
      };

      mockSupplierRepository.findOne.mockResolvedValue(null);

      await expect(service.update(supplierId, updateSupplierDto, mockUserCompanyId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when email already exists for another supplier', async () => {
      const supplierId = 'supplier-123';
      const updateSupplierDto: UpdateSupplierDto = {
        email: 'existing@example.com',
      };

      const existingSupplier = {
        id: supplierId,
        email: 'original@example.com',
        companyId: mockUserCompanyId,
      };

      const supplierWithSameEmail = {
        id: 'other-supplier',
        email: 'existing@example.com',
      };

      mockSupplierRepository.findOne
        .mockResolvedValueOnce(existingSupplier) // Supplier exists
        .mockResolvedValueOnce(supplierWithSameEmail); // Email exists for another supplier

      await expect(service.update(supplierId, updateSupplierDto, mockUserCompanyId)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a supplier', async () => {
      const supplierId = 'supplier-123';
      const mockSupplier = {
        id: supplierId,
        name: 'Acme Supplies',
        companyId: mockUserCompanyId,
      };

      mockSupplierRepository.findOne.mockResolvedValue(mockSupplier);
      mockSupplierRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove(supplierId, mockUserCompanyId);

      expect(mockSupplierRepository.findOne).toHaveBeenCalledWith({
        where: { id: supplierId },
        relations: ['products'],
      });
      expect(mockSupplierRepository.delete).toHaveBeenCalledWith(supplierId);
    });

    it('should throw NotFoundException when supplier not found', async () => {
      const supplierId = 'non-existent-id';

      mockSupplierRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(supplierId, mockUserCompanyId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCategory', () => {
    it('should return suppliers by category', async () => {
      const category = SupplierCategory.STRATEGIC;
      const mockSuppliers = [
        {
          id: 'supplier-1',
          name: 'Material Supplier 1',
          category: SupplierCategory.STRATEGIC,
        },
        {
          id: 'supplier-2',
          name: 'Material Supplier 2',
          category: SupplierCategory.STRATEGIC,
        },
      ];

      mockSupplierRepository.find.mockResolvedValue(mockSuppliers);

      const result = await service.findByCategory(category);

      expect(mockSupplierRepository.find).toHaveBeenCalledWith({
        where: { category },
        relations: ['products'],
      });
      expect(result).toEqual(mockSuppliers);
    });
  });
});
