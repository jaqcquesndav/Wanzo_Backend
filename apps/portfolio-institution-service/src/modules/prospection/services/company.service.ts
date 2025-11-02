import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company, CompanyStatus, CompanySize, FinancialMetrics, ESGMetrics } from '../entities/company.entity';
import { CreateCompanyDto, CompanyFiltersDto } from '../dtos/company.dto';
import { AccountingIntegrationService, SMEProspectData } from '../../integration/accounting-integration.service';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly accountingIntegrationService: AccountingIntegrationService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, institutionId: string, userId: string): Promise<Company> {
    const company = this.companyRepository.create({
      ...createCompanyDto,
      institution_id: institutionId,
      created_by: userId,
    });

    return await this.companyRepository.save(company);
  }

  async findAll(filters: CompanyFiltersDto, institutionId: string) {
    const queryBuilder = this.companyRepository.createQueryBuilder('company');
    
    queryBuilder.where('company.institution_id = :institutionId', { institutionId });

    if (filters.sector) {
      queryBuilder.andWhere('company.sector ILIKE :sector', { sector: `%${filters.sector}%` });
    }

    if (filters.size) {
      queryBuilder.andWhere('company.size = :size', { size: filters.size });
    }

    if (filters.status) {
      queryBuilder.andWhere('company.status = :status', { status: filters.status });
    }

    if (filters.searchTerm) {
      queryBuilder.andWhere(
        '(company.name ILIKE :searchTerm OR company.sector ILIKE :searchTerm)',
        { searchTerm: `%${filters.searchTerm}%` }
      );
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('company.created_at', 'DESC');

    const [companies, total] = await queryBuilder.getManyAndCount();

    return {
      data: companies,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: string, institutionId: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id, institution_id: institutionId }
    });

    if (!company) {
      throw new Error('Company not found');
    }

    return company;
  }

  async update(id: string, updateData: Partial<CreateCompanyDto>, institutionId: string): Promise<Company> {
    const company = await this.findOne(id, institutionId);
    
    Object.assign(company, updateData);
    return await this.companyRepository.save(company);
  }

  async remove(id: string, institutionId: string): Promise<void> {
    const company = await this.findOne(id, institutionId);
    await this.companyRepository.remove(company);
  }

  async updateLastContact(id: string, institutionId: string): Promise<Company> {
    const company = await this.findOne(id, institutionId);
    company.lastContact = new Date();
    return await this.companyRepository.save(company);
  }

  /**
   * Synchronise les PME qui ont autorisé le partage de données depuis le service accounting
   */
  async syncAuthorizedSMEs(institutionId: string, userId: string): Promise<{ synced: number; errors: number }> {
    this.logger.log('Starting sync of authorized SMEs for prospection');
    
    try {
      const authorizedSMEs = await this.accountingIntegrationService.getAuthorizedSMEsForProspection();
      
      if (authorizedSMEs.length === 0) {
        this.logger.log('No authorized SMEs found for sync');
        return { synced: 0, errors: 0 };
      }

      let syncedCount = 0;
      let errorCount = 0;

      for (const smeData of authorizedSMEs) {
        try {
          await this.createOrUpdateCompanyFromSME(smeData, institutionId, userId);
          syncedCount++;
          this.logger.log(`Successfully synced SME: ${smeData.name} (${smeData.id})`);
        } catch (error: any) {
          errorCount++;
          this.logger.error(`Failed to sync SME ${smeData.id}: ${error.message}`);
        }
      }

      this.logger.log(`Sync completed: ${syncedCount} synced, ${errorCount} errors`);
      return { synced: syncedCount, errors: errorCount };
    } catch (error: any) {
      this.logger.error(`Error during SME sync: ${error.message}`);
      throw error;
    }
  }

  /**
   * Synchronise une PME spécifique depuis le service accounting
   */
  async syncSpecificSME(smeId: string, institutionId: string, userId: string): Promise<Company> {
    this.logger.log(`Syncing specific SME: ${smeId}`);
    
    try {
      const smeData = await this.accountingIntegrationService.syncSMEDataForProspection(smeId);
      return await this.createOrUpdateCompanyFromSME(smeData, institutionId, userId);
    } catch (error: any) {
      this.logger.error(`Failed to sync SME ${smeId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Vérifie si une PME a autorisé le partage de données
   */
  async checkSMEDataSharingAuthorization(smeId: string): Promise<boolean> {
    return await this.accountingIntegrationService.checkDataSharingAuthorization(smeId);
  }

  /**
   * Récupère la liste des PME autorisées
   */
  async getAuthorizedSMEsList(): Promise<string[]> {
    return await this.accountingIntegrationService.getAuthorizedSMEsList();
  }

  /**
   * Filtre les entreprises locales pour ne montrer que celles qui ont autorisé le partage
   */
  async findAllWithDataSharingFilter(filters: CompanyFiltersDto, institutionId: string) {
    const result = await this.findAll(filters, institutionId);
    
    // Vérifier pour chaque entreprise si elle a autorisé le partage
    const companiesWithDataSharing = await Promise.all(
      result.data.map(async (company) => {
        try {
          const hasDataSharing = await this.checkSMEDataSharingAuthorization(company.id);
          return {
            ...company,
            hasDataSharingAuthorization: hasDataSharing
          };
        } catch (error: any) {
          // Si on ne peut pas vérifier, considérer comme non autorisé
          return {
            ...company,
            hasDataSharingAuthorization: false
          };
        }
      })
    );

    return {
      ...result,
      data: companiesWithDataSharing
    };
  }

  /**
   * Crée ou met à jour une entreprise à partir des données SME
   */
  private async createOrUpdateCompanyFromSME(
    smeData: SMEProspectData, 
    institutionId: string, 
    userId: string
  ): Promise<Company> {
    // Vérifier si l'entreprise existe déjà
    let existingCompany: Company | null = null;
    try {
      existingCompany = await this.companyRepository.findOne({
        where: { id: smeData.id }
      });
    } catch (error: any) {
      // L'entreprise n'existe pas encore
    }

    const companyData = {
      name: smeData.name,
      sector: smeData.sector,
      size: smeData.size as CompanySize, // Cast explicite vers CompanySize
      annual_revenue: smeData.annual_revenue,
      employee_count: smeData.employee_count,
      website_url: smeData.website_url,
      status: CompanyStatus.ACTIVE,
      financial_metrics: smeData.financial_metrics as FinancialMetrics,
      esg_metrics: smeData.esg_metrics as ESGMetrics,
      institution_id: institutionId,
      created_by: userId,
    };

    if (existingCompany) {
      // Mettre à jour l'entreprise existante
      Object.assign(existingCompany, companyData);
      return await this.companyRepository.save(existingCompany);
    } else {
      // Créer une nouvelle entreprise avec l'ID de la SME
      const newCompany = this.companyRepository.create({
        id: smeData.id, // Utiliser l'ID de la SME
        ...companyData
      });
      return await this.companyRepository.save(newCompany);
    }
  }
}