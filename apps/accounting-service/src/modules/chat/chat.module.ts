import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from './entities/chat.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatService } from './services/chat.service';
import { ChatController } from './controllers/chat.controller';
import { AgentEntriesController } from './controllers/agent-entries.controller';
import { JournalsModule } from '../journals/journals.module';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, ChatMessage]),
    JournalsModule,
    AccountsModule,
  ],
  providers: [ChatService],
  controllers: [ChatController, AgentEntriesController],
  exports: [ChatService],
})
export class ChatModule {}