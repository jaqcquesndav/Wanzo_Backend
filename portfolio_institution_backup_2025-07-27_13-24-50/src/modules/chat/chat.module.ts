import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatService } from './services/chat.service';
import { ChatController } from './controllers/chat.controller';
import { PortfoliosModule } from '../portfolios/portfolios.module'; // Correct the path if necessary
import { ProspectionModule } from '../prospection/prospection.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, ChatMessage]),
    PortfoliosModule,
    ProspectionModule,
  ],
  providers: [ChatService],
  controllers: [ChatController],
  exports: [ChatService],
})
export class ChatModule {}
