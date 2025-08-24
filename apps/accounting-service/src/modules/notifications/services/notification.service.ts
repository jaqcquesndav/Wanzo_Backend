import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationDto, UpdateNotificationDto, NotificationQueryDto } from '../dtos/notification.dto';

@Injectable()
export class NotificationService {
  private isEmptyCache: boolean | null = null;
  private lastEmptyCheck: number = 0;
  private readonly EMPTY_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async findAll(userId: string, query: NotificationQueryDto) {
    const { page = 1, pageSize = 20, unreadOnly, type, from, to } = query;
    
    // Vérifier si la DB est vide avec cache
    const isEmpty = await this.checkIfEmpty();
    if (isEmpty) {
      return {
        notifications: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 0
        },
        unreadCount: 0,
        isEmpty: true // Indicateur pour le frontend
      };
    }
    
    let queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    // Apply filters
    if (unreadOnly) {
      queryBuilder = queryBuilder.andWhere('notification.read = false');
    }

    if (type) {
      queryBuilder = queryBuilder.andWhere('notification.type = :type', { type });
    }

    if (from) {
      queryBuilder = queryBuilder.andWhere('notification.createdAt >= :from', { from });
    }

    if (to) {
      queryBuilder = queryBuilder.andWhere('notification.createdAt <= :to', { to });
    }

    // Check for expired notifications and exclude them
    queryBuilder = queryBuilder.andWhere(
      '(notification.expiresAt IS NULL OR notification.expiresAt > :now)',
      { now: new Date() }
    );

    // Apply pagination
    const skip = (page - 1) * pageSize;
    queryBuilder = queryBuilder
      .orderBy('notification.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [notifications, total] = await queryBuilder.getManyAndCount();

    // Get unread count
    const unreadCount = await this.notificationRepository.count({
      where: {
        userId,
        read: false
      }
    });

    return {
      notifications,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      },
      unreadCount,
      isEmpty: false
    };
  }

  private async checkIfEmpty(): Promise<boolean> {
    const now = Date.now();
    
    // Utiliser le cache si disponible et récent
    if (this.isEmptyCache !== null && (now - this.lastEmptyCheck) < this.EMPTY_CHECK_INTERVAL) {
      return this.isEmptyCache;
    }
    
    // Vérifier si la table est vide
    const count = await this.notificationRepository.count();
    this.isEmptyCache = count === 0;
    this.lastEmptyCheck = now;
    
    return this.isEmptyCache;
  }

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    // Invalider le cache lors de la création
    this.isEmptyCache = false;
    
    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      expiresAt: createNotificationDto.expiresAt ? new Date(createNotificationDto.expiresAt) : undefined
    });
    
    return await this.notificationRepository.save(notification);
  }

  async findOne(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async update(id: string, userId: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.findOne(id, userId);

    // If marking as read, set readAt timestamp
    if (updateNotificationDto.read === true && !notification.read) {
      updateNotificationDto = {
        ...updateNotificationDto,
        readAt: new Date()
      };
    }

    Object.assign(notification, updateNotificationDto);
    return await this.notificationRepository.save(notification);
  }

  async remove(id: string, userId: string): Promise<void> {
    const notification = await this.findOne(id, userId);
    await this.notificationRepository.remove(notification);
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    return await this.update(id, userId, { read: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, read: false },
      { read: true, readAt: new Date() }
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: {
        userId,
        read: false
      }
    });
  }

  async deleteExpiredNotifications(): Promise<void> {
    await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .from(Notification)
      .where('expiresAt IS NOT NULL AND expiresAt < :now', { now: new Date() })
      .execute();
  }

  // Helper method to create system notifications
  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    link?: string,
    metadata?: Record<string, any>
  ): Promise<Notification> {
    return await this.create({
      type: type as any,
      title,
      message,
      userId,
      link,
      metadata
    });
  }
}
