import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { UserActivity, ActivityType } from '../entities/user-activity.entity';
import { UserPreference } from '../entities/user-preference.entity';
import { UserSession } from '../entities/user-session.entity';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserSearchFilterDto, 
  ChangeUserStatusDto,
  UserPreferenceDto 
} from '../dto/user.dto';
import { EventsService } from '../../events/events.service';
import { EventUserType } from '@wanzobe/shared';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserActivity)
    private userActivityRepository: Repository<UserActivity>,
    @InjectRepository(UserPreference)
    private userPreferenceRepository: Repository<UserPreference>,
    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,
    private eventsService: EventsService,
  ) {}

  async findAll(institutionId: string, filters?: UserSearchFilterDto): Promise<[User[], number]> {
    const where: FindOptionsWhere<User> = { institutionId };

    if (filters) {
      if (filters.search) {
        where.email = Like(`%${filters.search}%`);
        // Or search by name fields - this would need a more complex query
      }
      if (filters.role) {
        where.role = filters.role;
      }
      if (filters.status) {
        where.status = filters.status;
      }
      
      // Date range filters
      if (filters.createdAfter && filters.createdBefore) {
        where.createdAt = Between(new Date(filters.createdAfter), new Date(filters.createdBefore));
      } else if (filters.createdAfter) {
        where.createdAt = Between(new Date(filters.createdAfter), new Date());
      } else if (filters.createdBefore) {
        where.createdAt = Between(new Date(0), new Date(filters.createdBefore));
      }
    }

    return await this.userRepository.findAndCount({
      where,
      order: {
        createdAt: 'DESC',
      },
      select: [
        'id', 'email', 'firstName', 'lastName', 'phone', 'role', 'status',
        'profilePicture', 'institutionId', 'kiotaId', 'isEmailVerified',
        'isTwoFactorEnabled', 'createdAt', 'updatedAt', 'lastLogin'
      ]
    });
  }

  async findById(institutionId: string, id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, institutionId },
      select: [
        'id', 'email', 'firstName', 'lastName', 'phone', 'role', 'status',
        'profilePicture', 'institutionId', 'kiotaId', 'isEmailVerified',
        'isTwoFactorEnabled', 'createdAt', 'updatedAt', 'lastLogin', 'metadata'
      ]
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto, createdBy: string): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new ConflictException(`User with email ${createUserDto.email} already exists`);
    }

    // Generate kiotaId
    const kiotaId = this.generateKiotaId();

    const user = this.userRepository.create({
      ...createUserDto,
      id: uuidv4(),
      kiotaId,
      createdBy,
      status: createUserDto.status || UserStatus.PENDING
    });

    const savedUser = await this.userRepository.save(user);

    // Emit USER_CREATED event to notify customer-service
    try {
      await this.eventsService.publishUserCreated({
        userId: savedUser.id,
        email: savedUser.email,
        name: `${savedUser.firstName || ''} ${savedUser.lastName || ''}`.trim(),
        role: savedUser.role,
        userType: savedUser.role === UserRole.ADMIN ? EventUserType.INSTITUTION_ADMIN : EventUserType.INSTITUTION_USER,
        customerAccountId: savedUser.institutionId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to emit USER_CREATED event:', error);
    }

    return savedUser;
  }

  async update(institutionId: string, id: string, updateUserDto: UpdateUserDto, updatedBy: string): Promise<User> {
    const user = await this.findById(institutionId, id);

    // Check if email is being changed and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email }
      });

      if (existingUser) {
        throw new ConflictException(`User with email ${updateUserDto.email} already exists`);
      }
    }

    Object.assign(user, { ...updateUserDto, updatedBy });
    return await this.userRepository.save(user);
  }

  async changeStatus(institutionId: string, id: string, statusDto: ChangeUserStatusDto, updatedBy: string): Promise<User> {
    const user = await this.findById(institutionId, id);
    
    // Create activity log for status change
    await this.logActivity(
      user.id,
      ActivityType.SETTINGS_CHANGE,
      `User status changed from ${user.status} to ${statusDto.status}`,
      undefined,
      { reason: statusDto.reason }
    );

    user.status = statusDto.status;
    user.updatedBy = updatedBy;
    
    return await this.userRepository.save(user);
  }

  async delete(institutionId: string, id: string): Promise<void> {
    const user = await this.findById(institutionId, id);
    await this.userRepository.remove(user);
  }

  async findByAuth0Id(auth0Id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { auth0Id }
    });

    if (!user) {
      throw new NotFoundException(`User with Auth0 ID ${auth0Id} not found`);
    }

    return user;
  }

  async updateLastLogin(id: string, ipAddress?: string, userAgent?: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.lastLogin = new Date();
    await this.userRepository.save(user);

    // Log login activity
    await this.logActivity(id, ActivityType.LOGIN, 'User logged in', ipAddress, { userAgent });
  }

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
    // Verify user exists in this institution
    await this.findById(institutionId, userId);

    return await this.userActivityRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 100 // Limit to most recent 100 activities
    });
  }

  async setUserPreference(institutionId: string, userId: string, preferenceDto: UserPreferenceDto): Promise<UserPreference> {
    // Verify user exists in this institution
    await this.findById(institutionId, userId);

    // Check if preference already exists
    let preference = await this.userPreferenceRepository.findOne({
      where: {
        userId,
        category: preferenceDto.category as any,
        key: preferenceDto.key
      }
    });

    if (preference) {
      // Update existing preference
      preference.value = preferenceDto.value;
    } else {
      // Create new preference
      preference = this.userPreferenceRepository.create({
        userId,
        institutionId,
        category: preferenceDto.category as any,
        key: preferenceDto.key,
        value: preferenceDto.value
      });
    }

    return await this.userPreferenceRepository.save(preference);
  }

  async getUserPreferences(institutionId: string, userId: string): Promise<UserPreference[]> {
    // Verify user exists in this institution
    await this.findById(institutionId, userId);

    return await this.userPreferenceRepository.find({
      where: { userId }
    });
  }

  async getUserSessions(institutionId: string, userId: string): Promise<UserSession[]> {
    // Verify user exists in this institution
    await this.findById(institutionId, userId);

    return await this.userSessionRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' }
    });
  }

  async terminateSession(institutionId: string, userId: string, sessionId: string): Promise<void> {
    // Verify user exists in this institution
    await this.findById(institutionId, userId);

    const session = await this.userSessionRepository.findOne({
      where: { id: sessionId, userId }
    });

    if (!session) {
      throw new NotFoundException(`Session with ID ${sessionId} not found`);
    }

    session.isActive = false;
    await this.userSessionRepository.save(session);

    // Log logout activity
    await this.logActivity(userId, ActivityType.LOGOUT, 'User session terminated', session.ipAddress);
  }

  async terminateAllSessions(institutionId: string, userId: string, exceptSessionId?: string): Promise<void> {
    // Verify user exists in this institution
    await this.findById(institutionId, userId);

    const query = this.userSessionRepository
      .createQueryBuilder()
      .update(UserSession)
      .set({ isActive: false })
      .where('userId = :userId AND isActive = :isActive', { userId, isActive: true });

    if (exceptSessionId) {
      query.andWhere('id != :exceptSessionId', { exceptSessionId });
    }

    await query.execute();

    // Log activity
    await this.logActivity(userId, ActivityType.LOGOUT, 'All user sessions terminated');
  }

  private generateKiotaId(): string {
    // Generate a unique KIOTA-USR-XXXXXXXX-XX format ID
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    const checksum = Math.random().toString(36).substring(2, 4).toUpperCase();
    return `KIOTA-USR-${randomPart}-${checksum}`;
  }
}
