import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from './company.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Company } from '../entities/company.entity';
import { Location } from '../entities/location.entity';
import { Repository } from 'typeorm';
import { UpdateCompanyProfileDto } from '../dtos/company.dto';

const mockCompanyRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
};

const mockLocationRepository = {
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
};

describe('CompanyService', () => {
  let service: CompanyService;
  const now = new Date();
  const mockCompany: Company = {
    id: 'wanzo_singleton_id',
    name: 'Wanzo',
    rccmNumber: 'RCCM123',
    nationalId: 'ID123',
    taxNumber: 'TAX123',
    contactEmail: 'contact@wanzo.com',
    contactPhone: ['123456789'],
    address: { street: '123 Main St', city: 'Kinshasa', province: 'Kinshasa', commune: 'Gombe', quartier: 'Business', coordinates: { lat: -4.325, lng: 15.3222 } },
    createdAt: now,
    updatedAt: now,
    logo: 'logo.png',
    documents: {},
    locations: [] as Location[],
    representativeName: 'John Doe',
    representativeRole: 'CEO',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: getRepositoryToken(Company),
          useValue: mockCompanyRepository,
        },
        {
          provide: getRepositoryToken(Location),
          useValue: mockLocationRepository,
        },
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getCompanyProfile', () => {
    it('should find and return the company profile', async () => {
      mockCompanyRepository.findOne.mockResolvedValue(mockCompany);
      
      const result = await service.getCompanyProfile();

      expect(mockCompanyRepository.findOne).toHaveBeenCalled();
      expect(result.name).toEqual(mockCompany.name);
    });
  });

  describe('updateCompanyProfile', () => {
    it('should update and return the company profile', async () => {
      const updateDto: UpdateCompanyProfileDto = { name: 'Wanzo Inc.' };
      const updatedCompany = { ...mockCompany, ...updateDto, updatedAt: new Date() };

      mockCompanyRepository.findOne.mockResolvedValue(mockCompany);
      mockCompanyRepository.save.mockResolvedValue(updatedCompany);

      const result = await service.updateCompanyProfile(updateDto);

      expect(mockCompanyRepository.findOne).toHaveBeenCalled();
      expect(mockCompanyRepository.save).toHaveBeenCalledWith(expect.objectContaining(updateDto));
      expect(result.name).toEqual(updatedCompany.name);
    });
  });

  describe('uploadLogo', () => {
    it('should upload a logo and update the company profile', async () => {
      const filename = 'logo.png';
      const buffer = Buffer.from('test');

      mockCompanyRepository.findOne.mockResolvedValue(mockCompany);
      mockCompanyRepository.save.mockImplementation(c => Promise.resolve(c));

      const result = await service.uploadLogo(buffer, filename);

      expect(result.logoUrl).toBeDefined();
      expect(mockCompanyRepository.save).toHaveBeenCalledWith(expect.objectContaining({ logo: result.logoUrl }));
    });
  });
});
