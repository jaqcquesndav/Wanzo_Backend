import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserActivity, ActivityType } from '../entities/user-activity.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class UserActivityService {
  constructor(
    @InjectRepository(UserActivity)
    private userActivityRepository: Repository<UserActivity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async logActivity(
    userId: string, 
    type: ActivityType, 
    description: string, 
    ipAddress?: string, 
    metadata?: Record<string, any>,
    userAgent?: string
  ): Promise<UserActivity> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const activity = this.userActivityRepository.create({
      userId,
      type,
      description,
      ipAddress,
      userAgent,
      metadata,
      institutionId: user.institutionId
    });

    return await this.userActivityRepository.save(activity);
  }

  async getUserActivities(institutionId: string, userId: string): Promise<UserActivity[]> {
    // Check if user exists in this institution
    const user = await this.userRepository.findOne({
      where: { id: userId, institutionId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found in institution ${institutionId}`);
    }

    return await this.userActivityRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100 // Limit to most recent 100 activities
    });
  }

  async getInstitutionActivities(institutionId: string, limit = 100): Promise<UserActivity[]> {
    return await this.userActivityRepository.find({
      where: { institutionId },
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  async getActivityById(activityId: string): Promise<UserActivity> {
    const activity = await this.userActivityRepository.findOne({
      where: { id: activityId }
    });

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${activityId} not found`);
    }

    return activity;
  }
}
