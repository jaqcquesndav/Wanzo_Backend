import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [
    TerminusModule, // Restored but simplified
  ],
  controllers: [HealthController],
  providers: [], // Removed HealthService to avoid external dependency checks
})
export class HealthModule {}
