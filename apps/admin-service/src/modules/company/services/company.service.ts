import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company, LocationType } from '../entities/company.entity';
import { Location } from '../entities/location.entity'; // Import Location entity
import { 
  CompanyProfileDto, 
  UpdateCompanyProfileDto,
  AddLocationDto,
  UpdateLocationDto
} from '../dtos/company.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>, // Inject Location repository
  ) {}

  // Singleton company ID for Wanzo
  private readonly WANZO_COMPANY_ID = 'wanzo_singleton_id';

  /**
   * Retrieve the company profile
   */
  async getCompanyProfile(): Promise<CompanyProfileDto> {
    const company = await this.findCompany();
    return this.mapToDto(company);
  }

  /**
   * Update the company profile
   */
  async updateCompanyProfile(updateDto: UpdateCompanyProfileDto): Promise<CompanyProfileDto> {
    const company = await this.findCompany();
    
    // Update company fields
    Object.assign(company, updateDto);

    const updatedCompany = await this.companyRepository.save(company);
    return this.mapToDto(updatedCompany);
  }

  /**
   * Upload company logo
   */
  async uploadLogo(fileBuffer: Buffer, filename: string): Promise<{ logoUrl: string }> {
    // In a real implementation, this would handle file upload to a storage service
    // For now, we'll simulate a successful upload with a dummy URL
    const company = await this.findCompany();
    
    // In production, this would be handled by a file storage service
    const logoUrl = `https://cdn.wanzo.com/logos/${filename.replace(/\s+/g, '_')}`;
    
    company.logo = logoUrl;
    await this.companyRepository.save(company);
    
    return { logoUrl };
  }

  /**
   * Upload a company document
   */
  async uploadDocument(fileBuffer: Buffer, filename: string, type: string): Promise<{
    documentId: string;
    type: string;
    fileUrl: string;
    uploadedAt: string;
  }> {
    const company = await this.findCompany();
    
    // Validate document type
    if (!['rccmFile', 'nationalIdFile', 'taxNumberFile', 'cnssFile'].includes(type)) {
      throw new BadRequestException(`Invalid document type: ${type}`);
    }
    
    // In production, this would be handled by a file storage service
    const fileUrl = `https://cdn.wanzo.com/docs/${type}_${filename.replace(/\s+/g, '_')}`;
    
    // Update company documents
    company.documents = {
      ...company.documents,
      [type]: fileUrl
    };
    
    await this.companyRepository.save(company);
    
    return {
      documentId: uuidv4(), // Generate a unique ID for the document
      type,
      fileUrl,
      uploadedAt: new Date().toISOString()
    };
  }

  /**
   * List all company documents
   */
  async listDocuments(): Promise<{
    id: string;
    type: string;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: string;
  }[]> {
    const company = await this.findCompany();
    const result: Array<{
      id: string;
      type: string;
      fileUrl: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      uploadedAt: string;
    }> = [];
    
    // Convert the documents object to an array for the response
    for (const [type, fileUrl] of Object.entries(company.documents)) {
      if (fileUrl) {
        const fileName = fileUrl.split('/').pop() || 'unknown-file';
        result.push({
          id: `doc_${uuidv4().substring(0, 5)}`, // Generate a shorter unique ID
          type,
          fileUrl,
          fileName,
          fileSize: 1000000, // Mock file size
          mimeType: 'application/pdf', // Mock mime type
          uploadedAt: company.updatedAt.toISOString()
        });
      }
    }
    
    return result;
  }

  /**
   * Add a company location
   */
  async addLocation(locationData: AddLocationDto): Promise<Location> {
    const company = await this.findCompany();
    
    const newLocation = this.locationRepository.create({
      ...locationData,
      company: company,
    });
    
    return this.locationRepository.save(newLocation);
  }

  /**
   * Update a company location
   */
  async updateLocation(locationId: string, updateDto: UpdateLocationDto): Promise<Location> {
    const location = await this.locationRepository.findOne({ where: { id: locationId } });

    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }
    
    Object.assign(location, updateDto);
    
    return this.locationRepository.save(location);
  }

  /**
   * Delete a company location
   */
  async deleteLocation(locationId: string): Promise<void> {
    const result = await this.locationRepository.delete(locationId);

    if (result.affected === 0) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }
  }

  /**
   * Get company statistics
   */
  async getCompanyStatistics(): Promise<{
    activeUsers: number;
    activeCompanies: number;
    activeSubscriptions: number;
    totalRevenue: { usd: number; cdf: number };
  }> {
    // In a real implementation, this would query the database for actual statistics
    // For this demo, we'll return mock data
    return {
      activeUsers: 125,
      activeCompanies: 45,
      activeSubscriptions: 38,
      totalRevenue: {
        usd: 15000,
        cdf: 37500000
      }
    };
  }

  /**
   * Helper method to find the singleton company entity or create it if it doesn't exist
   */
  private async findCompany(): Promise<Company> {
    // Try to find the singleton company
    let company = await this.companyRepository.findOne({
      where: { id: this.WANZO_COMPANY_ID }
    });
    
    // If not found, create it (this should only happen on first run)
    if (!company) {
      const companyData: Partial<Company> = {
        id: this.WANZO_COMPANY_ID,
        name: 'Wanzo Inc.',
        rccmNumber: 'CD/KIN/RCCM/123456',
        nationalId: 'NAT12345',
        taxNumber: 'TAX12345',
        cnssNumber: 'CNSS12345',
        address: {
          street: '123 Innovation Drive',
          city: 'Kinshasa',
          province: 'Kinshasa',
          commune: 'Gombe',
          quartier: 'Centre-ville',
          coordinates: {
            lat: -4.325,
            lng: 15.322
          }
        },
        documents: {
          rccmFile: undefined,
          nationalIdFile: undefined,
          taxNumberFile: undefined,
          cnssFile: undefined
        },
        contactEmail: 'info@wanzo.com',
        contactPhone: ['+243123456789'],
        representativeName: 'John Doe',
        representativeRole: 'CEO'
      };
      
      company = this.companyRepository.create(companyData);
      await this.companyRepository.save(company);
    }
    
    return company;
  }

  /**
   * Map entity to DTO
   */
  private mapToDto(company: Company): CompanyProfileDto {
    return {
      id: company.id,
      name: company.name,
      rccmNumber: company.rccmNumber,
      nationalId: company.nationalId,
      taxNumber: company.taxNumber,
      cnssNumber: company.cnssNumber,
      logo: company.logo,
      legalForm: company.legalForm,
      businessSector: company.businessSector,
      description: company.description,
      address: company.address,
      locations: company.locations,
      documents: company.documents,
      contactEmail: company.contactEmail,
      contactPhone: company.contactPhone,
      representativeName: company.representativeName,
      representativeRole: company.representativeRole,
      updatedAt: company.updatedAt.toISOString(),
      createdAt: company.createdAt.toISOString(),
    };
  }
}
