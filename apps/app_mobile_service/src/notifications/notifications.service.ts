import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, IsNull, Not, UpdateResult } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ListNotificationsDto, NotificationStatusQuery } from './dto/list-notifications.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  // This method is likely for internal use by other services to create notifications
  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async findAllForUser(
    listNotificationsDto: ListNotificationsDto,
    user: User,
  ): Promise<{ data: Notification[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, sortBy = 'receivedAt', sortOrder = 'DESC', status, type } = listNotificationsDto;
    const skip = (page - 1) * limit;

    const where: any = { userId: user.id };

    if (status === NotificationStatusQuery.READ) {
      where.readAt = Not(IsNull());
    } else if (status === NotificationStatusQuery.UNREAD) {
      where.readAt = IsNull();
    }
    // If status is ALL, no additional readAt filter is needed.

    if (type) {
      where.type = type;
    }

    const findOptions: FindManyOptions<Notification> = {
      where,
      order: { [sortBy]: sortOrder.toUpperCase() as 'ASC' | 'DESC' }, // Ensure sortOrder is uppercase
      skip,
      take: limit,
    };

    const [data, total] = await this.notificationRepository.findAndCount(findOptions);
    return { data, total, page, limit };
  }

  async findOne(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id, userId } });
    if (!notification) {
      throw new NotFoundException(`Notification with ID "${id}" not found or access denied.`);
    }
    return notification;
  }

  async markAsRead(id: string, user: User): Promise<Notification> {
    const notification = await this.findOne(id, user.id);
    if (notification.readAt) {
      return notification; // Already read
    }
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(user: User): Promise<UpdateResult> {
    return this.notificationRepository.update(
      { userId: user.id, readAt: IsNull() }, // Condition: unread notifications for the user
      { readAt: new Date() },          // Update: set readAt to now
    );
  }

  async remove(id: string, user: User): Promise<void> {
    await this.findOne(id, user.id); // Ensures user owns the notification and it exists
    const result = await this.notificationRepository.delete({ id, userId: user.id }); // ensure delete is also scoped by userId
    if (result.affected === 0) {
      // This case should ideally be caught by findOne or the scoped delete, but as a safeguard:
      throw new NotFoundException(`Notification with ID "${id}" not found or operation did not affect any rows.`);
    }
  }
  
  // Method to count unread notifications for a user (useful for badges, etc.)
  async countUnread(userId: string): Promise<number> {
    return this.notificationRepository.count({ where: { userId, readAt: IsNull() } });
  }
}
