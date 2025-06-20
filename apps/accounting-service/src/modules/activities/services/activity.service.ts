import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Activity } from '../entities/activity.entity';
import { CreateActivityDto, ActivityFilterDto } from '../dtos/activity.dto';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
  ) {}

  async create(createActivityDto: CreateActivityDto) {
    const activity = this.activityRepository.create(createActivityDto);
    return await this.activityRepository.save(activity);
  }

  async findAll(
    filters: ActivityFilterDto,
    page = 1,
    pageSize = 20,
  ) {
    const where: FindOptionsWhere<Activity> = {};

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.actionType) {
      where.actionType = filters.actionType;
    }

    if (filters.startDate && filters.endDate) {
      where.timestamp = Between(new Date(filters.startDate), new Date(filters.endDate));
    }

    const [activities, total] = await this.activityRepository.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Format for response
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      timestamp: activity.timestamp.toISOString(),
      actionType: activity.actionType,
      entityType: activity.entityType,
      entityId: activity.entityId,
      description: activity.description,
      user: {
        id: activity.userId,
        // Note: In a real implementation, you would fetch user details
        // from a user service or repository
        name: 'User Name',
        email: 'user@example.com',
        role: 'user'
      },
      details: activity.details,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent
    }));

    return {
      data: formattedActivities,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async logActivity(
    userId: string,
    actionType: string,
    entityType: string,
    entityId: string,
    description: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return await this.create({
      userId,
      actionType,
      entityType,
      entityId,
      description,
      details,
      ipAddress,
      userAgent,
    });
  }
}