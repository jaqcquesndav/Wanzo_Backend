import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prospect } from './entities/prospect.entity';
import { ProspectAnalysis } from './entities/prospect-analysis.entity';
import { ProspectDocument } from './entities/prospect-document.entity';
import { ProspectService } from './services/prospect.service';
import { ProspectAnalysisService } from './services/prospect-analysis.service';
import { RiskAnalysisService } from './services/risk-analysis.service';
import { ProspectController } from './controllers/prospect.controller';
import { ProspectAnalysisController } from './controllers/prospect-analysis.controller';
import { InstitutionModule } from '../institution/institution.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prospect, ProspectAnalysis, ProspectDocument]),
    forwardRef(() => InstitutionModule), // Use forwardRef to break circular dependency
    forwardRef(() => EventsModule),      // Add forwardRef to EventsModule
  ],
  providers: [
    ProspectService,
    ProspectAnalysisService,
    RiskAnalysisService,
  ],
  controllers: [
    ProspectController,
    ProspectAnalysisController,
  ],
  exports: [
    ProspectService,
    ProspectAnalysisService,
    RiskAnalysisService,
  ],
})
export class ProspectionModule {}