import { Injectable, NotFoundException, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company, CompanyDataSharingPreferences, DataSharingPreferenceKey } from '../entities/company.entity';
import { CreateCompanyDto, UpdateCompanyDto, CompanyDataSharingPreferencesDto } from '../dtos/company.dto';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    try {
      const newCompany = this.companyRepository.create(createCompanyDto);
      return await this.companyRepository.save(newCompany);
    } catch (error: any) { // Typed error as any
      this.logger.error(`Failed to create company: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to create company.');
    }
  }

  async findAll(): Promise<Company[]> {
    try {
      return await this.companyRepository.find();
    } catch (error: any) { // Typed error as any
      this.logger.error(`Failed to find all companies: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to retrieve companies.');
    }
  }

  async findById(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) {
      this.logger.warn(`Company with ID ${id} not found`);
      throw new NotFoundException(`Company with ID ${id} not found`);
    }
    return company;
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<Company> {
    try {
      const company = await this.findById(id); // Ensures company exists
      // Deep merge for metadata and preferences might be needed depending on desired behavior
      const updatedCompany = this.companyRepository.merge(company, updateCompanyDto);
      return await this.companyRepository.save(updatedCompany);
    } catch (error: any) { // Typed error as any
      this.logger.error(`Failed to update company ${id}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to update company.');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const result = await this.companyRepository.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Company with ID ${id} not found`);
      }
    } catch (error: any) { // Typed error as any
      this.logger.error(`Failed to remove company ${id}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to remove company.');
    }
  }

  async getCompanyDataSharingPreferences(companyId: string): Promise<CompanyDataSharingPreferences> {
    this.logger.log(`Fetching data sharing preferences for company ID: ${companyId}`);
    const company = await this.findById(companyId);
    return company.dataSharingPreferences || {}; // Return empty object if no preferences set
  }

  async updateCompanyDataSharingPreferences(
    companyId: string,
    preferencesDto: CompanyDataSharingPreferencesDto,
  ): Promise<Company> {
    this.logger.log(`Updating data sharing preferences for company ID: ${companyId}`);
    const company = await this.findById(companyId);
    
    // Merge new preferences with existing ones, ensuring existing ones are not lost
    const newPreferences: CompanyDataSharingPreferences = {
      ...(company.dataSharingPreferences || {}),
      ...preferencesDto,
    };

    company.dataSharingPreferences = newPreferences;
    return this.companyRepository.save(company);
  }

  /**
   * Checks if a specific data sharing preference is enabled for a company.
   * @param companyId The ID of the company.
   * @param preferenceKey The specific DataSharingPreferenceKey to check.
   * @returns True if the preference is explicitly set to true, false otherwise.
   */
  async isDataSharingPreferenceEnabled(companyId: string, preferenceKey: DataSharingPreferenceKey): Promise<boolean> {
    const preferences = await this.getCompanyDataSharingPreferences(companyId);
    return preferences[preferenceKey] === true; // Explicitly check for true
  }

  // Placeholder for findByKiotaId or other identifiers if needed for linking with other services via Kafka events
  // async findByExternalId(externalId: string): Promise<Company | null> {
  //   return this.companyRepository.findOne({ where: { externalIdField: externalId } }); // Adjust field name
  // }
}
