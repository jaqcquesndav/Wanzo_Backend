import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api'); // As per API documentation base URL
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip away properties that do not have any decorators
    forbidNonWhitelisted: true, // Throw an error if non-whitelisted values are provided
    transform: true, // Automatically transform payloads to DTO instances
  }));

  // Swagger Setup
  const config = new DocumentBuilder()
    .setTitle('App Mobile Service API')
    .setDescription('API for the Wanzobe App Mobile Service')
    .setVersion('1.0')
    .addBearerAuth() // This is crucial for JWT support in Swagger UI
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document); // Swagger UI available at /api/docs

  // Add other global configurations: CORS, etc.
  const port = process.env.PORT || 3000; // Port from API documentation, should be configurable
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
