import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentManagementService } from './services/document-management.service';
import { DocumentManagementController } from './controllers/document-management.controller';
import { Document } from './entities/document.entity';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document]),
    AuthModule,
    CloudinaryModule,
  ],
  controllers: [DocumentManagementController],
  providers: [DocumentManagementService],
  exports: [DocumentManagementService],
})
export class DocumentManagementModule {}
