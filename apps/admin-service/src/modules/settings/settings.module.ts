import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from './entities';
import { SettingsController } from './controllers';
import { SettingsService } from './services';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';

@Module({  imports: [
    TypeOrmModule.forFeature(Object.values(entities)),
    MulterModule.register({
      dest: './uploads', // Temporary storage for avatars
    }),
    AuthModule, // Import AuthModule to get access to JwtBlacklistGuard
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    })
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService]
})
export class SettingsModule {}
