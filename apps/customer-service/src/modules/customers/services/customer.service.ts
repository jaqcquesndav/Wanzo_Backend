import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Customer, CustomerType, CustomerStatus } from '../entities/customer.entity';

// Services shared
import { 
  CustomerRegistryService,
  CustomerLifecycleService,
  CustomerOwnershipService,
  CustomerEventsService,
} from '../shared';

// Services spécialisés
import { CompanyService } from '../company/services/company.service';
import { InstitutionService } from '../financial-institution/services/institution.service';

/**
 * Service orchestrateur principal pour la gestion des clients
 * Délègue aux sous-modules Company et Financial Institution selon le type
 * Utilise les services shared pour les opérations communes
 */
@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);

  constructor(
    // Services shared pour opérations communes
    private readonly customerRegistryService: CustomerRegistryService,
    private readonly customerLifecycleService: CustomerLifecycleService,
    private readonly customerOwnershipService: CustomerOwnershipService,
    private readonly customerEventsService: CustomerEventsService,

    // Services spécialisés par type de client
    private readonly companyService: CompanyService,
    private readonly institutionService: InstitutionService,
  ) {}

  // ==================== OPÉRATIONS CRUD GÉNÉRIQUES (Délégation aux services shared) ====================

  /**
   * Recherche de tous les clients avec pagination et filtres
   */
  async findAll(options: {
    page?: number;
    limit?: number;
    search?: string;
    type?: CustomerType;
    status?: CustomerStatus;
  } = {}) {
    this.logger.log(`Finding all customers with options: ${JSON.stringify(options)}`);
    
    // Délégation au service shared pour la recherche générale
    return this.customerRegistryService.findAll(options);
  }

  /**
   * Recherche d'un client par ID avec délégation selon le type
   */
  async findById(id: string, includeRelations: string[] = []): Promise<Customer> {
    this.logger.log(`Finding customer by ID: ${id}`);
    
    // Utiliser le service shared pour la recherche de base
    const customer = await this.customerRegistryService.findById(id, includeRelations);
    
    return customer;
  }

  /**
   * Création de client avec délégation selon le type
   */
  async create(createCustomerDto: {
    name: string;
    email: string;
    type: CustomerType;
    phone?: string;
    address?: string;
    [key: string]: any;
  }): Promise<Customer> {
    this.logger.log(`Creating customer: ${createCustomerDto.name} (${createCustomerDto.type})`);
    
    // Délégation selon le type de client
    switch (createCustomerDto.type) {
      case CustomerType.SME:
        // Transformer le DTO générique en DTO Company
        const companyDto = this.transformToCompanyDto(createCustomerDto);
        const company = await this.companyService.createCompany(companyDto);
        if (!(company as any).customer) {
          throw new Error('Company creation failed: no customer associated');
        }
        return (company as any).customer;
        
      case CustomerType.FINANCIAL:
        // Transformer le DTO générique en DTO Institution
        const institutionDto = this.transformToInstitutionDto(createCustomerDto);
        const institution = await this.institutionService.createInstitution(institutionDto);
        if (!(institution as any).customer) {
          throw new Error('Institution creation failed: no customer associated');
        }
        return (institution as any).customer;
        
      default:
        // Fallback vers le service shared pour types non spécifiques
        const customerDto = this.transformToCustomerDto(createCustomerDto);
        return this.customerRegistryService.createCustomer(customerDto);
    }
  }

  /**
   * Mise à jour de client avec délégation selon le type
   */
  async update(id: string, updateCustomerDto: any): Promise<Customer> {
    this.logger.log(`Updating customer: ${id}`);
    
    // D'abord identifier le type de client
    const customer = await this.findById(id);
    
    // Délégation selon le type de client
    switch (customer.type) {
      case CustomerType.SME:
        const company = await this.companyService.findByCustomerId(id);
        await this.companyService.updateCompany(company.id, updateCustomerDto);
        return this.findById(id);
        
      case CustomerType.FINANCIAL:
        const institution = await this.institutionService.findByCustomerId(id);
        await this.institutionService.updateInstitution(institution.id, updateCustomerDto);
        return this.findById(id);
        
      default:
        // Fallback vers le service shared
        return this.customerRegistryService.updateCustomer(id, updateCustomerDto);
    }
  }

  /**
   * Suppression de client avec délégation selon le type
   */
  async remove(id: string, deletedBy?: string): Promise<void> {
    this.logger.log(`Removing customer: ${id}`);
    
    // Identifier le type de client
    const customer = await this.findById(id);
    
    // Délégation selon le type de client
    switch (customer.type) {
      case CustomerType.SME:
        const company = await this.companyService.findByCustomerId(id);
        await this.companyService.deleteCompany(company.id, deletedBy);
        break;
        
      case CustomerType.FINANCIAL:
        const institution = await this.institutionService.findByCustomerId(id);
        await this.institutionService.deleteInstitution(institution.id, deletedBy);
        break;
        
      default:
        // Fallback vers le service shared
        await this.customerRegistryService.deleteCustomer(id, deletedBy);
        break;
    }
  }

  // ==================== OPÉRATIONS LIFECYCLE (Délégation aux services spécialisés et shared) ====================

  /**
   * Validation de client avec délégation selon le type
   */
  async validate(id: string, validatedBy = 'system', reason?: string): Promise<Customer> {
    this.logger.log(`Validating customer: ${id}`);
    
    // Identifier le type de client
    const customer = await this.findById(id);
    
    // Délégation selon le type de client
    switch (customer.type) {
      case CustomerType.SME:
        const company = await this.companyService.findByCustomerId(id);
        await this.companyService.validateCompany(company.id, validatedBy, reason);
        break;
        
      case CustomerType.FINANCIAL:
        const institution = await this.institutionService.findByCustomerId(id);
        await this.institutionService.validateInstitution(institution.id, validatedBy, reason);
        break;
        
      default:
        // Fallback vers le service shared
        await this.customerLifecycleService.validateCustomer(
          id, 
          validatedBy,
          reason ? { notes: reason } : undefined,
          'CustomerService'
        );
        break;
    }
    
    // Retourner les données mises à jour
    return this.findById(id);
  }

  /**
   * Suspension de client avec délégation selon le type
   */
  async suspend(id: string, reason: string, suspendedBy = 'system'): Promise<Customer> {
    this.logger.log(`Suspending customer: ${id}`);
    
    // Identifier le type de client
    const customer = await this.findById(id);
    
    // Délégation selon le type de client
    switch (customer.type) {
      case CustomerType.SME:
        const company = await this.companyService.findByCustomerId(id);
        await this.companyService.suspendCompany(company.id, suspendedBy, reason);
        break;
        
      case CustomerType.FINANCIAL:
        const institution = await this.institutionService.findByCustomerId(id);
        await this.institutionService.suspendInstitution(institution.id, suspendedBy, reason);
        break;
        
      default:
        // Fallback vers le service shared
        await this.customerLifecycleService.suspendCustomer(
          id,
          suspendedBy,
          reason,
          'CustomerService'
        );
        break;
    }
    
    // Retourner les données mises à jour
    return this.findById(id);
  }

  /**
   * Réactivation de client avec délégation selon le type
   */
  async reactivate(id: string, reactivatedBy = 'system', reason?: string): Promise<Customer> {
    this.logger.log(`Reactivating customer: ${id}`);
    
    // Identifier le type de client
    const customer = await this.findById(id);
    
    // Délégation selon le type de client
    switch (customer.type) {
      case CustomerType.SME:
        const company = await this.companyService.findByCustomerId(id);
        await this.companyService.reactivateCompany(company.id, reactivatedBy, reason);
        break;
        
      case CustomerType.FINANCIAL:
        const institution = await this.institutionService.findByCustomerId(id);
        await this.institutionService.reactivateInstitution(institution.id, reactivatedBy, reason);
        break;
        
      default:
        // Fallback vers le service shared
        await this.customerLifecycleService.reactivateCustomer(
          id,
          reactivatedBy,
          'CustomerService',
          reason
        );
        break;
    }
    
    // Retourner les données mises à jour
    return this.findById(id);
  }

  // ==================== OPÉRATIONS SPÉCIALISÉES PAR TYPE ====================

  /**
   * Méthodes spécifiques aux entreprises (délégation au CompanyService)
   */
  async getCompanyById(id: string): Promise<any> {
    this.logger.log(`Getting company by ID: ${id}`);
    return this.companyService.findById(id);
  }

  async getCompanyAssets(customerId: string): Promise<any[]> {
    const company = await this.companyService.findByCustomerId(customerId);
    return this.companyService.getCompanyAssets(company.id);
  }

  /**
   * Méthodes spécifiques aux institutions financières (délégation au InstitutionService)
   */
  async getInstitutionById(id: string): Promise<any> {
    this.logger.log(`Getting institution by ID: ${id}`);
    return this.institutionService.findById(id);
  }

  async getInstitutionBranches(customerId: string): Promise<any[]> {
    const institution = await this.institutionService.findByCustomerId(customerId);
    return this.institutionService.getInstitutionBranches(institution.id);
  }

  // ==================== VALIDATION D'ACCÈS (Délégation aux services shared) ====================

  /**
   * Validation d'accès utilisateur
   */
  async validateUserAccess(customerId: string, userId: string): Promise<void> {
    this.logger.log(`Validating user access: customer=${customerId}, user=${userId}`);
    
    await this.customerOwnershipService.enforceUserAccess(customerId, userId, {
      resourceType: 'customer',
    });
  }

  /**
   * Validation d'accès administrateur
   */
  async validateAdminAccess(customerId: string, userId: string): Promise<void> {
    this.logger.log(`Validating admin access: customer=${customerId}, user=${userId}`);
    
    await this.customerOwnershipService.enforceAdminAccess(customerId, userId, {
      resourceType: 'customer',
    });
  }

  // ==================== MÉTHODES UTILITAIRES ET STATISTIQUES ====================

  /**
   * Statistiques globales des clients
   */
  async getCustomerStats(): Promise<{
    total: number;
    byType: Record<CustomerType, number>;
    byStatus: Record<CustomerStatus, number>;
  }> {
    this.logger.log('Getting customer statistics');
    
    const [byType, byStatus] = await Promise.all([
      this.customerRegistryService.countByType(),
      this.customerRegistryService.countByStatus(),
    ]);

    const total = Object.values(byType).reduce((sum, count) => sum + count, 0);

    return {
      total,
      byType,
      byStatus,
    };
  }

  /**
   * Recherche globale avec critères avancés
   */
  async searchCustomers(criteria: {
    query?: string;
    types?: CustomerType[];
    statuses?: CustomerStatus[];
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<Customer[]> {
    this.logger.log(`Searching customers with criteria: ${JSON.stringify(criteria)}`);
    
    return this.customerRegistryService.search(criteria);
  }

  /**
   * Méthodes de compatibilité (anciennes signatures)
   */
  
  /**
   * @deprecated Utiliser update() à la place
   */
  async updateById(id: string, updateFields: Record<string, any>): Promise<Customer> {
    this.logger.warn(`Deprecated method updateById called. Use update() instead.`);
    return this.update(id, updateFields);
  }

  /**
   * @deprecated Utiliser validate() à la place
   */
  async validateCustomer(
    customerId: string, 
    adminId: string,
    details?: Record<string, any>,
    requestingService?: string,
  ): Promise<Customer> {
    this.logger.warn(`Deprecated method validateCustomer called. Use validate() instead.`);
    return this.validate(customerId, adminId, details?.notes);
  }

  /**
   * @deprecated Utiliser suspend() à la place
   */
  async suspendCustomer(
    customerId: string, 
    adminId: string,
    reason: string,
    requestingService?: string,
  ): Promise<Customer> {
    this.logger.warn(`Deprecated method suspendCustomer called. Use suspend() instead.`);
    return this.suspend(customerId, reason, adminId);
  }

  /**
   * @deprecated Utiliser reactivate() à la place
   */
  async reactivateCustomer(
    customerId: string, 
    adminId: string,
    requestingService?: string,
  ): Promise<Customer> {
    this.logger.warn(`Deprecated method reactivateCustomer called. Use reactivate() instead.`);
    return this.reactivate(customerId, adminId);
  }

  // ==================== MÉTHODES DE TRANSFORMATION ====================

  /**
   * Transformer un DTO générique en DTO Company
   */
  private transformToCompanyDto(genericDto: any): any {
    return {
      companyName: genericDto.name,
      email: genericDto.email,
      phone: genericDto.phone,
      headOfficeAddress: genericDto.address,
      description: genericDto.description,
      registrationNumber: genericDto.registrationNumber,
      taxId: genericDto.taxId,
      websiteUrl: genericDto.website,
      establishmentDate: genericDto.establishmentDate,
      numberOfEmployees: genericDto.numberOfEmployees,
      annualRevenue: genericDto.annualRevenue,
      ...genericDto, // Spread pour les propriétés supplémentaires
    };
  }

  /**
   * Transformer un DTO générique en DTO Institution
   */
  private transformToInstitutionDto(genericDto: any): any {
    return {
      name: genericDto.name,
      type: genericDto.institutionType || 'OTHER',
      category: genericDto.institutionCategory || genericDto.institutionType || 'OTHER',
      description: genericDto.description,
      licenseNumber: genericDto.licenseNumber,
      establishedDate: genericDto.establishmentDate,
      contacts: {
        general: {
          email: genericDto.email || '',
          phone: genericDto.phone || '',
        }
      },
      address: genericDto.address ? {
        street: typeof genericDto.address === 'string' ? genericDto.address : genericDto.address.street,
        city: genericDto.city,
        province: genericDto.province,
        country: genericDto.country || 'DRC'
      } : undefined,
      leadership: genericDto.ceoName ? {
        name: genericDto.ceoName,
        gender: genericDto.ceoGender || 'other',
        email: genericDto.ceoEmail,
      } : undefined,
      ...genericDto, // Spread pour les propriétés supplémentaires
    };
  }

  /**
   * Transformer un DTO générique en DTO Customer pour le service shared
   */
  private transformToCustomerDto(genericDto: any): Partial<Customer> {
    return {
      name: genericDto.name,
      email: genericDto.email,
      phone: genericDto.phone,
      type: genericDto.type,
      address: typeof genericDto.address === 'string' ? {
        street: genericDto.address,
      } : genericDto.address,
      status: CustomerStatus.PENDING,
    };
  }
}
