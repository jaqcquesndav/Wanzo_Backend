import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSession } from '../entities/user-session.entity';
import { User } from '../entities/user.entity';
import { v4 as uuidv4 } from 'uuid';
import { UserActivityService } from './user-activity.service';
import { ActivityType } from '../entities/user-activity.entity';

@Injectable()
export class UserSessionService {
  constructor(
    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userActivityService: UserActivityService
  ) {}

  async createSession(
    userId: string,
    token: string,
    ipAddress?: string,
    userAgent?: string,
    deviceType?: string,
    expiresInHours: number = 24
  ): Promise<UserSession> {
    const user = await this.userRepository.findOne({
      where: { id: userId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    const session = this.userSessionRepository.create({
      id: uuidv4(),
      userId,
      token,
      ipAddress,
      userAgent,
      deviceType,
      expiresAt,
      lastActivity: new Date(),
      institutionId: user.institutionId,
      isActive: true
    });

    const savedSession = await this.userSessionRepository.save(session);

    // Log session creation
    await this.userActivityService.logActivity(
      userId,
      ActivityType.LOGIN,
      'New session created',
      ipAddress,
      { deviceType },
      userAgent
    );

    return savedSession;
  }

  async getUserSessions(institutionId: string, userId: string): Promise<UserSession[]> {
    // Check if user exists in this institution
    const user = await this.userRepository.findOne({
      where: { id: userId, institutionId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found in institution ${institutionId}`);
    }

    return await this.userSessionRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' }
    });
  }

  async terminateSession(institutionId: string, userId: string, sessionId: string): Promise<void> {
    // Check if user exists in this institution
    const user = await this.userRepository.findOne({
      where: { id: userId, institutionId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found in institution ${institutionId}`);
    }

    const session = await this.userSessionRepository.findOne({
      where: { id: sessionId, userId }
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    session.isActive = false;
    await this.userSessionRepository.save(session);

    // Log session termination
    await this.userActivityService.logActivity(
      userId,
      ActivityType.LOGOUT,
      'Session terminated',
      session.ipAddress,
      { sessionId }
    );
  }

  async terminateAllSessions(institutionId: string, userId: string, exceptSessionId?: string): Promise<void> {
    // Check if user exists in this institution
    const user = await this.userRepository.findOne({
      where: { id: userId, institutionId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found in institution ${institutionId}`);
    }

    const query = this.userSessionRepository
      .createQueryBuilder()
      .update(UserSession)
      .set({ isActive: false })
      .where('userId = :userId AND isActive = :isActive', { userId, isActive: true });

    if (exceptSessionId) {
      query.andWhere('id != :exceptSessionId', { exceptSessionId });
    }

    await query.execute();

    // Log all sessions termination
    await this.userActivityService.logActivity(
      userId,
      ActivityType.LOGOUT,
      exceptSessionId 
        ? 'All other sessions terminated' 
        : 'All sessions terminated',
      undefined,
      { exceptSessionId }
    );
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    const session = await this.userSessionRepository.findOne({
      where: { id: sessionId }
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    session.lastActivity = new Date();
    await this.userSessionRepository.save(session);
  }

  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();
    
    const result = await this.userSessionRepository
      .createQueryBuilder()
      .update(UserSession)
      .set({ isActive: false })
      .where('expiresAt < :now AND isActive = :isActive', { now, isActive: true })
      .execute();
      
    return result.affected || 0;
  }
}
