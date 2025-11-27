import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyCoreEntity as Company } from '../entities/company-core.entity';
import { CustomerEventsProducer } from '../../../kafka/producers/customer-events.producer';
import { 
  CreateCompanyDto, 
  UpdateCompanyDto, 
  CompanyResponseDto,
  ContactsDto,
  OwnerDto,
  AssociateDto,
  ActivitiesDto,
  CapitalDto
} from '../dto/company-core.dto';
import { CustomerType, CustomerStatus, AddressDto } from '../../shared';

/**
 * Service pour la gestion du profil principal des entreprises
 * Gère les contacts, propriétaires, associés, activités et capital
 * 
 * NOTE: Version corrigée avec mapping Entity→DTO approprié
 * Entity: companyName, taxNumber, status (string), champs plats
 * DTO: name, taxId, status (CustomerStatus), objets imbriqués
 */
@Injectable()
export class CompanyCoreService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly customerEventsProducer: CustomerEventsProducer,
  ) {}

  /**
   * Créer un nouveau profil d'entreprise
   */
  async createCompany(createCompanyDto: CreateCompanyDto): Promise<CompanyResponseDto> {
    try {
      // Validation des données obligatoires
      this.validateRequiredFields(createCompanyDto);

      // Vérification de l'unicité du nom d'entreprise
      await this.checkCompanyNameUniqueness(createCompanyDto.name);

      // Création de l'entité entreprise en mappant les DTOs vers les champs de l'entité
      const company = this.companyRepository.create({
        // Informations de base
        companyName: createCompanyDto.name,
        tradeName: createCompanyDto.name,
        description: createCompanyDto.description,
        
        // Adresse (mapping du DTO vers les champs plats)
        address: createCompanyDto.address?.street || '',
        city: createCompanyDto.address?.city || '',
        province: createCompanyDto.address?.province || '',
        postalCode: createCompanyDto.address?.postalCode,
        country: createCompanyDto.address?.country || 'RDC',
        
        // Contacts (extraction depuis ContactsDto)
        phone: createCompanyDto.contacts?.phone,
        email: createCompanyDto.contacts?.email,
        website: undefined, // ContactsDto doesn't have website field
        
        // Capital
        authorizedCapital: createCompanyDto.capital?.amount || 0,
        paidUpCapital: createCompanyDto.capital?.paidUp || createCompanyDto.capital?.amount || 0,
        capitalCurrency: createCompanyDto.capital?.currency || 'CDF',
        
        // Activités
        sector: createCompanyDto.activities?.primaryActivity || createCompanyDto.activities?.sector || 'Non spécifié',
        
        // Propriétaires et associés (stockés en JSON)
        owners: createCompanyDto.owner ? [{
          id: createCompanyDto.owner.id,
          name: createCompanyDto.owner.name,
          type: 'individual',
          shares: 0,
          percentage: createCompanyDto.owner.shareholding || 100,
          joinDate: new Date().toISOString(),
          contact: {
            phone: createCompanyDto.owner.phone,
            email: createCompanyDto.owner.email,
            address: createCompanyDto.owner.address
          },
          isActive: true
        }] : undefined,
        
        associates: createCompanyDto.associates?.map(assoc => ({
          id: assoc.id,
          name: assoc.name,
          type: (assoc.type === 'founder' || assoc.type === 'partner' ? 'individual' : 'company') as 'individual' | 'company',
          role: assoc.position,
          joinDate: assoc.joinDate || new Date().toISOString(),
          contact: {
            phone: assoc.phone,
            email: assoc.email,
            address: assoc.address
          },
          isActive: true
        })),
        
        // Champs obligatoires avec valeurs par défaut
        registrationNumber: 'PENDING-' + Date.now(),
        legalForm: 'SARL',
        incorporationDate: new Date(),
        status: 'pending'
      });

      const savedCompany = await this.companyRepository.save(company);
      
      // Partager le profil avec admin-service via Kafka
      await this.shareCompanyProfileWithAdminService(savedCompany);
      
      return this.mapToCompanyResponseDto(savedCompany);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la création de l'entreprise: ${errorMessage}`);
    }
  }

  /**
   * Mettre à jour un profil d'entreprise
   */
  async updateCompany(id: string, updateCompanyDto: UpdateCompanyDto): Promise<CompanyResponseDto> {
    try {
      const company = await this.companyRepository.findOne({ where: { id } });
      
      if (!company) {
        throw new Error('Entreprise non trouvée');
      }

      // Vérification de l'unicité du nom si modifié
      if (updateCompanyDto.company?.name &&
          updateCompanyDto.company.name !== company.companyName) {
        await this.checkCompanyNameUniqueness(updateCompanyDto.company.name);
      }

      // Mise à jour des champs
      if (updateCompanyDto.company) {
        Object.assign(company, updateCompanyDto.company);
      }

      const updatedCompany = await this.companyRepository.save(company);
      
      // Partager le profil mis à jour avec admin-service via Kafka
      await this.shareCompanyProfileWithAdminService(updatedCompany);
      
      return this.mapToCompanyResponseDto(updatedCompany);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la mise à jour de l'entreprise: ${errorMessage}`);
    }
  }

  /**
   * Récupérer une entreprise par ID
   */
  async getCompanyById(id: string): Promise<CompanyResponseDto> {
    try {
      const company = await this.companyRepository.findOne({ where: { id } });
      
      if (!company) {
        throw new Error('Entreprise non trouvée');
      }

      return this.mapToCompanyResponseDto(company);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération de l'entreprise: ${errorMessage}`);
    }
  }

  /**
   * Récupérer les entreprises par secteur
   */
  async getCompaniesBySector(sector: string, page = 1, limit = 10): Promise<{ companies: CompanyResponseDto[], total: number }> {
    try {
      const [companies, total] = await this.companyRepository.findAndCount({
        where: { sector },
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' }
      });

      return {
        companies: companies.map(company => this.mapToCompanyResponseDto(company)),
        total
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des entreprises par secteur: ${errorMessage}`);
    }
  }

  /**
   * Mettre à jour les contacts d'une entreprise
   */
  async updateContacts(id: string, contacts: ContactsDto): Promise<CompanyResponseDto> {
    try {
      const company = await this.companyRepository.findOne({ where: { id } });
      
      if (!company) {
        throw new Error('Entreprise non trouvée');
      }

      // Map ContactsDto to contacts array format
      company.contacts = [{
        id: crypto.randomUUID(),
        name: 'Contact principal',
        position: 'Contact',
        phone: contacts.phone,
        email: contacts.email,
        isPrimary: true,
        isActive: true
      }];
      const updatedCompany = await this.companyRepository.save(company);
      
      return this.mapToCompanyResponseDto(updatedCompany);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la mise à jour des contacts: ${errorMessage}`);
    }
  }

  /**
   * Mettre à jour le propriétaire d'une entreprise
   */
  async updateOwner(id: string, owner: OwnerDto): Promise<CompanyResponseDto> {
    try {
      const company = await this.companyRepository.findOne({ where: { id } });
      
      if (!company) {
        throw new Error('Entreprise non trouvée');
      }

      // Map OwnerDto to owners array format
      company.owners = [{
        id: owner.id || crypto.randomUUID(),
        name: owner.name,
        type: 'individual',
        shares: owner.shareholding || 0,
        percentage: owner.shareholding || 0,
        joinDate: new Date().toISOString(),
        contact: {
          phone: owner.phone,
          email: owner.email
        },
        isActive: true
      }];
      const updatedCompany = await this.companyRepository.save(company);
      
      return this.mapToCompanyResponseDto(updatedCompany);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la mise à jour du propriétaire: ${errorMessage}`);
    }
  }

  /**
   * Ajouter un associé à une entreprise
   */
  async addAssociate(id: string, associate: AssociateDto): Promise<CompanyResponseDto> {
    try {
      const company = await this.companyRepository.findOne({ where: { id } });
      
      if (!company) {
        throw new Error('Entreprise non trouvée');
      }

      // Vérifier si l'associé existe déjà
      const existingAssociate = company.associates?.find(
        assoc => assoc.name === associate.name &&
                 assoc.contact?.email === associate.email
      );

      if (existingAssociate) {
        throw new Error('Cet associé existe déjà');
      }

      // Map AssociateDto to associates array format
      const mappedAssociate = {
        id: associate.id || crypto.randomUUID(),
        name: associate.name,
        type: (associate.type === 'founder' || associate.type === 'investor' || associate.type === 'partner') ? 'individual' as const : 'company' as const,
        role: associate.position || 'partner',
        joinDate: new Date().toISOString(),
        contact: {
          phone: associate.phone,
          email: associate.email
        },
        isActive: true
      };
      
      company.associates = [...(company.associates || []), mappedAssociate];
      const updatedCompany = await this.companyRepository.save(company);
      
      return this.mapToCompanyResponseDto(updatedCompany);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de l'ajout de l'associé: ${errorMessage}`);
    }
  }

  /**
   * Supprimer un associé d'une entreprise
   */
  async removeAssociate(id: string, associateIndex: number): Promise<CompanyResponseDto> {
    try {
      const company = await this.companyRepository.findOne({ where: { id } });
      
      if (!company) {
        throw new Error('Entreprise non trouvée');
      }

      if (!company.associates || associateIndex >= company.associates.length) {
        throw new Error('Associé non trouvé');
      }

      // Supprimer l'associé
      company.associates = company.associates.filter((_, index) => index !== associateIndex);
      const updatedCompany = await this.companyRepository.save(company);
      
      return this.mapToCompanyResponseDto(updatedCompany);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la suppression de l'associé: ${errorMessage}`);
    }
  }

  /**
   * Mettre à jour les activités d'une entreprise
   */
  async updateActivities(id: string, activities: ActivitiesDto): Promise<CompanyResponseDto> {
    try {
      const company = await this.companyRepository.findOne({ where: { id } });
      
      if (!company) {
        throw new Error('Entreprise non trouvée');
      }

      // Map ActivitiesDto to activities array format
      company.activities = [{
        id: crypto.randomUUID(),
        name: activities.primaryActivity,
        description: activities.primaryActivity,
        sector: activities.sector || 'other',
        isMain: true,
        startDate: new Date().toISOString(),
        isActive: true
      }];
      const updatedCompany = await this.companyRepository.save(company);
      
      return this.mapToCompanyResponseDto(updatedCompany);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la mise à jour des activités: ${errorMessage}`);
    }
  }

  /**
   * Mettre à jour le capital d'une entreprise
   */
  async updateCapital(id: string, capital: CapitalDto): Promise<CompanyResponseDto> {
    try {
      const company = await this.companyRepository.findOne({ where: { id } });
      
      if (!company) {
        throw new Error('Entreprise non trouvée');
      }

      // Map CapitalDto to entity flat structure
      company.authorizedCapital = capital.amount;
      company.paidUpCapital = capital.paidUp || capital.amount;
      company.capitalCurrency = capital.currency || 'CDF';
      const updatedCompany = await this.companyRepository.save(company);
      
      return this.mapToCompanyResponseDto(updatedCompany);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la mise à jour du capital: ${errorMessage}`);
    }
  }

  /**
   * Désactiver une entreprise
   */
  async deactivateCompany(id: string): Promise<CompanyResponseDto> {
    try {
      const company = await this.companyRepository.findOne({ where: { id } });
      
      if (!company) {
        throw new Error('Entreprise non trouvée');
      }

      // Note: isActive is a computed property, set status instead
      company.status = 'inactive';
      const updatedCompany = await this.companyRepository.save(company);
      
      return this.mapToCompanyResponseDto(updatedCompany);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la désactivation de l'entreprise: ${errorMessage}`);
    }
  }

  /**
   * Rechercher des entreprises
   */
  async searchCompanies(query: string, page = 1, limit = 10): Promise<{ companies: CompanyResponseDto[], total: number }> {
    try {
      const [companies, total] = await this.companyRepository
        .createQueryBuilder('company')
        .where('company.companyName ILIKE :query', { query: `%${query}%` })
        .orWhere('company.registrationNumber ILIKE :query', { query: `%${query}%` })
        .orWhere('company.sector ILIKE :query', { query: `%${query}%` })
        .skip((page - 1) * limit)
        .take(limit)
        .orderBy('company.createdAt', 'DESC')
        .getManyAndCount();

      return {
        companies: companies.map(company => this.mapToCompanyResponseDto(company)),
        total
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la recherche d'entreprises: ${errorMessage}`);
    }
  }

  // Méthodes privées

  /**
   * Vérifier l'unicité du nom d'entreprise
   */
  private async checkCompanyNameUniqueness(name: string): Promise<void> {
    const existingCompany = await this.companyRepository.findOne({
      where: { companyName: name }
    });

    if (existingCompany) {
      throw new Error(`Une entreprise avec le nom "${name}" existe déjà`);
    }
  }

  /**
   * Valider les champs obligatoires
   */
  private validateRequiredFields(createCompanyDto: CreateCompanyDto): void {
    if (!createCompanyDto.name) {
      throw new Error('Le nom commercial est requis');
    }
    if (!createCompanyDto.contacts?.email) {
      throw new Error('L\'email est requis');
    }
  }

  /**
   * Mapper l'entité Company vers CompanyResponseDto
   * NOTE: Mapping corrigé Entity→DTO
   * - companyName → name
   * - taxNumber → taxId  
   * - status (string) → status (CustomerStatus with cast)
   * - Champs plats → Objets DTO (address, contacts, etc.)
   */
  private mapToCompanyResponseDto(company: Company): CompanyResponseDto {
    // Map address fields to AddressDto object
    const addressDto: AddressDto = {
      street: company.address || '',
      city: company.city || '',
      province: company.province || '',
      postalCode: company.postalCode,
      country: company.country || 'RDC'
    };

    // Map contacts fields to ContactsDto object
    const contactsDto: ContactsDto = {
      phone: company.phone,
      email: company.email
    };

    // Map owner from JSON array to single OwnerDto
    const ownerDto: OwnerDto | undefined = company.owners?.[0] ? {
      id: company.owners[0].id,
      name: company.owners[0].name,
      email: company.owners[0].contact?.email || '',
      phone: company.owners[0].contact?.phone || '',
      isMainOwner: true,
      shareholding: company.owners[0].percentage
    } : undefined;

    // Map associates from JSON array to AssociateDto array
    const associatesDto = company.associates?.map(assoc => ({
      id: assoc.id,
      name: assoc.name,
      email: assoc.contact?.email || '',
      phone: assoc.contact?.phone || '',
      position: assoc.role,
      shareholding: 0,
      type: 'partner' as const,
      joinDate: assoc.joinDate
    }));

    // Map activities from JSON array to ActivitiesExtendedDto
    const activitiesDto = {
      primaryActivity: company.activities?.[0]?.name || company.sector,
      secondaryActivities: company.activities?.slice(1).map(a => a.name) || [],
      sector: company.sector
    };

    // Map capital fields to CapitalDto
    const capitalDto = {
      amount: company.authorizedCapital || 0,
      paidUp: company.paidUpCapital || 0,
      currency: company.capitalCurrency || 'CDF'
    };

    return {
      id: company.id,
      name: company.companyName,
      description: company.description,
      type: 'COMPANY' as CustomerType, // Entity doesn't have type field
      status: (company.status || 'PENDING') as CustomerStatus,
      contacts: contactsDto,
      address: addressDto,
      owner: ownerDto!,
      associates: associatesDto,
      activities: activitiesDto as any,
      capital: capitalDto as any,
      locations: company.locations,
      logo: company.logoUrl,
      documents: [],
      metadata: company.metadata,
      subscription: company.subscription,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }

  /**
   * Partager le profil company avec admin-service via Kafka
   */
  private async shareCompanyProfileWithAdminService(company: Company): Promise<void> {
    try {
      // Récupérer le customer associé si disponible
      const customer = company.customer;
      
      if (!customer) {
        console.warn(`Company ${company.id} n'a pas de customer associé, skip Kafka share`);
        return;
      }

      // Construire les données du profil company structuré
      const companyProfile = {
        registrationNumber: company.registrationNumber,
        tradeName: company.tradeName,
        incorporationDate: company.incorporationDate?.toISOString(),
        legalForm: company.legalForm,
        industry: company.sector,
        size: this.calculateCompanySize(company.employeeCount),
        sector: company.sector,
        rccm: company.registrationNumber,
        taxId: company.taxNumber,
        address: {
          street: company.address,
          city: company.city,
          province: company.province,
          country: company.country,
          postalCode: company.postalCode,
        },
        activities: {
          primary: company.sector,
          secondary: [],
          details: company.activities || [],
        },
        capital: {
          isApplicable: true,
          authorized: company.authorizedCapital || 0,
          paidUp: company.paidUpCapital || 0,
          currency: company.capitalCurrency || 'CDF',
          shares: {
            total: 0,
            value: 0,
          },
        },
        financials: {
          annualRevenue: 0,
          revenueCurrency: company.capitalCurrency || 'CDF',
          lastFinancialYear: new Date().getFullYear().toString(),
          employeeCount: company.employeeCount || 0,
        },
        owner: company.owners?.[0] ? {
          id: company.owners[0].id,
          name: company.owners[0].name,
          email: company.owners[0].contact?.email,
          phone: company.owners[0].contact?.phone,
        } : undefined,
        associates: company.associates || [],
        locations: company.locations || [],
        contactPersons: company.contacts || [],
        socialMedia: {
          facebook: company.facebookPage,
        },
        yearFounded: company.incorporationDate?.getFullYear(),
        employeeCount: company.employeeCount || 0,
        lastVerifiedAt: new Date().toISOString(),
      };

      // Émettre l'événement Kafka
      await this.customerEventsProducer.emitCompanyProfileShare({
        customer: customer,
        smeData: company,
        extendedIdentification: undefined, // À compléter si disponible
        assets: [], // À compléter avec assets si disponible
        stocks: [], // À compléter avec stocks si disponible
        financialData: {
          totalAssetsValue: 0,
          lastValuationDate: new Date().toISOString(),
        },
      });

      console.log(`✓ Profil company ${company.id} partagé avec admin-service via Kafka`);
    } catch (error) {
      console.error(`Erreur lors du partage du profil company ${company.id}:`, error);
      // Ne pas bloquer l'opération principale si Kafka échoue
    }
  }

  /**
   * Calculer la taille de l'entreprise basée sur le nombre d'employés
   */
  private calculateCompanySize(employeeCount?: number): string {
    if (!employeeCount) return 'SMALL';
    if (employeeCount < 10) return 'MICRO';
    if (employeeCount < 50) return 'SMALL';
    if (employeeCount < 250) return 'MEDIUM';
    return 'LARGE';
  }
}
