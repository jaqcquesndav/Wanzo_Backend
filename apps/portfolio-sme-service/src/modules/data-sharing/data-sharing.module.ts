import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSharingConfig } from './entities/data-sharing-config.entity';
import { DataSharingHistory } from './entities/data-sharing-history.entity';
import { DataSharingService } from './services/data-sharing.service';
import { DataSharingController } from './controllers/data-sharing.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([DataSharingConfig, DataSharingHistory]),
  ],
  providers: [DataSharingService],
  controllers: [DataSharingController],
  exports: [DataSharingService],
})
export class DataSharingModule {}