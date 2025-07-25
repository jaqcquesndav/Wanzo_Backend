import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsController } from './controllers';
import { DocumentsService } from './services';
import { Document, DocumentFolder } from './entities';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule to get access to JwtBlacklistGuard
import { HttpModule } from '@nestjs/axios';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DocumentFolder, Document]), // Changed order: DocumentFolder first
    AuthModule, // Add AuthModule to imports to access JwtBlacklistGuard
    EventsModule, // Add EventsModule to resolve EventsService dependency
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    })
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService]
})
export class DocumentsModule {}
