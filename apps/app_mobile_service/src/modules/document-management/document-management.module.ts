import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentManagementService } from './services/document-management.service';
import { DocumentManagementController } from './controllers/document-management.controller';
import { Document } from './entities/document.entity';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from 'nestjs-cloudinary'; // Import CloudinaryModule
import { ConfigModule, ConfigService } from '@nestjs/config'; // Import ConfigModule and ConfigService

@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
    AuthModule,
    ConfigModule, // Ensure ConfigModule is imported if not already global in a higher module
    CloudinaryModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
        api_key: configService.get<string>('CLOUDINARY_API_KEY'),
        api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
        secure: true, // Optional: ensures https URLs
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [DocumentManagementController],
  providers: [DocumentManagementService],
  exports: [DocumentManagementService],
})
export class DocumentManagementModule {}
