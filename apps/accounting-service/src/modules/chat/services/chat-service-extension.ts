import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';

@Injectable()
export class ChatServiceExtension {
  constructor(
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
  ) {}

  /**
   * Find a chat message by its ID
   */
  async findMessageById(id: string): Promise<ChatMessage> {
    const message = await this.messageRepository.findOne({
      where: { id }
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return message;
  }

  /**
   * Update a chat message
   */
  async updateMessage(message: ChatMessage): Promise<ChatMessage> {
    return await this.messageRepository.save(message);
  }
}
