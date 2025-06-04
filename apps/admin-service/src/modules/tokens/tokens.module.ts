import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from './entities';
import { TokensController } from './controllers';
import { TokensService } from './services';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule to get access to JwtBlacklistGuard
import { HttpModule } from '@nestjs/axios';

@Module({  imports: [
    TypeOrmModule.forFeature(Object.values(entities).filter(entity => typeof entity === 'function')),
    MulterModule.register({
      dest: './uploads/proofs', // Temporary storage for payment proofs
    }),
    AuthModule, // Import AuthModule to provide JwtService for JwtBlacklistGuard
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    })
  ],
  controllers: [TokensController],
  providers: [TokensService],
  exports: [TokensService]
})
export class TokensModule {}
