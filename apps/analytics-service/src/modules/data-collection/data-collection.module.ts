import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataCollectionService } from './data-collection.service';
import { AnalyticsConfig } from '../../entities';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    ConfigModule,
    TypeOrmModule.forFeature([AnalyticsConfig]),
  ],
  providers: [DataCollectionService],
  exports: [DataCollectionService],
})
export class DataCollectionModule {}
