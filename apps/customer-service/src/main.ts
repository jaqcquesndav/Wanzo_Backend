import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { PrometheusController } from './monitoring/prometheus.controller';
import * as prometheus from 'prom-client';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('Customer Service API')
    .setDescription('API pour la gestion des clients, utilisateurs, abonnements et tokens')
    .setVersion('1.0')
    .addTag('customers')
    .addTag('users')
    .addTag('subscriptions')
    .addTag('tokens')
    .addBearerAuth()
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  // Ajouter les validations DTO
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Enable CORS
  app.enableCors();
  
  // Configuration Prometheus pour monitoring
  const register = new prometheus.Registry();
  prometheus.collectDefaultMetrics({ register });
  app.useGlobalInterceptors(PrometheusController.getPrometheusInterceptor(register));
  
  // Démarrer le serveur
  const port = configService.get<number>('PORT', 3011);
  await app.listen(port);
  console.log(`Customer Service running on port ${port}`);
}

bootstrap();
