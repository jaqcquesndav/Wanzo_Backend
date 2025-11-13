import { Injectable } from '@nestjs/common';
import { CustomerType } from '../../entities/customer.entity';
import { CustomerRegistryService } from '../../shared/services/customer-registry.service';
import { CustomerLifecycleService } from '../../shared/services/customer-lifecycle.service';
import { CustomerOwnershipService } from '../../shared/services/customer-ownership.service';
import { CustomerEventsService } from '../../shared/services/customer-events.service';
import {
  CompanyResponseDto,
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanyLocationDto,
  CompanyPartnerDto,
  CompanyListQueryDto,
  CompanyListResponseDto,
} from '../dto/create-company.dto';

@Injectable()
export class CompanyService {
  constructor(
    private readonly registryService: CustomerRegistryService,
    private readonly lifecycleService: CustomerLifecycleService,
    private readonly ownershipService: CustomerOwnershipService,
    private readonly eventService: CustomerEventsService,
  ) {}

  /**
   * POST /companies - Créer une nouvelle entreprise
   */
  async createCompany(createCompanyDto: CreateCompanyDto): Promise<CompanyResponseDto> {
    // Validation et nettoyage
    const cleanedData = this.cleanCompanyData(createCompanyDto);
    
    // Créer l'entreprise via le registryService
    const company = await this.registryService.createCustomer({
      ...cleanedData,
      type: CustomerType.SME,
    });

    // Déclencher l'événement de création
    await this.eventService.emitCustomerCreated({
      customerId: company.id,
      customerType: CustomerType.SME,
      newData: company,
    });

    return this.mapToResponseDto(company);
  }

  /**
   * GET /companies/{id} - Récupérer une entreprise par ID
   */
  async getCompanyById(id: string): Promise<CompanyResponseDto> {
    const company = await this.registryService.findById(id);
    if (!company) {
      throw new Error(`Company with ID ${id} not found`);
    }
    return this.mapToResponseDto(company);
  }

  /**
   * GET /companies - Lister les entreprises avec filtres
   */
  async getCompanies(query: CompanyListQueryDto): Promise<CompanyListResponseDto> {
    const result = await this.registryService.findAll({
      type: CustomerType.SME,
      page: query.page || 1,
      limit: query.limit || 10,
      search: query.search,
    });
    
    const { data, total } = result;

    return {
      data: data.map(company => this.mapToResponseDto(company)),
      meta: {
        pagination: {
          page: query.page || 1,
          limit: query.limit || 10,
          total: total,
          pages: Math.ceil(total / (query.limit || 10)),
        },
      },
    };
  }

  /**
   * PATCH /companies/{id} - Mettre à jour une entreprise
   */
  async updateCompany(id: string, updateCompanyDto: UpdateCompanyDto): Promise<CompanyResponseDto> {
    const existingCompany = await this.registryService.findById(id);
    if (!existingCompany) {
      throw new Error(`Company with ID ${id} not found`);
    }

    // Validation et nettoyage
    const cleanedData = this.cleanCompanyData(updateCompanyDto);
    
    // Mettre à jour
    const updatedCompany = await this.registryService.updateCustomer(id, cleanedData);

    // Déclencher l'événement de mise à jour
    await this.eventService.emitCustomerUpdated({
      customerId: id,
      customerType: CustomerType.SME,
      newData: updatedCompany,
    });

    return this.mapToResponseDto(updatedCompany);
  }

  /**
   * DELETE /companies/{id} - Supprimer une entreprise
   */
  async deleteCompany(id: string, deletedBy?: string): Promise<void> {
    const company = await this.registryService.findById(id);
    if (!company) {
      throw new Error(`Company with ID ${id} not found`);
    }

    // Supprimer du registre
    await this.registryService.deleteCustomer(id, deletedBy);

    // Déclencher l'événement de suppression
    await this.eventService.emitCustomerDeleted({
      customerId: id,
      customerType: CustomerType.SME,
      metadata: { deletedAt: new Date(), deletedBy },
    });
  }

  /**
   * POST /companies/{id}/locations - Ajouter une localisation
   */
  async addLocation(companyId: string, locationDto: CompanyLocationDto): Promise<CompanyLocationDto> {
    const company = await this.registryService.findById(companyId);
    if (!company) {
      throw new Error(`Company with ID ${companyId} not found`);
    }

    // TODO: Implement location storage logic
    const location = { ...locationDto, id: `loc-${Date.now()}` };
    
    await this.eventService.emitCustomerUpdated({
      customerId: companyId,
      customerType: CustomerType.SME,
      metadata: { action: 'LOCATION_ADDED', location },
    });

    return location;
  }

  /**
   * GET /companies/{id}/locations - Récupérer les localisations
   */
  async getLocations(companyId: string): Promise<CompanyLocationDto[]> {
    const company = await this.registryService.findById(companyId);
    if (!company) {
      throw new Error(`Company with ID ${companyId} not found`);
    }

    // TODO: Implement location retrieval logic
    return [];
  }

  /**
   * POST /companies/{id}/partners - Ajouter un partenaire
   */
  async addPartner(companyId: string, partnerDto: CompanyPartnerDto): Promise<CompanyPartnerDto> {
    const company = await this.registryService.findById(companyId);
    if (!company) {
      throw new Error(`Company with ID ${companyId} not found`);
    }

    // TODO: Implement partner storage logic
    const partner = { ...partnerDto, id: `partner-${Date.now()}` };
    
    await this.eventService.emitCustomerUpdated({
      customerId: companyId,
      customerType: CustomerType.SME,
      metadata: { action: 'PARTNER_ADDED', partner },
    });

    return partner;
  }

  /**
   * GET /companies/{id}/partners - Récupérer les partenaires
   */
  async getPartners(companyId: string): Promise<CompanyPartnerDto[]> {
    const company = await this.registryService.findById(companyId);
    if (!company) {
      throw new Error(`Company with ID ${companyId} not found`);
    }

    // TODO: Implement partner retrieval logic
    return [];
  }

  /**
   * Méthodes utilitaires privées
   */
  private cleanCompanyData(data: CreateCompanyDto | UpdateCompanyDto): any {
    // Nettoyage et validation des données
    const cleaned = { ...data };
    
    // Nettoyer les chaînes
    if (cleaned.name) {
      cleaned.name = cleaned.name.trim();
    }
    if (cleaned.email) {
      cleaned.email = cleaned.email.toLowerCase().trim();
    }
    if (cleaned.website) {
      cleaned.website = cleaned.website.trim();
    }

    // Valider le format email
    if (cleaned.email && !this.isValidEmail(cleaned.email)) {
      throw new Error('Invalid email format');
    }

    // Valider le numéro de téléphone
    if (cleaned.phone && !this.isValidPhoneNumber(cleaned.phone)) {
      throw new Error('Invalid phone number format');
    }

    return cleaned;
  }

  private mapToResponseDto(company: any): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      legalName: company.legalName,
      description: company.description,
      industry: company.industry,
      size: company.size,
      email: company.email,
      phone: company.phone,
      website: company.website,
      address: company.address,
      logoUrl: company.logoUrl,
      status: company.status,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phoneNumber);
  }

  // ==================== MÉTHODES ADDITIONNELLES POUR customer.service ====================

  /**
   * Trouver une entreprise par customerId
   */
  async findByCustomerId(customerId: string): Promise<CompanyResponseDto> {
    const company = await this.registryService.findById(customerId);
    return this.mapToResponseDto(company);
  }

  /**
   * Valider une entreprise
   */
  async validateCompany(companyId: string, validatedBy: string, reason?: string): Promise<void> {
    await this.lifecycleService.validateCustomer(companyId, validatedBy, reason ? { notes: reason } : undefined, 'CompanyService');
  }

  /**
   * Suspendre une entreprise
   */
  async suspendCompany(companyId: string, suspendedBy: string, reason: string): Promise<void> {
    await this.lifecycleService.suspendCustomer(companyId, suspendedBy, reason, 'CompanyService');
  }

  /**
   * Réactiver une entreprise
   */
  async reactivateCompany(companyId: string, reactivatedBy: string, reason?: string): Promise<void> {
    await this.lifecycleService.reactivateCustomer(companyId, reactivatedBy, 'CompanyService');
  }

  /**
   * Trouver une entreprise par ID (alias pour compatibilité)
   */
  async findById(id: string): Promise<CompanyResponseDto> {
    const company = await this.registryService.findById(id);
    return this.mapToResponseDto(company);
  }

  /**
   * Obtenir les actifs d'une entreprise (placeholder)
   */
  async getCompanyAssets(companyId: string): Promise<any[]> {
    // TODO: Implémenter la récupération des actifs
    return [];
  }
}