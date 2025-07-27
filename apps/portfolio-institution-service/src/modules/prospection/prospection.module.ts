import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prospect } from './entities/prospect.entity';
import { Document } from './entities/document.entity';
import { ContactHistory } from './entities/contact-history.entity';
import { ProspectAnalysis } from './entities/prospect-analysis.entity';
import { Campaign } from './entities/campaign.entity';
import { ProspectService } from './services/prospect.service';
import { ProspectAnalysisService } from './services/prospect-analysis.service';
import { CampaignService } from './services/campaign.service';
import { LeadsService } from './services/leads.service';
import { StatsService } from './services/stats.service';
import { ProspectController } from './controllers/prospect.controller';
import { ProspectAnalysisController } from './controllers/prospect-analysis.controller';
import { CampaignController } from './controllers/campaign.controller';
import { LeadsController } from './controllers/leads.controller';
import { StatsController } from './controllers/stats.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Prospect,
      Document,
      ContactHistory,
      ProspectAnalysis,
      Campaign,
    ]),
  ],
  providers: [
    ProspectService,
    ProspectAnalysisService,
    CampaignService,
    LeadsService,
    StatsService,
  ],
  controllers: [
    ProspectController,
    ProspectAnalysisController,
    CampaignController,
    LeadsController,
    StatsController,
  ],
  exports: [
    ProspectService,
    ProspectAnalysisService,
    CampaignService,
    LeadsService,
    StatsService,
  ],
})
export class ProspectionModule {}
