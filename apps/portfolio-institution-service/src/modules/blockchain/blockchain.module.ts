import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlockchainService } from './services/blockchain.service';
import { BlockchainController } from './controllers/blockchain.controller';
import { ChainAnchor } from './entities/chain-anchor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChainAnchor])],
  providers: [BlockchainService],
  controllers: [BlockchainController],
  exports: [BlockchainService],
})
export class BlockchainModule {}
