import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { InstitutionService } from '../../../src/modules/institution/services/institution.service';
import { Institution, InstitutionType, LicenseType, RegulatoryStatus } from '../../../src/modules/institution/entities/institution.entity';
import { InstitutionDocument } from '../../../src/modules/institution/entities/institution-document.entity';
import { InstitutionUser } from '../../../src/modules/institution/entities/institution-user.entity';
import { CreateInstitutionDto, UpdateInstitutionDto } from '../../../src/modules/institution/dtos/institution.dto';
import { PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE } from '../../../src/modules/events/events.module';

describe('InstitutionService', () => {
  let service: InstitutionService;
  let institutionRepository: Repository<Institution>;
  let institutionDocumentRepository: Repository<InstitutionDocument>;
  let institutionUserRepository: Repository<InstitutionUser>;

  const mockInstitution: Institution = {
    id: '1',
    kiotaId: 'kiota-123',
    name: 'Test Bank SA',
    type: InstitutionType.BANK,
    status: 'active' as any,
    license_number: 'LIC-789012',
    license_type: LicenseType.UNIVERSAL_BANKING,
    address: '123 Test Street',
    phone: '+1234567890',
    email: 'contact@testbank.com',
    website: 'https://testbank.com',
    legal_representative: 'John Doe',
    tax_id: 'TAX123456',
    regulatory_status: RegulatoryStatus.REGULATED,
    metadata: {},
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
    documents: [],
    users: [],
    subscriptionPlan: 'premium' as any,
    subscriptionStatus: 'active' as any,
    tokenBalance: 1000,
    tokensUsed: 100,
    tokenUsageHistory: [],
  };

  const mockRepositoryFactory = () => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    count: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstitutionService,
        {
          provide: getRepositoryToken(Institution),
          useValue: mockRepositoryFactory(),
        },
        {
          provide: getRepositoryToken(InstitutionDocument),
          useValue: mockRepositoryFactory(),
        },
        {
          provide: getRepositoryToken(InstitutionUser),
          useValue: mockRepositoryFactory(),
        },
        {
          provide: PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE,
          useValue: {
            emit: jest.fn(),
            send: jest.fn(),
            connect: jest.fn(),
            close: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<InstitutionService>(InstitutionService);
    institutionRepository = module.get<Repository<Institution>>(getRepositoryToken(Institution));
    institutionDocumentRepository = module.get<Repository<InstitutionDocument>>(getRepositoryToken(InstitutionDocument));
    institutionUserRepository = module.get<Repository<InstitutionUser>>(getRepositoryToken(InstitutionUser));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new institution', async () => {
      const createInstitutionDto: CreateInstitutionDto = {
        name: 'Test Bank SA',
        type: InstitutionType.BANK,
        licenseNumber: 'LIC-789012',
        licenseType: LicenseType.UNIVERSAL_BANKING,
        address: '123 Test Street',
        phone: '+1234567890',
        email: 'contact@testbank.com',
        website: 'https://testbank.com',
        legalRepresentative: 'John Doe',
        taxId: 'TAX123456',
        regulatoryStatus: RegulatoryStatus.REGULATED,
        documents: [],
      };

      const userId = 'user-123';

      institutionRepository.create = jest.fn().mockReturnValue(mockInstitution);
      institutionRepository.save = jest.fn().mockResolvedValue(mockInstitution);
      institutionRepository.findOneOrFail = jest.fn().mockResolvedValue(mockInstitution);

      const result = await service.create(createInstitutionDto, userId);

      expect(institutionRepository.create).toHaveBeenCalledWith({
        address: createInstitutionDto.address,
        email: createInstitutionDto.email,
        legalRepresentative: createInstitutionDto.legalRepresentative,
        licenseNumber: createInstitutionDto.licenseNumber,
        licenseType: createInstitutionDto.licenseType,
        name: createInstitutionDto.name,
        phone: createInstitutionDto.phone,
        regulatoryStatus: createInstitutionDto.regulatoryStatus,
        taxId: createInstitutionDto.taxId,
        type: createInstitutionDto.type,
        website: createInstitutionDto.website,
        kiotaId: expect.any(String),
        createdBy: userId,
        metadata: { initiatedBy: userId },
        status: 'pending_verification',
        active: false,
      });
      expect(institutionRepository.save).toHaveBeenCalledWith(mockInstitution);
      expect(result).toEqual(mockInstitution);
    });
  });

  describe('findById', () => {
    it('should return an institution by id', async () => {
      institutionRepository.findOneOrFail = jest.fn().mockResolvedValue(mockInstitution);

      const result = await service.findById('1');

      expect(institutionRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['documents', 'users'],
      });
      expect(result).toEqual(mockInstitution);
    });

    it('should throw NotFoundException when institution not found', async () => {
      institutionRepository.findOneOrFail = jest.fn().mockRejectedValue(new NotFoundException());

      await expect(service.findById('999')).rejects.toThrow(NotFoundException);
      expect(institutionRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: '999' },
        relations: ['documents', 'users'],
      });
    });
  });

  describe('update', () => {
    it('should update an institution', async () => {
      const updateInstitutionDto: UpdateInstitutionDto = {
        name: 'Updated Bank SA',
        address: '456 New Street',
      };

      institutionRepository.findOneOrFail = jest.fn().mockResolvedValue(mockInstitution);
      institutionRepository.save = jest.fn().mockResolvedValue({
        ...mockInstitution,
        ...updateInstitutionDto,
      });

      const result = await service.update('1', updateInstitutionDto, 'user-123');

      expect(institutionRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['documents', 'users'],
      });
      expect(institutionRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(updateInstitutionDto.name);
      expect(result.address).toBe(updateInstitutionDto.address);
    });

    it('should throw NotFoundException when institution not found', async () => {
      institutionRepository.findOneOrFail = jest.fn().mockRejectedValue(new NotFoundException());

      const updateInstitutionDto: UpdateInstitutionDto = {
        name: 'Updated Bank SA',
      };

      await expect(service.update('999', updateInstitutionDto, 'user-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addDocument', () => {
    it('should add a document to institution', async () => {
      const documentData = {
        name: 'License Document',
        type: 'license',
        cloudinaryUrl: 'https://example.com/document.pdf',
      };

      const mockDocument = {
        id: '1',
        ...documentData,
        institutionId: '1',
        created_at: new Date(),
        updated_at: new Date(),
      };

      institutionRepository.findOneOrFail = jest.fn().mockResolvedValue(mockInstitution);
      institutionDocumentRepository.create = jest.fn().mockReturnValue(mockDocument);
      institutionDocumentRepository.save = jest.fn().mockResolvedValue(mockDocument);

      const result = await service.addDocument('1', documentData, 'user-123');

      expect(institutionRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['documents', 'users'],
      });
      expect(institutionDocumentRepository.create).toHaveBeenCalledWith({
        institutionId: '1',
        name: documentData.name,
        type: documentData.type,
        cloudinaryUrl: documentData.cloudinaryUrl,
        description: undefined,
        validUntil: undefined,
        createdBy: 'user-123',
      });
      expect(institutionDocumentRepository.save).toHaveBeenCalledWith(mockDocument);
      expect(result).toEqual(mockDocument);
    });

    it('should throw NotFoundException when institution not found', async () => {
      institutionRepository.findOneOrFail = jest.fn().mockRejectedValue(new NotFoundException());

      const documentData = {
        name: 'License Document',
        type: 'license',
        cloudinaryUrl: 'https://example.com/document.pdf',
      };

      await expect(service.addDocument('999', documentData, 'user-123')).rejects.toThrow(NotFoundException);
    });
  });
});
