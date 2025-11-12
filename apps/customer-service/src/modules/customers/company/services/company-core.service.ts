import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../entities/company-core.entity';
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

/**
 * Service pour la gestion du profil principal des entreprises
 * Gère les contacts, propriétaires, associés, activités et capital
 */
@Injectable()
export class CompanyCoreService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
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

      // Création de l'entité entreprise
      const company = this.companyRepository.create({
        name: createCompanyDto.name,
        email: createCompanyDto.email,
        phone: createCompanyDto.phone,
        registrationNumber: createCompanyDto.registrationNumber,
        taxId: createCompanyDto.taxId,
        type: createCompanyDto.type,
        status: createCompanyDto.status,
        incorporationDate: createCompanyDto.incorporationDate,
        legalForm: createCompanyDto.legalForm,
        sector: createCompanyDto.sector,
        subSector: createCompanyDto.subSector,
        address: createCompanyDto.address,
        coordinates: createCompanyDto.coordinates,
        locations: createCompanyDto.locations,
        contacts: createCompanyDto.contacts,
        owner: createCompanyDto.owner,
        associates: createCompanyDto.associates,
        activities: createCompanyDto.activities,
        employeeCount: createCompanyDto.employeeCount,
        website: createCompanyDto.website,
        description: createCompanyDto.description,
        logoUrl: createCompanyDto.logoUrl,
        socialMediaLinks: createCompanyDto.socialMediaLinks,
        isVerified: false,
        isActive: true,
      });

      const savedCompany = await this.companyRepository.save(company);
      
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
          updateCompanyDto.company.name !== company.name) {
        await this.checkCompanyNameUniqueness(updateCompanyDto.company.name);
      }

      // Mise à jour des champs
      if (updateCompanyDto.company) {
        Object.assign(company, updateCompanyDto.company);
      }

      const updatedCompany = await this.companyRepository.save(company);
      
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

      company.contacts = contacts;
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

      company.owner = owner;
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
                 assoc.email === associate.email
      );

      if (existingAssociate) {
        throw new Error('Cet associé existe déjà');
      }

      // Ajouter le nouvel associé
      company.associates = [...(company.associates || []), associate];
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

      company.activities = activities;
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

      company.capital = capital;
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

      company.isActive = false;
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
        .where('company.name ILIKE :query', { query: `%${query}%` })
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
      where: { name }
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
    if (!createCompanyDto.email) {
      throw new Error('L\'email est requis');
    }
    if (!createCompanyDto.registrationNumber) {
      throw new Error('Le numéro d\'enregistrement est requis');
    }
  }

  /**
   * Mapper l'entité Company vers CompanyResponseDto
   */
  private mapToCompanyResponseDto(company: Company): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
      registrationNumber: company.registrationNumber,
      taxId: company.taxId,
      type: company.type,
      status: company.status,
      incorporationDate: company.incorporationDate,
      legalForm: company.legalForm,
      sector: company.sector,
      subSector: company.subSector,
      address: company.address,
      coordinates: company.coordinates,
      locations: company.locations,
      contacts: company.contacts,
      owner: company.owner,
      associates: company.associates,
      activities: company.activities,
      employeeCount: company.employeeCount,
      website: company.website,
      description: company.description,
      logoUrl: company.logoUrl,
      socialMediaLinks: company.socialMediaLinks,
      capital: company.capital,
      isVerified: company.isVerified,
      isActive: company.isActive,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    };
  }
}