import { Injectable, Logger } from '@nestjs/common';
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import {
  CustomerEventTopics,
  CustomerCreatedEvent,
  CustomerUpdatedEvent,
  CustomerSyncResponseEvent,
} from '@wanzobe/shared/events/kafka-config';
import { InstitutionService } from '../../institution/services/institution.service';

@Controller() // Required for NestJS to recognize this as a potential message handler container
@Injectable()  // Required for dependency injection
export class InstitutionEventsConsumer {
  private readonly logger = new Logger(InstitutionEventsConsumer.name);

  constructor(
    private readonly institutionService: InstitutionService,
  ) {}

  @EventPattern(CustomerEventTopics.CUSTOMER_CREATED)
  async handleCustomerCreated(@Payload() event: CustomerCreatedEvent): Promise<void> {
    this.logger.log(`Received ${CustomerEventTopics.CUSTOMER_CREATED} event: ${JSON.stringify(event)}`);
    
    // Traiter seulement les institutions financières
    if (event.type !== 'INSTITUTION') {
      this.logger.log(`Skipping customer ${event.customerId} - not an institution (type: ${event.type})`);
      return;
    }

    try {
      // Créer ou mettre à jour l'institution dans le service portfolio
      const institutionData = {
        id: event.customerId,
        name: event.name,
        registrationNumber: event.registrationNumber,
        licenseNumber: event.licenseNumber,
        taxId: event.taxId,
        country: event.country,
        phone: event.phone,
        email: event.email,
        address: event.address,
        createdAt: new Date(event.timestamp),
        updatedAt: new Date(event.timestamp)
      };

      await this.institutionService.createOrUpdate(institutionData);
      this.logger.log(`Institution ${event.customerId} synchronized from customer service`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling ${CustomerEventTopics.CUSTOMER_CREATED} for institution ${event.customerId}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }

  @EventPattern(CustomerEventTopics.CUSTOMER_UPDATED)
  async handleCustomerUpdated(@Payload() event: CustomerUpdatedEvent): Promise<void> {
    this.logger.log(`Received ${CustomerEventTopics.CUSTOMER_UPDATED} event: ${JSON.stringify(event)}`);
    
    // Traiter seulement les institutions financières
    if (event.type !== 'INSTITUTION') {
      this.logger.log(`Skipping customer ${event.customerId} - not an institution (type: ${event.type})`);
      return;
    }

    try {
      // Mettre à jour l'institution dans le service portfolio
      await this.institutionService.updateFromEvent(event.customerId, event.updatedFields);
      this.logger.log(`Institution ${event.customerId} updated from customer service`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling ${CustomerEventTopics.CUSTOMER_UPDATED} for institution ${event.customerId}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }

  @EventPattern(CustomerEventTopics.CUSTOMER_SYNC_RESPONSE)
  async handleCustomerSyncResponse(@Payload() event: CustomerSyncResponseEvent): Promise<void> {
    this.logger.log(`Received ${CustomerEventTopics.CUSTOMER_SYNC_RESPONSE} event: ${JSON.stringify(event)}`);
    
    try {
      if (event.found && event.customerData && event.customerData.type === 'INSTITUTION') {
        // Créer ou mettre à jour l'institution avec les données reçues du customer service
        const institutionData = {
          id: event.customerData.id,
          name: event.customerData.name,
          registrationNumber: event.customerData.registrationNumber,
          licenseNumber: event.customerData.licenseNumber,
          taxId: event.customerData.taxId,
          vatNumber: event.customerData.vatNumber,
          address: event.customerData.address,
          city: event.customerData.city,
          country: event.customerData.country,
          phone: event.customerData.phone,
          email: event.customerData.email,
          website: event.customerData.website,
          createdAt: new Date(event.customerData.createdAt),
          updatedAt: new Date(event.customerData.updatedAt)
        };

        await this.institutionService.createOrUpdate(institutionData);
        this.logger.log(`Institution ${event.customerId} synchronized successfully from customer service`);
      } else if (event.found && event.customerData?.type !== 'INSTITUTION') {
        this.logger.log(`Customer ${event.customerId} found but not an institution (type: ${event.customerData?.type})`);
      } else {
        this.logger.warn(`Customer ${event.customerId} not found in customer service`);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error handling ${CustomerEventTopics.CUSTOMER_SYNC_RESPONSE} for institution ${event.customerId}: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
    }
  }
}
