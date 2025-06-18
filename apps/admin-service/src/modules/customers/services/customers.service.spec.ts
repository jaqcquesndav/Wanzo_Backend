import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Customer, CustomerDocument, CustomerActivity, ValidationProcess, CustomerStatus, CustomerType, AccountType, DocumentType, DocumentStatus } from '../entities';
import { Repository } from 'typeorm';
import { EventsService } from '../../events/events.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

const mockCustomerRepository = {
  findAndCount: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
};

const mockDocumentRepository = {
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
};
const mockActivityRepository = {
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
};
const mockValidationProcessRepository = {};
const mockEventsService = {
  publishCustomerCreated: jest.fn(),
  publishCustomerUpdated: jest.fn(),
  publishCustomerStatusChanged: jest.fn(),
  publishCustomerValidated: jest.fn(),
  publishCustomerSuspended: jest.fn(),
  publishCustomerReactivated: jest.fn(),
  publishCustomerDeleted: jest.fn(),
};

describe('CustomersService', () => {
  let service: CustomersService;
  let repository: Repository<Customer>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(CustomerDocument),
          useValue: mockDocumentRepository,
        },
        {
          provide: getRepositoryToken(CustomerActivity),
          useValue: mockActivityRepository,
        },
        {
          provide: getRepositoryToken(ValidationProcess),
          useValue: mockValidationProcessRepository,
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    repository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return a paginated list of customers', async () => {
      const customers = [{ id: '1', name: 'Test Customer' }];
      const totalCount = 1;
      mockCustomerRepository.findAndCount.mockResolvedValue([customers, totalCount]);

      const result = await service.findAll({});

      expect(mockCustomerRepository.findAndCount).toHaveBeenCalled();
      expect(result.customers).toHaveLength(totalCount);
      expect(result.totalCount).toBe(totalCount);
    });
  });

  describe('findOne', () => {
    it('should return a single customer', async () => {
      const customer = { id: '1', name: 'Test Customer' };
      mockCustomerRepository.findOne.mockResolvedValue(customer);
      // Mock the behavior of getCustomerStatistics which is called by findOne
      const mockActivities = [{ id: 'act1', type: 'test activity' }];
      (mockActivityRepository.find as jest.Mock).mockResolvedValue(mockActivities);


      const result = await service.findOne('1');

      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' }, relations: ['documents', 'activities', 'validationProcesses'] });
      expect(result).toBeDefined();
      // You might want to add more assertions here about the result object
    });

    it('should throw NotFoundException if customer not found', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return a new customer', async () => {
      const createCustomerDto = {
        email: 'test@example.com',
        name: 'Test Customer',
        type: CustomerType.PME,
        phone: '1234567890',
        address: '123 Main St',
        city: 'Anytown',
        country: 'Anyland',
        accountType: AccountType.FREEMIUM,
        billingContactName: 'Billing Contact',
        billingContactEmail: 'billing@example.com',
        financialInstitutionData: { name: 'Test Bank' },
      };
      const savedCustomer: Customer = { 
        id: '1', 
        ...createCustomerDto, 
        status: CustomerStatus.PENDING, 
        tokenAllocation: 0, 
        documents: [] as CustomerDocument[], 
        activities: [] as CustomerActivity[], 
        validationProcesses: [] as ValidationProcess[], 
        validationHistory: [] as any[],
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: null,
        ownerEmail: null,
        validatedAt: null,
        validatedBy: null,
        suspendedAt: null,
        suspendedBy: null,
        suspensionReason: null,
        pmeData: null,
        financialInstitutionData: null,
        reactivatedAt: null,
        reactivatedBy: null,
       };

      mockCustomerRepository.findOne.mockResolvedValue(null);
      mockCustomerRepository.create.mockReturnValue(savedCustomer);
      mockCustomerRepository.save.mockResolvedValue(savedCustomer);
      (mockActivityRepository.find as jest.Mock).mockResolvedValue([]); 
      (mockActivityRepository.create as jest.Mock).mockImplementation(dto => dto);
      (mockActivityRepository.save as jest.Mock).mockImplementation(dto => Promise.resolve(dto));

      const result = await service.create(createCustomerDto as any);

      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({ where: { email: createCustomerDto.email } });
      expect(mockCustomerRepository.create).toHaveBeenCalled();
      expect(mockCustomerRepository.save).toHaveBeenCalled();
      expect(result.email).toEqual(createCustomerDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      const createCustomerDto = {
        email: 'test@example.com',
        name: 'Test Customer',
        type: CustomerType.PME,
        phone: '1234567890',
        address: '123 Main St',
        city: 'Anytown',
        country: 'Anyland',
        accountType: AccountType.FREEMIUM,
        billingContactName: 'Billing Contact',
        billingContactEmail: 'billing@example.com',
        financialInstitutionData: { name: 'Test Bank' },
      };
      mockCustomerRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(service.create(createCustomerDto as any)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update and return a customer', async () => {
      const updateCustomerDto = { name: 'Updated Name' };
      const existingCustomer = { id: '1', name: 'Old Name', email: 'test@example.com' };
      
      mockCustomerRepository.findOne.mockResolvedValue(existingCustomer);
      mockCustomerRepository.save.mockImplementation(customer => Promise.resolve(customer));

      const result = await service.update('1', updateCustomerDto);

      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockCustomerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Name' }));
      expect(result.name).toEqual('Updated Name');
    });

    it('should throw NotFoundException if customer to update is not found', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(service.update('1', { name: 'any' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateCustomer', () => {
    it('should validate a customer and return the updated customer', async () => {
      const customer = { id: '1', status: CustomerStatus.PENDING };
      mockCustomerRepository.findOne.mockResolvedValue(customer);
      mockCustomerRepository.save.mockImplementation(c => Promise.resolve(c));

      const result = await service.validateCustomer('1');

      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockCustomerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ 
        status: CustomerStatus.ACTIVE, 
        validatedBy: 'current-admin-id',
        validatedAt: expect.any(Date),
      }));
      expect(result.status).toEqual(CustomerStatus.ACTIVE);
    });

    it('should throw NotFoundException if customer to validate is not found', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);
      await expect(service.validateCustomer('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('suspendCustomer', () => {
    it('should suspend a customer and return the updated customer', async () => {
      const customer = { id: '1', status: CustomerStatus.ACTIVE };
      mockCustomerRepository.findOne.mockResolvedValue(customer);
      mockCustomerRepository.save.mockImplementation(c => Promise.resolve(c));

      const result = await service.suspendCustomer('1', 'reason');

      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockCustomerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ 
        status: CustomerStatus.SUSPENDED, 
        suspendedBy: 'current-admin-id',
        suspensionReason: 'reason',
        suspendedAt: expect.any(Date),
      }));
      expect(result.status).toEqual(CustomerStatus.SUSPENDED);
    });

    it('should throw NotFoundException if customer to suspend is not found', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);
      await expect(service.suspendCustomer('1', 'reason')).rejects.toThrow(NotFoundException);
    });
  });

  describe('reactivateCustomer', () => {
    it('should reactivate a customer and return the updated customer', async () => {
      const customer = { id: '1', status: CustomerStatus.SUSPENDED };
      mockCustomerRepository.findOne.mockResolvedValue(customer);
      mockCustomerRepository.save.mockImplementation(c => Promise.resolve(c));

      const result = await service.reactivateCustomer('1');

      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockCustomerRepository.save).toHaveBeenCalledWith(expect.objectContaining({ 
        status: CustomerStatus.ACTIVE, 
        reactivatedBy: 'current-admin-id',
        reactivatedAt: expect.any(Date),
        suspensionReason: null,
      }));
      expect(result.status).toEqual(CustomerStatus.ACTIVE);
    });

    it('should throw NotFoundException if customer to reactivate is not found', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);
      await expect(service.reactivateCustomer('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a customer', async () => {
      const customer = { id: '1', name: 'Test' };
      mockCustomerRepository.findOne.mockResolvedValue(customer);
      mockCustomerRepository.remove.mockResolvedValue(customer as any);

      await service.remove('1');

      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' }, relations: ['documents', 'activities', 'validationProcesses'] });
      expect(mockCustomerRepository.remove).toHaveBeenCalledWith(customer);
    });

    it('should throw NotFoundException if customer to remove is not found', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDocuments', () => {
    it('should return a list of documents for a customer', async () => {
      const documents = [{ id: 'doc1', type: DocumentType.ID_NAT, fileName: 'id.pdf' }];
      mockCustomerRepository.findOne.mockResolvedValue({ id: '1' });
      mockDocumentRepository.find.mockResolvedValue(documents);

      const result = await service.getDocuments('1');

      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockDocumentRepository.find).toHaveBeenCalledWith({ where: { customerId: '1' } });
      expect(result).toHaveLength(1);
      expect(result[0].fileName).toEqual('id.pdf');
    });

    it('should throw NotFoundException if customer is not found', async () => {
      mockCustomerRepository.findOne.mockResolvedValue(null);
      await expect(service.getDocuments('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('uploadDocument', () => {
    it('should upload a document for a customer', async () => {
      const customer = { id: '1' };
      mockCustomerRepository.findOne.mockResolvedValue(customer);
      const doc = { id: 'doc1', customerId: '1', type: DocumentType.ID_NAT, fileName: 'test.pdf', fileUrl: 'url' };
      mockDocumentRepository.create.mockReturnValue(doc);
      mockDocumentRepository.save.mockResolvedValue(doc);

      const result = await service.uploadDocument('1', DocumentType.ID_NAT, 'new-doc.pdf', 'url', 'original.pdf');

      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockDocumentRepository.create).toHaveBeenCalled();
      expect(mockDocumentRepository.save).toHaveBeenCalled();
      expect(result.fileName).toEqual('test.pdf'); // Corrected expectation
    });
  });

  describe('approveDocument', () => {
    it('should approve a document', async () => {
      const doc = { id: 'doc1', customerId: '1', type: DocumentType.ID_NAT, status: DocumentStatus.PENDING };
      mockDocumentRepository.findOne.mockResolvedValue(doc);
      mockDocumentRepository.save.mockImplementation(d => Promise.resolve(d));
      (mockActivityRepository.create as jest.Mock).mockImplementation(dto => dto);
      (mockActivityRepository.save as jest.Mock).mockImplementation(dto => Promise.resolve(dto));

      const result = await service.approveDocument('1', 'doc1', 'Looks good');

      expect(mockDocumentRepository.findOne).toHaveBeenCalledWith({ where: { id: 'doc1', customerId: '1' } });
      expect(mockDocumentRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: DocumentStatus.APPROVED }));
      expect(result.status).toEqual(DocumentStatus.APPROVED);
    });
  });

  describe('rejectDocument', () => {
    it('should reject a document', async () => {
      const doc = { id: 'doc1', customerId: '1', type: DocumentType.ID_NAT, status: DocumentStatus.PENDING };
      mockDocumentRepository.findOne.mockResolvedValue(doc);
      mockDocumentRepository.save.mockImplementation(d => Promise.resolve(d));
      (mockActivityRepository.create as jest.Mock).mockImplementation(dto => dto);
      (mockActivityRepository.save as jest.Mock).mockImplementation(dto => Promise.resolve(dto));

      const result = await service.rejectDocument('1', 'doc1', 'Blurry image');

      expect(mockDocumentRepository.findOne).toHaveBeenCalledWith({ where: { id: 'doc1', customerId: '1' } });
      expect(mockDocumentRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: DocumentStatus.REJECTED }));
      expect(result.status).toEqual(DocumentStatus.REJECTED);
    });
  });
});
