import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicChatAdhaController } from './controllers/public-chat-adha.controller';
import { PublicChatAdhaService } from './services/public-chat-adha.service';
import { ChatConversation } from './entities/chat-conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatConversation,
      ChatMessage
    ])
  ],
  controllers: [PublicChatAdhaController],
  providers: [PublicChatAdhaService],
  exports: [PublicChatAdhaService]
})
export class PublicChatAdhaModule {}