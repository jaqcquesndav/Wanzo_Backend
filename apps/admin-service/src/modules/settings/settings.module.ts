import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as entities from './entities';
import { SettingsController } from './controllers';
import { SettingsService } from './services';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature(Object.values(entities)),
    MulterModule.register({
      dest: './uploads', // Temporary storage for avatars
    })
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService]
})
export class SettingsModule {}
