import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './controllers';
import { DocumentsService } from './services';
import { Document, DocumentFolder } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentFolder, Document]) // Changed order: DocumentFolder first
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService]
})
export class DocumentsModule {}
