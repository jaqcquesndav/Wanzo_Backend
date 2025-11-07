import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Blockchain Service')
    .setDescription('Anchoring and verification API (IPFS + Fabric)')
    .setVersion('1.0')
  .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'bearer')
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, doc);
}
