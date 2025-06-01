import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from './entities';
import { TokensController } from './controllers';
import { TokensService } from './services';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature(Object.values(entities).filter(entity => typeof entity === 'function')),
    MulterModule.register({
      dest: './uploads/proofs', // Temporary storage for payment proofs
    })
  ],
  controllers: [TokensController],
  providers: [TokensService],
  exports: [TokensService]
})
export class TokensModule {}
