import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SmartCacheService } from './services/smart-cache.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [SmartCacheService],
  exports: [SmartCacheService],
})
export class CacheModule {}
