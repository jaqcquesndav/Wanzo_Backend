import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphModule } from './modules/graph/graph.module';
import { TimeseriesModule } from './modules/timeseries/timeseries.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { PrometheusMiddleware } from './monitoring/prometheus.middleware';
import { DataCollectionModule } from './modules/data-collection/data-collection.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { EventProcessingModule } from './modules/event-processing/event-processing.module';
import { FraudDetectionModule } from './modules/fraud-detection/fraud-detection.module';
import { FinancialDataConfigModule } from './modules/financial-data-config/financial-data-config.module';
import neo4jConfig from './config/neo4j.config';
import timeseriesConfig from './config/timeseries.config';
import databaseConfig from './config/database.config';
import kafkaConfig from './config/kafka.config';
import { AnalyticsConfig } from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [neo4jConfig, timeseriesConfig, databaseConfig, kafkaConfig],
    }),
    // Module global pour les données de configuration RDC
    FinancialDataConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'),
        entities: [
          AnalyticsConfig,
        ],
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    // Modules existants fonctionnels
    GraphModule,
    TimeseriesModule,
    IngestionModule,
    DataCollectionModule,
    AnalyticsModule,
    AuthModule,
    MonitoringModule,
    // Modules d'analyse de risque et fraude
    EventProcessingModule,
    FraudDetectionModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PrometheusMiddleware)
      .forRoutes('*');
  }
}