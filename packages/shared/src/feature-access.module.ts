import { Module, DynamicModule } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { FeatureAccessGuard } from './guards/feature-access.guard';
import { ManualFeatureAccessService } from './guards/feature-access.guard';

/**
 * Configuration pour le module de contrôle d'accès aux fonctionnalités
 */
export interface FeatureAccessModuleOptions {
  kafkaBrokers: string[];
  kafkaClientId: string;
  kafkaGroupId?: string;
}

/**
 * Module partagé pour le contrôle d'accès aux fonctionnalités métier
 * Fournit les décorateurs, guards et services nécessaires pour la vérification des limites d'abonnement
 */
@Module({})
export class FeatureAccessModule {
  /**
   * Configuration pour un module root (utilisé dans app.module.ts)
   */
  static forRoot(options: FeatureAccessModuleOptions): DynamicModule {
    return {
      module: FeatureAccessModule,
      imports: [
        ClientsModule.register([
          {
            name: 'KAFKA_SERVICE',
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: options.kafkaClientId,
                brokers: options.kafkaBrokers,
              },
              consumer: {
                groupId: options.kafkaGroupId || `${options.kafkaClientId}-group`,
                allowAutoTopicCreation: true,
              },
            },
          },
        ]),
      ],
      providers: [
        FeatureAccessGuard,
        ManualFeatureAccessService,
      ],
      exports: [
        FeatureAccessGuard,
        ManualFeatureAccessService,
        ClientsModule,
      ],
      global: true,
    };
  }

  /**
   * Configuration pour un module feature (utilisé dans d'autres modules)
   */
  static forFeature(): DynamicModule {
    return {
      module: FeatureAccessModule,
      providers: [
        FeatureAccessGuard,
        ManualFeatureAccessService,
      ],
      exports: [
        FeatureAccessGuard,
        ManualFeatureAccessService,
      ],
    };
  }
}

// Réexporter tous les éléments nécessaires
export * from './decorators/feature-access.decorator';
export * from './guards/feature-access.guard';
export * from './enums/business-features.enum';
export * from './events/business-feature-events';