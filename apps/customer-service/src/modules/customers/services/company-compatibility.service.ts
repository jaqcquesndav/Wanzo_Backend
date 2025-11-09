import { Injectable, Logger } from '@nestjs/common';
import { Customer } from '../entities/customer.entity';
import { CompanyResponseDto, AssetDataDto, StockDataDto, ActivitiesExtendedDto } from '../dto/company.dto';

/**
 * Service de compatibilité pour la migration vers les structures v2.1
 * Gère la conversion transparente entre anciens et nouveaux formats
 */
@Injectable()
export class CompanyCompatibilityService {
  private readonly logger = new Logger(CompanyCompatibilityService.name);

  /**
   * Convertit les données d'une entité Customer vers le format de réponse CompanyResponseDto
   * avec compatibilité v2.1
   */
  convertCustomerToCompanyResponse(customer: Customer): CompanyResponseDto {
    const response: CompanyResponseDto = {
      id: customer.id,
      name: customer.name,
      logo: customer.logo,
      description: customer.description,
      legalForm: customer.legalForm,
      industry: customer.industry,
      size: customer.size,
      website: customer.website,
      facebookPage: customer.facebookPage,
      rccm: customer.rccm,
      taxId: customer.taxId,
      natId: customer.natId,
      
      // Adresse
      address: customer.address ? {
        street: customer.address.street,
        commune: customer.address.commune,
        city: customer.address.city,
        province: customer.address.province,
        country: customer.address.country,
      } : undefined,

      // Emplacements
      locations: customer.locations?.map(loc => ({
        name: loc.name,
        type: loc.type,
        address: loc.address,
        coordinates: loc.coordinates ? {
          lat: loc.coordinates.lat,
          lng: loc.coordinates.lng,
        } : undefined,
      })),

      // Contacts
      contacts: customer.contacts,

      // Propriétaire
      owner: customer.owner,

      // Associés
      associates: customer.associates,

      // Activités avec compatibilité v2.1
      activities: customer.activities,
      
      // NOUVEAU v2.1 - Secteurs d'activité étendus et secteurs personnalisés
      activitiesExtended: this.convertToExtendedActivities(customer),
      secteursPersnnalises: customer.secteursPersnnalises,

      // Capital
      capital: customer.capital,

      // Données financières
      financials: customer.financials,

      // Affiliations
      affiliations: customer.affiliations,

      // Formulaire d'identification étendu
      extendedIdentification: customer.extendedIdentification ? {
        id: customer.extendedIdentification.id,
        customerId: customer.extendedIdentification.customerId,
        generalInfo: {
          companyName: customer.extendedIdentification.generalInfo?.companyName || '',
          tradeName: customer.extendedIdentification.generalInfo?.tradeName,
          legalForm: customer.extendedIdentification.generalInfo?.legalForm || 'SARL',
          companyType: customer.extendedIdentification.generalInfo?.companyType || 'traditional',
          sector: customer.extendedIdentification.generalInfo?.sector || '',
          foundingDate: customer.extendedIdentification.generalInfo?.foundingDate?.toISOString(),
          headquarters: customer.extendedIdentification.generalInfo?.headquarters || {
            address: '',
            city: '',
            province: '',
            country: ''
          },
          mainContact: customer.extendedIdentification.generalInfo?.mainContact || {
            name: '',
            position: '',
            email: '',
            phone: ''
          },
          digitalPresence: customer.extendedIdentification.generalInfo?.digitalPresence,
        },
        legalInfo: customer.extendedIdentification.legalInfo ? this.convertLegalInfoToDto(customer.extendedIdentification.legalInfo) : undefined,
        patrimonyAndMeans: customer.extendedIdentification.patrimonyAndMeans as any, // TODO: Implémenter la conversion complète
        specificities: customer.extendedIdentification.specificities as any, // TODO: Implémenter la conversion complète
        performance: customer.extendedIdentification.performance as any, // TODO: Implémenter la conversion complète
        completionPercentage: this.calculateCompletionPercentage(customer.extendedIdentification),
        completionStatus: this.calculateCompletionStatus(customer.extendedIdentification),
        createdAt: customer.extendedIdentification.createdAt.toISOString(),
        updatedAt: customer.extendedIdentification.updatedAt.toISOString(),
      } as any : undefined,

      // Actifs détaillés v2.1 (extraits du formulaire étendu si disponible)
      equipment: this.extractEquipmentAssets(customer),
      vehicles: this.extractVehicleAssets(customer),
      stocks: this.extractStocks(customer),

      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };

    return response;
  }

  /**
   * Convertit les activités vers le format étendu v2.1
   */
  private convertToExtendedActivities(customer: Customer): ActivitiesExtendedDto | undefined {
    if (!customer.activities && !customer.secteursPersnnalises) {
      return undefined;
    }

    const secteursPersnnalises = customer.secteursPersnnalises || [];
    const activities = customer.activities;

    // Si nous avons déjà les nouveaux champs, les utiliser
    if (activities?.primary || activities?.secondary) {
      return {
        secteurActivitePrincipal: activities.primary || '',
        secteursActiviteSecondaires: activities.secondary?.filter(s => !secteursPersnnalises.includes(s)) || [],
        secteursPersonalises: secteursPersnnalises,
        activities: activities,
      };
    }

    return undefined;
  }

  /**
   * Extrait les actifs d'équipement du formulaire étendu
   */
  private extractEquipmentAssets(customer: Customer): AssetDataDto[] {
    if (!customer.extendedIdentification?.patrimonyAndMeans?.equipment) {
      return [];
    }

    return customer.extendedIdentification.patrimonyAndMeans.equipment.map(equipment => ({
      id: equipment.id,
      designation: equipment.designation,
      type: equipment.type,
      description: equipment.description,
      prixAchat: equipment.prixAchat,
      valeurActuelle: equipment.valeurActuelle,
      devise: equipment.devise,
      dateAcquisition: equipment.dateAcquisition,
      etatActuel: equipment.etatActuel,
      localisation: equipment.localisation,
      marque: equipment.marque,
      modele: equipment.modele,
      quantite: equipment.quantite,
      unite: equipment.unite,
      proprietaire: equipment.proprietaire,
      observations: equipment.observations,
    }));
  }

  /**
   * Extrait les actifs de véhicules du formulaire étendu
   */
  private extractVehicleAssets(customer: Customer): AssetDataDto[] {
    if (!customer.extendedIdentification?.patrimonyAndMeans?.vehicles) {
      return [];
    }

    return customer.extendedIdentification.patrimonyAndMeans.vehicles.map(vehicle => ({
      id: vehicle.id,
      designation: vehicle.designation,
      type: vehicle.type,
      marque: vehicle.marque,
      modele: vehicle.modele,
      prixAchat: vehicle.prixAchat,
      valeurActuelle: vehicle.valeurActuelle,
      devise: vehicle.devise,
      dateAcquisition: vehicle.dateAcquisition,
      etatActuel: vehicle.etatActuel,
      proprietaire: vehicle.proprietaire,
    }));
  }

  /**
   * Extrait les données de stocks du formulaire étendu
   */
  private extractStocks(customer: Customer): StockDataDto[] {
    if (!customer.extendedIdentification?.patrimonyAndMeans?.stocks) {
      return [];
    }

    return customer.extendedIdentification.patrimonyAndMeans.stocks.map(stock => ({
      id: stock.id,
      designation: stock.designation,
      categorie: stock.categorie,
      description: stock.description,
      quantiteStock: stock.quantiteStock,
      unite: stock.unite,
      seuilMinimum: stock.seuilMinimum,
      seuilMaximum: stock.seuilMaximum,
      coutUnitaire: stock.coutUnitaire,
      valeurTotaleStock: stock.valeurTotaleStock,
      devise: stock.devise,
      dateDernierInventaire: stock.dateDernierInventaire,
      dureeRotationMoyenne: stock.dureeRotationMoyenne,
      datePeremption: stock.datePeremption,
      emplacement: stock.emplacement,
      conditionsStockage: stock.conditionsStockage,
      fournisseurPrincipal: stock.fournisseurPrincipal,
      numeroLot: stock.numeroLot,
      codeArticle: stock.codeArticle,
      etatStock: stock.etatStock,
      observations: stock.observations,
    }));
  }

  /**
   * Calcule le statut de complétude du formulaire étendu
   */
  private calculateCompletionStatus(form: any): any {
    const generalInfoComplete = !!(form.generalInfo?.companyName && form.generalInfo?.legalForm);
    const legalInfoComplete = !!(form.legalInfo?.rccm || form.legalInfo?.taxNumber);
    const patrimonyComplete = !!(form.patrimonyAndMeans?.shareCapital?.authorizedCapital);
    const specificitiesComplete = !!(form.specificities?.startup || form.specificities?.traditional);
    const performanceComplete = !!(form.performance?.financial?.revenue?.length);

    const completedSections = [
      generalInfoComplete,
      legalInfoComplete,
      patrimonyComplete,
      specificitiesComplete,
      performanceComplete
    ].filter(Boolean).length;

    const overallCompletion = Math.round((completedSections / 5) * 100);

    return {
      generalInfo: generalInfoComplete,
      legalInfo: legalInfoComplete,
      patrimonyAndMeans: patrimonyComplete,
      specificities: specificitiesComplete,
      performance: performanceComplete,
      overallCompletion,
    };
  }

  /**
   * Migre les anciennes données d'activités vers le nouveau format v2.1
   */
  migrateActivitiesToV21(oldActivities: any, secteursPersnnalises: string[] = []): ActivitiesExtendedDto {
    return {
      secteurActivitePrincipal: oldActivities?.primary || '',
      secteursActiviteSecondaires: oldActivities?.secondary?.filter((s: string) => !secteursPersnnalises.includes(s)) || [],
      secteursPersonalises: secteursPersnnalises,
      activities: oldActivities,
    };
  }

  /**
   * Valide la cohérence des données de stocks (valeur totale = quantité × coût unitaire)
   */
  validateStockData(stock: StockDataDto): boolean {
    const calculatedTotal = stock.quantiteStock * stock.coutUnitaire;
    const tolerance = 0.01; // Tolérance pour les erreurs d'arrondi
    
    return Math.abs(stock.valeurTotaleStock - calculatedTotal) <= tolerance;
  }

  /**
   * Calcule automatiquement la valeur totale du stock
   */
  calculateStockTotal(quantite: number, coutUnitaire: number): number {
    return Math.round((quantite * coutUnitaire) * 100) / 100; // Arrondi à 2 décimales
  }

  /**
   * Nettoie et valide les données avant sauvegarde
   */
  sanitizeCompanyData(data: any): any {
    // Nettoyage des champs vides
    if (data.secteursPersnnalises) {
      data.secteursPersnnalises = data.secteursPersnnalises.filter((s: string) => s.trim().length > 0);
    }

    // Validation et correction des stocks
    if (data.stocks) {
      data.stocks = data.stocks.map((stock: StockDataDto) => ({
        ...stock,
        valeurTotaleStock: this.calculateStockTotal(stock.quantiteStock, stock.coutUnitaire),
      }));
    }

    // Validation des dates
    if (data.extendedIdentification?.generalInfo?.foundingDate) {
      const foundingDate = new Date(data.extendedIdentification.generalInfo.foundingDate);
      if (foundingDate > new Date()) {
        this.logger.warn('Date de fondation dans le futur détectée, correction appliquée');
        data.extendedIdentification.generalInfo.foundingDate = new Date();
      }
    }

    return data;
  }

  /**
   * Calcule le pourcentage de complétion du formulaire d'identification étendu
   */
  private calculateCompletionPercentage(extendedIdentification: any): number {
    let totalFields = 0;
    let completedFields = 0;

    // Informations générales (obligatoires)
    totalFields += 5; // legalForm, foundingDate, businessSector, mainActivity, description
    if (extendedIdentification.generalInfo?.legalForm) completedFields++;
    if (extendedIdentification.generalInfo?.foundingDate) completedFields++;
    if (extendedIdentification.generalInfo?.businessSector) completedFields++;
    if (extendedIdentification.generalInfo?.mainActivity) completedFields++;
    if (extendedIdentification.generalInfo?.description) completedFields++;

    // Informations légales (optionnelles mais importantes)
    totalFields += 4; // rccm, taxId, natId, businessLicense
    if (extendedIdentification.legalInfo?.rccm) completedFields++;
    if (extendedIdentification.legalInfo?.taxId) completedFields++;
    if (extendedIdentification.legalInfo?.natId) completedFields++;
    if (extendedIdentification.legalInfo?.businessLicense) completedFields++;

    // Patrimoine et moyens
    totalFields += 3; // assets, stocks, capitalInfo
    if (extendedIdentification.patrimonyAndMeans?.assets?.length > 0) completedFields++;
    if (extendedIdentification.patrimonyAndMeans?.stocks?.length > 0) completedFields++;
    if (extendedIdentification.patrimonyAndMeans?.capitalInfo) completedFields++;

    // Spécificités
    totalFields += 2; // targetMarkets, competitiveAdvantages
    if (extendedIdentification.specificities?.targetMarkets?.length > 0) completedFields++;
    if (extendedIdentification.specificities?.competitiveAdvantages?.length > 0) completedFields++;

    // Performance
    totalFields += 2; // financialHighlights, businessModel
    if (extendedIdentification.performance?.financialHighlights) completedFields++;
    if (extendedIdentification.performance?.businessModel) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  }

  /**
   * Convertit LegalInfo vers LegalInfoDto en gérant les conversions de dates
   */
  private convertLegalInfoToDto(legalInfo: any): any {
    if (!legalInfo) return undefined;

    const converted = { ...legalInfo };

    if (converted.businessLicense && converted.businessLicense.issuedDate instanceof Date) {
      converted.businessLicense = {
        ...converted.businessLicense,
        issuedDate: converted.businessLicense.issuedDate.toISOString(),
        expiryDate: converted.businessLicense.expiryDate instanceof Date 
          ? converted.businessLicense.expiryDate.toISOString()
          : converted.businessLicense.expiryDate
      };
    }

    if (converted.operatingLicenses) {
      converted.operatingLicenses = converted.operatingLicenses.map((license: any) => ({
        ...license,
        issuedDate: license.issuedDate instanceof Date 
          ? license.issuedDate.toISOString()
          : license.issuedDate,
        expiryDate: license.expiryDate instanceof Date 
          ? license.expiryDate.toISOString()
          : license.expiryDate
      }));
    }

    if (converted.taxCompliance) {
      converted.taxCompliance = {
        ...converted.taxCompliance,
        lastFilingDate: converted.taxCompliance.lastFilingDate instanceof Date
          ? converted.taxCompliance.lastFilingDate.toISOString()
          : converted.taxCompliance.lastFilingDate,
        nextFilingDue: converted.taxCompliance.nextFilingDue instanceof Date
          ? converted.taxCompliance.nextFilingDue.toISOString()
          : converted.taxCompliance.nextFilingDue
      };
    }

    return converted;
  }
}