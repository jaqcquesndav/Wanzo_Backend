import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessOperationsController } from './business-operations.controller';
import { BusinessOperationsService } from './business-operations.service';
import { BusinessOperation } from './entities/business-operation.entity';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule if JwtAuthGuard is used
import { AuthModule as NewAuthModule } from '../../auth/auth.module'; // Nouveau module d'auth
import { EventsModule } from '../events/events.module'; // Import EventsModule pour publier des événements

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BusinessOperation
    ]),
    AuthModule, // Module d'auth existant
    NewAuthModule, // Nouveau module d'auth pour l'intégration plateforme
    EventsModule, // Module pour la publication d'événements
  ],
  controllers: [
    BusinessOperationsController
  ],
  providers: [
    BusinessOperationsService
  ],
  exports: [
    BusinessOperationsService
  ],
})
export class BusinessOperationsModule {}
