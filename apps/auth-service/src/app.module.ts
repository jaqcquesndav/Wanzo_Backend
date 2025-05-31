import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OIDCModule } from './modules/oidc/oidc.module';
import { Auth0Module } from './modules/auth0/auth0.module';
import { HealthModule } from './modules/health/health.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CompaniesModule } from './modules/companies/companies.module';
import oidcConfig from './config/oidc.config';
import auth0Config from './config/auth0.config';
import scopesConfig from './config/scopes.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [oidcConfig, auth0Config, scopesConfig],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'password'),
        database: configService.get('DB_DATABASE', 'auth'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    OIDCModule,
    Auth0Module,
    HealthModule,
    DashboardModule,
    CompaniesModule,
  ],
})
export class AppModule {}