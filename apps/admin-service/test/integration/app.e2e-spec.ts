import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

describe('Admin Service Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Créer une application de test avec une configuration de test
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('TEST_DATABASE_HOST', 'localhost'),
            port: configService.get('TEST_DATABASE_PORT', 5432),
            username: configService.get('TEST_DATABASE_USERNAME', 'postgres'),
            password: configService.get('TEST_DATABASE_PASSWORD', 'password'),
            database: configService.get('TEST_DATABASE_NAME', 'admin-service-test'),
            entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
            synchronize: true, // Seulement pour les tests
          }),
          inject: [ConfigService],
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body.status).toBe('ok');
        });
    });
  });

  describe('Metrics Endpoint', () => {
    it('/metrics (GET)', () => {
      return request(app.getHttpServer())
        .get('/metrics')
        .expect(200)
        .expect((res) => {
          // Vérifier que la réponse contient des métriques Prometheus
          expect(res.text).toContain('# HELP');
          expect(res.text).toContain('# TYPE');
        });
    });
  });

  // Note : Des tests d'intégration plus complets impliqueraient de tester les différentes
  // API et communications entre services, mais cela nécessiterait de configurer des
  // services mock ou des conteneurs pour les services dépendants.
});
