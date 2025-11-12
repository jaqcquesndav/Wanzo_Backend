import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
// Import des entités depuis le nouveau fichier
import { InstitutionCoreEntity } from '../entities/institution-core.entity.new';
import {
  CreateFinancialInstitutionDto,
  UpdateFinancialInstitutionDto,
  FinancialInstitutionResponseDto,
  InstitutionType,
  InstitutionStatus,
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
   * Créer une nouvelle institution financière
   */
  async createInstitution(createDto: CreateFinancialInstitutionDto): Promise<FinancialInstitutionResponseDto> {
    try {
      // Vérification de l'unicité du nom
      await this.checkInstitutionNameUniqueness(createDto.institutionName);
      
      // Génération d'un ID unique
      const institutionId = crypto.randomUUID();
      const currentDate = new Date();
      
      // Création de l'entité
      const institution = this.institutionRepository.create({
        id: institutionId,
        institutionName: createDto.institutionName,
        legalName: createDto.legalName,
        institutionType: createDto.institutionType,
        ownership: createDto.ownership || 'PRIVATE',
        status: createDto.status || 'ACTIVE',
        licenseNumber: createDto.licenseNumber,
        regulatoryAuthority: createDto.regulatoryAuthority,
        establishmentDate: createDto.establishedDate ? new Date(createDto.establishedDate) : undefined,
        headOfficeAddress: createDto.address?.street,
        city: createDto.address?.city,
        province: createDto.address?.province,
        countryOfOperation: createDto.address?.country || 'DRC',
        phoneNumber: createDto.contact?.phone,
        emailAddress: createDto.contact?.email,
        websiteUrl: createDto.contact?.website,
        ceoName: createDto.ceoName,
        description: createDto.description,
        authorizedCapital: createDto.authorizedCapital,
        paidUpCapital: createDto.paidUpCapital,
        baseCurrency: createDto.baseCurrency || 'CDF',
        totalBranches: createDto.totalBranches || 0,
        totalEmployees: createDto.totalEmployees || 0,
        logoUrl: createDto.logoUrl,
        createdBy: createDto.createdBy || 'system',
        createdAt: currentDate,
        updatedAt: currentDate,
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

      // Mise à jour des champs fournis
      if (updateDto.institutionName) {
        institution.institutionName = updateDto.institutionName;
      }
      if (updateDto.legalName) {
        institution.legalName = updateDto.legalName;
      }
      if (updateDto.institutionType) {
        institution.institutionType = updateDto.institutionType;
      }
      if (updateDto.status) {
        institution.status = updateDto.status;
      }
      if (updateDto.description) {
        institution.description = updateDto.description;
      }

      institution.updatedAt = new Date();
      institution.updatedBy = updateDto.updatedBy || 'system';

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
      institutionName: institution.institutionName,
      legalName: institution.legalName,
      institutionType: institution.institutionType as InstitutionType,
      ownership: institution.ownership,
      status: institution.status as InstitutionStatus,
      licenseNumber: institution.licenseNumber,
      regulatoryAuthority: institution.regulatoryAuthority,
      establishedDate: institution.establishmentDate,
      licenseExpiryDate: institution.licenseExpiryDate,
      address: {
        street: institution.headOfficeAddress || '',
        city: institution.city || '',
        province: institution.province || '',
        country: institution.countryOfOperation,
        postalCode: institution.postalCode,
      },
      contact: {
        phone: institution.phoneNumber,
        email: institution.emailAddress,
        website: institution.websiteUrl,
        fax: institution.faxNumber,
      },
      ceoName: institution.ceoName,
      description: institution.description,
      authorizedCapital: institution.authorizedCapital,
      paidUpCapital: institution.paidUpCapital,
      baseCurrency: institution.baseCurrency as any,
      totalBranches: institution.totalBranches,
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
}