import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Institution } from './entities/institution.entity';
import { InstitutionUser } from './entities/institution-user.entity';
import { InstitutionDocument } from './entities/institution-document.entity';
import { InstitutionService } from './services/institution.service';
import { InstitutionUserService } from './services/institution-user.service';
import { DocumentValidationService } from './services/document-validation.service';
import { SubscriptionService } from './services/subscription.service';
import { InstitutionController } from './controllers/institution.controller';
import { InstitutionUserController } from './controllers/institution-user.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Institution, InstitutionUser, InstitutionDocument]),
  ],
  providers: [
    InstitutionService,
    InstitutionUserService,
    DocumentValidationService,
    SubscriptionService,
  ],
  controllers: [
    InstitutionController,
    InstitutionUserController,
  ],
  exports: [
    InstitutionService,
    InstitutionUserService,
    DocumentValidationService,
    SubscriptionService,
  ],
})
export class InstitutionModule {}