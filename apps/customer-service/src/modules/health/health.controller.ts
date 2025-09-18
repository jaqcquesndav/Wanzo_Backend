import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
  MicroserviceHealthIndicator,
} from '@nestjs/terminus';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppHealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
    private appHealthService: AppHealthService,
    private configService: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check service health' })
  @ApiResponse({ status: 200, description: 'Health check passed' })
  @ApiResponse({ status: 503, description: 'Service unhealthy' })
  async check() {
    return this.health.check([
      // Vérification de la base de données (temporairement commentée)
      // () => this.db.pingCheck('database'),
      
      // Vérification de la mémoire
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024), // 200MB
      () => this.memory.checkRSS('memory_rss', 3000 * 1024 * 1024),  // 3GB
      
      // Vérification de l'espace disque
      () => this.disk.checkStorage('disk', { 
        path: '/', 
        thresholdPercent: 0.9 // 90% d'espace disque utilisé max
      }),
      
      // Vérification de Kafka
      () => this.microservice.pingCheck('kafka', {
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'customer-service',
            brokers: [this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092')],
          },
        },
      }),
    ]);
  }

  @Get('readiness')
  @HealthCheck()
  @ApiOperation({ summary: 'Check if service is ready to accept requests' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service not ready' })
  async checkReadiness() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.microservice.pingCheck('kafka', {
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'customer-service',
            brokers: [this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092')],
          },
        },
      }),
    ]);
  }

  @Get('liveness')
  @HealthCheck()
  @ApiOperation({ summary: 'Check if service is alive' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  @ApiResponse({ status: 503, description: 'Service is not alive' })
  async checkLiveness() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 500 * 1024 * 1024), // 500MB
    ]);
  }

  @Get('/dependencies')
  @HealthCheck()
  @ApiOperation({ summary: 'Check dependencies health' })
  @ApiResponse({ status: 200, description: 'Dependencies health check passed' })
  @ApiResponse({ status: 503, description: 'One or more dependencies are unhealthy' })
  async checkDependencies() {
    return this.health.check([
      () => this.appHealthService.checkApiGateway(),
      () => this.appHealthService.checkAuthService(),
      () => this.appHealthService.checkAnalyticsService(),
      () => this.appHealthService.checkAdminService(),
      () => this.appHealthService.checkAccountingService(),
      () => this.appHealthService.checkPortfolioSmeService(),
      () => this.appHealthService.checkPortfolioInstitutionService(),
    ]);
  }
}
