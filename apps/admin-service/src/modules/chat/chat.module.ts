import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './controllers';
import { ChatService } from './services';
import { 
  ChatSession, 
  ChatMessage, 
  ChatAttachment, 
  ChatTypingEvent 
} from './entities';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatSession, 
      ChatMessage, 
      ChatAttachment, 
      ChatTypingEvent
    ]),
    MulterModule.register({
      dest: './uploads/chat-attachments',
    }),
    AuthModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
