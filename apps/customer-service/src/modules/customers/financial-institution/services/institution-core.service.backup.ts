import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialInstitution } from '../../entities';
import { 
  CreateFinancialInstitutionDto,
  UpdateFinancialInstitutionDto,
  FinancialInstitutionResponseDto,
  HeadquartersAddressDto,
  ContactsDto,
  CeoDto,
  ServicesDto,
  FinancialInfoDto,
  CreditRatingDto
} from '../dto/institution-core.dto';

/**
 * Service pour la gestion du profil principal des institutions financières
 * Gère les informations générales, contacts, direction, services de base
 */
@Injectable()
export class InstitutionCoreService {
  constructor(
    @InjectRepository(FinancialInstitution)
    private readonly institutionRepository: Repository<FinancialInstitution>,
  ) {}

  /**
   * Créer une nouvelle institution financière
   */
  async createInstitution(createInstitutionDto: CreateFinancialInstitutionDto): Promise<FinancialInstitutionResponseDto> {
    try {
      // Validation des données obligatoires
      this.validateRequiredFields(createInstitutionDto);

      // Vérification de l'unicité du nom et du numéro de licence
      await this.checkInstitutionUniqueness(createInstitutionDto.institutionName, createInstitutionDto.licenseNumber);

      // Création de l'entité institution
      const institution = this.institutionRepository.create({
        institutionName: createInstitutionDto.institutionName,
        legalName: createInstitutionDto.legalName,
        institutionType: createInstitutionDto.institutionType,
        category: createInstitutionDto.category,
        licenseNumber: createInstitutionDto.licenseNumber,
        registrationNumber: createInstitutionDto.registrationNumber,
        taxId: createInstitutionDto.taxId,
        customerType: createInstitutionDto.customerType,
        status: createInstitutionDto.status,
        regulatoryStatus: createInstitutionDto.regulatoryStatus,
        establishmentDate: createInstitutionDto.establishmentDate,
        headquarters: createInstitutionDto.headquarters,
        contacts: createInstitutionDto.contacts,
        ceo: createInstitutionDto.ceo,
        services: createInstitutionDto.services,
        financialInfo: createInstitutionDto.financialInfo,
        creditRating: createInstitutionDto.creditRating,
        numberOfBranches: createInstitutionDto.numberOfBranches,
        numberOfEmployees: createInstitutionDto.numberOfEmployees,
        website: createInstitutionDto.website,
        description: createInstitutionDto.description,
        logoUrl: createInstitutionDto.logoUrl,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedInstitution = await this.institutionRepository.save(institution);
      return this.mapToResponseDto(savedInstitution);
    } catch (error) {
      throw new Error(`Erreur lors de la création de l'institution: ${error.message}`);
    }
  }

  /**
   * Mettre à jour une institution financière
   */
  async updateInstitution(updateInstitutionDto: UpdateFinancialInstitutionDto): Promise<FinancialInstitutionResponseDto> {
    try {
      const institution = await this.findInstitutionById(updateInstitutionDto.institutionId);
      
      // Vérification de l'unicité si le nom ou la licence sont modifiés
      if (updateInstitutionDto.institution.institutionName && 
          updateInstitutionDto.institution.institutionName !== institution.institutionName) {
        await this.checkNameUniqueness(updateInstitutionDto.institution.institutionName);
      }

      if (updateInstitutionDto.institution.licenseNumber && 
          updateInstitutionDto.institution.licenseNumber !== institution.licenseNumber) {
        await this.checkLicenseUniqueness(updateInstitutionDto.institution.licenseNumber);
      }

      // Mise à jour des champs
      Object.assign(institution, {
        ...updateInstitutionDto.institution,
        updatedAt: new Date(),
      });

      const updatedInstitution = await this.institutionRepository.save(institution);
      return this.mapToResponseDto(updatedInstitution);
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour de l'institution: ${error.message}`);
    }
  }

  /**
   * Récupérer une institution par ID
   */
  async getInstitutionById(institutionId: string): Promise<FinancialInstitutionResponseDto> {
    try {
      const institution = await this.findInstitutionById(institutionId);
      return this.mapToResponseDto(institution);
    } catch (error) {
      throw new Error(`Erreur lors de la récupération de l'institution: ${error.message}`);
    }
  }

  /**
   * Récupérer les institutions par type
   */
  async getInstitutionsByType(institutionType: string): Promise<FinancialInstitutionResponseDto[]> {
    try {
      const institutions = await this.institutionRepository.find({
        where: { institutionType, isActive: true },
        order: { institutionName: 'ASC' },
      });

      return institutions.map(institution => this.mapToResponseDto(institution));
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des institutions par type: ${error.message}`);
    }
  }

  /**
   * Récupérer les institutions par statut réglementaire
   */
  async getInstitutionsByRegulatoryStatus(regulatoryStatus: string): Promise<FinancialInstitutionResponseDto[]> {
    try {
      const institutions = await this.institutionRepository.find({
        where: { regulatoryStatus, isActive: true },
        order: { institutionName: 'ASC' },
      });

      return institutions.map(institution => this.mapToResponseDto(institution));
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des institutions par statut: ${error.message}`);
    }
  }

  /**
   * Mettre à jour les informations du siège social
   */
  async updateHeadquarters(institutionId: string, headquarters: HeadquartersAddressDto): Promise<FinancialInstitutionResponseDto> {
    try {
      const institution = await this.findInstitutionById(institutionId);
      institution.headquarters = headquarters;
      institution.updatedAt = new Date();

      const updatedInstitution = await this.institutionRepository.save(institution);
      return this.mapToResponseDto(updatedInstitution);
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du siège social: ${error.message}`);
    }
  }

  /**
   * Mettre à jour les contacts
   */
  async updateContacts(institutionId: string, contacts: ContactsDto): Promise<FinancialInstitutionResponseDto> {
    try {
      const institution = await this.findInstitutionById(institutionId);
      institution.contacts = contacts;
      institution.updatedAt = new Date();

      const updatedInstitution = await this.institutionRepository.save(institution);
      return this.mapToResponseDto(updatedInstitution);
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour des contacts: ${error.message}`);
    }
  }

  /**
   * Mettre à jour les informations du CEO
   */
  async updateCeo(institutionId: string, ceo: CeoDto): Promise<FinancialInstitutionResponseDto> {
    try {
      const institution = await this.findInstitutionById(institutionId);
      institution.ceo = ceo;
      institution.updatedAt = new Date();

      const updatedInstitution = await this.institutionRepository.save(institution);
      return this.mapToResponseDto(updatedInstitution);
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du CEO: ${error.message}`);
    }
  }

  /**
   * Mettre à jour les services
   */
  async updateServices(institutionId: string, services: ServicesDto): Promise<FinancialInstitutionResponseDto> {
    try {
      const institution = await this.findInstitutionById(institutionId);
      institution.services = services;
      institution.updatedAt = new Date();

      const updatedInstitution = await this.institutionRepository.save(institution);
      return this.mapToResponseDto(updatedInstitution);
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour des services: ${error.message}`);
    }
  }

  /**
   * Mettre à jour les informations financières
   */
  async updateFinancialInfo(institutionId: string, financialInfo: FinancialInfoDto): Promise<FinancialInstitutionResponseDto> {
    try {
      const institution = await this.findInstitutionById(institutionId);
      institution.financialInfo = financialInfo;
      institution.updatedAt = new Date();

      const updatedInstitution = await this.institutionRepository.save(institution);
      return this.mapToResponseDto(updatedInstitution);
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour des informations financières: ${error.message}`);
    }
  }

  /**
   * Mettre à jour la notation de crédit
   */
  async updateCreditRating(institutionId: string, creditRating: CreditRatingDto): Promise<FinancialInstitutionResponseDto> {
    try {
      const institution = await this.findInstitutionById(institutionId);
      institution.creditRating = creditRating;
      institution.updatedAt = new Date();

      const updatedInstitution = await this.institutionRepository.save(institution);
      return this.mapToResponseDto(updatedInstitution);
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour de la notation: ${error.message}`);
    }
  }

  /**
   * Désactiver une institution
   */
  async deactivateInstitution(institutionId: string): Promise<FinancialInstitutionResponseDto> {
    try {
      const institution = await this.findInstitutionById(institutionId);
      institution.isActive = false;
      institution.updatedAt = new Date();

      const updatedInstitution = await this.institutionRepository.save(institution);
      return this.mapToResponseDto(updatedInstitution);
    } catch (error) {
      throw new Error(`Erreur lors de la désactivation de l'institution: ${error.message}`);
    }
  }

  /**
   * Rechercher des institutions par nom
   */
  async searchInstitutionsByName(searchTerm: string): Promise<FinancialInstitutionResponseDto[]> {
    try {
      const institutions = await this.institutionRepository
        .createQueryBuilder('institution')
        .where('institution.institutionName ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
        .orWhere('institution.legalName ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
        .andWhere('institution.isActive = :isActive', { isActive: true })
        .orderBy('institution.institutionName', 'ASC')
        .getMany();

      return institutions.map(institution => this.mapToResponseDto(institution));
    } catch (error) {
      throw new Error(`Erreur lors de la recherche d'institutions: ${error.message}`);
    }
  }

  /**
   * Récupérer les statistiques générales d'une institution
   */
  async getInstitutionStats(institutionId: string): Promise<{
    totalBranches: number;
    totalEmployees: number;
    establishmentYears: number;
    creditRatingScore?: number;
    totalAssets?: number;
    totalCapital?: number;
  }> {
    try {
      const institution = await this.findInstitutionById(institutionId);
      
      const establishmentDate = new Date(institution.establishmentDate);
      const establishmentYears = new Date().getFullYear() - establishmentDate.getFullYear();

      return {
        totalBranches: institution.numberOfBranches || 0,
        totalEmployees: institution.numberOfEmployees || 0,
        establishmentYears,
        creditRatingScore: institution.creditRating?.score,
        totalAssets: institution.financialInfo?.totalAssets,
        totalCapital: institution.financialInfo?.totalCapital,
      };
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`);
    }
  }

  // Méthodes utilitaires privées
  private async findInstitutionById(institutionId: string): Promise<FinancialInstitution> {
    const institution = await this.institutionRepository.findOne({
      where: { id: institutionId, isActive: true },
    });

    if (!institution) {
      throw new Error(`Institution avec l'ID ${institutionId} non trouvée`);
    }

    return institution;
  }

  private async checkInstitutionUniqueness(institutionName: string, licenseNumber: string): Promise<void> {
    await this.checkNameUniqueness(institutionName);
    await this.checkLicenseUniqueness(licenseNumber);
  }

  private async checkNameUniqueness(institutionName: string): Promise<void> {
    const existingInstitution = await this.institutionRepository.findOne({
      where: { institutionName, isActive: true },
    });

    if (existingInstitution) {
      throw new Error(`Une institution avec le nom "${institutionName}" existe déjà`);
    }
  }

  private async checkLicenseUniqueness(licenseNumber: string): Promise<void> {
    const existingInstitution = await this.institutionRepository.findOne({
      where: { licenseNumber, isActive: true },
    });

    if (existingInstitution) {
      throw new Error(`Une institution avec le numéro de licence "${licenseNumber}" existe déjà`);
    }
  }

  private validateRequiredFields(createInstitutionDto: CreateFinancialInstitutionDto): void {
    if (!createInstitutionDto.institutionName) {
      throw new Error('Le nom de l\'institution est obligatoire');
    }
    if (!createInstitutionDto.legalName) {
      throw new Error('La raison sociale est obligatoire');
    }
    if (!createInstitutionDto.institutionType) {
      throw new Error('Le type d\'institution est obligatoire');
    }
    if (!createInstitutionDto.licenseNumber) {
      throw new Error('Le numéro de licence est obligatoire');
    }
    if (!createInstitutionDto.customerType) {
      throw new Error('Le type de client est obligatoire');
    }
    if (!createInstitutionDto.headquarters) {
      throw new Error('L\'adresse du siège social est obligatoire');
    }
  }

  private mapToResponseDto(institution: FinancialInstitution): FinancialInstitutionResponseDto {
    return {
      id: institution.id,
      institutionName: institution.institutionName,
      legalName: institution.legalName,
      institutionType: institution.institutionType,
      category: institution.category,
      licenseNumber: institution.licenseNumber,
      registrationNumber: institution.registrationNumber,
      taxId: institution.taxId,
      customerType: institution.customerType,
      status: institution.status,
      regulatoryStatus: institution.regulatoryStatus,
      establishmentDate: institution.establishmentDate,
      headquarters: institution.headquarters,
      contacts: institution.contacts,
      ceo: institution.ceo,
      services: institution.services,
      financialInfo: institution.financialInfo,
      creditRating: institution.creditRating,
      numberOfBranches: institution.numberOfBranches,
      numberOfEmployees: institution.numberOfEmployees,
      website: institution.website,
      description: institution.description,
      logoUrl: institution.logoUrl,
      createdAt: institution.createdAt.toISOString(),
      updatedAt: institution.updatedAt.toISOString(),
    };
  }
}