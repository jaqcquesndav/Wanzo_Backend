import { Test, TestingModule } from '@nestjs/testing';
import { InstitutionService } from './institution.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Institution, InstitutionType, RegulatoryStatus, LicenseType } from '../entities/institution.entity'; // Removed SubscriptionPlan, SubscriptionStatus
import { InstitutionDocument, DocumentType } from '../entities/institution-document.entity';
import { InstitutionUser, UserRole } from '../entities/institution-user.entity';
import { PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE } from '../../events/events.module';
import { NotFoundException } from '@nestjs/common';
import { CreateInstitutionDto, UpdateInstitutionDto } from '../dtos/institution.dto'; // Added UpdateInstitutionDto
import { InstitutionEventTopics, InstitutionStatusType } from '@wanzo/shared/events/kafka-config';

// Define common mock data
const mockInstitutionId = 'inst-123';
const mockUserId = 'user-123';

const mockCreateInstitutionDto: CreateInstitutionDto = {
  name: 'Test Institution',
  type: InstitutionType.FINTECH,
  licenseNumber: 'LIC-12345',
  licenseType: LicenseType.UNIVERSAL_BANKING,
  address: '123 Test St, Test City',
  phone: '123-456-7890',
  email: 'contact@testinstitution.com',
  website: 'http://testinstitution.com',
  legalRepresentative: 'John Doe',
  taxId: 'TAXID12345',
  regulatoryStatus: RegulatoryStatus.APPROVED,
  documents: [
    { name: 'KBIS', type: 'kbis', url: 'kbis-doc-url.pdf' }, // type as string, url for cloudinaryUrl
    { name: 'License Doc', type: DocumentType.LICENSE, url: 'license-doc-url.pdf' }
  ],
  metadata: { customField: 'customValue' }
};

const mockExistingInstitution: Institution = {
  id: mockInstitutionId,
  kiotaId: 'KIOTA-MOCK-123',
  name: 'Test Institution',
  type: InstitutionType.FINTECH,
  metadata: { initiatedBy: mockUserId },
  active: false, // Consistent with PENDING_VERIFICATION status initially
  status: InstitutionStatusType.PENDING_VERIFICATION,
  documents: [],
  users: [{
    id: mockUserId,
    authUserId: 'auth-user-123',
    kiotaId: 'KIOTA-USER-MOCK-123',
    institutionId: mockInstitutionId,
    name: 'Admin User',
    email: 'admin@example.com',
    phone: '1234567890',
    role: UserRole.ADMIN,
    permissions: [],
    emailVerified: true,
    active: true,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    institution: null as any,
    twoFactorEnabled: false, // Added missing property
    metadata: {}, // Added missing property
  }],
  tokenBalance: 100,
  tokensUsed: 0,
  tokenUsageHistory: [],
  created_at: new Date(),
  updated_at: new Date(),
  // Optional fields from entity
  subscriptionPlan: undefined,
  subscriptionStatus: undefined,
  subscriptionEndDate: null,
  lastSubscriptionChangeAt: null,
  subscriptionExpiresAt: null,
  createdBy: mockUserId,
  regulatory_status: RegulatoryStatus.APPROVED,
};

const mockInstitutionDocument: InstitutionDocument = {
  id: 'doc-1',
  institutionId: mockInstitutionId,
  name: 'Document 1',
  type: DocumentType.LICENSE,
  cloudinaryUrl: 'http://example.com/doc1.pdf',
  institution: mockExistingInstitution,
  createdBy: mockUserId,
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {}
};

const mockInstitutionRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  findOneOrFail: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  query: jest.fn(),
};

const mockInstitutionDocumentRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
};

const mockInstitutionUserRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
};

const mockKafkaProducerService = {
  emit: jest.fn(),
};

describe('InstitutionService', () => {
  let service: InstitutionService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstitutionService,
        { provide: getRepositoryToken(Institution), useValue: mockInstitutionRepository },
        { provide: getRepositoryToken(InstitutionDocument), useValue: mockInstitutionDocumentRepository },
        { provide: getRepositoryToken(InstitutionUser), useValue: mockInstitutionUserRepository },
        { provide: PORTFOLIO_INSTITUTION_KAFKA_PRODUCER_SERVICE, useValue: mockKafkaProducerService },
      ],
    }).compile();

    service = module.get<InstitutionService>(InstitutionService);

    mockInstitutionRepository.create.mockImplementation((dto) => ({ ...dto, id: 'temp-id', kiotaId: 'temp-kiota', users: [], documents: [] }));
    mockInstitutionRepository.save.mockImplementation(async (inst) => ({ ...inst, id: inst.id || mockInstitutionId, created_at: new Date(), updated_at: new Date() }));
    mockInstitutionRepository.findOneOrFail.mockResolvedValue(mockExistingInstitution);
    mockInstitutionRepository.findOne.mockResolvedValue(mockExistingInstitution);
    mockInstitutionDocumentRepository.create.mockImplementation(doc => ({...doc, id: 'temp-doc-id'}));
    mockInstitutionDocumentRepository.save.mockResolvedValue(mockInstitutionDocument); // General mock for save
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an institution successfully', async () => {
      const newInstId = 'new-inst-id';
      const newKiotaIdPrefix = 'KIOTA-INS-'; // Prefix used by service
      const { documents, ...institutionData } = mockCreateInstitutionDto;

      const createdInstitutionPartial = {
        ...institutionData,
        // kiotaId is generated by service, so we expect it with a pattern or any string
        createdBy: mockUserId,
        metadata: { initiatedBy: mockUserId },
        status: InstitutionStatusType.PENDING_VERIFICATION,
        active: false,
      };

      const savedInstitutionFull = {
        ...createdInstitutionPartial,
        id: newInstId,
        kiotaId: `${newKiotaIdPrefix}RANDOM123-AB`, // Example of generated ID
        documents: [], // documents are processed separately
        users: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockInstitutionRepository.create.mockReturnValue(createdInstitutionPartial as any); // create returns the entity to be saved
      mockInstitutionRepository.save.mockResolvedValueOnce(savedInstitutionFull as any);
      
      // Mock for document creation part
      const createdDocs = mockCreateInstitutionDto.documents.map((doc, index) => ({
        ...doc,
        id: `doc-${index}`,
        institutionId: newInstId,
        cloudinaryUrl: doc.url, // map url to cloudinaryUrl
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      mockInstitutionDocumentRepository.create.mockImplementation(docDto => {
        return createdDocs.find(d => d.name === docDto.name) || { ...docDto, id: 'fallback-doc-id' };
      });
      mockInstitutionDocumentRepository.save.mockResolvedValueOnce(createdDocs as any); // save for documents

      // Mock findById which is called at the end of create
      mockInstitutionRepository.findOneOrFail.mockResolvedValueOnce({ ...savedInstitutionFull, documents: createdDocs, users: [] } as any);

      const result = await service.create(mockCreateInstitutionDto, mockUserId);

      expect(result).toBeDefined();
      expect(result.id).toBe(newInstId);
      expect(result.name).toEqual(mockCreateInstitutionDto.name);
      expect(mockInstitutionRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        name: mockCreateInstitutionDto.name,
        type: mockCreateInstitutionDto.type,
        createdBy: mockUserId,
        status: InstitutionStatusType.PENDING_VERIFICATION,
        active: false,
        // kiotaId is generated within the service method before create
      }));
      expect(mockInstitutionRepository.save).toHaveBeenCalledWith(createdInstitutionPartial); // save is called with the object from create
      expect(mockKafkaProducerService.emit).toHaveBeenCalledWith(InstitutionEventTopics.INSTITUTION_CREATED, expect.any(String));

      if (mockCreateInstitutionDto.documents && mockCreateInstitutionDto.documents.length > 0) {
        expect(mockInstitutionDocumentRepository.create).toHaveBeenCalledTimes(mockCreateInstitutionDto.documents.length);
        mockCreateInstitutionDto.documents.forEach(docDto => {
          expect(mockInstitutionDocumentRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            institutionId: newInstId,
            name: docDto.name,
            type: docDto.type as DocumentType,
            cloudinaryUrl: docDto.url, // Service maps doc.url to cloudinaryUrl
            createdBy: mockUserId,
          }));
        });
        expect(mockInstitutionDocumentRepository.save).toHaveBeenCalledWith(expect.arrayContaining(createdDocs.map(d => expect.objectContaining({name: d.name}))));
      }
    });
  });

  describe('findById', () => {
    it('should return an institution if found', async () => {
      mockInstitutionRepository.findOneOrFail.mockResolvedValueOnce(mockExistingInstitution);
      const result = await service.findById(mockInstitutionId);
      expect(result).toEqual(mockExistingInstitution);
      expect(mockInstitutionRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: mockInstitutionId },
        relations: ['documents', 'users'],
      });
    });

    it('should throw NotFoundException if institution not found', async () => {
      mockInstitutionRepository.findOneOrFail.mockRejectedValueOnce(new Error('Simulated DB Error')); // Simulate TypeORM not found
      // The service catches this and throws NotFoundException
      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update institution successfully', async () => {
      const updateDto: UpdateInstitutionDto = { name: 'Updated Name', type: InstitutionType.BANK }; // Example update
      const currentInstitution = { ...mockExistingInstitution, id: mockInstitutionId };
      const expectedUpdatedInstitution = { ...currentInstitution, ...updateDto, updated_at: expect.any(Date) };

      mockInstitutionRepository.findOneOrFail.mockResolvedValueOnce(currentInstitution as any); // For findById call
      mockInstitutionRepository.save.mockResolvedValueOnce(expectedUpdatedInstitution as any);

      const result = await service.update(mockInstitutionId, updateDto, mockUserId);

      expect(mockInstitutionRepository.findOneOrFail).toHaveBeenCalledWith({ where: { id: mockInstitutionId }, relations: ['documents', 'users'] });
      expect(mockInstitutionRepository.save).toHaveBeenCalledWith(expect.objectContaining(updateDto));
      expect(result.name).toEqual(updateDto.name);
      expect(result.type).toEqual(updateDto.type);
      expect(mockKafkaProducerService.emit).toHaveBeenCalledWith(InstitutionEventTopics.INSTITUTION_PROFILE_UPDATED, expect.any(String));
    });
  });

  describe('addDocument', () => {
    it('should add document to institution', async () => {
      const documentDto = {
        name: 'New NDA Doc',
        type: DocumentType.OTHER, // Valid DocumentType string value
        cloudinaryUrl: 'http://new.doc/nda.pdf',
        description: 'A test NDA document'
      };
      const newDocumentEntity = {
        ...documentDto,
        id: 'doc-2',
        institutionId: mockInstitutionId,
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        institution: mockExistingInstitution, 
        metadata: {}
      };

      mockInstitutionRepository.findOneOrFail.mockResolvedValueOnce(mockExistingInstitution as any); // For findById
      mockInstitutionDocumentRepository.create.mockReturnValue(newDocumentEntity as any);
      mockInstitutionDocumentRepository.save.mockResolvedValueOnce(newDocumentEntity as any);

      const result = await service.addDocument(mockInstitutionId, documentDto, mockUserId);

      expect(result).toBeDefined();
      expect(result.id).toBe('doc-2');
      expect(result.name).toBe(documentDto.name);
      expect(result.cloudinaryUrl).toBe(documentDto.cloudinaryUrl);
      expect(mockInstitutionDocumentRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        institutionId: mockInstitutionId,
        name: documentDto.name,
        type: documentDto.type as DocumentType, // Service casts string to DocumentType
        cloudinaryUrl: documentDto.cloudinaryUrl,
        createdBy: mockUserId,
      }));
      expect(mockInstitutionDocumentRepository.save).toHaveBeenCalledWith(newDocumentEntity);
    });
  });
});