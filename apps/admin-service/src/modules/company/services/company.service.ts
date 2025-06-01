import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../entities';
import { CompanyProfileDto, UpdateCompanyProfileDto } from '../dtos';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  // Singleton company ID for Kiota
  private readonly KIOTA_COMPANY_ID = 'kiota_singleton_id';

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
    Object.assign(company, {
      ...updateDto,
      // Handle any special field transformations here if needed
    });

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
    const logoUrl = `https://cdn.kiota.com/logos/${filename}`;
    
    company.logoUrl = logoUrl;
    await this.companyRepository.save(company);
    
    return { logoUrl };
  }

  /**
   * Helper method to find the singleton company entity
   */
  private async findCompany(): Promise<Company> {
    // Try to find the singleton company
    let company = await this.companyRepository.findOneBy({ id: this.KIOTA_COMPANY_ID });
    
    // If not found, create it (this should only happen on first run)
    if (!company) {
      company = this.companyRepository.create({
        id: this.KIOTA_COMPANY_ID,
        name: 'Kiota Inc.',
        // Default values for other fields
      });
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
      registrationNumber: company.registrationNumber,
      taxId: company.taxId,
      address: company.address,
      contactEmail: company.contactEmail,
      phoneNumber: company.phoneNumber,
      website: company.website,
      logoUrl: company.logoUrl,
      industry: company.industry,
      foundedDate: company.foundedDate?.toISOString().split('T')[0], // Format as YYYY-MM-DD
      description: company.description,
      updatedAt: company.updatedAt,
      createdAt: company.createdAt,
    };
  }
}
