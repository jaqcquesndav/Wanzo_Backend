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
  create: jest.fn(),
  save: jest.fn(),
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

  describe('updateLastActivity', () => {
    it('should update last activity timestamp', async () => {
      const organizationId = 'org-id';
      const lastActivityDate = new Date();
      
      const existingOrganization: Partial<Organization> = {
        id: organizationId,
        name: 'Test Organization',
        lastActivityAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
      };

      const updatedOrganization = {
        ...existingOrganization,
        lastActivityAt: lastActivityDate,
      };

      repository.findOneBy.mockResolvedValue(existingOrganization);
      repository.save.mockResolvedValue(updatedOrganization);

      await service.updateLastActivity(organizationId, lastActivityDate);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: organizationId });
      expect(repository.save).toHaveBeenCalledWith({
        ...existingOrganization,
        lastActivityAt: lastActivityDate,
      });
    });

    it('should do nothing when organization not found', async () => {
      const organizationId = 'non-existent-id';
      const lastActivityDate = new Date();
      
      repository.findOneBy.mockResolvedValue(null);

      await service.updateLastActivity(organizationId, lastActivityDate);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: organizationId });
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateLogo', () => {
    it('should update organization logo', async () => {
      const organizationId = 'org-id';
      const file = { 
        originalname: 'logo.png',
        filename: 'logo-123456.png',
        path: '/uploads/logos/logo-123456.png'
      } as Express.Multer.File;
      
      const existingOrganization: Partial<Organization> = {
        id: organizationId,
        name: 'Test Organization',
        logo: 'https://old-logo-url.com/logo.png',
      };

      const expectedLogoUrl = `https://storage.example.com/logos/${organizationId}/logo.png`;
      const updatedOrganization = {
        ...existingOrganization,
        logo: expectedLogoUrl,
      };

      repository.findOneBy.mockResolvedValue(existingOrganization);
      repository.save.mockResolvedValue(updatedOrganization);

      const result = await service.updateLogo(organizationId, file);

      expect(result).toEqual(expectedLogoUrl);
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: organizationId });
      expect(repository.save).toHaveBeenCalledWith({
        ...existingOrganization,
        logo: expectedLogoUrl,
      });
    });

    it('should throw NotFoundException when organization not found', async () => {
      const organizationId = 'non-existent-id';
      const file = { 
        originalname: 'logo.png' 
      } as Express.Multer.File;
      
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.updateLogo(organizationId, file)).rejects.toThrow(
        new NotFoundException(`Organization with ID ${organizationId} not found`)
      );
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: organizationId });
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('getFiscalSettings', () => {
    it('should return fiscal settings for organization', async () => {
      const organizationId = 'org-id';
      const existingOrganization: Partial<Organization> = {
        id: organizationId,
        name: 'Test Organization',
        vatNumber: 'VAT123456',
      };

      repository.findOneBy.mockResolvedValue(existingOrganization);

      const result = await service.getFiscalSettings(organizationId);

      expect(result).toEqual({
        vatRegistered: true,
        vatNumber: 'VAT123456',
        vatRate: 16,
        taxPaymentFrequency: 'monthly',
        fiscalYearStart: {
          month: 1,
          day: 1,
        },
        taxationSystem: 'normal',
      });
      expect(repository.findOneBy).toHaveBeenCalledWith({ id: organizationId });
    });

    it('should return fiscal settings with vatRegistered false when no VAT number', async () => {
      const organizationId = 'org-id';
      const existingOrganization: Partial<Organization> = {
        id: organizationId,
        name: 'Test Organization',
        vatNumber: undefined,
      };

      repository.findOneBy.mockResolvedValue(existingOrganization);

      const result = await service.getFiscalSettings(organizationId);

      expect(result).toEqual({
        vatRegistered: false,
        vatNumber: '',
        vatRate: 16,
        taxPaymentFrequency: 'monthly',
        fiscalYearStart: {
          month: 1,
          day: 1,
        },
        taxationSystem: 'normal',
      });
    });

    it('should throw NotFoundException when organization not found', async () => {
      const organizationId = 'non-existent-id';
      
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.getFiscalSettings(organizationId)).rejects.toThrow(
        new NotFoundException(`Organization with ID ${organizationId} not found`)
      );
    });
  });

  describe('updateFiscalSettings', () => {
    it('should update fiscal settings', async () => {
      const organizationId = 'org-id';
      const fiscalSettingsDto = {
        vatRegistered: true,
        vatNumber: 'NEW-VAT-123456',
        vatRate: 20,
      };
      
      const existingOrganization: Partial<Organization> = {
        id: organizationId,
        name: 'Test Organization',
        vatNumber: 'OLD-VAT-123456',
      };

      const updatedOrganization = {
        ...existingOrganization,
        vatNumber: 'NEW-VAT-123456',
      };

      repository.findOneBy.mockResolvedValue(existingOrganization);
      repository.save.mockResolvedValue(updatedOrganization);

      // Mock getFiscalSettings to return the expected result
      jest.spyOn(service, 'getFiscalSettings').mockResolvedValue({
        vatRegistered: true,
        vatNumber: 'NEW-VAT-123456',
        vatRate: 20,
        taxPaymentFrequency: 'monthly',
        fiscalYearStart: { month: 1, day: 1 },
        taxationSystem: 'normal',
      });

      const result = await service.updateFiscalSettings(organizationId, fiscalSettingsDto);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: organizationId });
      expect(repository.save).toHaveBeenCalled();
      expect(service.getFiscalSettings).toHaveBeenCalledWith(organizationId);
      expect(result).toEqual({
        vatRegistered: true,
        vatNumber: 'NEW-VAT-123456',
        vatRate: 20,
        taxPaymentFrequency: 'monthly',
        fiscalYearStart: { month: 1, day: 1 },
        taxationSystem: 'normal',
      });
    });

    it('should remove VAT number when vatRegistered is false', async () => {
      const organizationId = 'org-id';
      const fiscalSettingsDto = {
        vatRegistered: false,
      };
      
      const existingOrganization: Partial<Organization> = {
        id: organizationId,
        name: 'Test Organization',
        vatNumber: 'VAT-123456',
      };

      const updatedOrganization = {
        ...existingOrganization,
        vatNumber: undefined,
      };

      repository.findOneBy.mockResolvedValue(existingOrganization);
      repository.save.mockResolvedValue(updatedOrganization);

      // Mock getFiscalSettings
      jest.spyOn(service, 'getFiscalSettings').mockResolvedValue({
        vatRegistered: false,
        vatNumber: '',
        vatRate: 16,
        taxPaymentFrequency: 'monthly',
        fiscalYearStart: { month: 1, day: 1 },
        taxationSystem: 'normal',
      });

      await service.updateFiscalSettings(organizationId, fiscalSettingsDto);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: organizationId });
      expect(repository.save).toHaveBeenCalledWith({
        ...existingOrganization,
        vatNumber: undefined,
      });
    });
  });

  describe('getBankDetails', () => {
    it('should return bank details for organization', async () => {
      const organizationId = 'org-id';
      
      const result = await service.getBankDetails(organizationId);

      expect(result).toEqual([
        {
          id: 'bank-1',
          bankName: 'Equity Bank',
          accountNumber: '1234567890',
          iban: '',
          swift: 'EQBLCDKI',
          currency: 'USD',
          isPrimary: true
        }
      ]);
    });
  });
});
