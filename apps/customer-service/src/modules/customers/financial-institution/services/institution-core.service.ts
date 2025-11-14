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
   * Créer une nouvelle institution financière (100% conforme - mapping direct)
   */
  async createInstitution(createDto: CreateFinancialInstitutionDto): Promise<FinancialInstitutionResponseDto> {
    try {
      // Vérification de l'unicité du nom
      await this.checkInstitutionNameUniqueness(createDto.denominationSociale);
      
      // Génération d'un ID unique
      const institutionId = crypto.randomUUID();
      const currentDate = new Date();
      
      // Mapping direct DTO → Entity (nomenclature identique)
      const institution = this.institutionRepository.create({
        id: institutionId,
        userId: createDto.userId,
        
        // Identification institutionnelle
        denominationSociale: createDto.denominationSociale,
        sigle: createDto.sigle,
        typeInstitution: createDto.typeInstitution as any,
        sousCategorie: createDto.sousCategorie || '',
        dateCreation: createDto.dateCreation ? new Date(createDto.dateCreation) : new Date(),
        paysOrigine: createDto.paysOrigine || 'DRC',
        statutJuridique: createDto.statutJuridique || '',
        
        // Informations réglementaires
        autoritéSupervision: createDto.autoritéSupervision as any || 'BCC',
        numeroAgrement: createDto.numeroAgrement || '',
        dateAgrement: createDto.dateAgrement ? new Date(createDto.dateAgrement) : new Date(),
        validiteAgrement: createDto.validiteAgrement ? new Date(createDto.validiteAgrement) : new Date(),
        numeroRCCM: createDto.numeroRCCM || '',
        numeroNIF: createDto.numeroNIF || '',
        
        // Activités
        activitesAutorisees: [],
        
        // Opérations
        siegeSocial: createDto.siegeSocial || '',
        nombreAgences: createDto.nombreAgences || 0,
        villesProvincesCouvertes: createDto.villesProvincesCouvertes || [],
        presenceInternationale: createDto.presenceInternationale || false,
        
        // Finances
        capitalSocialMinimum: 0,
        capitalSocialActuel: parseFloat(createDto.capitalSocialActuel || '0'),
        fondsPropresMontant: 0,
        totalBilan: 0,
        chiffreAffairesAnnuel: 0,
        devise: createDto.devise as any || 'CDF',
        
        // Clientèle
        segmentClientelePrincipal: createDto.segmentClientelePrincipal || '',
        nombreClientsActifs: createDto.nombreClientsActifs || 0,
        portefeuilleCredit: 0,
        depotsCollectes: 0,
        
        // Services Wanzo
        servicesCredit: [],
        servicesInvestissement: [],
        servicesGarantie: [],
        servicesTransactionnels: [],
        servicesConseil: [],
        
        // Métadonnées
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
   * Mettre à jour une institution existante (100% conforme - mapping direct)
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

      // Mise à jour des champs fournis (mapping direct - nomenclature identique)
      // Seuls les champs présents dans UpdateFinancialInstitutionDto sont mis à jour
      if (updateDto.denominationSociale) institution.denominationSociale = updateDto.denominationSociale;
      if (updateDto.sigle) institution.sigle = updateDto.sigle;
      if (updateDto.typeInstitution) institution.typeInstitution = updateDto.typeInstitution as any;
      if (updateDto.sousCategorie) institution.sousCategorie = updateDto.sousCategorie;
      if (updateDto.statutJuridique) institution.statutJuridique = updateDto.statutJuridique;
      if ((updateDto as any).paysOrigine) institution.paysOrigine = (updateDto as any).paysOrigine;
      
      // Réglementaire
      if ((updateDto as any).autoritéSupervision) institution.autoritéSupervision = (updateDto as any).autoritéSupervision;
      if ((updateDto as any).numeroAgrement) institution.numeroAgrement = (updateDto as any).numeroAgrement;
      if ((updateDto as any).numeroRCCM) institution.numeroRCCM = (updateDto as any).numeroRCCM;
      if ((updateDto as any).numeroNIF) institution.numeroNIF = (updateDto as any).numeroNIF;
      
      // Opérations
      if (updateDto.siegeSocial) institution.siegeSocial = updateDto.siegeSocial;
      if (updateDto.nombreAgences !== undefined) institution.nombreAgences = updateDto.nombreAgences;
      if ((updateDto as any).villesProvincesCouvertes) institution.villesProvincesCouvertes = (updateDto as any).villesProvincesCouvertes;
      if ((updateDto as any).presenceInternationale !== undefined) institution.presenceInternationale = (updateDto as any).presenceInternationale;
      
      // Finances
      if (updateDto.capitalSocialActuel) institution.capitalSocialActuel = parseFloat(updateDto.capitalSocialActuel);
      if ((updateDto as any).fondsPropresMontant) institution.fondsPropresMontant = parseFloat((updateDto as any).fondsPropresMontant);
      if ((updateDto as any).totalBilan) institution.totalBilan = parseFloat((updateDto as any).totalBilan);
      if ((updateDto as any).chiffreAffairesAnnuel) institution.chiffreAffairesAnnuel = parseFloat((updateDto as any).chiffreAffairesAnnuel);
      
      // Clientèle
      if (updateDto.segmentClientelePrincipal) institution.segmentClientelePrincipal = updateDto.segmentClientelePrincipal;
      if (updateDto.nombreClientsActifs !== undefined) institution.nombreClientsActifs = updateDto.nombreClientsActifs;
      if ((updateDto as any).portefeuilleCredit) institution.portefeuilleCredit = parseFloat((updateDto as any).portefeuilleCredit);
      if ((updateDto as any).depotsCollectes) institution.depotsCollectes = parseFloat((updateDto as any).depotsCollectes);
      
      // Services (si présents dans le DTO)
      if ((updateDto as any).servicesCredit) institution.servicesCredit = (updateDto as any).servicesCredit;
      if ((updateDto as any).servicesInvestissement) institution.servicesInvestissement = (updateDto as any).servicesInvestissement;
      if ((updateDto as any).servicesGarantie) institution.servicesGarantie = (updateDto as any).servicesGarantie;
      if ((updateDto as any).servicesTransactionnels) institution.servicesTransactionnels = (updateDto as any).servicesTransactionnels;
      if ((updateDto as any).servicesConseil) institution.servicesConseil = (updateDto as any).servicesConseil;

      institution.updatedAt = new Date();

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
    type?: EntityInstitutionType;
    status?: string;
    city?: string;
  }): Promise<FinancialInstitutionResponseDto[]> {
    try {
      const queryBuilder = this.institutionRepository.createQueryBuilder('institution');

      if (criteria.name) {
        queryBuilder.andWhere('institution.denominationSociale ILIKE :name', {
          name: `%${criteria.name}%`,
        });
      }

      if (criteria.type) {
        queryBuilder.andWhere('institution.typeInstitution = :type', {
          type: criteria.type,
        });
      }

      if (criteria.status) {
        // Note: status field removed, can filter by other criteria if needed
        console.warn('Status filter not available in new schema');
      }

      if (criteria.city) {
        queryBuilder.andWhere('institution.siegeSocial ILIKE :city', {
          city: `%${criteria.city}%`,
        });
      }

      const institutions = await queryBuilder
        .orderBy('institution.createdAt', 'DESC')
        .getMany();

      return institutions.map(institution => this.mapToResponseDto(institution));
    } catch (error) {
      throw new Error(`Erreur lors de la recherche: ${(error as Error).message}`);
    }
  }

  /**
   * Obtenir les statistiques des institutions (100% conforme)
   */
  async getInstitutionStatistics(): Promise<{
    total: number;
    byType: Record<string, number>;
  }> {
    try {
      const total = await this.institutionRepository.count();

      const byType = await this.institutionRepository
        .createQueryBuilder('institution')
        .select('institution.typeInstitution', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('institution.typeInstitution')
        .getRawMany();

      return {
        total,
        byType: byType.reduce((acc, item) => {
          acc[item.type] = parseInt(item.count);
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
  private async checkInstitutionNameUniqueness(denominationSociale: string): Promise<void> {
    const existingInstitution = await this.institutionRepository.findOne({
      where: { denominationSociale },
    });

    if (existingInstitution) {
      throw new ConflictException(`Une institution avec le nom "${denominationSociale}" existe déjà`);
    }
  }

  /**
   * Mapper une entité vers un DTO de réponse (100% conforme - mapping direct)
   */
  private mapToResponseDto(institution: InstitutionCoreEntity): FinancialInstitutionResponseDto {
    return {
      id: institution.id,
      userId: institution.userId,
      
      // === IDENTIFICATION INSTITUTIONNELLE (Mapping direct) ===
      denominationSociale: institution.denominationSociale,
      sigle: institution.sigle,
      typeInstitution: institution.typeInstitution as any,
      sousCategorie: institution.sousCategorie,
      dateCreation: institution.dateCreation.toISOString(),
      paysOrigine: institution.paysOrigine,
      statutJuridique: institution.statutJuridique,
      
      // === INFORMATIONS RÉGLEMENTAIRES ===
      autoritéSupervision: institution.autoritéSupervision as any,
      numeroAgrement: institution.numeroAgrement,
      dateAgrement: institution.dateAgrement.toISOString(),
      validiteAgrement: institution.validiteAgrement.toISOString(),
      numeroRCCM: institution.numeroRCCM,
      numeroNIF: institution.numeroNIF,
      
      // === ACTIVITÉS ===
      activitesAutorisees: institution.activitesAutorisees,
      
      // === OPÉRATIONS ===
      siegeSocial: institution.siegeSocial,
      nombreAgences: institution.nombreAgences,
      villesProvincesCouvertes: institution.villesProvincesCouvertes,
      presenceInternationale: institution.presenceInternationale,
      
      // === FINANCES ===
      capitalSocialMinimum: institution.capitalSocialMinimum.toString(),
      capitalSocialActuel: institution.capitalSocialActuel.toString(),
      fondsPropresMontant: institution.fondsPropresMontant.toString(),
      totalBilan: institution.totalBilan.toString(),
      chiffreAffairesAnnuel: institution.chiffreAffairesAnnuel.toString(),
      devise: institution.devise as any,
      
      // === CLIENTÈLE ===
      segmentClientelePrincipal: institution.segmentClientelePrincipal,
      nombreClientsActifs: institution.nombreClientsActifs,
      portefeuilleCredit: institution.portefeuilleCredit.toString(),
      depotsCollectes: institution.depotsCollectes.toString(),
      
      // === SERVICES WANZO ===
      servicesCredit: institution.servicesCredit || [],
      servicesInvestissement: institution.servicesInvestissement || [],
      servicesGarantie: institution.servicesGarantie || [],
      servicesTransactionnels: institution.servicesTransactionnels || [],
      servicesConseil: institution.servicesConseil || [],
      
      // === PARTENARIAT ===
      motivationPrincipale: institution.motivationPrincipale || '',
      servicesPrioritaires: institution.servicesPrioritaires || [],
      segmentsClienteleCibles: institution.segmentsClienteleCibles || [],
      volumeAffairesEnvisage: institution.volumeAffairesEnvisage || '',
      
      // === CONDITIONS COMMERCIALES ===
      grillesTarifaires: institution.grillesTarifaires || '',
      conditionsPreferentielles: institution.conditionsPreferentielles || '',
      delaisTraitement: institution.delaisTraitement || '',
      criteresEligibilite: institution.criteresEligibilite || '',
      
      // === CAPACITÉ ===
      montantMaximumDossier: institution.montantMaximumDossier?.toString() || '',
      enveloppeGlobale: institution.enveloppeGlobale?.toString() || '',
      secteursActivitePrivilegies: institution.secteursActivitePrivilegies || [],
      zonesGeographiquesPrioritaires: institution.zonesGeographiquesPrioritaires || [],
      
      // === DOCUMENTS ===
      documentsLegaux: institution.documentsLegaux || [],
      documentsFinanciers: institution.documentsFinanciers || [],
      documentsOperationnels: institution.documentsOperationnels || [],
      documentsCompliance: institution.documentsCompliance || [],
      
      // === MÉTADONNÉES ===
      createdAt: institution.createdAt.toISOString(),
      updatedAt: institution.updatedAt.toISOString(),
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
  }> {
    return this.getInstitutionStatistics();
  }
}