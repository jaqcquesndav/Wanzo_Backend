import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphModule } from './modules/graph/graph.module';
import { TimeseriesModule } from './modules/timeseries/timeseries.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { PrometheusMiddleware } from './monitoring/prometheus.middleware';
import neo4jConfig from './config/neo4j.config';
import timeseriesConfig from './config/timeseries.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [neo4jConfig, timeseriesConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...configService.get('timeseries'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
      }),
      inject: [ConfigService],
    }),
    GraphModule,
    TimeseriesModule,
    IngestionModule,
    MonitoringModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(PrometheusMiddleware)
      .forRoutes('*');
  }
}