import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionRegulatory } from '../entities/institution-regulatory.entity';
import { 
  CreateRegulatoryComplianceDto, 
  UpdateRegulatoryComplianceDto, 
  RegulatoryComplianceResponseDto,
  LicenseDto,
  ComplianceReportDto,
  AuditDto,
  RegulatoryObligationDto,
  ComplianceStatus
} from '../dto/institution-regulatory.dto';
import * as crypto from 'crypto';

/**
 * Service pour la gestion de la conformité réglementaire des institutions financières
 * Gère les licences, rapports de conformité, audits et obligations réglementaires
 */
@Injectable()
export class InstitutionRegulatoryService {
  constructor(
    @InjectRepository(InstitutionRegulatory)
    private readonly regulatoryRepository: Repository<InstitutionRegulatory>,
  ) {}

  /**
   * Créer ou mettre à jour la conformité réglementaire d'une institution
   */
  async createOrUpdateCompliance(institutionId: string, createComplianceDto: CreateRegulatoryComplianceDto): Promise<RegulatoryComplianceResponseDto> {
    try {
      // Vérifier si une conformité existe déjà pour cette institution
      let compliance = await this.regulatoryRepository.findOne({ where: { institutionId } });
      
      if (compliance) {
        // Mise à jour de la conformité existante
        compliance = this.regulatoryRepository.merge(compliance, {
          ...createComplianceDto.compliance,
          updatedAt: new Date(),
        });
      } else {
        // Création d'une nouvelle conformité
        const complianceId = crypto.randomUUID();
        const currentDate = new Date().toISOString();
        
        compliance = this.regulatoryRepository.create({
          id: complianceId,
          institutionId,
          ...createComplianceDto.compliance,
          status: createComplianceDto.compliance.status || ComplianceStatus.COMPLIANT,
          licenses: createComplianceDto.compliance.licenses || [],
          reports: createComplianceDto.compliance.reports || [],
          audits: createComplianceDto.compliance.audits || [],
          obligations: createComplianceDto.compliance.obligations || [],
          createdAt: new Date(currentDate),
          updatedAt: new Date(currentDate),
        });
      }

      const savedCompliance = await this.regulatoryRepository.save(compliance);
      
      return this.mapToResponseDto(savedCompliance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la création/mise à jour de la conformité: ${errorMessage}`);
    }
  }

  /**
   * Mettre à jour la conformité réglementaire
   */
  async updateCompliance(complianceId: string, updateComplianceDto: UpdateRegulatoryComplianceDto): Promise<RegulatoryComplianceResponseDto> {
    try {
      const compliance = await this.regulatoryRepository.findOne({ where: { id: complianceId } });
      
      if (!compliance) {
        throw new Error('Données de conformité non trouvées');
      }

      // Calcul automatique du score de conformité
      const complianceScore = this.calculateComplianceScore(compliance);

      // Mise à jour des données
      const updatedCompliance = this.regulatoryRepository.merge(compliance, {
        ...updateComplianceDto.compliance,
        complianceScore,
        lastAssessmentDate: new Date(),
        updatedAt: new Date(),
      });

      const savedCompliance = await this.regulatoryRepository.save(updatedCompliance);
      
      return this.mapToResponseDto(savedCompliance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la mise à jour de la conformité: ${errorMessage}`);
    }
  }

  /**
   * Récupérer la conformité réglementaire d'une institution
   */
  async getCompliance(institutionId: string): Promise<RegulatoryComplianceResponseDto> {
    try {
      const compliance = await this.regulatoryRepository.findOne({ where: { institutionId } });
      
      if (!compliance) {
        throw new Error('Données de conformité non trouvées');
      }

      return this.mapToResponseDto(compliance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération de la conformité: ${errorMessage}`);
    }
  }

  /**
   * Ajouter une licence
   */
  async addLicense(institutionId: string, license: LicenseDto): Promise<RegulatoryComplianceResponseDto> {
    try {
      const compliance = await this.regulatoryRepository.findOne({ where: { institutionId } });
      
      if (!compliance) {
        throw new Error('Données de conformité non trouvées');
      }

      const newLicense = {
        ...license,
        id: crypto.randomUUID(),
        issueDate: license.issueDate || new Date().toISOString(),
        status: license.status || 'active',
      };

      compliance.licenses = [...(compliance.licenses || []), newLicense];
      compliance.updatedAt = new Date();
      
      const updatedCompliance = await this.regulatoryRepository.save(compliance);
      
      return this.mapToResponseDto(updatedCompliance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de l'ajout de la licence: ${errorMessage}`);
    }
  }

  /**
   * Mettre à jour une licence
   */
  async updateLicense(institutionId: string, licenseId: string, licenseUpdate: Partial<LicenseDto>): Promise<RegulatoryComplianceResponseDto> {
    try {
      const compliance = await this.regulatoryRepository.findOne({ where: { institutionId } });
      
      if (!compliance) {
        throw new Error('Données de conformité non trouvées');
      }

      const licenseIndex = compliance.licenses?.findIndex(license => license.id === licenseId);
      
      if (licenseIndex === -1 || licenseIndex === undefined) {
        throw new Error('Licence non trouvée');
      }

      // Mise à jour de la licence
      compliance.licenses![licenseIndex] = {
        ...compliance.licenses![licenseIndex],
        ...licenseUpdate,
      };
      
      compliance.updatedAt = new Date();
      
      const updatedCompliance = await this.regulatoryRepository.save(compliance);
      
      return this.mapToResponseDto(updatedCompliance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la mise à jour de la licence: ${errorMessage}`);
    }
  }

  /**
   * Ajouter un rapport de conformité
   */
  async addReport(institutionId: string, report: ComplianceReportDto): Promise<RegulatoryComplianceResponseDto> {
    try {
      const compliance = await this.regulatoryRepository.findOne({ where: { institutionId } });
      
      if (!compliance) {
        throw new Error('Données de conformité non trouvées');
      }

      const newReport = {
        ...report,
        id: crypto.randomUUID(),
        submissionDate: report.submissionDate || new Date().toISOString(),
        status: report.status || 'pending',
      };

      compliance.reports = [...(compliance.reports || []), newReport];
      compliance.updatedAt = new Date();
      
      const updatedCompliance = await this.regulatoryRepository.save(compliance);
      
      return this.mapToResponseDto(updatedCompliance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de l'ajout du rapport: ${errorMessage}`);
    }
  }

  /**
   * Ajouter un audit
   */
  async addAudit(institutionId: string, audit: AuditDto): Promise<RegulatoryComplianceResponseDto> {
    try {
      const compliance = await this.regulatoryRepository.findOne({ where: { institutionId } });
      
      if (!compliance) {
        throw new Error('Données de conformité non trouvées');
      }

      const newAudit = {
        ...audit,
        id: crypto.randomUUID(),
        scheduledDate: audit.scheduledDate || new Date().toISOString(),
        status: audit.status || 'scheduled',
      };

      compliance.audits = [...(compliance.audits || []), newAudit];
      compliance.updatedAt = new Date();
      
      const updatedCompliance = await this.regulatoryRepository.save(compliance);
      
      return this.mapToResponseDto(updatedCompliance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de l'ajout de l'audit: ${errorMessage}`);
    }
  }

  /**
   * Ajouter une obligation réglementaire
   */
  async addObligation(institutionId: string, obligation: RegulatoryObligationDto): Promise<RegulatoryComplianceResponseDto> {
    try {
      const compliance = await this.regulatoryRepository.findOne({ where: { institutionId } });
      
      if (!compliance) {
        throw new Error('Données de conformité non trouvées');
      }

      const newObligation = {
        ...obligation,
        id: crypto.randomUUID(),
        createdDate: obligation.createdDate || new Date().toISOString(),
        status: obligation.status || 'pending',
      };

      compliance.obligations = [...(compliance.obligations || []), newObligation];
      compliance.updatedAt = new Date();
      
      const updatedCompliance = await this.regulatoryRepository.save(compliance);
      
      return this.mapToResponseDto(updatedCompliance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de l'ajout de l'obligation: ${errorMessage}`);
    }
  }

  /**
   * Récupérer les licences expirant bientôt
   */
  async getExpiringLicenses(institutionId: string, daysAhead = 30): Promise<LicenseDto[]> {
    try {
      const compliance = await this.regulatoryRepository.findOne({ where: { institutionId } });
      
      if (!compliance || !compliance.licenses) {
        return [];
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const expiringLicenses = compliance.licenses.filter(license => {
        if (!license.expiryDate) return false;
        const expiryDate = new Date(license.expiryDate);
        return expiryDate <= futureDate && expiryDate >= new Date();
      });

      return expiringLicenses;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des licences expirantes: ${errorMessage}`);
    }
  }

  /**
   * Récupérer les rapports en retard
   */
  async getOverdueReports(institutionId: string): Promise<ComplianceReportDto[]> {
    try {
      const compliance = await this.regulatoryRepository.findOne({ where: { institutionId } });
      
      if (!compliance || !compliance.reports) {
        return [];
      }

      const now = new Date();
      const overdueReports = compliance.reports.filter(report => {
        if (!report.dueDate || report.status === 'submitted') return false;
        const dueDate = new Date(report.dueDate);
        return dueDate < now;
      });

      return overdueReports;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des rapports en retard: ${errorMessage}`);
    }
  }

  /**
   * Calculer le score de conformité
   */
  private calculateComplianceScore(compliance: InstitutionRegulatory): number {
    try {
      let score = 100;
      const now = new Date();

      // Déduction pour les licences expirées
      const expiredLicenses = compliance.licenses?.filter(license => {
        if (!license.expiryDate) return false;
        return new Date(license.expiryDate) < now;
      }).length || 0;

      score -= expiredLicenses * 10; // -10 points par licence expirée

      // Déduction pour les rapports en retard
      const overdueReports = compliance.reports?.filter(report => {
        if (!report.dueDate || report.status === 'submitted') return false;
        return new Date(report.dueDate) < now;
      }).length || 0;

      score -= overdueReports * 5; // -5 points par rapport en retard

      // Déduction pour les audits non conformes
      const failedAudits = compliance.audits?.filter(audit => 
        audit.result === 'non-compliant'
      ).length || 0;

      score -= failedAudits * 15; // -15 points par audit non conforme

      // Déduction pour les obligations non respectées
      const failedObligations = compliance.obligations?.filter(obligation => 
        obligation.status === 'failed'
      ).length || 0;

      score -= failedObligations * 8; // -8 points par obligation non respectée

      return Math.max(0, Math.min(100, score));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors du calcul du score: ${errorMessage}`);
    }
  }

  /**
   * Générer un tableau de bord de conformité
   */
  async generateComplianceDashboard(institutionId: string): Promise<any> {
    try {
      const compliance = await this.regulatoryRepository.findOne({ where: { institutionId } });
      
      if (!compliance) {
        return {
          institutionId,
          status: 'no-data',
          message: 'Aucune donnée de conformité trouvée',
        };
      }

      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      // Licences
      const totalLicenses = compliance.licenses?.length || 0;
      const activeLicenses = compliance.licenses?.filter(l => l.status === 'active').length || 0;
      const expiringLicenses = compliance.licenses?.filter(license => {
        if (!license.expiryDate) return false;
        const expiryDate = new Date(license.expiryDate);
        return expiryDate <= nextMonth && expiryDate >= now;
      }).length || 0;

      // Rapports
      const totalReports = compliance.reports?.length || 0;
      const submittedReports = compliance.reports?.filter(r => r.status === 'submitted').length || 0;
      const overdueReports = compliance.reports?.filter(report => {
        if (!report.dueDate || report.status === 'submitted') return false;
        return new Date(report.dueDate) < now;
      }).length || 0;

      // Audits
      const totalAudits = compliance.audits?.length || 0;
      const completedAudits = compliance.audits?.filter(a => a.status === 'completed').length || 0;
      const passedAudits = compliance.audits?.filter(a => a.result === 'compliant').length || 0;

      // Obligations
      const totalObligations = compliance.obligations?.length || 0;
      const fulfilledObligations = compliance.obligations?.filter(o => o.status === 'fulfilled').length || 0;

      // Score de conformité
      const complianceScore = this.calculateComplianceScore(compliance);

      return {
        institutionId,
        lastUpdated: compliance.updatedAt.toISOString(),
        complianceScore,
        status: compliance.status,
        
        licenses: {
          total: totalLicenses,
          active: activeLicenses,
          expiringSoon: expiringLicenses,
        },
        
        reports: {
          total: totalReports,
          submitted: submittedReports,
          overdue: overdueReports,
          submissionRate: totalReports > 0 ? (submittedReports / totalReports) * 100 : 0,
        },
        
        audits: {
          total: totalAudits,
          completed: completedAudits,
          passed: passedAudits,
          passRate: completedAudits > 0 ? (passedAudits / completedAudits) * 100 : 0,
        },
        
        obligations: {
          total: totalObligations,
          fulfilled: fulfilledObligations,
          fulfillmentRate: totalObligations > 0 ? (fulfilledObligations / totalObligations) * 100 : 0,
        },
        
        alerts: {
          expiringLicenses: expiringLicenses > 0,
          overdueReports: overdueReports > 0,
          lowComplianceScore: complianceScore < 70,
        },
        
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la génération du tableau de bord: ${errorMessage}`);
    }
  }

  // Méthodes privées

  /**
   * Mapper l'entité Regulatory vers ResponseDto
   */
  private mapToResponseDto(compliance: InstitutionRegulatory): RegulatoryComplianceResponseDto {
    return {
      id: compliance.id,
      institutionId: compliance.institutionId,
      regulatoryAuthority: compliance.regulatoryAuthority,
      status: compliance.status,
      complianceScore: compliance.complianceScore,
      lastAssessmentDate: compliance.lastAssessmentDate?.toISOString(),
      nextAssessmentDate: compliance.nextAssessmentDate?.toISOString(),
      licenses: compliance.licenses || [],
      reports: compliance.reports || [],
      audits: compliance.audits || [],
      obligations: compliance.obligations || [],
      notes: compliance.notes,
      documents: compliance.documents || [],
      createdAt: compliance.createdAt.toISOString(),
      updatedAt: compliance.updatedAt.toISOString(),
    };
  }
}