import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { SmeService } from '../sme.service';
import { Customer, CustomerStatus, CustomerType } from '../../entities/customer.entity';
import { Sme } from '../../entities/sme.entity';
import { SmeSpecificData } from '../../entities/sme-specific-data.entity';
import { CustomerEventsProducer } from '../../../kafka/producers/customer-events.producer';
import { CloudinaryService } from '../../../cloudinary/cloudinary.service';
import { 
  CreateCompanyDto, 
  UpdateCompanyDto, 
  LocationDto, 
  AssociateDto 
} from '../../dto/company.dto';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { User, UserRole, UserStatus, UserType } from '../../../users/entities/user.entity';
import { jest } from '@jest/globals';

const mockCustomerRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn()
  }))
});

const mockSmeRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  findAndCount: jest.fn(),
});

const mockSmeDataRepository = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

const mockCustomerEventsProducer = () => ({
  emitSmeCreated: jest.fn(),
  emitSmeUpdated: jest.fn(),
  emitSmeStatusChanged: jest.fn(),
  emitSmeDeleted: jest.fn(),
  publishCustomerCreated: jest.fn()
});

const mockCloudinaryService = () => ({
  uploadImage: jest.fn()
});

describe('SmeService', () => {
  let service: SmeService;
  let customerRepository: jest.Mocked<Repository<Customer>>;
  let smeRepository: jest.Mocked<Repository<Sme>>;
  let smeDataRepository: jest.Mocked<Repository<SmeSpecificData>>;
  let customerEventsProducer: jest.Mocked<CustomerEventsProducer>;
  let cloudinaryService: jest.Mocked<CloudinaryService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmeService,
        { provide: getRepositoryToken(Customer), useFactory: mockCustomerRepository },
        { provide: getRepositoryToken(Sme), useFactory: mockSmeRepository },
        { provide: getRepositoryToken(SmeSpecificData), useFactory: mockSmeDataRepository },
        { provide: CustomerEventsProducer, useFactory: mockCustomerEventsProducer },
        { provide: CloudinaryService, useFactory: mockCloudinaryService }
      ],
    }).compile();

    service = module.get<SmeService>(SmeService);
    customerRepository = module.get(getRepositoryToken(Customer)) as jest.Mocked<Repository<Customer>>;
    smeRepository = module.get(getRepositoryToken(Sme)) as jest.Mocked<Repository<Sme>>;
    smeDataRepository = module.get(getRepositoryToken(SmeSpecificData)) as jest.Mocked<Repository<SmeSpecificData>>;
    customerEventsProducer = module.get(CustomerEventsProducer) as jest.Mocked<CustomerEventsProducer>;
    cloudinaryService = module.get(CloudinaryService) as jest.Mocked<CloudinaryService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new SME and customer', async () => {
      const createCompanyDto: CreateCompanyDto = {
        name: 'Test Company',
        legalForm: 'SARL',
        industry: 'Technology',
        address: {
          street: '123 Main St',
          city: 'Test City',
          country: 'Test Country'
        },
        contacts: {
          email: 'contact@test.com',
          phone: '123456789'
        }
      };

      const auth0Id = 'auth0|123';
      const userId = 'user-id';

      // Mock the necessary repository responses
      const mockCustomer = {
        id: 'customer-id',
        name: createCompanyDto.name,
        type: CustomerType.SME,
        status: CustomerStatus.ACTIVE,
        email: createCompanyDto.contacts?.email,
        phone: createCompanyDto.contacts?.phone,
        address: createCompanyDto.address
      };

      const mockSmeData = {
        id: 'sme-data-id',
        legalForm: createCompanyDto.legalForm,
        industry: createCompanyDto.industry,
        yearFounded: new Date().getFullYear()
      };

      const mockSme = {
        id: 'sme-id',
        customerId: mockCustomer.id,
        name: createCompanyDto.name,
        legalForm: createCompanyDto.legalForm,
        industry: createCompanyDto.industry
      };

      customerRepository.create.mockReturnValue(mockCustomer as any);
      customerRepository.save.mockResolvedValue(mockCustomer as any);
      smeDataRepository.create.mockReturnValue(mockSmeData as any);
      smeDataRepository.save.mockResolvedValue(mockSmeData as any);
      smeRepository.create.mockReturnValue(mockSme as any);
      smeRepository.save.mockResolvedValue(mockSme as any);

      const result = await service.create(createCompanyDto, auth0Id);

      expect(customerRepository.create).toHaveBeenCalled();
      expect(customerRepository.save).toHaveBeenCalled();
      expect(smeDataRepository.create).toHaveBeenCalled();
      expect(smeDataRepository.save).toHaveBeenCalled();
      expect(smeRepository.create).toHaveBeenCalled();
      expect(smeRepository.save).toHaveBeenCalled();
      expect(customerEventsProducer.emitSmeCreated).toHaveBeenCalled();
      // The service doesn't call publishCustomerCreated, it only calls emitSmeCreated
      
      expect(result).toBeDefined();
      expect(result.id).toBe(mockCustomer.id);
      expect(result.name).toBe(createCompanyDto.name);
    });
  });

  describe('findAll', () => {
    it('should return paginated SMEs', async () => {
      const mockSmes: Sme[] = [
        {
          customerId: 'customer-1',
          name: 'Company 1',
          legalForm: 'SARL',
          industry: 'Technology',
          customer: { id: 'customer-1', type: CustomerType.SME, status: CustomerStatus.ACTIVE } as Customer,
        } as Sme,
        {
          customerId: 'customer-2',
          name: 'Company 2',
          legalForm: 'SA',
          industry: 'Finance',
          customer: { id: 'customer-2', type: CustomerType.SME, status: CustomerStatus.ACTIVE } as Customer,
        } as Sme
      ];

      smeRepository.findAndCount.mockResolvedValue([mockSmes, 2]);

      const result = await service.findAll(1, 10);

      expect(smeRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: {},
        skip: 0,
        take: 10,
      }));
      
      expect(result[0]).toHaveLength(2);
      expect(result[1]).toBe(2);
    });

    it('should filter SMEs by search term when provided', async () => {
      const mockSmes: Sme[] = [
        {
          customerId: 'customer-1',
          name: 'Test Company',
          legalForm: 'SARL',
          industry: 'Technology',
          customer: { id: 'customer-1', type: CustomerType.SME, status: CustomerStatus.ACTIVE } as Customer,
        } as Sme
      ];

      smeRepository.findAndCount.mockResolvedValue([mockSmes, 1]);

      const result = await service.findAll(1, 10, { search: 'test' });

      expect(smeRepository.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
        where: { name: Like('%test%') },
        skip: 0,
        take: 10,
      }));
      
      expect(result[0]).toHaveLength(1);
      expect(result[1]).toBe(1);
    });
  });

  describe('findById', () => {
    it('should return a SME by ID', async () => {
      const mockSme = {
        customerId: 'customer-id',
        name: 'Test Company',
        customer: {
          id: 'customer-id',
          type: CustomerType.SME,
          status: CustomerStatus.ACTIVE,
        }
      } as Sme;

      smeRepository.findOne.mockResolvedValue(mockSme);

      const result = await service.findById('customer-id');

      expect(smeRepository.findOne).toHaveBeenCalledWith({
        where: { customerId: 'customer-id' },
        relations: ['customer', 'customer.users', 'customer.subscriptions', 'customer.smeData'],
      });
      
      expect(result).toBeDefined();
      expect(result.id).toBe(mockSme.customerId);
    });

    it('should throw NotFoundException if SME not found', async () => {
      smeRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a SME', async () => {
      const updateCompanyDto: UpdateCompanyDto = {
        description: 'Updated description'
      };

      const mockSme = {
        customerId: 'customer-id',
        name: 'Test Company',
        customer: {
          id: 'customer-id',
          type: CustomerType.SME,
          status: CustomerStatus.ACTIVE,
          smeData: {
            id: 'sme-data-id',
            legalForm: 'SARL',
            industry: 'Technology'
          }
        }
      };

      smeRepository.findOne.mockResolvedValue(mockSme as any);
      smeRepository.save.mockImplementation((data: any) => Promise.resolve({
        ...mockSme,
        description: data.description,
        updatedAt: expect.any(Date)
      } as any));

      const result = await service.update('customer-id', updateCompanyDto);

      expect(smeRepository.findOne).toHaveBeenCalled();
      expect(smeRepository.save).toHaveBeenCalled();
      expect(customerEventsProducer.emitSmeUpdated).toHaveBeenCalled();
      
      expect(result).toBeDefined();
      expect(result.description).toBe(updateCompanyDto.description);
    });
  });

  describe('updateLogo', () => {
    it('should upload company logo', async () => {
      const companyId = 'company-id';
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'logo.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      };

      const mockSme = {
        customerId: companyId,
        name: 'Test Company'
      };

      const uploadResult = {
        url: 'https://cloudinary.com/logo.jpg',
        publicId: 'logo-id'
      };

      smeRepository.findOne.mockResolvedValue(mockSme as any);
      cloudinaryService.uploadImage.mockResolvedValue(uploadResult);
      smeRepository.save.mockResolvedValue({
        ...mockSme,
        logoUrl: uploadResult.url
      } as any);

      const result = await service.updateLogo(companyId, mockFile);

      expect(smeRepository.findOne).toHaveBeenCalled();
      expect(cloudinaryService.uploadImage).toHaveBeenCalledWith(mockFile, expect.any(String));
      expect(smeRepository.save).toHaveBeenCalled();
      expect(customerEventsProducer.emitSmeUpdated).toHaveBeenCalled();
      
      expect(result).toBeDefined();
      expect(result).toBe(uploadResult.url);
    });

    it('should throw NotFoundException if company not found', async () => {
      const companyId = 'non-existent-id';
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'logo.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      };

      smeRepository.findOne.mockResolvedValue(null);

      await expect(service.updateLogo(companyId, mockFile)).rejects.toThrow(NotFoundException);
    });
  });

  // Ajoutez plus de tests pour les autres méthodes selon besoin
});
