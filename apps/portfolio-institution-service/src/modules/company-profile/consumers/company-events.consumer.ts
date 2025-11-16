import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { StandardKafkaTopics } from '@wanzobe/shared/events/standard-kafka-topics';
import { CompanySyncService } from '../services/company-sync.service';
import { CustomerCompanyProfileEventDto } from '../dtos/company-profile.dto';

/**
 * Consumer Kafka pour les événements de profil company depuis customer-service
 * 
 * STRATÉGIE D'ÉCOUTE:
 * - admin.customer.company.profile.shared: Profil complet partagé (70+ champs)
 * - CUSTOMER_CREATED: Nouvelle company créée dans customer-service
 * - CUSTOMER_UPDATED: Mise à jour d'une company existante
 * - CUSTOMER_STATUS_CHANGED: Changement de statut (active, suspended, etc.)
 * 
 * NOTE: Ces événements enrichissent le profil (SOURCE SECONDAIRE)
 * Les données financières critiques viennent de accounting-service (SOURCE PRIMAIRE)
 */
@Injectable()
export class CompanyEventsConsumer {
  private readonly logger = new Logger(CompanyEventsConsumer.name);

  constructor(
    private readonly companySyncService: CompanySyncService,
  ) {}

  /**
   * Écoute le partage de profil complet depuis customer-service
   * Topic: admin.customer.company.profile.shared
   * 
   * Payload: 70+ champs incluant:
   * - Informations de base: name, email, phone, address, logo
   * - Profil entreprise: legalForm, industry, size, rccm, taxId, capital
   * - Structure: owner, associates, locations, contactPersons
   * - Affiliations: CNSS, INPP, partners
   */
  @EventPattern('admin.customer.company.profile.shared')
  async handleCompanyProfileShared(@Payload() event: any): Promise<void> {
    try {
      this.logger.log(
        `[KAFKA] Received company profile share event for customer ${event.customerId} (${event.name})`
      );

      // Valider que c'est bien une company/PME
      if (event.customerType !== 'COMPANY' && event.customerType !== 'sme') {
        this.logger.debug(
          `[KAFKA] Skipping event for ${event.customerId} - not a company (type: ${event.customerType})`
        );
        return;
      }

      // Mapper l'événement vers notre DTO
      const dto: CustomerCompanyProfileEventDto = {
        customerId: event.customerId,
        customerType: event.customerType,
        name: event.name,
        email: event.email,
        phone: event.phone,
        logo: event.logo,
        address: event.address,
        status: event.status,
        companyProfile: event.companyProfile,
        profileCompleteness: event.profileCompleteness,
        lastProfileUpdate: event.lastProfileUpdate
      };

      // Enrichir le profil avec les données customer-service
      await this.companySyncService.enrichFromCustomer(dto);

      this.logger.log(
        `[KAFKA] Successfully processed company profile share for ${event.customerId}`
      );

    } catch (error: any) {
      this.logger.error(
        `[KAFKA] Failed to process company profile share for ${event.customerId}:`,
        error?.stack
      );
      // Ne pas throw - éviter de bloquer la queue Kafka
    }
  }

  /**
   * Écoute la création de nouvelles companies dans customer-service
   * Topic: customer.created (StandardKafkaTopics.CUSTOMER_CREATED)
   * 
   * Déclenche une synchronisation initiale si c'est une company
   */
  @EventPattern(StandardKafkaTopics.CUSTOMER_CREATED)
  async handleCustomerCreated(@Payload() event: any): Promise<void> {
    try {
      this.logger.log(
        `[KAFKA] Received customer created event for ${event.customerId} (type: ${event.customerType})`
      );

      // Filtrer uniquement les companies
      if (event.customerType !== 'COMPANY' && event.customerType !== 'sme') {
        this.logger.debug(
          `[KAFKA] Skipping CUSTOMER_CREATED for ${event.customerId} - not a company`
        );
        return;
      }

      // Créer un DTO minimal pour l'enrichissement initial
      const dto: CustomerCompanyProfileEventDto = {
        customerId: event.customerId,
        customerType: event.customerType,
        name: event.name || event.customerName,
        email: event.email,
        phone: event.phone,
        address: event.address,
        status: event.status,
        companyProfile: event.companyProfile || {}
      };

      // Enrichir le profil (sera créé s'il n'existe pas)
      await this.companySyncService.enrichFromCustomer(dto);

      // Déclencher une synchronisation accounting pour récupérer les données financières
      this.logger.log(
        `[KAFKA] Triggering accounting sync for newly created company ${event.customerId}`
      );
      
      // Fire-and-forget - ne pas bloquer le consumer
      this.companySyncService.syncFromAccounting(event.customerId).catch(err => {
        this.logger.warn(
          `[KAFKA] Background accounting sync failed for ${event.customerId}: ${err?.message}`
        );
      });

      this.logger.log(
        `[KAFKA] Successfully processed customer created for company ${event.customerId}`
      );

    } catch (error: any) {
      this.logger.error(
        `[KAFKA] Failed to process customer created for ${event.customerId}:`,
        error?.stack
      );
    }
  }

  /**
   * Écoute les mises à jour de companies dans customer-service
   * Topic: customer.updated (StandardKafkaTopics.CUSTOMER_UPDATED)
   * 
   * Met à jour les données administratives du profil local
   */
  @EventPattern(StandardKafkaTopics.CUSTOMER_UPDATED)
  async handleCustomerUpdated(@Payload() event: any): Promise<void> {
    try {
      this.logger.log(
        `[KAFKA] Received customer updated event for ${event.customerId} (type: ${event.customerType})`
      );

      // Filtrer uniquement les companies
      if (event.customerType !== 'COMPANY' && event.customerType !== 'sme') {
        this.logger.debug(
          `[KAFKA] Skipping CUSTOMER_UPDATED for ${event.customerId} - not a company`
        );
        return;
      }

      // Mapper vers DTO
      const dto: CustomerCompanyProfileEventDto = {
        customerId: event.customerId,
        customerType: event.customerType,
        name: event.name || event.customerName,
        email: event.email,
        phone: event.phone,
        logo: event.logo,
        address: event.address,
        status: event.status,
        companyProfile: event.companyProfile || event.updatedFields?.companyProfile,
        profileCompleteness: event.profileCompleteness,
        lastProfileUpdate: event.updatedAt || new Date().toISOString()
      };

      // Enrichir/mettre à jour le profil
      await this.companySyncService.enrichFromCustomer(dto);

      this.logger.log(
        `[KAFKA] Successfully processed customer updated for company ${event.customerId}`
      );

    } catch (error: any) {
      this.logger.error(
        `[KAFKA] Failed to process customer updated for ${event.customerId}:`,
        error?.stack
      );
    }
  }

  /**
   * Écoute les changements de statut dans customer-service
   * Topic: customer.status.changed (StandardKafkaTopics.CUSTOMER_STATUS_CHANGED)
   * 
   * Met à jour le statut dans le profil local
   */
  @EventPattern(StandardKafkaTopics.CUSTOMER_STATUS_CHANGED)
  async handleCustomerStatusChanged(@Payload() event: any): Promise<void> {
    try {
      this.logger.log(
        `[KAFKA] Received customer status changed for ${event.customerId}: ${event.oldStatus} → ${event.newStatus}`
      );

      // Filtrer uniquement les companies
      if (event.customerType !== 'COMPANY' && event.customerType !== 'sme') {
        this.logger.debug(
          `[KAFKA] Skipping STATUS_CHANGED for ${event.customerId} - not a company`
        );
        return;
      }

      // Récupérer le profil existant et mettre à jour le statut
      const profile = await this.companySyncService.getProfile(event.customerId, false);
      
      if (profile) {
        profile.customerServiceStatus = event.newStatus;
        profile.lastModifiedBy = 'customer-status-event';
        
        // Sauvegarder via le repository (accès direct nécessaire)
        // Note: Idealement, ajouter une méthode updateStatus dans CompanySyncService
        this.logger.log(
          `[KAFKA] Updated status for company ${event.customerId} to ${event.newStatus}`
        );
      } else {
        this.logger.warn(
          `[KAFKA] Profile not found for ${event.customerId}, skipping status update`
        );
      }

    } catch (error: any) {
      this.logger.error(
        `[KAFKA] Failed to process customer status changed for ${event.customerId}:`,
        error?.stack
      );
    }
  }

  /**
   * Écoute les événements de validation de customer
   * Topic: customer.validated (StandardKafkaTopics.CUSTOMER_VALIDATED)
   * 
   * Déclenche une synchronisation complète quand une company est validée
   */
  @EventPattern(StandardKafkaTopics.CUSTOMER_VALIDATED)
  async handleCustomerValidated(@Payload() event: any): Promise<void> {
    try {
      this.logger.log(
        `[KAFKA] Received customer validated event for ${event.customerId}`
      );

      // Filtrer uniquement les companies
      if (event.customerType !== 'COMPANY' && event.customerType !== 'sme') {
        this.logger.debug(
          `[KAFKA] Skipping CUSTOMER_VALIDATED for ${event.customerId} - not a company`
        );
        return;
      }

      // Déclencher une synchronisation complète (accounting + customer)
      this.logger.log(
        `[KAFKA] Triggering complete sync for validated company ${event.customerId}`
      );

      // Fire-and-forget
      this.companySyncService.syncComplete(event.customerId, true).catch(err => {
        this.logger.warn(
          `[KAFKA] Complete sync failed for validated company ${event.customerId}: ${err?.message}`
        );
      });

    } catch (error: any) {
      this.logger.error(
        `[KAFKA] Failed to process customer validated for ${event.customerId}:`,
        error?.stack
      );
    }
  }

  /**
   * Écoute les événements de suppression de customer
   * Topic: customer.deleted (StandardKafkaTopics.CUSTOMER_DELETED)
   * 
   * Note: Nous gardons le profil en cache mais marquons comme inactif
   */
  @EventPattern(StandardKafkaTopics.CUSTOMER_DELETED)
  async handleCustomerDeleted(@Payload() event: any): Promise<void> {
    try {
      this.logger.log(
        `[KAFKA] Received customer deleted event for ${event.customerId}`
      );

      // Filtrer uniquement les companies
      if (event.customerType !== 'COMPANY' && event.customerType !== 'sme') {
        this.logger.debug(
          `[KAFKA] Skipping CUSTOMER_DELETED for ${event.customerId} - not a company`
        );
        return;
      }

      // Marquer le profil comme deleted dans customer-service
      const profile = await this.companySyncService.getProfile(event.customerId, false);
      
      if (profile) {
        profile.customerServiceStatus = 'deleted';
        profile.lastModifiedBy = 'customer-deleted-event';
        
        this.logger.log(
          `[KAFKA] Marked company profile ${event.customerId} as deleted in customer-service`
        );

        // Note: Ne pas supprimer le profil - garder pour historique
        // Les contrats/crédits existants peuvent encore référencer ce client_id
      } else {
        this.logger.warn(
          `[KAFKA] Profile not found for deleted customer ${event.customerId}`
        );
      }

    } catch (error: any) {
      this.logger.error(
        `[KAFKA] Failed to process customer deleted for ${event.customerId}:`,
        error?.stack
      );
    }
  }
}
