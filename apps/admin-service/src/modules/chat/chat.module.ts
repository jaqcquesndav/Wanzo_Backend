import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './controllers';
import { ChatService } from './services';
import { ChatSession, ChatMessage, ChatAttachment } from './entities';
// import { UsersModule } from '../users/users.module'; // If User entity is from another module
// import { FileStorageModule } from '../file-storage/file-storage.module'; // If using a separate file storage module

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage, ChatAttachment]),
    // UsersModule, // Import if User entity is used and managed elsewhere
    // FileStorageModule, // Import if you have a module for file uploads/downloads
  ],
  controllers: [ChatController],
  providers: [ChatService, /* ChatGateway if using WebSockets */],
  exports: [ChatService],
})
export class ChatModule {}
