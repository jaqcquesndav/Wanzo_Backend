import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// Import des entités depuis le nouveau fichier
import { InstitutionCoreEntity, InstitutionType as EntityInstitutionType } from '../entities/institution-core.entity';
import {
  CreateFinancialInstitutionDto,
  UpdateFinancialInstitutionDto,
  FinancialInstitutionResponseDto,
  FinancialInstitutionType as DtoInstitutionType,
} from '../dto/institution-core.dto';
import * as crypto from 'crypto';

/**
 * Service pour la gestion des institutions financières
 * Gère les informations de base, profils et opérations CRUD
 */
@Injectable()
export class InstitutionCoreService {
  constructor(
    @InjectRepository(InstitutionCoreEntity)
    private readonly institutionRepository: Repository<InstitutionCoreEntity>,
  ) {}

  /**
   * Mapper les types d'institutions du DTO français vers l'entity anglaise
   */
  private mapInstitutionType(dtoType: DtoInstitutionType): EntityInstitutionType {
    const typeMapping: Record<DtoInstitutionType, EntityInstitutionType> = {
      [DtoInstitutionType.BANQUE]: EntityInstitutionType.BANQUE,
      [DtoInstitutionType.MICROFINANCE]: EntityInstitutionType.MICROFINANCE,
      [DtoInstitutionType.COOPEC]: EntityInstitutionType.COOPEC,
      [DtoInstitutionType.FOND_GARANTIE]: EntityInstitutionType.FOND_GARANTIE,
      [DtoInstitutionType.ENTREPRISE_FINANCIERE]: EntityInstitutionType.ENTREPRISE_FINANCIERE,
      [DtoInstitutionType.FOND_CAPITAL_INVESTISSEMENT]: EntityInstitutionType.FOND_CAPITAL_INVESTISSEMENT,
      [DtoInstitutionType.FOND_IMPACT]: EntityInstitutionType.FOND_IMPACT,
      [DtoInstitutionType.AUTRE]: EntityInstitutionType.AUTRE,
    };
    return typeMapping[dtoType] || EntityInstitutionType.AUTRE;
  }

  /**
   * Mapper les types d'institutions de l'entity anglaise vers le DTO français
   */
  private mapEntityToDtoType(entityType: EntityInstitutionType): DtoInstitutionType {
    // Les enums ont les mêmes valeurs, mapping direct
    const validDtoTypes = Object.values(DtoInstitutionType);
    if (validDtoTypes.includes(entityType as any)) {
      return entityType as unknown as DtoInstitutionType;
    }
    return DtoInstitutionType.AUTRE;
  }

  /**
   * Créer une nouvelle institution financière
   */
  async createInstitution(createDto: CreateFinancialInstitutionDto): Promise<FinancialInstitutionResponseDto> {
    try {
      // Vérification de l'unicité du nom
      await this.checkInstitutionNameUniqueness(createDto.denominationSociale);
      
      // Génération d'un ID unique
      const institutionId = crypto.randomUUID();
      const currentDate = new Date();
      
      // Mapping du DTO français vers l'entity anglaise
      const institution = this.institutionRepository.create({
        id: institutionId,
        institutionName: createDto.denominationSociale,
        legalName: createDto.denominationSociale,
        acronym: createDto.sigle,
        institutionType: this.mapInstitutionType(createDto.typeInstitution),
        sector: 'PRIVE' as any, // Défaut
        status: 'ACTIVE',
        licenseNumber: createDto.numeroAgrement,
        regulatoryAuthority: createDto.autoritéSupervision as any,
        establishmentDate: createDto.dateCreation ? new Date(createDto.dateCreation) : undefined,
        headOfficeAddress: createDto.siegeSocial,
        city: createDto.siegeSocial, // À améliorer avec parsing d'adresse
        province: '', // À améliorer
        countryOfOperation: createDto.paysOrigine || 'DRC',
        phoneNumber: '',  // Pas dans le DTO de base
        emailAddress: '', // Pas dans le DTO de base
        websiteUrl: '',   // Pas dans le DTO de base
        description: createDto.statutJuridique,
        authorizedCapital: parseFloat(createDto.capitalSocialMinimum || '0'),
        paidUpCapital: parseFloat(createDto.capitalSocialActuel || '0'),
        baseCurrency: createDto.devise || 'CDF',
        totalBranches: createDto.nombreAgences || 0,
        totalEmployees: 0,
        logoUrl: '',
        createdBy: createDto.userId || 'system',
        createdAt: currentDate,
        updatedAt: currentDate,
        customerId: createDto.userId,
        businessRegistrationNumber: createDto.numeroRCCM,
        taxIdentificationNumber: createDto.numeroNIF,
      });

      // Sauvegarde en base
      const savedInstitution = await this.institutionRepository.save(institution);
      
      return this.mapToResponseDto(savedInstitution);
    } catch (error) {
      if ((error as Error).message.includes('déjà existant')) {
        throw new ConflictException((error as Error).message);
      }
      throw new Error(`Erreur lors de la création de l'institution: ${(error as Error).message}`);
    }
  }

  /**
   * Mettre à jour une institution existante
   */
  async updateInstitution(
    institutionId: string,
    updateDto: UpdateFinancialInstitutionDto,
  ): Promise<FinancialInstitutionResponseDto> {
    try {
      const institution = await this.institutionRepository.findOne({
        where: { id: institutionId },
      });

      if (!institution) {
        throw new NotFoundException(`Institution avec l'ID ${institutionId} non trouvée`);
      }

      // Mise à jour des champs fournis (mapping DTO français → Entity anglaise)
      if (updateDto.denominationSociale) {
        institution.institutionName = updateDto.denominationSociale;
        institution.legalName = updateDto.denominationSociale;
      }
      if (updateDto.sigle) {
        institution.acronym = updateDto.sigle;
      }
      if (updateDto.typeInstitution) {
        institution.institutionType = this.mapInstitutionType(updateDto.typeInstitution);
      }
      if (updateDto.statutJuridique) {
        institution.description = updateDto.statutJuridique;
      }
      if (updateDto.nombreAgences !== undefined) {
        institution.totalBranches = updateDto.nombreAgences;
      }

      institution.updatedAt = new Date();
      institution.updatedBy = updateDto.userId || 'system';

      const updatedInstitution = await this.institutionRepository.save(institution);
      return this.mapToResponseDto(updatedInstitution);
    } catch (error) {
      if ((error as Error).message.includes('non trouvée')) {
        throw new NotFoundException((error as Error).message);
      }
      throw new Error(`Erreur lors de la mise à jour: ${(error as Error).message}`);
    }
  }

  /**
   * Récupérer une institution par ID
   */
  async getInstitutionById(institutionId: string): Promise<FinancialInstitutionResponseDto> {
    try {
      const institution = await this.institutionRepository.findOne({
        where: { id: institutionId },
        relations: ['leadership'],
      });

      if (!institution) {
        throw new NotFoundException(`Institution avec l'ID ${institutionId} non trouvée`);
      }

      return this.mapToResponseDto(institution);
    } catch (error) {
      throw new Error(`Erreur lors de la récupération: ${(error as Error).message}`);
    }
  }

  /**
   * Récupérer toutes les institutions
   */
  async getAllInstitutions(): Promise<FinancialInstitutionResponseDto[]> {
    try {
      const institutions = await this.institutionRepository.find({
        relations: ['leadership'],
        order: { createdAt: 'DESC' },
      });

      return institutions.map(institution => this.mapToResponseDto(institution));
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des institutions: ${(error as Error).message}`);
    }
  }

  /**
   * Supprimer une institution
   */
  async deleteInstitution(institutionId: string): Promise<void> {
    try {
      const institution = await this.institutionRepository.findOne({
        where: { id: institutionId },
      });

      if (!institution) {
        throw new NotFoundException(`Institution avec l'ID ${institutionId} non trouvée`);
      }

      await this.institutionRepository.remove(institution);
    } catch (error) {
      throw new Error(`Erreur lors de la suppression: ${(error as Error).message}`);
    }
  }

  /**
   * Rechercher des institutions par critères
   */
  async searchInstitutions(criteria: {
    name?: string;
    type?: InstitutionType;
    status?: InstitutionStatus;
    city?: string;
  }): Promise<FinancialInstitutionResponseDto[]> {
    try {
      const queryBuilder = this.institutionRepository.createQueryBuilder('institution');

      if (criteria.name) {
        queryBuilder.andWhere('institution.institutionName ILIKE :name', {
          name: `%${criteria.name}%`,
        });
      }

      if (criteria.type) {
        queryBuilder.andWhere('institution.institutionType = :type', {
          type: criteria.type,
        });
      }

      if (criteria.status) {
        queryBuilder.andWhere('institution.status = :status', {
          status: criteria.status,
        });
      }

      if (criteria.city) {
        queryBuilder.andWhere('institution.city ILIKE :city', {
          city: `%${criteria.city}%`,
        });
      }

      const institutions = await queryBuilder
        .leftJoinAndSelect('institution.leadership', 'leadership')
        .orderBy('institution.createdAt', 'DESC')
        .getMany();

      return institutions.map(institution => this.mapToResponseDto(institution));
    } catch (error) {
      throw new Error(`Erreur lors de la recherche: ${(error as Error).message}`);
    }
  }

  /**
   * Obtenir les statistiques des institutions
   */
  async getInstitutionStatistics(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    active: number;
  }> {
    try {
      const total = await this.institutionRepository.count();
      const active = await this.institutionRepository.count({
        where: { isActive: true },
      });

      const byType = await this.institutionRepository
        .createQueryBuilder('institution')
        .select('institution.institutionType', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('institution.institutionType')
        .getRawMany();

      const byStatus = await this.institutionRepository
        .createQueryBuilder('institution')
        .select('institution.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('institution.status')
        .getRawMany();

      return {
        total,
        active,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = parseInt(item.count);
          return acc;
        }, {}),
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {}),
      };
    } catch (error) {
      throw new Error(`Erreur lors du calcul des statistiques: ${(error as Error).message}`);
    }
  }

  /**
   * Valider l'unicité du nom d'institution
   */
  private async checkInstitutionNameUniqueness(institutionName: string): Promise<void> {
    const existingInstitution = await this.institutionRepository.findOne({
      where: { institutionName },
    });

    if (existingInstitution) {
      throw new ConflictException(`Une institution avec le nom "${institutionName}" existe déjà`);
    }
  }

  /**
   * Mapper une entité vers un DTO de réponse
   */
  private mapToResponseDto(institution: InstitutionCoreEntity): FinancialInstitutionResponseDto {
    return {
      id: institution.id,
      userId: institution.customerId || '',
      // Mapping Entity anglaise → DTO français
      denominationSociale: institution.institutionName || '',
      sigle: institution.acronym || '',
      typeInstitution: this.mapEntityToDtoType(institution.institutionType),
      sousCategorie: '', // À compléter
      dateCreation: institution.establishmentDate?.toISOString() || new Date().toISOString(),
      paysOrigine: institution.countryOfOperation || 'DRC',
      statutJuridique: institution.description || '',
      autoritéSupervision: institution.regulatoryAuthority as any,
      numeroAgrement: institution.licenseNumber || '',
      dateAgrement: institution.licenseIssuedDate?.toISOString() || '',
      validiteAgrement: institution.licenseExpiryDate?.toISOString() || '',
      numeroRCCM: institution.businessRegistrationNumber || '',
      numeroNIF: institution.taxIdentificationNumber || '',
      activitesAutorisees: [], // À compléter depuis relation
      siegeSocial: institution.headOfficeAddress || '',
      nombreAgences: institution.totalBranches || 0,
      villesProvincesCouvertes: [], // À compléter
      presenceInternationale: false,
      capitalSocialMinimum: institution.authorizedCapital?.toString() || '0',
      capitalSocialActuel: institution.paidUpCapital?.toString() || '0',
      fondsPropresMontant: '0', // À compléter
      totalBilan: '0', // À compléter
      chiffreAffairesAnnuel: '0', // À compléter
      devise: institution.baseCurrency as any,
      segmentClientelePrincipal: '',
      nombreClientsActifs: 0,
      portefeuilleCredit: '0',
      depotsCollectes: '0',
      servicesCredit: [],
      servicesInvestissement: [],
      servicesGarantie: [],
      servicesTransactionnels: [],
      totalEmployees: institution.totalEmployees,
      totalCustomers: institution.totalCustomers,
      logoUrl: institution.logoUrl,
      isActive: institution.isActive,
      isVerified: institution.isVerified,
      createdAt: institution.createdAt,
      updatedAt: institution.updatedAt,
      createdBy: institution.createdBy,
      updatedBy: institution.updatedBy,
    };
  }

  /**
   * Obtenir les institutions par filtres (alias de searchInstitutions)
   */
  async getInstitutionsByFilters(filters: {
    name?: string;
    type?: any;
    status?: any;
    city?: string;
  }): Promise<FinancialInstitutionResponseDto[]> {
    return this.searchInstitutions(filters);
  }

  /**
   * Rechercher les institutions par nom (alias simplifié)
   */
  async searchInstitutionsByName(name: string): Promise<FinancialInstitutionResponseDto[]> {
    return this.searchInstitutions({ name });
  }

  /**
   * Obtenir les institutions par type
   */
  async getInstitutionsByType(type: any): Promise<FinancialInstitutionResponseDto[]> {
    return this.searchInstitutions({ type });
  }

  /**
   * Obtenir les statistiques des institutions (alias)
   */
  async getInstitutionStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    active: number;
  }> {
    return this.getInstitutionStatistics();
  }
}