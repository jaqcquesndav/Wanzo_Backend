import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Payment Service API')
    .setDescription('Unified payment processing API (SerdiPay, Stripe, PayPal, etc.)')
    .setVersion('1.0')
    .addTag('payments')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();

  const port = Number(process.env.PORT || 3007);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Payment Service running on port ${port}`);
}

bootstrap();
