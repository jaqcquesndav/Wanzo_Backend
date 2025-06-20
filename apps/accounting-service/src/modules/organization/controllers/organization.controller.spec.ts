import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from '../services/organization.service';
import { UpdateOrganizationDto } from '../dtos/update-organization.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AccountingMode, Organization } from '../entities/organization.entity';
import { NotFoundException } from '@nestjs/common';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let service: OrganizationService;

  const mockOrganizationService = {
    findByCompanyId: jest.fn(),
    update: jest.fn(),
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
      const companyId = 'company-id';
      const req = {
        user: { companyId }
      };

      const mockOrganization: Partial<Organization> = {
        id: companyId,
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

      mockOrganizationService.findByCompanyId.mockResolvedValue(mockOrganization);

      const result = await controller.getOrganization(req as any);

      expect(result).toEqual({
        success: true,
        data: mockOrganization
      });
      expect(mockOrganizationService.findByCompanyId).toHaveBeenCalledWith(companyId);
    });

    it('should handle organization not found', async () => {
      const companyId = 'non-existent-id';
      const req = {
        user: { companyId }
      };

      mockOrganizationService.findByCompanyId.mockResolvedValue(null);

      const result = await controller.getOrganization(req as any);

      expect(result).toEqual({
        success: true,
        data: null
      });
      expect(mockOrganizationService.findByCompanyId).toHaveBeenCalledWith(companyId);
    });
  });

  describe('updateOrganization', () => {
    it('should update organization details', async () => {
      const companyId = 'company-id';
      const req = {
        user: { companyId }
      };

      const updateDto: UpdateOrganizationDto = {
        name: 'Updated Organization',
        address: 'Updated Address',
        taxId: 'UPDATED-TAX-123',
        website: 'https://updated.com'
      };

      const updatedOrganization: Partial<Organization> = {
        id: companyId,
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
      expect(mockOrganizationService.update).toHaveBeenCalledWith(companyId, updateDto);
    });

    it('should handle organization not found on update', async () => {
      const companyId = 'non-existent-id';
      const req = {
        user: { companyId }
      };

      const updateDto: UpdateOrganizationDto = {
        name: 'Updated Organization'
      };

      mockOrganizationService.update.mockRejectedValue(
        new NotFoundException(`Organization with ID ${companyId} not found`)
      );

      await expect(controller.updateOrganization(updateDto, req as any)).rejects.toThrow(NotFoundException);
      expect(mockOrganizationService.update).toHaveBeenCalledWith(companyId, updateDto);
    });
  });
});
