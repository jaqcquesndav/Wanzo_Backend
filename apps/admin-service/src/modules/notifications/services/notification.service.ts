import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationDto } from '../dtos/notification.dto';
import { ActivityService } from '../../activities/services/activity.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private activityService: ActivityService,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    return await this.notificationRepository.save(notification);
  }

  async findAll(userId: string, page = 1, perPage = 10): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { timestamp: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      notifications,
      total,
      page,
      perPage,
    };
  }

  async findById(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.findById(id, userId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    notification.read = true;
    return await this.notificationRepository.save(notification);
  }

  async delete(id: string, userId: string): Promise<{ success: boolean; message: string }> {
    const notification = await this.findById(id, userId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    await this.notificationRepository.remove(notification);
    return { success: true, message: 'Notification deleted successfully' };
  }

  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    const count = await this.notificationRepository.count({
      where: { userId, read: false },
    });

    return { unreadCount: count };
  }

  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
  ): Promise<Notification> {
    this.logger.debug(`Creating system notification for user ${userId}: ${title}`);
    
    const notification = await this.create({
      userId,
      type: 'system',
      title,
      message,
    });

    await this.activityService.logUserActivity(
      userId,
      'NOTIFICATION_CREATED',
      `System notification created: ${title}`,
      { notificationId: notification.id }
    );

    return notification;
  }

  async createPaymentNotification(
    userId: string,
    amount: number,
    status: string,
  ): Promise<Notification> {
    this.logger.debug(`Creating payment notification for user ${userId}: ${status}`);
    
    return await this.create({
      userId,
      type: 'payment',
      title: `Payment ${status}`,
      message: `Your payment of $${amount} has been ${status}.`,
    });
  }

  async createSubscriptionNotification(
    userId: string,
    plan: string,
    action: string,
  ): Promise<Notification> {
    this.logger.debug(`Creating subscription notification for user ${userId}: ${action}`);
    
    return await this.create({
      userId,
      type: 'subscription',
      title: 'Subscription Update',
      message: `Your ${plan} subscription has been ${action}.`,
    });
  }
}