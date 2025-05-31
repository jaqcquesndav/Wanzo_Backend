import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from './entities/asset.entity';
import { AssetValuation } from './entities/asset-valuation.entity';
import { AssetService } from './services/asset.service';
import { AssetController } from './controllers/asset.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset, AssetValuation]),
  ],
  providers: [AssetService],
  controllers: [AssetController],
  exports: [AssetService],
})
export class AssetsModule {}