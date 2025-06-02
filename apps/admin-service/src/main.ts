import './tracing'; // Tracing setup runs on import
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
// import { LoggingInterceptor } from './common/interceptors/logging.interceptor'; // Commented out
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
// import { TracingInterceptor } from './common/interceptors/tracing.interceptor'; // Commented out
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import helmet from 'helmet';

async function bootstrap() {
  // Configure Winston logger
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf((info: winston.Logform.TransformableInfo) => {
            return `${info.timestamp} [${info.level}]: ${info.message}`;
          }),
        ),
      }),
      // ... file transports ...
    ],
  });

  // **On ne crée qu'une seule application** basée sur AppModule
  const app = await NestFactory.create(AppModule, { logger });
  const configService = app.get(ConfigService);

  // Enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Security middleware
  app.use(helmet());
  
  // CORS
  app.enableCors({
    origin: [
      'http://localhost:3000', 
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:4000',  
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    credentials: true,
    maxAge: 3600
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    validationError: { target: false },
  }));

  // Global Filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Interceptors
  app.useGlobalInterceptors(
    // new LoggingInterceptor(), // Commented out
    new TimeoutInterceptor(),
    // new TracingInterceptor(), // Commented out
  );

  // Swagger API Documentation
  const options = new DocumentBuilder()
    .setTitle('Admin Service API')
    .setDescription('API documentation for the Admin Service')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);  SwaggerModule.setup('api-docs', app, document);

  const port = configService.get<number>('PORT', 3001); // Port par défaut 3001 pour admin-service
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
