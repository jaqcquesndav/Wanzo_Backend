import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CompanySyncService } from '../../company-profile/services/company-sync.service';
import { CompanyProfile } from '../../company-profile/entities/company-profile.entity';
import { ProspectionFiltersDto, ProspectDto, ProspectListResponseDto } from '../dtos/prospection.dto';

/**
 * Service de prospection utilisant le cache CompanyProfile
 * 
 * Ce service se concentre sur la logique métier de prospection:
 * - Filtrage des prospects (companies) selon critères métier
 * - Transformation des données pour affichage prospection
 * - Enrichissement avec statut prospection (contacted, pending, etc.)
 * 
 * Il délègue la synchronisation des données à CompanySyncService
 */
@Injectable()
export class ProspectionService {
  private readonly logger = new Logger(ProspectionService.name);

  constructor(
    private readonly companySyncService: CompanySyncService,
  ) {}

  /**
   * Liste les prospects (companies) avec filtres prospection
   */
  async findProspects(
    filters: ProspectionFiltersDto,
    institutionId: string
  ): Promise<ProspectListResponseDto> {
    this.logger.log(`Finding prospects for institution ${institutionId} with filters: ${JSON.stringify(filters)}`);

    // Transformer les filtres prospection vers filtres CompanyProfile
    const searchFilters = {
      sector: filters.sector,
      companySize: filters.size,
      minCreditScore: filters.minCreditScore || 50, // Score minimum pour prospection
      maxCreditScore: filters.maxCreditScore,
      financialRating: filters.financialRating,
      companyName: filters.searchTerm,
      page: filters.page || 1,
      limit: filters.limit || 20,
    };

    // Utiliser le service de sync existant
    const result = await this.companySyncService.searchProfiles(searchFilters);

    // Filtrer par statut si demandé (prospection spécifique)
    let filteredProfiles = result.profiles;
    if (filters.status) {
      // Le statut prospection peut être stocké dans metadata ou dérivé
      filteredProfiles = result.profiles.filter(profile => {
        // Pour l'instant, tous les profils sont considérés comme "active" pour prospection
        // À améliorer avec un vrai statut de prospection
        return filters.status === 'active';
      });
    }

    // Transformer en DTOs prospection
    const prospects = filteredProfiles.map(profile => this.toProspectDto(profile));

    return {
      data: prospects,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      }
    };
  }

  /**
   * Récupère les détails d'un prospect spécifique
   */
  async getProspectDetails(companyId: string, institutionId: string): Promise<ProspectDto> {
    this.logger.log(`Getting prospect details for company ${companyId}`);

    // Utiliser le service de sync qui gère l'auto-refresh si données stale
    const profile = await this.companySyncService.getProfile(companyId, true);

    if (!profile) {
      throw new NotFoundException(`Prospect ${companyId} not found`);
    }

    return this.toProspectDto(profile);
  }

  /**
   * Recherche de prospects par proximité géographique
   */
  async findNearbyProspects(
    latitude: number,
    longitude: number,
    radiusKm: number,
    filters?: ProspectionFiltersDto
  ): Promise<ProspectDto[]> {
    this.logger.log(`Finding prospects within ${radiusKm}km of (${latitude}, ${longitude})`);

    // Récupérer tous les prospects avec filtres de base
    const result = await this.findProspects(filters || {}, '');

    // Filtrer par distance
    const nearbyProspects = result.data.filter(prospect => {
      if (!prospect.latitude || !prospect.longitude) return false;

      const distance = this.calculateDistance(
        latitude,
        longitude,
        prospect.latitude,
        prospect.longitude
      );

      return distance <= radiusKm;
    });

    // Trier par distance
    return nearbyProspects.sort((a, b) => {
      const distA = this.calculateDistance(latitude, longitude, a.latitude!, a.longitude!);
      const distB = this.calculateDistance(latitude, longitude, b.latitude!, b.longitude!);
      return distA - distB;
    });
  }

  /**
   * Statistiques de prospection
   */
  async getProspectionStats(institutionId: string) {
    this.logger.log(`Getting prospection stats for institution ${institutionId}`);

    const stats = await this.companySyncService.getStats();

    return {
      totalProspects: stats.totalProfiles,
      bySector: stats.bySector,
      bySize: stats.bySize,
      byFinancialRating: stats.byFinancialRating,
      averageCreditScore: this.calculateAverageCreditScore(stats),
      dataFreshness: {
        withFreshAccountingData: stats.profilesWithFreshAccountingData,
        withFreshCustomerData: stats.profilesWithFreshCustomerData,
      },
      lastCalculated: stats.lastCalculated,
    };
  }

  /**
   * Transforme CompanyProfile en ProspectDto pour l'affichage prospection
   */
  private toProspectDto(profile: CompanyProfile): ProspectDto {
    return {
      id: profile.id,
      name: profile.companyName,
      sector: profile.sector,
      size: profile.companySize,
      status: 'active', // À améliorer avec vrai statut prospection
      
      // Métriques financières (accounting-service)
      financial_metrics: {
        annual_revenue: profile.annualRevenue,
        revenue_growth: profile.revenueGrowth,
        profit_margin: profile.profitMargin,
        cash_flow: profile.cashFlow,
        debt_ratio: profile.debtRatio,
        working_capital: profile.workingCapital,
        credit_score: profile.creditScore,
        financial_rating: profile.financialRating,
        ebitda: profile.ebitda,
      },
      
      // Informations de contact (customer-service)
      contact_info: {
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        website: profile.websiteUrl,
      },
      
      // Coordonnées géographiques
      latitude: profile.latitude,
      longitude: profile.longitude,
      
      // Données légales (customer-service)
      legal_info: {
        legalForm: profile.legalForm,
        rccm: profile.rccm,
        taxId: profile.taxId,
        yearFounded: profile.yearFounded,
      },
      
      // Informations complémentaires
      employeeCount: profile.employeeCount,
      locations: profile.locations,
      owner: profile.owner,
      contactPersons: profile.contactPersons,
      
      // Métadonnées
      profileCompleteness: profile.profileCompleteness,
      lastSyncFromAccounting: profile.lastSyncFromAccounting?.toISOString(),
      lastSyncFromCustomer: profile.lastSyncFromCustomer?.toISOString(),
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  /**
   * Calcule la distance entre deux points géographiques (formule de Haversine)
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateAverageCreditScore(stats: any): number {
    // Calculer la moyenne pondérée basée sur les ratings
    const ratingScores: Record<string, number> = {
      'AAA': 95, 'AA+': 85, 'AA': 80, 'AA-': 75,
      'A+': 70, 'A': 65, 'A-': 60,
      'BBB': 55, 'BB': 45, 'B': 35, 'C': 25, 'D': 15, 'E': 5
    };

    let totalScore = 0;
    let totalCount = 0;

    Object.entries(stats.byFinancialRating || {}).forEach(([rating, count]) => {
      const score = ratingScores[rating] || 50;
      totalScore += score * (count as number);
      totalCount += count as number;
    });

    return totalCount > 0 ? Math.round(totalScore / totalCount) : 0;
  }
}
