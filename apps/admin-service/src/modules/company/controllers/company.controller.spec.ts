import { Test, TestingModule } from '@nestjs/testing';
import { CompanyController } from './company.controller';
import { CompanyService } from '../services/company.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { UpdateCompanyProfileDto } from '../dtos/company.dto';

const mockCompanyService = {
  getCompanyProfile: jest.fn(),
  updateCompanyProfile: jest.fn(),
  uploadLogo: jest.fn(),
};

describe('CompanyController', () => {
  let controller: CompanyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        {
          provide: CompanyService,
          useValue: mockCompanyService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CompanyController>(CompanyController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCompanyProfile', () => {
    it('should call service and return company profile', async () => {
      const profile = { name: 'Wanzo' };
      mockCompanyService.getCompanyProfile.mockResolvedValue(profile);

      const result = await controller.getCompanyProfile();

      expect(mockCompanyService.getCompanyProfile).toHaveBeenCalled();
      expect(result.data).toEqual(profile);
    });
  });

  describe('updateCompanyProfile', () => {
    it('should call service to update and return the updated profile', async () => {
      const updateDto: UpdateCompanyProfileDto = { name: 'Wanzo Inc.' };
      const updatedProfile = { name: 'Wanzo Inc.' };
      mockCompanyService.updateCompanyProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateCompanyProfile(updateDto);

      expect(mockCompanyService.updateCompanyProfile).toHaveBeenCalledWith(updateDto);
      expect(result.data).toEqual(updatedProfile);
      expect(result.message).toContain('updated successfully');
    });
  });

  describe('uploadLogo', () => {
    it('should call service to upload logo and return the url', async () => {
      const file = { buffer: Buffer.from('test'), originalname: 'logo.png' } as Express.Multer.File;
      const serviceResponse = { logoUrl: 'http://logo.url' };
      mockCompanyService.uploadLogo.mockResolvedValue(serviceResponse);

      const expectedResult = {
        message: 'Logo uploaded successfully',
        data: serviceResponse,
      };

      const result = await controller.uploadLogo(file);

      expect(mockCompanyService.uploadLogo).toHaveBeenCalledWith(file.buffer, file.originalname);
      expect(result).toEqual(expectedResult);
    });
  });
});
