import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable Helmet
  app.use(helmet());

  // Configuration CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',  // Frontend
      'http://localhost:3001',  // Admin Service
      'http://localhost:3002',  // Auth Service
      'http://localhost:4000',  // Autre service potentiel
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-request-time'],
    exposedHeaders: ['Authorization'],
    credentials: true,
    maxAge: 3600
  });

  await app.listen(3002);
}
bootstrap();
