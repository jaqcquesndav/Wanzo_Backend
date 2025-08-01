import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdhaService } from './adha.service';
import { AdhaController } from './adha.controller';
import { AdhaConversation } from './entities/adha-conversation.entity';
import { AdhaMessage } from './entities/adha-message.entity';
import { AuthModule } from '../auth/auth.module';
// import { OpenAIService } from '../openai/openai.service'; // If you have a separate OpenAI module

@Module({
  imports: [
    TypeOrmModule.forFeature([AdhaConversation, AdhaMessage]),
    AuthModule,
    // OpenaiModule, // If you create one
  ],
  controllers: [AdhaController],
  providers: [
    AdhaService,
    // OpenAIService, // Provide OpenAIService if it's not global or part of another imported module
  ],
})
export class AdhaModule {}
