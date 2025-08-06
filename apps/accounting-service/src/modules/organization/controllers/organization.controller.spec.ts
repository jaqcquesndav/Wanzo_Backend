import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from '../services/organization.service';
import { UpdateOrganizationDto } from '../dtos/update-organization.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AccountingMode, Organization } from '../entities/organization.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let service: OrganizationService;

  const mockOrganizationService = {
    findById: jest.fn(),
    update: jest.fn(),
    updateLogo: jest.fn(),
    getFiscalSettings: jest.fn(),
    updateFiscalSettings: jest.fn(),
    getBankDetails: jest.fn(),
    addBankDetails: jest.fn(),
    updateBankDetails: jest.fn(),
    deleteBankDetails: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationController],
      providers: [
        {
          provide: OrganizationService,
          useValue: mockOrganizationService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrganizationController>(OrganizationController);
    service = module.get<OrganizationService>(OrganizationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getOrganization', () => {
    it('should return organization details', async () => {
      const organizationId = 'org-id';
      const req = {
        user: { organizationId }
      };

      const mockOrganization: Partial<Organization> = {
        id: organizationId,
        name: 'Test Organization',
        registrationNumber: 'REG123456',
        taxId: 'TAX123456',
        vatNumber: 'VAT123456',
        address: '123 Test Street',
        phone: '+123456789',
        email: 'contact@testorg.com',
        website: 'https://testorg.com',
        accountingMode: AccountingMode.SYSCOHADA,
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
        industry: 'Technology',
        description: 'A test organization',
        legalForm: 'LLC',
        capital: '100000'
      };

      mockOrganizationService.findById.mockResolvedValue(mockOrganization);

      const result = await controller.getOrganization(req as any);

      expect(result).toEqual({
        success: true,
        data: mockOrganization
      });
      expect(mockOrganizationService.findById).toHaveBeenCalledWith(organizationId);
    });

    it('should handle organization not found', async () => {
      const organizationId = 'non-existent-id';
      const req = {
        user: { organizationId }
      };

      mockOrganizationService.findById.mockResolvedValue(null);

      const result = await controller.getOrganization(req as any);

      expect(result).toEqual({
        success: true,
        data: null
      });
      expect(mockOrganizationService.findById).toHaveBeenCalledWith(organizationId);
    });
  });

  describe('updateOrganization', () => {
    it('should update organization details', async () => {
      const organizationId = 'org-id';
      const req = {
        user: { organizationId }
      };

      const updateDto: UpdateOrganizationDto = {
        name: 'Updated Organization',
        address: 'Updated Address',
        taxId: 'UPDATED-TAX-123',
        website: 'https://updated.com'
      };

      const updatedOrganization: Partial<Organization> = {
        id: organizationId,
        name: updateDto.name,
        address: updateDto.address,
        taxId: updateDto.taxId,
        website: updateDto.website,
        updatedAt: new Date()
      };

      mockOrganizationService.update.mockResolvedValue(updatedOrganization);

      const result = await controller.updateOrganization(updateDto, req as any);

      expect(result).toEqual({
        success: true,
        data: updatedOrganization
      });
      expect(mockOrganizationService.update).toHaveBeenCalledWith(organizationId, updateDto);
    });

    it('should handle organization not found on update', async () => {
      const organizationId = 'non-existent-id';
      const req = {
        user: { organizationId }
      };

      const updateDto: UpdateOrganizationDto = {
        name: 'Updated Organization'
      };

      mockOrganizationService.update.mockRejectedValue(
        new NotFoundException(`Organization with ID ${organizationId} not found`)
      );

      await expect(controller.updateOrganization(updateDto, req as any)).rejects.toThrow(NotFoundException);
      expect(mockOrganizationService.update).toHaveBeenCalledWith(organizationId, updateDto);
    });
  });

  describe('uploadLogo', () => {
    it('should upload organization logo', async () => {
      const organizationId = 'org-id';
      const req = {
        user: { organizationId }
      };
      
      const file = {
        originalname: 'logo.png',
        filename: 'processed-logo.png',
        path: '/uploads/logos/processed-logo.png'
      } as Express.Multer.File;
      
      const logoUrl = 'https://storage.example.com/logos/org-id/logo.png';
      
      mockOrganizationService.updateLogo.mockResolvedValue(logoUrl);
      
      const result = await controller.uploadLogo(file, req as any);
      
      expect(result).toEqual({
        success: true,
        data: {
          logo: logoUrl
        }
      });
      expect(mockOrganizationService.updateLogo).toHaveBeenCalledWith(organizationId, file);
    });
    
    it('should throw BadRequestException when no file is provided', async () => {
      const organizationId = 'org-id';
      const req = {
        user: { organizationId }
      };
      
      await expect(controller.uploadLogo(undefined as any, req as any))
        .rejects.toThrow(BadRequestException);
      
      expect(mockOrganizationService.updateLogo).not.toHaveBeenCalled();
    });
  });
  
  describe('getFiscalSettings', () => {
    it('should return fiscal settings', async () => {
      const organizationId = 'org-id';
      const req = {
        user: { organizationId }
      };
      
      const fiscalSettings = {
        vatRegistered: true,
        vatNumber: 'VAT123456',
        vatRate: 16,
        taxPaymentFrequency: 'monthly',
        fiscalYearStart: {
          month: 1,
          day: 1,
        },
        taxationSystem: 'normal',
      };
      
      mockOrganizationService.getFiscalSettings.mockResolvedValue(fiscalSettings);
      
      const result = await controller.getFiscalSettings(req as any);
      
      expect(result).toEqual({
        success: true,
        data: fiscalSettings
      });
      expect(mockOrganizationService.getFiscalSettings).toHaveBeenCalledWith(organizationId);
    });
  });
  
  describe('updateFiscalSettings', () => {
    it('should update fiscal settings', async () => {
      const organizationId = 'org-id';
      const req = {
        user: { organizationId }
      };
      
      const fiscalSettingsDto = {
        vatRegistered: true,
        vatNumber: 'VAT123456',
        vatRate: 16,
      };
      
      const updatedSettings = {
        vatRegistered: true,
        vatNumber: 'VAT123456',
        vatRate: 16,
        taxPaymentFrequency: 'monthly',
        fiscalYearStart: {
          month: 1,
          day: 1,
        },
        taxationSystem: 'normal',
      };
      
      mockOrganizationService.updateFiscalSettings.mockResolvedValue(updatedSettings);
      
      const result = await controller.updateFiscalSettings(fiscalSettingsDto, req as any);
      
      expect(result).toEqual({
        success: true,
        data: updatedSettings
      });
      expect(mockOrganizationService.updateFiscalSettings).toHaveBeenCalledWith(organizationId, fiscalSettingsDto);
    });
  });
  
  describe('getBankDetails', () => {
    it('should return bank details', async () => {
      const organizationId = 'org-id';
      const req = {
        user: { organizationId }
      };
      
      const bankDetails = [
        {
          id: 'bank-1',
          bankName: 'Equity Bank',
          accountNumber: '1234567890',
          iban: '',
          swift: 'EQBLCDKI',
          currency: 'USD',
          isPrimary: true
        }
      ];
      
      mockOrganizationService.getBankDetails.mockResolvedValue(bankDetails);
      
      const result = await controller.getBankDetails(req as any);
      
      expect(result).toEqual({
        success: true,
        data: bankDetails
      });
      expect(mockOrganizationService.getBankDetails).toHaveBeenCalledWith(organizationId);
    });
  });
  
  describe('addBankDetails', () => {
    it('should add new bank details', async () => {
      const organizationId = 'org-id';
      const req = {
        user: { organizationId }
      };
      
      const bankDetailsDto = {
        bankName: 'BCDC',
        accountNumber: '5555666677',
        swift: 'BCDCCDKI',
        currency: 'EUR',
      };
      
      const newBankDetails = {
        id: 'bank-3',
        ...bankDetailsDto,
        isPrimary: false
      };
      
      mockOrganizationService.addBankDetails.mockResolvedValue(newBankDetails);
      
      const result = await controller.addBankDetails(bankDetailsDto, req as any);
      
      expect(result).toEqual({
        success: true,
        data: newBankDetails
      });
      expect(mockOrganizationService.addBankDetails).toHaveBeenCalledWith(organizationId, bankDetailsDto);
    });
  });
  
  describe('updateBankDetails', () => {
    it('should update bank details', async () => {
      const organizationId = 'org-id';
      const bankDetailsId = 'bank-1';
      const req = {
        user: { organizationId }
      };
      
      const bankDetailsDto = {
        accountNumber: '5555666699',
        isPrimary: true
      };
      
      const updatedBankDetails = {
        id: bankDetailsId,
        bankName: 'Equity Bank',
        accountNumber: '5555666699',
        iban: '',
        swift: 'EQBLCDKI',
        currency: 'USD',
        isPrimary: true
      };
      
      mockOrganizationService.updateBankDetails.mockResolvedValue(updatedBankDetails);
      
      const result = await controller.updateBankDetails(bankDetailsId, bankDetailsDto, req as any);
      
      expect(result).toEqual({
        success: true,
        data: updatedBankDetails
      });
      expect(mockOrganizationService.updateBankDetails).toHaveBeenCalledWith(
        organizationId, 
        bankDetailsId, 
        bankDetailsDto
      );
    });
  });
  
  describe('deleteBankDetails', () => {
    it('should delete bank details', async () => {
      const organizationId = 'org-id';
      const bankDetailsId = 'bank-1';
      const req = {
        user: { organizationId }
      };
      
      mockOrganizationService.deleteBankDetails.mockResolvedValue(undefined);
      
      const result = await controller.deleteBankDetails(bankDetailsId, req as any);
      
      expect(result).toEqual({
        success: true,
        message: "Bank details successfully deleted"
      });
      expect(mockOrganizationService.deleteBankDetails).toHaveBeenCalledWith(organizationId, bankDetailsId);
    });
  });
});
