import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionService } from '../institution.service';
import { Customer, CustomerStatus, CustomerType } from '../../entities/customer.entity';
import { CustomerEventsProducer } from '../../../kafka/producers/customer-events.producer';
import { FinancialInstitutionSpecificData, InstitutionType, InstitutionCategory } from '../../entities/financial-institution-specific-data.entity';
import { CloudinaryService } from '../../../cloudinary';
import { 
  CreateFinancialInstitutionDto, 
  UpdateFinancialInstitutionDto, 
  BranchDto,
  FinancialInstitutionResponseDto,
} from '../../dto/financial-institution.dto';
import { jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';

// Define a mock MulterFile for testing uploads
interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

const mockCustomerRepository = () => ({
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

const mockFinancialDataRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
});

const mockCustomerEventsProducer = () => ({
  emitInstitutionCreated: jest.fn(),
  emitInstitutionUpdated: jest.fn(),
});

const mockCloudinaryService = () => ({
  uploadImage: jest.fn().mockImplementation(() =>
    Promise.resolve({
      url: 'https://example.com/image.jpg',
      publicId: 'sample/publicId',
    }),
  ),
});

describe('InstitutionService', () => {
  let service: InstitutionService;
  let customerRepository: jest.Mocked<Repository<Customer>>;
  let financialDataRepository: jest.Mocked<Repository<FinancialInstitutionSpecificData>>;
  let customerEventsProducer: jest.Mocked<CustomerEventsProducer>;
  let cloudinaryService: jest.Mocked<CloudinaryService>;

  const mockCustomer = {
    id: 'customer-id',
    name: 'Test Bank',
    type: CustomerType.FINANCIAL,
    status: CustomerStatus.PENDING,
    email: 'contact@testbank.com',
    phone: '123456789',
    address: {
      street: '123 Main St',
      city: 'Test City',
      country: 'Test Country',
      commune: 'Test Commune',
      province: 'Test Province',
    },
    financialData: {
      id: 'financial-data-id',
      type: InstitutionType.BANK,
      category: InstitutionCategory.PRIVATE,
      licenseNumber: 'LIC123456',
      establishedDate: new Date('2000-01-01'),
      contacts: { general: { email: 'contact@testbank.com', phone: '123456789' } },
      leadership: {},
      branches: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as Customer; // Cast to unknown first to satisfy TypeScript

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstitutionService,
        { provide: getRepositoryToken(Customer), useFactory: mockCustomerRepository },
        { provide: getRepositoryToken(FinancialInstitutionSpecificData), useFactory: mockFinancialDataRepository },
        { provide: CustomerEventsProducer, useFactory: mockCustomerEventsProducer },
        { provide: CloudinaryService, useFactory: mockCloudinaryService },
      ],
    }).compile();

    service = module.get<InstitutionService>(InstitutionService);
    customerRepository = module.get(getRepositoryToken(Customer));
    financialDataRepository = module.get(getRepositoryToken(FinancialInstitutionSpecificData));
    customerEventsProducer = module.get(CustomerEventsProducer);
    cloudinaryService = module.get(CloudinaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new financial institution', async () => {
      const createDto: CreateFinancialInstitutionDto = {
        name: 'Test Bank',
        type: InstitutionType.BANK,
        category: InstitutionCategory.PRIVATE,
        licenseNumber: 'LIC123456',
        establishedDate: '2000-01-01',
        address: {
          headquarters: { street: '123 Main St', city: 'Test City', country: 'Test Country', commune: 'Test Commune', province: 'Test Province' },
        },
        contacts: {
          general: { email: 'contact@testbank.com', phone: '123456789' },
        },
        leadership: {},
      };

      financialDataRepository.create.mockReturnValue(mockCustomer.financialData as any);
      financialDataRepository.save.mockResolvedValue(mockCustomer.financialData as any);
      customerRepository.create.mockReturnValue(mockCustomer as any);
      customerRepository.save.mockResolvedValue(mockCustomer as any);

      const result = await service.create(createDto);

      expect(financialDataRepository.create).toHaveBeenCalledWith(expect.any(Object));
      expect(financialDataRepository.save).toHaveBeenCalledWith(mockCustomer.financialData);
      expect(customerRepository.create).toHaveBeenCalledWith(expect.any(Object));
      expect(customerRepository.save).toHaveBeenCalledWith(mockCustomer);
      expect(customerEventsProducer.emitInstitutionCreated).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Object);
      expect(result.name).toEqual(createDto.name);
    });
  });

  describe('findAll', () => {
    it('should return paginated financial institutions', async () => {
      const customers = [mockCustomer];
      customerRepository.findAndCount.mockResolvedValue([customers, 1]);

      const [result, count] = await service.findAll(1, 10);

      expect(customerRepository.findAndCount).toHaveBeenCalledWith({
        where: { type: CustomerType.FINANCIAL },
        skip: 0,
        take: 10,
        order: { createdAt: 'DESC' },
        relations: ['financialData'],
      });
      expect(count).toBe(1);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(mockCustomer.name);
    });
  });

  describe('findById', () => {
    it('should return a financial institution by ID', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);

      const result = await service.findById('customer-id');

      expect(customerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'customer-id', type: CustomerType.FINANCIAL },
        relations: ['financialData', 'subscriptions'],
      });
      expect(result).toBeInstanceOf(Object);
      expect(result.id).toBe(mockCustomer.id);
    });

    it('should throw NotFoundException if institution not found', async () => {
      customerRepository.findOne.mockResolvedValue(null);
      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a financial institution', async () => {
      const updateDto: UpdateFinancialInstitutionDto = { description: 'Updated description' };
      const updatedCustomer = { ...mockCustomer, description: 'Updated description' };

      customerRepository.findOne.mockResolvedValue(mockCustomer);
      customerRepository.save.mockResolvedValue(updatedCustomer as any);
      financialDataRepository.save.mockResolvedValue(mockCustomer.financialData as any);

      const result = await service.update('customer-id', updateDto);

      expect(customerRepository.findOne).toHaveBeenCalled();
      expect(customerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ description: 'Updated description' }));
      expect(customerEventsProducer.emitInstitutionUpdated).toHaveBeenCalled();
      expect(result.description).toEqual('Updated description');
    });
  });

  describe('uploadLogo', () => {
    it('should upload institution logo', async () => {
      const institutionId = 'customer-id';
      const mockFile: MulterFile = {
        buffer: Buffer.from('test'),
        originalname: 'logo.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      };
      const uploadResult = { url: 'https://cloudinary.com/logo.jpg', publicId: 'logo-id' };

      customerRepository.findOne.mockResolvedValue(mockCustomer);
      cloudinaryService.uploadImage.mockResolvedValue(uploadResult);
      customerRepository.save.mockResolvedValue({ ...mockCustomer, logo: uploadResult.url } as any);

      const result = await service.uploadLogo(institutionId, mockFile);

      expect(customerRepository.findOne).toHaveBeenCalledWith({ where: { id: institutionId, type: CustomerType.FINANCIAL } });
      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(mockFile, `financial-institutions/${institutionId}/logo`);
      expect(customerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ logo: uploadResult.url }));
      expect(result).toBe(uploadResult.url);
    });
  });

  describe('addBranch', () => {
    it('should add a branch to a financial institution', async () => {
      const institutionId = 'customer-id';
      const branchDto: BranchDto = {
        name: 'Branch 1',
        address: { street: '123 Branch St', city: 'Branch City', country: 'Branch Country', commune: 'Branch Commune', province: 'Branch Province' },
        manager: 'Branch Manager',
        email: 'branch@testbank.com',
        phone: '987654321',
      };

      // Deep copy to avoid mutation issues in tests
      const originalCustomer = JSON.parse(JSON.stringify(mockCustomer));
      customerRepository.findOne.mockResolvedValue(originalCustomer);
      financialDataRepository.save.mockResolvedValue(originalCustomer.financialData);

      const result = await service.addBranch(institutionId, branchDto);

      expect(customerRepository.findOne).toHaveBeenCalled();
      expect(financialDataRepository.save).toHaveBeenCalled();
      const savedData = financialDataRepository.save.mock.calls[0][0];
      
      expect(savedData.branches).toBeDefined();
      if (savedData.branches) {
        expect(savedData.branches).toHaveLength(1);
        expect(savedData.branches[0].name).toBe(branchDto.name);
      }
      expect(result.name).toBe(branchDto.name);
    });
  });
});
