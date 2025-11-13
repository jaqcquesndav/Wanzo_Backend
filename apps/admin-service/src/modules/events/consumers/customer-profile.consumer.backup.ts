import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';
import { CustomersService } from '../../customers/services/customers.service';

/**
 * Consumer pour recevoir et traiter les profils clients détaillés
 * depuis le customer-service via Kafka
 */
@Injectable()
export class CustomerProfileConsumer {
  private readonly logger = new Logger(CustomerProfileConsumer.name);

  constructor(
    private readonly customersService: CustomersService,
  ) {}

  /**
   * Reçoit et traite les profils complets d'entreprises (PME)
   */
  @EventPattern('admin.customer.company.profile.shared')
  async handleCompanyProfileShared(
    @Payload() profileData: {
      customerId: string;
      customerType: 'COMPANY';
      name: string;
      email: string;
      phone?: string;
      logo?: string;
      address?: any;
      status: string;
      accountType?: string;
      createdAt?: string;
      updatedAt?: string;
      
      companyProfile: {
        legalForm?: string;
        industry?: string;
        size?: string;
        rccm?: string;
        taxId?: string;
        natId?: string;
        activities?: any;
        capital?: any;
        financials?: any;
        affiliations?: any;
        owner?: any;
        associates?: any[];
        locations?: any[];
        yearFounded?: number;
        employeeCount?: number;
        contactPersons?: any[];
        socialMedia?: any;
      };
      
      extendedProfile?: {
        generalInfo?: any;
        legalInfo?: any;
        patrimonyAndMeans?: any;
        specificities?: any;
        performance?: any;
        completionPercentage?: number;
        isComplete?: boolean;
      };
      
      patrimoine: {
        assets: any[];
        stocks: any[];
        totalAssetsValue: number;
        lastValuationDate?: string;
      };
      
      profileCompleteness: {
        percentage: number;
        missingFields: string[];
        completedSections: string[];
      };
      
      lastProfileUpdate: string;
    },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Received company profile for customer: ${profileData.customerId}`);
    
    try {
      // Créer ou mettre à jour le profil client dans admin-service
      const customerProfile = await this.customersService.createOrUpdateCustomerProfile({
        customerId: profileData.customerId,
        customerType: 'PME' as any,
        basicInfo: {
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          logo: profileData.logo,
          address: profileData.address,
          status: profileData.status as any,
          accountType: profileData.accountType as any,
        },
        detailedProfile: {
          companyProfile: profileData.companyProfile,
          extendedProfile: profileData.extendedProfile,
          patrimoine: profileData.patrimoine,
        },
        metadata: {
          profileCompleteness: profileData.profileCompleteness,
          lastSyncFromCustomerService: profileData.lastProfileUpdate,
          dataSource: 'customer-service-kafka',
        }
      });

      this.logger.log(`Successfully processed company profile for customer ${profileData.customerId}`);
      
      // Optionnel: Émettre un événement de confirmation
      // await this.eventsService.emitCustomerProfileSynced(customerProfile);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process company profile for customer ${profileData.customerId}: ${err.message}`, err.stack);
    }
  }

  /**
   * Reçoit et traite les profils complets d'institutions financières
   */
  @EventPattern('admin.customer.institution.profile.shared')
  async handleInstitutionProfileShared(
    @Payload() profileData: {
      customerId: string;
      customerType: 'FINANCIAL_INSTITUTION';
      name: string;
      email: string;
      phone?: string;
      logo?: string;
      address?: any;
      status: string;
      accountType?: string;
      createdAt?: string;
      updatedAt?: string;
      
      institutionProfile: {
        denominationSociale?: string;
        sigleLegalAbrege?: string;
        type?: string;
        category?: string;
        licenseNumber?: string;
        establishedDate?: string;
        typeInstitution?: string;
        autorisationExploitation?: string;
        dateOctroi?: string;
        autoriteSupervision?: string;
        dateAgrement?: string;
        coordonneesGeographiques?: any;
        regulatoryInfo?: any;
        website?: string;
        brandColors?: any;
        facebookPage?: string;
        linkedinPage?: string;
        capitalStructure?: any;
        branches?: any[];
        contacts?: any;
        leadership?: any;
        services?: any;
        financialInfo?: any;
        digitalPresence?: any;
        partnerships?: any;
        certifications?: any;
        creditRating?: any;
        performanceMetrics?: any;
      };
      
      regulatoryProfile?: {
        complianceStatus?: string;
        lastAuditDate?: string;
        reportingRequirements?: any[];
        riskAssessment?: string;
      };
      
      profileCompleteness: {
        percentage: number;
        missingFields: string[];
        completedSections: string[];
      };
      
      lastProfileUpdate: string;
    },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Received institution profile for customer: ${profileData.customerId}`);
    
    try {
      // Créer ou mettre à jour le profil client dans admin-service
      const customerProfile = await this.customersService.createOrUpdateCustomerProfile({
        customerId: profileData.customerId,
        customerType: 'FINANCIAL' as any,
        basicInfo: {
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          logo: profileData.logo,
          address: profileData.address,
          status: profileData.status as any,
          accountType: profileData.accountType as any,
        },
        detailedProfile: {
          institutionProfile: profileData.institutionProfile,
          regulatoryProfile: profileData.regulatoryProfile,
        },
        metadata: {
          profileCompleteness: profileData.profileCompleteness,
          lastSyncFromCustomerService: profileData.lastProfileUpdate,
          dataSource: 'customer-service-kafka',
        }
      });

      this.logger.log(`Successfully processed institution profile for customer ${profileData.customerId}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process institution profile for customer ${profileData.customerId}: ${err.message}`, err.stack);
    }
  }

  /**
   * Reçoit les notifications de mise à jour de profil
   */
  @EventPattern('admin.customer.profile.updated')
  async handleCustomerProfileUpdated(
    @Payload() updateData: {
      customerId: string;
      customerType: 'COMPANY' | 'FINANCIAL_INSTITUTION';
      updatedFields: string[];
      updateContext: {
        updatedBy?: string;
        updateSource: 'form_submission' | 'admin_action' | 'system_update';
        formType?: string;
      };
      timestamp: string;
    },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Received profile update notification for customer: ${updateData.customerId}`);
    
    try {
      // Marquer le profil comme ayant besoin d'une synchronisation
      await this.customersService.markCustomerForResync(updateData.customerId, {
        lastUpdateNotified: updateData.timestamp,
        updatedFields: updateData.updatedFields,
        updateContext: updateData.updateContext,
      });

      this.logger.log(`Marked customer ${updateData.customerId} for profile resync`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process profile update notification for customer ${updateData.customerId}: ${err.message}`, err.stack);
    }
  }

  /**
   * Traite les demandes de synchronisation de profil
   */
  @EventPattern('admin.customer.profile.sync.request')
  async handleProfileSyncRequest(
    @Payload() syncRequest: {
      customerId: string;
      requestingService: string;
      requestedData: string[];
      priority: 'low' | 'normal' | 'high' | 'urgent';
      requestId: string;
      timestamp: string;
    },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Received profile sync request for customer: ${syncRequest.customerId}`);
    
    try {
      // Si c'est une demande urgente, demander immédiatement la synchronisation
      if (syncRequest.priority === 'urgent' || syncRequest.priority === 'high') {
        await this.customersService.requestCustomerProfileSync(syncRequest.customerId, {
          requestedData: syncRequest.requestedData,
          requestId: syncRequest.requestId,
          priority: syncRequest.priority,
        });
      } else {
        // Pour les demandes normales/basses, programmer la synchronisation
        await this.customersService.scheduleCustomerProfileSync(syncRequest.customerId, {
          requestedData: syncRequest.requestedData,
          requestId: syncRequest.requestId,
          priority: syncRequest.priority,
          scheduledFor: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        });
      }

      this.logger.log(`Processed profile sync request ${syncRequest.requestId} for customer ${syncRequest.customerId}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process profile sync request for customer ${syncRequest.customerId}: ${err.message}`, err.stack);
    }
  }

  // =====================================================
  // NOUVEAUX HANDLERS POUR STRUCTURES V2.1
  // =====================================================

  /**
   * Traite les données spécialisées d'institution financière (70+ champs v2.1)
   */
  @EventPattern('admin.customer.financial.institution.specific.data')
  async handleFinancialInstitutionSpecificData(
    @Payload() data: {
      customerId: string;
      dataType: 'FINANCIAL_INSTITUTION_SPECIFIC_V2_1';
      specificData: {
        // Informations légales et réglementaires
        denominationSociale: string;
        sigleLegalAbrege?: string;
        numeroAgrement: string;
        dateAgrement: string;
        autoriteSupervision: string;
        typeInstitution: string;
        categorieInstitution?: string;
        
        // Activités autorisées
        activitesAutorisees: string[];
        servicesOfferts: string[];
        produitsBancaires?: string[];
        
        // Structure du capital
        capitalSocial: number;
        capitalMinimumReglementaire: number;
        structureActionnariat: any[];
        principauxActionnaires: any[];
        
        // Gouvernance
        conseilAdministration: any[];
        directionGenerale: any[];
        comitesSpecialises: any[];
        
        // Réseau et implantations
        siegeSocial: any;
        agences: any[];
        pointsService: any[];
        reseauDistribution: any;
        
        // Informations financières
        chiffreAffaires: number;
        totalBilan: number;
        fondsPropreNets: number;
        ratioSolvabilite: number;
        notationCredit?: string;
        
        // Présence digitale
        siteWeb?: string;
        plateformeDigitale?: any;
        servicesEnLigne: string[];
        applicationsMobiles?: any[];
        
        // Partenariats et affiliations
        partenairesStrategiques?: any[];
        affiliationsInternationales?: any[];
        reseauxCorrespondants?: any[];
        
        // Conformité et certifications
        certificationsISO?: string[];
        auditExterne?: any;
        rapportsConformite: any[];
        
        // Données complémentaires
        historiquePerformances?: any[];
        indicateursRisque?: any;
        perspectivesStrategiques?: string;
        notesSpeciales?: string;
      };
      dataVersion: '2.1';
      timestamp: string;
    },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Received financial institution specific data (v2.1) for customer: ${data.customerId}`);
    
    try {
      // Mettre à jour le profil avec les données spécialisées
      await this.customersService.updateCustomerSpecificData(data.customerId, {
        dataType: 'FINANCIAL_INSTITUTION_V2_1',
        specificData: data.specificData,
        version: '2.1',
        receivedAt: new Date().toISOString(),
      });

      // Calculer le nouveau pourcentage de complétude avec les 70+ champs
      const completeness = this.calculateFinancialInstitutionCompleteness(data.specificData);
      
      await this.customersService.updateCustomerCompleteness(data.customerId, {
        overallPercentage: completeness.percentage,
        sections: {
          basicInfo: completeness.basicInfoComplete,
          legalInfo: completeness.legalInfoComplete,
          governanceInfo: completeness.governanceComplete,
          financialInfo: completeness.financialInfoComplete,
          digitalPresence: completeness.digitalPresenceComplete,
          compliance: completeness.complianceComplete,
        },
        missingCriticalFields: completeness.missingCriticalFields,
        lastCalculated: new Date().toISOString(),
      });

      this.logger.log(`Successfully processed financial institution specific data (v2.1) for customer ${data.customerId} - ${completeness.percentage}% complete`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process financial institution specific data for customer ${data.customerId}: ${err.message}`, err.stack);
    }
  }

  /**
   * Traite les données de patrimoine (AssetData v2.1)
   */
  @EventPattern('admin.customer.assets.data')
  async handleAssetDataUpdate(
    @Payload() data: {
      customerId: string;
      dataType: 'ASSET_DATA_V2_1';
      assets: {
        id: string;
        nom: string;
        description: string;
        categorie: string;
        sousCategorie?: string;
        prixAchat: number;
        dateAcquisition: string;
        valeurActuelle: number;
        dateEvaluation: string;
        etatActuel: 'neuf' | 'tres_bon' | 'bon' | 'moyen' | 'mauvais' | 'deteriore';
        proprietaire: string;
        localisation?: string;
        numeroSerie?: string;
        garantie?: { dateExpiration: string; fournisseur: string; };
        documentsAssocies?: string[];
        metadata?: Record<string, any>;
      }[];
      summary: {
        totalValue: number;
        assetsCount: number;
        lastUpdateDate: string;
        depreciation: number;
      };
      dataVersion: '2.1';
      timestamp: string;
    },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Received asset data (v2.1) for customer: ${data.customerId} - ${data.assets.length} assets`);
    
    try {
      // Mettre à jour les données de patrimoine
      await this.customersService.updateCustomerAssets(data.customerId, {
        assets: data.assets,
        summary: data.summary,
        version: '2.1',
        receivedAt: new Date().toISOString(),
      });

      // Mettre à jour les métriques financières basées sur les actifs
      await this.customersService.updateFinancialMetrics(data.customerId, {
        totalAssetsValue: data.summary.totalValue,
        assetsCount: data.summary.assetsCount,
        depreciationRate: data.summary.depreciation,
        lastAssetsUpdate: data.summary.lastUpdateDate,
      });

      this.logger.log(`Successfully processed asset data (v2.1) for customer ${data.customerId} - Total value: ${data.summary.totalValue}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process asset data for customer ${data.customerId}: ${err.message}`, err.stack);
    }
  }

  /**
   * Traite les données de stock professionnel (StockData v2.1)
   */
  @EventPattern('admin.customer.stocks.data')
  async handleStockDataUpdate(
    @Payload() data: {
      customerId: string;
      dataType: 'STOCK_DATA_V2_1';
      stocks: {
        id: string;
        nomProduit: string;
        codeProduit: string;
        categorie: string;
        quantiteStock: number;
        seuilMinimum: number;
        seuilMaximum: number;
        coutUnitaire: number;
        valeurTotaleStock: number;
        uniteMessure: string;
        fournisseurPrincipal?: string;
        dateEntreeStock: string;
        dateDerniereRotation?: string;
        emplacementStock: string;
        etatStock: 'disponible' | 'reserve' | 'endommage' | 'expire';
        metadata?: Record<string, any>;
      }[];
      summary: {
        totalStockValue: number;
        totalItems: number;
        lowStockItems: number;
        lastUpdateDate: string;
      };
      dataVersion: '2.1';
      timestamp: string;
    },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Received stock data (v2.1) for customer: ${data.customerId} - ${data.stocks.length} items`);
    
    try {
      // Mettre à jour les données de stock
      await this.customersService.updateCustomerStocks(data.customerId, {
        stocks: data.stocks,
        summary: data.summary,
        version: '2.1',
        receivedAt: new Date().toISOString(),
      });

      // Identifier les stocks à faible niveau
      const lowStockAlerts = data.stocks.filter(stock => 
        stock.quantiteStock <= stock.seuilMinimum && stock.etatStock === 'disponible'
      );

      if (lowStockAlerts.length > 0) {
        await this.customersService.createStockAlerts(data.customerId, {
          lowStockItems: lowStockAlerts,
          alertLevel: 'medium',
          createdAt: new Date().toISOString(),
        });
      }

      // Mettre à jour les métriques d'inventaire
      await this.customersService.updateInventoryMetrics(data.customerId, {
        totalStockValue: data.summary.totalStockValue,
        totalItems: data.summary.totalItems,
        lowStockItemsCount: data.summary.lowStockItems,
        lastStockUpdate: data.summary.lastUpdateDate,
        rotationMetrics: this.calculateStockRotationMetrics(data.stocks),
      });

      this.logger.log(`Successfully processed stock data (v2.1) for customer ${data.customerId} - Total stock value: ${data.summary.totalStockValue}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process stock data for customer ${data.customerId}: ${err.message}`, err.stack);
    }
  }

  /**
   * Traite le formulaire d'identification d'entreprise étendu
   */
  @EventPattern('admin.customer.enterprise.identification')
  async handleEnterpriseIdentificationForm(
    @Payload() data: {
      customerId: string;
      dataType: 'ENTERPRISE_IDENTIFICATION_FORM_V2_1';
      identification: {
        generalInfo: any;
        legalInfo: any;
        patrimonyAndMeans: any;
        specificities: any;
        performance: any;
        completionPercentage: number;
        lastUpdated: string;
        isComplete: boolean;
        validatedBy?: string;
        validationDate?: string;
      };
      dataVersion: '2.1';
      timestamp: string;
    },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Received enterprise identification form (v2.1) for customer: ${data.customerId} - ${data.identification.completionPercentage}% complete`);
    
    try {
      // Mettre à jour l'identification étendue
      await this.customersService.updateCustomerExtendedIdentification(data.customerId, {
        identification: data.identification,
        version: '2.1',
        receivedAt: new Date().toISOString(),
      });

      // Si le formulaire est complet et validé, mettre à jour le statut
      if (data.identification.isComplete && data.identification.validatedBy) {
        await this.customersService.updateCustomerValidationStatus(data.customerId, {
          identificationComplete: true,
          validatedBy: data.identification.validatedBy,
          validationDate: data.identification.validationDate,
          completionPercentage: data.identification.completionPercentage,
        });
      }

      // Calculer les scores de risque basés sur l'identification étendue
      const riskAssessment = this.calculateEnterpriseRiskAssessment(data.identification);
      await this.customersService.updateCustomerRiskProfile(data.customerId, riskAssessment);

      this.logger.log(`Successfully processed enterprise identification form (v2.1) for customer ${data.customerId}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process enterprise identification form for customer ${data.customerId}: ${err.message}`, err.stack);
    }
  }

  /**
   * Traite les profils complets v2.1
   */
  @EventPattern('admin.customer.complete.profile.v2_1')
  async handleCompleteProfileV21(
    @Payload() profileData: {
      customerId: string;
      customerType: 'COMPANY' | 'FINANCIAL_INSTITUTION';
      name: string;
      email: string;
      phone?: string;
      logo?: string;
      address?: any;
      status: string;
      accountType?: string;
      createdAt?: string;
      updatedAt?: string;
      dataVersion: '2.1';
      
      // Données spécifiques selon le type
      institutionSpecificData?: any;
      companySpecificData?: any;
      extendedIdentification?: any;
      patrimoine?: {
        assets: any[];
        stocks: any[];
        totalAssetsValue: number;
        totalStockValue: number;
        lastUpdateDate: string;
      };
      complianceData?: any;
      performanceMetrics?: any;
      
      profileCompleteness: {
        percentage: number;
        missingFields: string[];
        completedSections: string[];
      };
    },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Received complete profile (v2.1) for customer: ${profileData.customerId} (${profileData.customerType})`);
    
    try {
      // Traitement unifié pour tous les types de profils v2.1
      const processedProfile = await this.customersService.processCompleteProfileV21(profileData.customerId, {
        basicInfo: {
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phone,
          logo: profileData.logo,
          address: profileData.address,
          status: profileData.status,
          accountType: profileData.accountType,
        },
        customerType: profileData.customerType,
        specificData: profileData.institutionSpecificData || profileData.companySpecificData,
        extendedData: {
          identification: profileData.extendedIdentification,
          patrimoine: profileData.patrimoine,
          compliance: profileData.complianceData,
          performance: profileData.performanceMetrics,
        },
        metadata: {
          dataVersion: '2.1',
          profileCompleteness: profileData.profileCompleteness,
          lastSyncFromCustomerService: new Date().toISOString(),
          dataSource: 'customer-service-kafka-v2.1',
        }
      });

      // Générer des insights automatiques basés sur le profil complet
      const insights = await this.generateCustomerInsights(profileData);
      await this.customersService.updateCustomerInsights(profileData.customerId, insights);

      this.logger.log(`Successfully processed complete profile (v2.1) for customer ${profileData.customerId} - ${profileData.profileCompleteness.percentage}% complete`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process complete profile (v2.1) for customer ${profileData.customerId}: ${err.message}`, err.stack);
    }
  }

  /**
   * Traite les synchronisations de données critiques
   */
  @EventPattern('admin.customer.critical.sync.priority')
  @EventPattern('admin.customer.data.sync')
  async handleCriticalDataSync(
    @Payload() data: {
      customerId: string;
      syncType: 'full_profile' | 'financial_data' | 'assets_update' | 'compliance_update';
      priority: 'high' | 'medium' | 'low';
      changes: {
        field: string;
        oldValue: any;
        newValue: any;
        impact: 'high' | 'medium' | 'low';
      }[];
      metadata: {
        source: string;
        requestId: string;
        requiresAdminApproval?: boolean;
      };
      timestamp: string;
      dataVersion: '2.1';
    },
    @Ctx() context: KafkaContext,
  ) {
    this.logger.log(`Received critical data sync (${data.priority}) for customer: ${data.customerId} - ${data.changes.length} changes`);
    
    try {
      // Traiter les changements selon leur impact
      const highImpactChanges = data.changes.filter(change => change.impact === 'high');
      
      if (highImpactChanges.length > 0) {
        // Les changements à fort impact nécessitent une attention particulière
        await this.customersService.processHighImpactChanges(data.customerId, {
          changes: highImpactChanges,
          syncType: data.syncType,
          requiresApproval: data.metadata.requiresAdminApproval,
          requestId: data.metadata.requestId,
        });
      }

      // Appliquer tous les changements
      await this.customersService.applySyncChanges(data.customerId, {
        changes: data.changes,
        syncType: data.syncType,
        priority: data.priority,
        source: data.metadata.source,
        appliedAt: new Date().toISOString(),
      });

      // Si synchronisation complète, demander re-validation du profil
      if (data.syncType === 'full_profile') {
        await this.customersService.scheduleProfileRevalidation(data.customerId, {
          reason: 'full_profile_sync',
          priority: data.priority,
          requestId: data.metadata.requestId,
        });
      }

      this.logger.log(`Successfully processed critical data sync for customer ${data.customerId} - Request: ${data.metadata.requestId}`);
      
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Failed to process critical data sync for customer ${data.customerId}: ${err.message}`, err.stack);
    }
  }

  // =====================================================
  // MÉTHODES UTILITAIRES POUR TRAITEMENT V2.1
  // =====================================================

  /**
   * Calcule la complétude d'une institution financière avec les 70+ champs v2.1
   */
  private calculateFinancialInstitutionCompleteness(specificData: any): {
    percentage: number;
    basicInfoComplete: boolean;
    legalInfoComplete: boolean;
    governanceComplete: boolean;
    financialInfoComplete: boolean;
    digitalPresenceComplete: boolean;
    complianceComplete: boolean;
    missingCriticalFields: string[];
  } {
    const criticalFields = [
      'denominationSociale', 'numeroAgrement', 'autoriteSupervision', 
      'typeInstitution', 'capitalSocial', 'totalBilan', 'ratioSolvabilite'
    ];
    
    const missingCriticalFields = criticalFields.filter(field => !specificData[field]);
    
    let completedSections = 0;
    const totalSections = 6;
    
    // Vérification section par section
    const basicInfoComplete = !!(specificData.denominationSociale && specificData.typeInstitution);
    const legalInfoComplete = !!(specificData.numeroAgrement && specificData.autoriteSupervision);
    const governanceComplete = !!(specificData.conseilAdministration?.length > 0 && specificData.directionGenerale?.length > 0);
    const financialInfoComplete = !!(specificData.capitalSocial && specificData.totalBilan);
    const digitalPresenceComplete = !!(specificData.siteWeb || specificData.servicesEnLigne?.length > 0);
    const complianceComplete = !!(specificData.certificationsISO?.length > 0 || specificData.rapportsConformite?.length > 0);
    
    if (basicInfoComplete) completedSections++;
    if (legalInfoComplete) completedSections++;
    if (governanceComplete) completedSections++;
    if (financialInfoComplete) completedSections++;
    if (digitalPresenceComplete) completedSections++;
    if (complianceComplete) completedSections++;
    
    const percentage = Math.round((completedSections / totalSections) * 100);
    
    return {
      percentage,
      basicInfoComplete,
      legalInfoComplete,
      governanceComplete,
      financialInfoComplete,
      digitalPresenceComplete,
      complianceComplete,
      missingCriticalFields,
    };
  }

  /**
   * Calcule les métriques de rotation de stock
   */
  private calculateStockRotationMetrics(stocks: any[]): {
    averageRotationDays: number;
    fastMovingItems: number;
    slowMovingItems: number;
    stagnantItems: number;
  } {
    const now = new Date();
    let totalRotationDays = 0;
    let itemsWithRotation = 0;
    let fastMovingItems = 0;
    let slowMovingItems = 0;
    let stagnantItems = 0;

    stocks.forEach(stock => {
      if (stock.dateDerniereRotation) {
        const rotationDate = new Date(stock.dateDerniereRotation);
        const daysSinceRotation = Math.floor((now.getTime() - rotationDate.getTime()) / (1000 * 60 * 60 * 24));
        
        totalRotationDays += daysSinceRotation;
        itemsWithRotation++;
        
        if (daysSinceRotation <= 30) {
          fastMovingItems++;
        } else if (daysSinceRotation <= 90) {
          slowMovingItems++;
        } else {
          stagnantItems++;
        }
      }
    });

    return {
      averageRotationDays: itemsWithRotation > 0 ? Math.round(totalRotationDays / itemsWithRotation) : 0,
      fastMovingItems,
      slowMovingItems,
      stagnantItems,
    };
  }

  /**
   * Calcule l'évaluation des risques d'entreprise basé sur l'identification étendue
   */
  private calculateEnterpriseRiskAssessment(identification: any): {
    overallRiskScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
    recommendations: string[];
  } {
    let riskScore = 0;
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    // Évaluation basée sur les données financières
    if (identification.patrimonyAndMeans) {
      const { chiffreAffairesAnnuel, beneficeNet, nombreEmployes } = identification.patrimonyAndMeans;
      
      if (chiffreAffairesAnnuel && chiffreAffairesAnnuel < 100000) {
        riskScore += 20;
        riskFactors.push('Chiffre d\'affaires faible');
      }
      
      if (beneficeNet && beneficeNet < 0) {
        riskScore += 30;
        riskFactors.push('Bénéfices négatifs');
        recommendations.push('Améliorer la rentabilité');
      }
      
      if (nombreEmployes && nombreEmployes < 3) {
        riskScore += 10;
        riskFactors.push('Équipe réduite');
      }
    }

    // Évaluation basée sur les performances
    if (identification.performance) {
      const { croissanceCA, evolitionEffectifs } = identification.performance;
      
      if (croissanceCA && croissanceCA < 0) {
        riskScore += 25;
        riskFactors.push('Croissance négative');
        recommendations.push('Stratégie de redressement nécessaire');
      }
      
      if (evolitionEffectifs && evolitionEffectifs < -10) {
        riskScore += 15;
        riskFactors.push('Réduction importante des effectifs');
      }
    }

    // Déterminer le niveau de risque
    let riskLevel: 'low' | 'medium' | 'high';
    if (riskScore <= 20) {
      riskLevel = 'low';
    } else if (riskScore <= 50) {
      riskLevel = 'medium';
      recommendations.push('Surveillance accrue recommandée');
    } else {
      riskLevel = 'high';
      recommendations.push('Évaluation approfondie requise');
    }

    return {
      overallRiskScore: riskScore,
      riskLevel,
      riskFactors,
      recommendations,
    };
  }

  /**
   * Génère des insights automatiques basés sur le profil complet
   */
  private async generateCustomerInsights(profileData: any): Promise<{
    insights: string[];
    recommendations: string[];
    opportunitiesIdentified: string[];
    alertsTriggered: string[];
  }> {
    const insights: string[] = [];
    const recommendations: string[] = [];
    const opportunitiesIdentified: string[] = [];
    const alertsTriggered: string[] = [];

    // Analyse basée sur le type de client
    if (profileData.customerType === 'FINANCIAL_INSTITUTION') {
      // Insights pour institutions financières
      if (profileData.institutionSpecificData?.ratioSolvabilite) {
        const ratio = profileData.institutionSpecificData.ratioSolvabilite;
        if (ratio > 15) {
          insights.push('Ratio de solvabilité excellent, institution bien capitalisée');
          opportunitiesIdentified.push('Potentiel pour expansion des services');
        } else if (ratio < 8) {
          insights.push('Ratio de solvabilité préoccupant');
          alertsTriggered.push('Surveillance renforcée recommandée');
          recommendations.push('Amélioration du capital requis');
        }
      }
      
      if (profileData.institutionSpecificData?.servicesEnLigne?.length > 0) {
        insights.push('Présence digitale établie');
        opportunitiesIdentified.push('Intégration API avancée possible');
      }
    } else if (profileData.customerType === 'COMPANY') {
      // Insights pour entreprises
      if (profileData.patrimoine) {
        const { totalAssetsValue, totalStockValue } = profileData.patrimoine;
        const totalPatrimoine = totalAssetsValue + totalStockValue;
        
        if (totalPatrimoine > 1000000) {
          insights.push('Patrimoine important, client à fort potentiel');
          opportunitiesIdentified.push('Services premium adaptés');
        }
        
        if (totalStockValue > totalAssetsValue * 0.8) {
          insights.push('Stock important par rapport aux actifs');
          recommendations.push('Optimisation de la gestion des stocks');
        }
      }
    }

    // Analyse de complétude
    if (profileData.profileCompleteness.percentage < 70) {
      alertsTriggered.push('Profil incomplet - données manquantes');
      recommendations.push('Accompagnement pour compléter le profil');
    } else if (profileData.profileCompleteness.percentage >= 90) {
      insights.push('Profil très complet, client bien qualifié');
      opportunitiesIdentified.push('Processus d\'approbation accéléré possible');
    }

    return {
      insights,
      recommendations,
      opportunitiesIdentified,
      alertsTriggered,
    };
  }
}