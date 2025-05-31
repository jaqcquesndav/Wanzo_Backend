import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InstitutionService } from './institution.service';
import { Institution, InstitutionType, LicenseType, RegulatoryStatus } from '../entities/institution.entity';
import { InstitutionDocument } from '../entities/institution-document.entity';
import { CreateInstitutionDto } from '../dtos/institution.dto';
import { NotFoundException } from '@nestjs/common';

describe('InstitutionService', () => {
  let service: InstitutionService;

  const mockInstitutionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockDocumentRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstitutionService,
        {
          provide: getRepositoryToken(Institution),
          useValue: mockInstitutionRepository,
        },
        {
          provide: getRepositoryToken(InstitutionDocument),
          useValue: mockDocumentRepository,
        },
      ],
    }).compile();

    service = module.get<InstitutionService>(InstitutionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createInstitutionDto: CreateInstitutionDto = {
      name: 'Test Bank',
      type: InstitutionType.BANK,
      licenseNumber: '123456789',
      licenseType: LicenseType.NATIONAL,
      address: '123 Test St',
      phone: '+1234567890',
      email: 'test@bank.com',
      website: 'https://testbank.com',
      legalRepresentative: 'John Doe',
      taxId: 'TAX123',
      regulatoryStatus: RegulatoryStatus.COMPLIANT,
      documents: [
        {
          name: 'License',
          type: 'license',
          url: 'https://example.com/license.pdf',
        },
      ],
    };

    it('should create an institution successfully', async () => {
      const userId = 'user-123';
      const institution = { id: 'inst-123', ...createInstitutionDto };

      mockInstitutionRepository.create.mockReturnValue(institution);
      mockInstitutionRepository.save.mockResolvedValue(institution);
      mockDocumentRepository.create.mockReturnValue({ id: 'doc-123' });
      mockDocumentRepository.save.mockResolvedValue({ id: 'doc-123' });

      const result = await service.create(createInstitutionDto, userId);

      expect(result).toEqual(institution);
      expect(mockInstitutionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createInstitutionDto.name,
          type: createInstitutionDto.type,
          createdBy: userId,
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return an institution if found', async () => {
      const institution = {
        id: 'inst-123',
        name: 'Test Bank',
        documents: [],
        users: [],
      };

      mockInstitutionRepository.findOne.mockResolvedValue(institution);

      const result = await service.findById('inst-123');

      expect(result).toEqual(institution);
    });

    it('should throw NotFoundException if institution not found', async () => {
      mockInstitutionRepository.findOne.mockResolvedValue(null);

      await expect(service.findById('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update institution successfully', async () => {
      const institution = {
        id: 'inst-123',
        name: 'Original Name',
        type: InstitutionType.BANK,
      };

      const updateDto = {
        name: 'Updated Name',
        regulatoryStatus: RegulatoryStatus.COMPLIANT,
      };

      mockInstitutionRepository.findOne.mockResolvedValue(institution);
      mockInstitutionRepository.save.mockResolvedValue({ ...institution, ...updateDto });

      const result = await service.update('inst-123', updateDto);

      expect(result.name).toBe('Updated Name');
      expect(mockInstitutionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateDto),
      );
    });
  });

  describe('addDocument', () => {
    it('should add document to institution', async () => {
      const institution = { id: 'inst-123', name: 'Test Bank' };
      const document = {
        name: 'New Document',
        type: 'license',
        cloudinaryUrl: 'https://example.com/doc.pdf',
      };
      const userId = 'user-123';

      mockInstitutionRepository.findOne.mockResolvedValue(institution);
      mockDocumentRepository.create.mockReturnValue({ ...document, id: 'doc-123' });
      mockDocumentRepository.save.mockResolvedValue({ ...document, id: 'doc-123' });

      const result = await service.addDocument('inst-123', document, userId);

      expect(result.name).toBe('New Document');
      expect(mockDocumentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          institutionId: institution.id,
          createdBy: userId,
        }),
      );
    });
  });
});