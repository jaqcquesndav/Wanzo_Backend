import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageStatus } from '../entities/message.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async create(message: Partial<Message>): Promise<Message> {
    const newMessage = this.messageRepository.create(message);
    return await this.messageRepository.save(newMessage);
  }

  async findById(id: string): Promise<Message> {
    const message = await this.messageRepository.findOne({ where: { id } });
    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
    return message;
  }

  async findByUser(userId: string, page = 1, perPage = 10): Promise<{
    messages: Message[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const [messages, total] = await this.messageRepository.findAndCount({
      where: [
        { senderId: userId },
        { recipientId: userId },
      ],
      skip: (page - 1) * perPage,
      take: perPage,
      order: { createdAt: 'DESC' },
    });

    return {
      messages,
      total,
      page,
      perPage,
    };
  }

  async markAsRead(id: string): Promise<Message> {
    const message = await this.findById(id);
    message.status = MessageStatus.READ;
    return await this.messageRepository.save(message);
  }

  async delete(id: string): Promise<void> {
    await this.messageRepository.delete(id);
  }
}