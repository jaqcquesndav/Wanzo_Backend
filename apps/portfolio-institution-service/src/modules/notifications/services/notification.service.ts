import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(notification: Partial<Notification>): Promise<Notification> {
    const newNotification = this.notificationRepository.create(notification);
    return await this.notificationRepository.save(newNotification);
  }

  async findById(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return notification;
  }

  async findByUser(userId: string, page = 1, perPage = 10): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * perPage,
      take: perPage,
      order: { timestamp: 'DESC' },
    });

    return {
      notifications,
      total,
      page,
      perPage,
    };
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.findById(id);
    notification.read = true;
    return await this.notificationRepository.save(notification);
  }

  async delete(id: string): Promise<void> {
    await this.notificationRepository.delete(id);
  }

  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
  ): Promise<Notification> {
    return await this.create({
      userId,
      type: NotificationType.INFO,
      title,
      message,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, read: false },
    });
  }
}