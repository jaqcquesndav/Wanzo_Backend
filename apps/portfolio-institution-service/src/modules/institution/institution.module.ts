import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Institution } from './entities/institution.entity';
import { InstitutionUser } from './entities/institution-user.entity';
import { InstitutionDocument } from './entities/institution-document.entity';
import { InstitutionService } from './services/institution.service';
import { InstitutionUserService } from './services/institution-user.service';
import { DocumentValidationService } from './services/document-validation.service';
import { SubscriptionService } from './services/subscription.service';
import { TokenEventHandler } from './services/token-event.handler';
import { TokenMonitorService } from './services/token-monitor.service';
import { InstitutionController } from './controllers/institution.controller';
import { InstitutionUserController } from './controllers/institution-user.controller';
import { SubscriptionController } from './controllers/subscription.controller';
import { TokenAnalyticsController } from './controllers/token-analytics.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Institution, InstitutionUser, InstitutionDocument]),
    forwardRef(() => EventsModule), // Use forwardRef to break circular dependency
  ],
  providers: [
    InstitutionService,
    InstitutionUserService,
    DocumentValidationService,
    SubscriptionService,
    TokenEventHandler,    TokenMonitorService,
  ],
  controllers: [
    InstitutionController,
    InstitutionUserController,
    SubscriptionController,
    TokenAnalyticsController,
  ],
  exports: [
    InstitutionService,
    InstitutionUserService,
    DocumentValidationService,
    SubscriptionService,
    TokenEventHandler,
    TokenMonitorService,
  ],
})
export class InstitutionModule {}