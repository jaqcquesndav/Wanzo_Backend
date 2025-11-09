import { Injectable, Logger } from '@nestjs/common';
import { EventsService } from '../../events/events.service';
import { CustomersService } from './customers.service';

/**
 * Service de workflow pour orchestrer la synchronisation entre customer-service et admin-service
 * Assure la conformité totale des profils entreprise et institution v2.1
 */
@Injectable()
export class CustomerProfileWorkflowService {
  private readonly logger = new Logger(CustomerProfileWorkflowService.name);

  constructor(
    private readonly customersService: CustomersService,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Orchestre la synchronisation complète d'un profil v2.1
   */
  async orchestrateCompleteProfileSync(data: {
    customerId: string;
    customerType: 'COMPANY' | 'FINANCIAL_INSTITUTION';
    triggerReason: 'profile_updated' | 'validation_completed' | 'admin_request' | 'scheduled_sync';
    requestingService: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  }): Promise<{
    success: boolean;
    syncId: string;
    steps: Array<{
      step: string;
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
      message?: string;
      data?: any;
    }>;
  }> {
    const syncId = `sync_${Date.now()}_${data.customerId}`;
    const steps: Array<any> = [];

    this.logger.log(`Starting complete profile sync for customer ${data.customerId} (${data.customerType}) - Sync ID: ${syncId}`);

    try {
      // Étape 1: Vérifier l'état actuel du profil
      steps.push({ step: 'check_current_profile', status: 'in_progress' });
      const currentProfile = await this.customersService.getCustomerDetailedProfile(data.customerId);
      
      if (!currentProfile) {
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = 'No existing profile found, will create new';
      } else {
        steps[steps.length - 1].status = 'completed';
        steps[steps.length - 1].message = `Existing profile found (completeness: ${currentProfile.profileCompleteness}%)`;
      }

      // Étape 2: Demander la synchronisation à customer-service
      steps.push({ step: 'request_customer_service_sync', status: 'in_progress' });
      await this.requestCustomerServiceSync(data.customerId, {
        syncId,
        priority: data.priority,
        requestedData: this.getRequiredDataForCustomerType(data.customerType),
        reason: data.triggerReason,
      });
      steps[steps.length - 1].status = 'completed';
      steps[steps.length - 1].message = 'Sync request sent to customer-service';

      // Étape 3: Marquer le profil comme en cours de synchronisation
      steps.push({ step: 'mark_sync_in_progress', status: 'in_progress' });
      await this.markProfileSyncInProgress(data.customerId, syncId);
      steps[steps.length - 1].status = 'completed';

      // Étape 4: Programmer la vérification de synchronisation
      steps.push({ step: 'schedule_sync_verification', status: 'in_progress' });
      await this.scheduleSyncVerification(data.customerId, syncId, data.priority);
      steps[steps.length - 1].status = 'completed';

      this.logger.log(`Profile sync orchestration completed for customer ${data.customerId} - Sync ID: ${syncId}`);

      return {
        success: true,
        syncId,
        steps,
      };

    } catch (error) {
      const err = error as Error;
      this.logger.error(`Profile sync orchestration failed for customer ${data.customerId}: ${err.message}`, err.stack);
      
      // Marquer la dernière étape comme échouée
      if (steps.length > 0) {
        steps[steps.length - 1].status = 'failed';
        steps[steps.length - 1].message = err.message;
      }

      return {
        success: false,
        syncId,
        steps,
      };
    }
  }

  /**
   * Traite les notifications de mise à jour de profil v2.1
   */
  async processProfileUpdateNotification(data: {
    customerId: string;
    customerType: 'COMPANY' | 'FINANCIAL_INSTITUTION';
    updatedSections: string[];
    updateSource: 'form_submission' | 'admin_action' | 'system_update';
    impact: 'low' | 'medium' | 'high';
    metadata: any;
  }): Promise<void> {
    this.logger.log(`Processing profile update notification for customer ${data.customerId} - Impact: ${data.impact}`);

    try {
      // Déterminer la priorité de synchronisation basée sur l'impact
      const priority = this.determineSyncPriority(data.impact, data.updatedSections);

      // Si impact élevé ou sections critiques, synchronisation immédiate
      if (data.impact === 'high' || this.hasCriticalSections(data.updatedSections)) {
        await this.orchestrateCompleteProfileSync({
          customerId: data.customerId,
          customerType: data.customerType,
          triggerReason: 'profile_updated',
          requestingService: 'admin-service',
          priority,
        });
      } else {
        // Pour les mises à jour mineures, marquer pour synchronisation différée
        await this.scheduleDelayedSync(data.customerId, {
          reason: 'minor_update',
          updatedSections: data.updatedSections,
          scheduledFor: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          priority,
        });
      }

    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process profile update notification for customer ${data.customerId}: ${err.message}`, err.stack);
    }
  }

  /**
   * Valide la conformité d'un profil après synchronisation
   */
  async validateProfileConformity(customerId: string): Promise<{
    isConform: boolean;
    issues: Array<{
      category: 'missing_data' | 'invalid_data' | 'incomplete_section' | 'compliance_issue';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      field?: string;
      recommendation?: string;
    }>;
    overallScore: number;
    recommendations: string[];
  }> {
    this.logger.log(`Validating profile conformity for customer ${customerId}`);

    const profile = await this.customersService.getCustomerDetailedProfile(customerId);
    
    if (!profile) {
      return {
        isConform: false,
        issues: [{
          category: 'missing_data',
          severity: 'critical',
          description: 'Profile not found in admin-service',
          recommendation: 'Complete profile synchronization required',
        }],
        overallScore: 0,
        recommendations: ['Request complete profile sync from customer-service'],
      };
    }

    const issues: Array<any> = [];
    const recommendations: string[] = [];
    let score = 100;

    // Validation selon le type de client
    if (profile.customerType === 'FINANCIAL_INSTITUTION') {
      const institutionIssues = await this.validateFinancialInstitutionProfile(profile);
      issues.push(...institutionIssues);
    } else if (profile.customerType === 'PME') {
      const companyIssues = await this.validateCompanyProfile(profile);
      issues.push(...companyIssues);
    }

    // Calcul du score basé sur les problèmes trouvés
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    score = Math.max(0, score);
    const isConform = score >= 70 && !issues.some(i => i.severity === 'critical');

    // Générer des recommandations
    if (score < 70) {
      recommendations.push('Améliorer la complétude du profil');
    }
    if (issues.some(i => i.category === 'compliance_issue')) {
      recommendations.push('Résoudre les problèmes de conformité réglementaire');
    }
    if (issues.some(i => i.category === 'missing_data')) {
      recommendations.push('Compléter les données manquantes critiques');
    }

    return {
      isConform,
      issues,
      overallScore: score,
      recommendations,
    };
  }

  /**
   * Gère les situations d'échec de synchronisation
   */
  async handleSyncFailure(data: {
    customerId: string;
    syncId: string;
    error: string;
    attemptNumber: number;
    maxRetries: number;
  }): Promise<void> {
    this.logger.error(`Sync failure for customer ${data.customerId} (attempt ${data.attemptNumber}/${data.maxRetries}): ${data.error}`);

    try {
      // Marquer le profil avec l'erreur
      const profile = await this.customersService.getCustomerDetailedProfile(data.customerId);
      if (profile) {
        if (!profile.syncErrors) profile.syncErrors = [];
        profile.syncErrors.push({
          timestamp: new Date().toISOString(),
          error: data.error,
          details: {
            syncId: data.syncId,
            attemptNumber: data.attemptNumber,
          },
        });

        // Si nombre max de tentatives atteint
        if (data.attemptNumber >= data.maxRetries) {
          profile.syncStatus = 'sync_failed';
          profile.requiresAttention = true;
          profile.adminStatus = 'requires_attention' as any;

          // Créer une alerte
          if (!profile.alerts) profile.alerts = [];
          profile.alerts.push({
            type: 'sync_failure',
            level: 'high',
            message: `Synchronisation échouée après ${data.maxRetries} tentatives`,
            data: { syncId: data.syncId, lastError: data.error },
            createdAt: new Date().toISOString(),
            acknowledged: false,
          });

          // Notifier les administrateurs
          await this.notifyAdminsSyncFailure(data.customerId, data.syncId, data.error);
        } else {
          // Programmer une nouvelle tentative
          await this.scheduleRetry(data.customerId, data.syncId, data.attemptNumber + 1);
        }
      }

    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to handle sync failure for customer ${data.customerId}: ${err.message}`, err.stack);
    }
  }

  // =====================================================
  // MÉTHODES PRIVÉES UTILITAIRES
  // =====================================================

  private async requestCustomerServiceSync(customerId: string, options: {
    syncId: string;
    priority: string;
    requestedData: string[];
    reason: string;
  }): Promise<void> {
    // TODO: Publier un événement Kafka vers customer-service
    await this.eventsService.publishCustomerSyncRequested({
      customerId,
      syncId: options.syncId,
      priority: options.priority,
      requestedData: options.requestedData,
      reason: options.reason,
      requestingService: 'admin-service',
      timestamp: new Date().toISOString(),
    });
  }

  private getRequiredDataForCustomerType(customerType: 'COMPANY' | 'FINANCIAL_INSTITUTION'): string[] {
    if (customerType === 'FINANCIAL_INSTITUTION') {
      return [
        'basic_info',
        'institution_specific_data',
        'regulatory_data',
        'compliance_info',
        'performance_metrics',
        'digital_presence',
        'governance_structure',
        'financial_metrics',
      ];
    } else {
      return [
        'basic_info',
        'company_profile',
        'extended_identification',
        'assets_data',
        'stocks_data',
        'financial_data',
        'performance_data',
        'compliance_info',
      ];
    }
  }

  private async markProfileSyncInProgress(customerId: string, syncId: string): Promise<void> {
    const profile = await this.customersService.getCustomerDetailedProfile(customerId);
    if (profile) {
      profile.syncStatus = 'pending_sync';
      profile.syncMetadata = {
        ...profile.syncMetadata,
        lastSyncFromCustomerService: syncId,
        dataSource: 'workflow-orchestrator',
        syncVersion: '2.1',
        lastUpdateNotified: new Date().toISOString(),
        updatedFields: ['syncStatus'],
        updateContext: {
          type: 'sync_initiated',
          syncId: syncId,
          startedAt: new Date().toISOString(),
        },
      };
      // Sauvegarder les changements (cette méthode devrait être ajoutée au service)
    }
  }

  private async scheduleSyncVerification(customerId: string, syncId: string, priority: string): Promise<void> {
    // Programmer la vérification selon la priorité
    const delayMinutes = priority === 'urgent' ? 2 : priority === 'high' ? 5 : priority === 'medium' ? 10 : 30;
    
    // TODO: Implémenter avec un job scheduler (Bull, Agenda, etc.)
    setTimeout(async () => {
      await this.verifySyncCompletion(customerId, syncId);
    }, delayMinutes * 60 * 1000);
  }

  private async verifySyncCompletion(customerId: string, syncId: string): Promise<void> {
    const profile = await this.customersService.getCustomerDetailedProfile(customerId);
    
    if (profile && profile.syncStatus === 'pending_sync') {
      // Si toujours en attente après le délai, considérer comme échec
      await this.handleSyncFailure({
        customerId,
        syncId,
        error: 'Sync timeout - no response from customer-service',
        attemptNumber: 1,
        maxRetries: 3,
      });
    }
  }

  private determineSyncPriority(impact: string, updatedSections: string[]): 'low' | 'medium' | 'high' | 'urgent' {
    if (impact === 'high' || this.hasCriticalSections(updatedSections)) {
      return 'urgent';
    } else if (impact === 'medium' || updatedSections.length > 5) {
      return 'high';
    } else if (impact === 'low' && updatedSections.length <= 2) {
      return 'low';
    } else {
      return 'medium';
    }
  }

  private hasCriticalSections(sections: string[]): boolean {
    const criticalSections = [
      'basic_info',
      'legal_info',
      'financial_data',
      'compliance_data',
      'regulatory_info',
      'identification',
    ];
    
    return sections.some(section => criticalSections.includes(section));
  }

  private async scheduleDelayedSync(customerId: string, options: {
    reason: string;
    updatedSections: string[];
    scheduledFor: Date;
    priority: string;
  }): Promise<void> {
    const profile = await this.customersService.getCustomerDetailedProfile(customerId);
    if (profile) {
      profile.nextScheduledSync = options.scheduledFor;
      profile.syncStatus = 'sync_scheduled';
      // Sauvegarder les changements
    }
  }

  private async validateFinancialInstitutionProfile(profile: any): Promise<Array<any>> {
    const issues: Array<any> = [];

    // Vérifier les données spécialisées d'institution financière
    if (!profile.institutionProfile) {
      issues.push({
        category: 'missing_data',
        severity: 'critical',
        description: 'Missing institution-specific profile data',
        recommendation: 'Request complete institution profile from customer-service',
      });
    } else {
      const requiredFields = [
        'denominationSociale',
        'numeroAgrement',
        'autoriteSupervision',
        'typeInstitution',
        'capitalSocial',
      ];

      requiredFields.forEach(field => {
        if (!profile.institutionProfile[field]) {
          issues.push({
            category: 'missing_data',
            severity: 'high',
            description: `Missing required institution field: ${field}`,
            field,
            recommendation: `Complete ${field} information`,
          });
        }
      });
    }

    // Vérifier la conformité réglementaire
    if (!profile.regulatoryProfile || !profile.regulatoryProfile.complianceStatus) {
      issues.push({
        category: 'compliance_issue',
        severity: 'high',
        description: 'Missing regulatory compliance information',
        recommendation: 'Update regulatory compliance status',
      });
    }

    return issues;
  }

  private async validateCompanyProfile(profile: any): Promise<Array<any>> {
    const issues: Array<any> = [];

    // Vérifier le profil entreprise
    if (!profile.companyProfile) {
      issues.push({
        category: 'missing_data',
        severity: 'critical',
        description: 'Missing company-specific profile data',
        recommendation: 'Request complete company profile from customer-service',
      });
    } else {
      const requiredFields = ['legalForm', 'industry', 'rccm', 'activities'];

      requiredFields.forEach(field => {
        if (!profile.companyProfile[field]) {
          issues.push({
            category: 'missing_data',
            severity: 'medium',
            description: `Missing company field: ${field}`,
            field,
            recommendation: `Complete ${field} information`,
          });
        }
      });
    }

    // Vérifier l'identification étendue
    if (!profile.extendedProfile || !profile.extendedProfile.isComplete) {
      issues.push({
        category: 'incomplete_section',
        severity: 'medium',
        description: 'Extended identification form is not complete',
        recommendation: 'Complete enterprise identification form',
      });
    }

    // Vérifier le patrimoine
    if (!profile.patrimoine || (!profile.patrimoine.assets?.length && !profile.patrimoine.stocks?.length)) {
      issues.push({
        category: 'missing_data',
        severity: 'low',
        description: 'No assets or stocks data available',
        recommendation: 'Add company assets and inventory information',
      });
    }

    return issues;
  }

  private async scheduleRetry(customerId: string, syncId: string, attemptNumber: number): Promise<void> {
    // Délai exponentiel: 2^attemptNumber minutes
    const delayMinutes = Math.pow(2, attemptNumber);
    
    setTimeout(async () => {
      this.logger.log(`Retrying sync for customer ${customerId} (attempt ${attemptNumber})`);
      
      const profile = await this.customersService.getCustomerDetailedProfile(customerId);
      if (profile) {
        const customerType = profile.customerType === 'FINANCIAL_INSTITUTION' ? 'FINANCIAL_INSTITUTION' : 'COMPANY';
        
        await this.orchestrateCompleteProfileSync({
          customerId,
          customerType,
          triggerReason: 'admin_request',
          requestingService: 'admin-service-retry',
          priority: 'high',
        });
      }
    }, delayMinutes * 60 * 1000);
  }

  private async notifyAdminsSyncFailure(customerId: string, syncId: string, error: string): Promise<void> {
    // TODO: Implémenter les notifications aux administrateurs
    // Par exemple: email, notification push, webhook, etc.
    this.logger.error(`ADMIN NOTIFICATION: Sync failure for customer ${customerId} - Sync ID: ${syncId} - Error: ${error}`);
    
    // Publier un événement pour notification
    await this.eventsService.publishAdminNotification({
      type: 'sync_failure',
      severity: 'high',
      customerId,
      message: `Profile synchronization failed after multiple attempts`,
      details: { syncId, error },
      timestamp: new Date().toISOString(),
    });
  }
}