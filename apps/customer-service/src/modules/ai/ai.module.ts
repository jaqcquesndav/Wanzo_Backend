import { Module } from '@nestjs/common';
import { AiController } from './controllers/ai.controller';
// import { AiService } from './services/ai.service'; // Temporairement commenté
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [AiController],
  // providers: [AiService], // Temporairement commenté
  // exports: [AiService], // Temporairement commenté
})
export class AiModule {}
