import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MicroserviceIntegrationService } from '../services/microservice-integration.service';
import { KafkaConsumerService } from '../../kafka-consumer/services/kafka-consumer.service';

@ApiTags('Integration Health')
@Controller('integration/health')
export class IntegrationHealthController {
  constructor(
    private readonly integrationService: MicroserviceIntegrationService,
    private readonly kafkaConsumerService: KafkaConsumerService,
  ) {}

  @Get()
  @ApiOperation({ 
    summary: 'Vérifier l\'état de santé de l\'intégration',
    description: 'Vérifie la connectivité avec tous les microservices et Kafka'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'État de santé de l\'intégration',
    schema: {
      example: {
        status: 'healthy',
        timestamp: '2025-08-04T10:30:00Z',
        services: {
          customerService: true,
          portfolioService: true,
          commerceService: true,
          accountingService: true
        },
        kafka: {
          consumers: {
            'commerce.operation.created': true,
            'user.created': true,
            'user.updated': true,
            'portfolio.funding-request.status-changed': true,
            'portfolio.contract.created': true,
            'token.purchase.created': true
          }
        }
      }
    }
  })
  async getIntegrationHealth() {
    try {
      // Vérifier les microservices
      const servicesHealth = await this.integrationService.checkMicroservicesHealth();
      
      // Vérifier les consumers Kafka
      const kafkaStatus = this.kafkaConsumerService.getConsumerStatus();

      // Déterminer le statut global
      const allServicesHealthy = Object.values(servicesHealth).every(status => status);
      const allKafkaHealthy = Object.values(kafkaStatus).every(status => status);
      
      const overallStatus = allServicesHealthy && allKafkaHealthy ? 'healthy' : 'degraded';

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services: servicesHealth,
        kafka: {
          consumers: kafkaStatus
        },
        summary: {
          totalServices: Object.keys(servicesHealth).length,
          healthyServices: Object.values(servicesHealth).filter(Boolean).length,
          totalKafkaConsumers: Object.keys(kafkaStatus).length,
          activeKafkaConsumers: Object.values(kafkaStatus).filter(Boolean).length
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: errorMessage,
        services: {},
        kafka: { consumers: {} }
      };
    }
  }

  @Get('services')
  @ApiOperation({ 
    summary: 'Vérifier l\'état des microservices uniquement',
    description: 'Vérifie la connectivité avec tous les microservices externes'
  })
  async getServicesHealth() {
    try {
      const servicesHealth = await this.integrationService.checkMicroservicesHealth();
      
      return {
        timestamp: new Date().toISOString(),
        services: servicesHealth,
        status: Object.values(servicesHealth).every(Boolean) ? 'all_healthy' : 'some_issues'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: errorMessage,
        services: {}
      };
    }
  }

  @Get('kafka')
  @ApiOperation({ 
    summary: 'Vérifier l\'état des consumers Kafka',
    description: 'Vérifie l\'état de tous les consumers Kafka'
  })
  async getKafkaHealth() {
    try {
      const kafkaStatus = this.kafkaConsumerService.getConsumerStatus();
      
      return {
        timestamp: new Date().toISOString(),
        consumers: kafkaStatus,
        status: Object.values(kafkaStatus).every(Boolean) ? 'all_active' : 'some_inactive',
        summary: {
          total: Object.keys(kafkaStatus).length,
          active: Object.values(kafkaStatus).filter(Boolean).length,
          inactive: Object.values(kafkaStatus).filter(status => !status).length
        }
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: errorMessage,
        consumers: {}
      };
    }
  }
}
