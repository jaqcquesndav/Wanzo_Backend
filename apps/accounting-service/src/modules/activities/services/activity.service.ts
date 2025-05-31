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
    perPage = 10,
  ) {
    const where: FindOptionsWhere<Activity> = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.startDate && filters.endDate) {
      where.timestamp = Between(new Date(filters.startDate), new Date(filters.endDate));
    }

    const [activities, total] = await this.activityRepository.findAndCount({
      where,
      order: { timestamp: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      activities,
      page,
      perPage,
      total,
    };
  }

  async findUserActivities(userId: string, page = 1, perPage = 10) {
    return this.findAll({ userId }, page, perPage);
  }

  async findCompanyActivities(companyId: string, page = 1, perPage = 10) {
    return this.findAll({ companyId }, page, perPage);
  }

  async logUserActivity(
    userId: string,
    action: string,
    description: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return await this.create({
      userId,
      action,
      description,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  async logCompanyActivity(
    companyId: string,
    userId: string,
    action: string,
    description: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return await this.create({
      companyId,
      userId,
      action,
      description,
      metadata,
      ipAddress,
      userAgent,
    });
  }
}