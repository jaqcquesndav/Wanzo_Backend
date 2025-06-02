import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, MoreThanOrEqual } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserSession, UserActivity, RolePermission } from '../entities/user-related.entity';
import { 
  CreateUserDto, 
  UpdateUserDto, 
  UserQueryParamsDto, 
  UserSessionsQueryDto, 
  UserActivityQueryDto,
  ChangePasswordDto,
  ResetPasswordDto,
  ResetPasswordRequestDto,
  RolePermissionsUpdateDto
} from '../dtos/user.dto';
import { UserRole, UserStatus, UserType } from '../entities/enums';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UserEventsHandler } from './user-events.handler';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    @InjectRepository(UserActivity)
    private readonly activityRepository: Repository<UserActivity>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
    private readonly userEventsHandler: UserEventsHandler,
  ) {}

  // User CRUD Operations
  async findAll(queryParams: UserQueryParamsDto) {
    const { 
      search, 
      role, 
      userType, 
      customerAccountId, 
      status, 
      page = 1, 
      limit = 10 
    } = queryParams;

    const query = this.userRepository.createQueryBuilder('user');

    // Apply filters
    if (search) {
      query.andWhere('(user.name LIKE :search OR user.email LIKE :search)', { 
        search: `%${search}%` 
      });
    }
    
    if (role) {
      query.andWhere('user.role = :role', { role });
    }
    
    if (userType) {
      query.andWhere('user.userType = :userType', { userType });
    }
    
    if (customerAccountId) {
      query.andWhere('user.customerAccountId = :customerAccountId', { customerAccountId });
    }
    
    if (status) {
      query.andWhere('user.status = :status', { status });
    }

    // Calculate pagination
    const total = await query.getCount();
    const totalPages = Math.ceil(total / limit);
    
    // Apply pagination
    query.skip((page - 1) * limit).take(limit);
    
    // Get results
    const users = await query.getMany();

    return {
      users,
      totalCount: total,
      page,
      totalPages
    };
  }

  async findById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(createUserDto: CreateUserDto) {
    // Check if email is already used
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Validate external user has customerAccountId
    if (createUserDto.userType === UserType.EXTERNAL && !createUserDto.customerAccountId) {
      throw new BadRequestException('Customer Account ID is required for external users');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(createUserDto.password);

    // Get default permissions for the role
    let permissions: string[] = [];
    if (createUserDto.role) {
      const rolePermissions = await this.rolePermissionRepository.findOne({
        where: { role: createUserDto.role },
      });
      if (rolePermissions) {
        permissions = rolePermissions.permissions;
      }
    }

    // Create new user
    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      permissions,
      status: createUserDto.status || UserStatus.PENDING,
    });

    return this.userRepository.save(newUser);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);

    // If updating email, check if it's not already used
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // If role is changing, update permissions
    if (updateUserDto.role && updateUserDto.role !== user.role) {
      const rolePermissions = await this.rolePermissionRepository.findOne({
        where: { role: updateUserDto.role },
      });
      if (rolePermissions) {
        updateUserDto.permissions = rolePermissions.permissions;
      }
    }

    // Update user
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string) {
    const user = await this.findById(id);
    return this.userRepository.remove(user);
  }

  // User Profile Operations
  async getProfile(userId: string) {
    return this.findById(userId);
  }

  async updateProfile(userId: string, updateData: UpdateUserDto) {
    // Restrict what fields can be updated through profile update
    // For example, users shouldn't be able to change their own role
    const allowedUpdates = {
      name: updateData.name,
      phoneNumber: updateData.phoneNumber,
      departement: updateData.departement,
      avatar: updateData.avatar,
    };

    return this.update(userId, allowedUpdates);
  }

  // Password Management
  async changePassword(changePasswordDto: ChangePasswordDto) {
    const { userId, currentPassword, newPassword, confirmPassword } = changePasswordDto;

    // Confirm passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New passwords do not match');
    }    // Get user with password
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!user || !user.password) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Update password
    user.password = await this.hashPassword(newPassword);
    await this.userRepository.save(user);

    return { success: true, message: 'Password changed successfully' };
  }

  async requestPasswordReset(resetRequestDto: ResetPasswordRequestDto) {
    const { email } = resetRequestDto;
    const user = await this.findByEmail(email);

    if (!user) {
      // For security reasons, don't reveal if the email exists
      return { success: true, message: 'If your email exists in our system, you will receive a password reset link' };
    }

    // Generate reset token
    const resetToken = uuidv4();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token valid for 24 hours

    // Save token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = tokenExpiry;
    await this.userRepository.save(user);

    // In a real application, send email with reset link
    // For now, just return success
    return { success: true, message: 'If your email exists in our system, you will receive a password reset link' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword, confirmPassword } = resetPasswordDto;

    // Confirm passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    // Find user with this reset token
    const user = await this.userRepository.findOne({
      where: { 
        resetPasswordToken: token,
        resetPasswordExpires: Not(new Date()),
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Update password
    user.password = await this.hashPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await this.userRepository.save(user);

    return { success: true, message: 'Password has been reset successfully' };
  }

  async adminResetPassword(userId: string) {
    const user = await this.findById(userId);
    
    // Generate reset token
    const resetToken = uuidv4();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token valid for 24 hours

    // Save token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = tokenExpiry;
    await this.userRepository.save(user);

    // In a real application, send email with reset link
    // For now, just return success
    return { success: true, message: 'Password reset initiated for user' };
  }
  // User Status Management
  async toggleUserStatus(userId: string, active: boolean, changedBy: string, reason?: string) {
    const user = await this.findById(userId);
    
    const previousStatus = user.status;
    const newStatus = active ? UserStatus.ACTIVE : UserStatus.INACTIVE;
    
    user.status = newStatus;
    const updatedUser = await this.userRepository.save(user);
    
    // Call the event handler to publish the status change event
    if (this.userEventsHandler) {
      await this.userEventsHandler.handleUserStatusChange(
        userId,
        previousStatus,
        newStatus,
        user.userType,
        changedBy,
        reason
      );
    }
    
    return updatedUser;
  }

  // Session Management
  async getUserSessions(queryParams: UserSessionsQueryDto) {
    const { userId, isActive, page = 1, limit = 10 } = queryParams;

    const query = this.sessionRepository.createQueryBuilder('session')
      .where('session.userId = :userId', { userId });

    if (isActive !== undefined) {
      query.andWhere('session.isActive = :isActive', { isActive });
    }

    const total = await query.getCount();
    const totalPages = Math.ceil(total / limit);

    query.skip((page - 1) * limit)
      .take(limit)
      .orderBy('session.lastActive', 'DESC');

    const sessions = await query.getMany();

    return {
      sessions,
      total,
      page,
      totalPages,
    };
  }

  async terminateSession(sessionId: string) {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    session.isActive = false;
    await this.sessionRepository.save(session);

    return { success: true };
  }

  // Activity Logging
  async getUserActivities(queryParams: UserActivityQueryDto) {
    const { userId, action, startDate, endDate, page = 1, limit = 20 } = queryParams;

    const query = this.activityRepository.createQueryBuilder('activity')
      .where('activity.userId = :userId', { userId });

    if (action) {
      query.andWhere('activity.action = :action', { action });
    }

    if (startDate) {
      query.andWhere('activity.timestamp >= :startDate', { startDate });
    }

    if (endDate) {
      query.andWhere('activity.timestamp <= :endDate', { endDate });
    }

    const total = await query.getCount();
    const totalPages = Math.ceil(total / limit);

    query.skip((page - 1) * limit)
      .take(limit)
      .orderBy('activity.timestamp', 'DESC');

    const activities = await query.getMany();

    return {
      activities,
      total,
      page,
      totalPages,
    };
  }

  async logActivity(userId: string, action: string, ipAddress: string, userAgent: string, metadata?: Record<string, any>) {
    const activity = this.activityRepository.create({
      userId,
      action,
      ipAddress,
      userAgent,
      metadata,
    });

    return this.activityRepository.save(activity);
  }

  // Role & Permissions Management
  async getRolePermissions(role: string) {
    const rolePermissions = await this.rolePermissionRepository.findOne({
      where: { role },
    });

    if (!rolePermissions) {
      throw new NotFoundException(`Role ${role} not found`);
    }

    return rolePermissions;
  }

  async updateRolePermissions(role: string, updateDto: RolePermissionsUpdateDto) {
    let rolePermissions = await this.rolePermissionRepository.findOne({
      where: { role },
    });

    if (!rolePermissions) {
      // Create new role permissions
      rolePermissions = this.rolePermissionRepository.create({
        role,
        permissions: updateDto.permissions,
      });
    } else {
      // Update existing role permissions
      rolePermissions.permissions = updateDto.permissions;
      rolePermissions.updatedAt = new Date();
    }

    await this.rolePermissionRepository.save(rolePermissions);

    // Update permissions for all users with this role
    await this.userRepository.update(
      { role: role as UserRole },
      { permissions: updateDto.permissions }
    );

    return rolePermissions;
  }

  async getAllRolesWithPermissions() {
    return this.rolePermissionRepository.find();
  }

  // User Statistics
  async getUserStatistics() {
    const totalUsers = await this.userRepository.count();
    
    const activeUsers = await this.userRepository.count({
      where: { status: UserStatus.ACTIVE },
    });

    const pendingUsers = await this.userRepository.count({
      where: { status: UserStatus.PENDING },
    });

    // Get user counts by role
    const usersByRole: Record<string, number> = {};
    for (const role of Object.values(UserRole)) {
      usersByRole[role] = await this.userRepository.count({
        where: { role: role as UserRole },
      });
    }

    // Get new users in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsersLast30Days = await this.userRepository.count({
      where: {
        createdAt: MoreThanOrEqual(thirtyDaysAgo),
      },
    });

    return {
      totalUsers,
      activeUsers,
      pendingUsers,
      usersByRole,
      newUsersLast30Days,
    };
  }

  // Helper Methods
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }
}
