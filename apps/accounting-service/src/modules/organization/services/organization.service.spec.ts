import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationService } from './organization.service';
import { Organization, AccountingMode } from '../entities/organization.entity';
import { UpdateOrganizationDto } from '../dtos/update-organization.dto';
import { NotFoundException } from '@nestjs/common';

// Define a safer mock repository type
const createMockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

describe('OrganizationService', () => {
  let service: OrganizationService;
  let repository: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    repository = createMockRepository();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        {
          provide: getRepositoryToken(Organization),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrganizationProfile', () => {
    it('should return organization profile', async () => {
      const organizationId = 'org-id';
      const mockOrganization: Partial<Organization> = {
        id: organizationId,
        name: 'Test Organization',
        address: '123 Test Street',
        vatNumber: 'VAT123456',
        registrationNumber: 'REG123456',
        industry: 'Technology',
        website: 'https://testorg.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findOneBy.mockResolvedValue(mockOrganization);

      const result = await service.getOrganizationProfile(organizationId);

      expect(result).toEqual({
        id: organizationId,
        name: mockOrganization.name,
        address: mockOrganization.address,
        vatNumber: mockOrganization.vatNumber,
        registrationNumber: mockOrganization.registrationNumber,
        industry: mockOrganization.industry,
        website: mockOrganization.website,
        createdAt: mockOrganization.createdAt,
        updatedAt: mockOrganization.updatedAt,
      });
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: organizationId });
    });

    it('should throw NotFoundException when organization not found', async () => {
      const organizationId = 'non-existent-id';
      
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.getOrganizationProfile(organizationId)).rejects.toThrow(
        new NotFoundException(`Organization with ID ${organizationId} not found`)
      );
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: organizationId });
    });
  });

  describe('findById', () => {
    it('should return organization by id', async () => {
      const organizationId = 'org-id';
      const mockOrganization: Partial<Organization> = {
        id: organizationId,
        name: 'Test Organization',
      };

      repository.findOneBy.mockResolvedValue(mockOrganization);

      const result = await service.findById(organizationId);

      expect(result).toEqual(mockOrganization);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: organizationId });
    });

    it('should return null when organization not found', async () => {
      const organizationId = 'non-existent-id';
      
      repository.findOneBy.mockResolvedValue(null);

      const result = await service.findById(organizationId);

      expect(result).toBeNull();
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: organizationId });
    });
  });

  describe('findByCompanyId', () => {
    it('should call findById with companyId', async () => {
      const companyId = 'company-id';
      const mockOrganization: Partial<Organization> = {
        id: companyId,
        name: 'Test Organization',
      };

      repository.findOneBy.mockResolvedValue(mockOrganization);

      const result = await service.findByCompanyId(companyId);

      expect(result).toEqual(mockOrganization);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: companyId });
    });
  });

  describe('update', () => {
    it('should update organization details', async () => {
      const organizationId = 'org-id';
      const updateDto: UpdateOrganizationDto = {
        name: 'Updated Organization',
        address: 'Updated Address',
        taxId: 'UPDATED-TAX-123',
      };

      const existingOrganization: Partial<Organization> = {
        id: organizationId,
        name: 'Test Organization',
        address: '123 Test Street',
        taxId: 'TAX123456',
      };

      const updatedOrganization: Partial<Organization> = {
        ...existingOrganization,
        ...updateDto,
      };

      repository.findOneBy.mockResolvedValue(existingOrganization);
      repository.save.mockResolvedValue(updatedOrganization);

      const result = await service.update(organizationId, updateDto);

      expect(result).toEqual(updatedOrganization);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: organizationId });
      expect(repository.save).toHaveBeenCalledWith({
        ...existingOrganization,
        ...updateDto,
      });
    });

    it('should throw NotFoundException when organization not found', async () => {
      const organizationId = 'non-existent-id';
      const updateDto: UpdateOrganizationDto = {
        name: 'Updated Organization',
      };
      
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.update(organizationId, updateDto)).rejects.toThrow(
        new NotFoundException(`Organization with ID ${organizationId} not found`)
      );
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: organizationId });
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new organization', async () => {
      const organizationData: Partial<Organization> = {
        name: 'New Organization',
        address: 'New Address',
        taxId: 'NEW-TAX-123',
        accountingMode: AccountingMode.SYSCOHADA,
      };
      
      const userId = 'user-id';

      const createdOrganization: Partial<Organization> = {
        id: 'new-org-id',
        ...organizationData,
        createdBy: userId,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };

      repository.create.mockReturnValue(organizationData);
      repository.save.mockResolvedValue(createdOrganization);

      const result = await service.create(organizationData, userId);

      expect(result).toEqual(createdOrganization);
      expect(repository.create).toHaveBeenCalledWith({
        ...organizationData,
        createdBy: userId,
      });
      expect(repository.save).toHaveBeenCalled();
    });
  });
});
