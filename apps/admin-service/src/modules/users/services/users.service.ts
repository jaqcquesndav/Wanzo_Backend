import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, MoreThanOrEqual } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserSession, UserActivity, RolePermission } from '../entities/user-related.entity';
import { 
  CreateUserDto, 
  UpdateUserDto,
  UpdateUserRoleDto,
  UserFilterDto,
  UserDto,
  ToggleStatusDto,
  ResetPasswordDto
} from '../dtos';
import { UserRole, UserStatus, UserType } from '../entities/enums';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { EventsService } from '../../events/events.service';
import { EventUserType, SharedUserStatus } from '@wanzo/shared/events/kafka-config';

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
    private readonly eventsService: EventsService,
  ) {}

  private async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email } });
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Convert User entity to UserDto
  private mapUserToDto(user: User): UserDto {
    const userDto = new UserDto();
    userDto.id = user.id;
    userDto.name = user.name;
    userDto.email = user.email;
    userDto.role = user.role;
    userDto.userType = user.userType;
    userDto.customerAccountId = user.customerAccountId;
    userDto.customerName = user.customerName;
    userDto.customerType = user.customerType;
    userDto.status = user.status;
    userDto.avatar = user.avatar;
    userDto.createdAt = user.createdAt.toISOString();
    
    if (user.updatedAt) {
      userDto.updatedAt = user.updatedAt.toISOString();
    }
    
    if (user.lastLogin) {
      userDto.lastLogin = user.lastLogin.toISOString();
    }
    
    userDto.permissions = user.permissions;
    userDto.departement = user.departement;
    userDto.phoneNumber = user.phoneNumber;
    userDto.position = user.position;
    
    return userDto;
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  // User CRUD Operations
  async findAll(filterDto: UserFilterDto): Promise<{ users: UserDto[], totalCount: number, page: number, totalPages: number }> {
    const { 
      search, 
      role, 
      userType, 
      customerAccountId, 
      status, 
      page = 1, 
      limit = 10 
    } = filterDto;

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
    const totalCount = await query.getCount();
    const totalPages = Math.ceil(totalCount / limit);
    
    // Apply pagination
    query.skip((page - 1) * limit).take(limit);
    
    // Get results
    const users = await query.getMany();
    return { users: users.map(user => this.mapUserToDto(user)), totalCount, page, totalPages };
  }

  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await this.hashPassword(createUserDto.password);

    const newUser = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      status: UserStatus.PENDING,
    });

    const savedUser = await this.userRepository.save(newUser);

    await this.eventsService.publishUserCreated({
      userId: savedUser.id,
      email: savedUser.email,
      name: savedUser.name,
      role: savedUser.role,
      userType: savedUser.userType as unknown as EventUserType,
      customerAccountId: savedUser.customerAccountId,
      customerName: savedUser.customerName,
      timestamp: new Date().toISOString(),
    });

    return this.mapUserToDto(savedUser);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    await this.eventsService.publishUserUpdated({
      userId: updatedUser.id,
      updatedFields: updateUserDto,
      timestamp: new Date().toISOString(),
    });

    return this.mapUserToDto(updatedUser);
  }

  async updateRole(id: string, updateRoleDto: UpdateUserRoleDto): Promise<UserDto> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    const previousRole = user.role;

    // Check if role is valid
    const rolePermissions = await this.rolePermissionRepository.findOne({
      where: { role: updateRoleDto.role },
    });

    if (!rolePermissions) {
      throw new BadRequestException(`Role ${updateRoleDto.role} is not valid`);
    }

    // Update role and permissions
    user.role = updateRoleDto.role;
    user.permissions = [{
      applicationId: 'default',
      permissions: rolePermissions.permissions
    }];

    const savedUser = await this.userRepository.save(user);
    
    await this.eventsService.publishUserRoleChanged({
      userId: savedUser.id,
      previousRole: previousRole,
      newRole: savedUser.role,
      userType: savedUser.userType as unknown as EventUserType,
      changedBy: 'admin', // Placeholder, replace with actual admin user ID
      timestamp: new Date().toISOString(),
    });

    // Log activity
    this.logger.log(`User role updated: ${savedUser.id} (${savedUser.email}) to ${updateRoleDto.role}`);
    
    return this.mapUserToDto(savedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    await this.eventsService.publishUserDeleted({
      userId: user.id,
      deletedBy: 'admin', // Placeholder, replace with actual admin user ID
      timestamp: new Date().toISOString(),
    });
  }

  async resetPassword(userId: string): Promise<{ message: string }> {
    const user = await this.findOne(userId);
    // In a real application, you would generate a token and send a reset email.
    // For now, we'll just log the action as a placeholder.
    this.logger.log(`Password reset initiated for user: ${user.id} (${user.email})`);
    await this.eventsService.publishUserPasswordReset({
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
    });
    return { message: 'Password reset initiated successfully.' };
  }

  async toggleUserStatus(userId: string, toggleStatusDto: ToggleStatusDto): Promise<UserDto> {
    const user = await this.findOne(userId);
    const previousStatus = user.status;
    user.status = toggleStatusDto.active ? UserStatus.ACTIVE : UserStatus.INACTIVE;
    const updatedUser = await this.userRepository.save(user);

    await this.eventsService.publishUserStatusChanged({
      userId: updatedUser.id,
      previousStatus: previousStatus as unknown as SharedUserStatus,
      newStatus: updatedUser.status as unknown as SharedUserStatus,
      userType: updatedUser.userType as unknown as EventUserType,
      changedBy: 'admin', // Placeholder, replace with actual admin user ID
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`User status for ${user.email} toggled to ${user.status}`);
    return this.mapUserToDto(updatedUser);
  }

  async getUserActivities(id: string): Promise<UserActivity[]> {
    await this.findOne(id); // a user must exist
    return this.activityRepository.find({ 
      where: { userId: id },
      order: { timestamp: 'DESC' },
      take: 50 // limit results
    });
  }

  async getUserSessions(id: string): Promise<UserSession[]> {
    await this.findOne(id); // a user must exist
    return this.sessionRepository.find({ 
      where: { userId: id },
      order: { lastActive: 'DESC' },
      take: 50 // limit results
    });
  }

  async getDashboardStats(): Promise<any> {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { status: UserStatus.ACTIVE } });
    const usersByRole: Partial<{ [key in UserRole]: number }> = {};

    for (const role of Object.values(UserRole)) {
      usersByRole[role] = await this.userRepository.count({ where: { role } });
    }

    return { totalUsers, activeUsers, usersByRole };
  }

  // User Profile Operations
  async getProfile(userId: string): Promise<UserDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User profile not found`);
    }
    return this.mapUserToDto(user);
  }

  async updateProfile(userId: string, updateData: UpdateUserDto): Promise<UserDto> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User profile not found`);
    }

    // Restrict what fields can be updated through profile update
    const allowedUpdates = {
      name: updateData.name,
      phoneNumber: updateData.phoneNumber,
      departement: updateData.departement,
      avatar: updateData.avatar,
    };

    // Update user properties
    const updatedUser = Object.assign(user, allowedUpdates);
    const savedUser = await this.userRepository.save(updatedUser);
    
    return this.mapUserToDto(savedUser);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordMatching = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordMatching) {
      throw new BadRequestException('Invalid current password');
    }

    user.password = await this.hashPassword(newPassword);
    await this.userRepository.save(user);
    this.logger.log(`Password changed for user ${user.email}`);
  }

  // Role & Permissions Management
  async getRolePermissions(role: UserRole): Promise<any> {
    const rolePermissions = await this.rolePermissionRepository.findOne({
      where: { role },
    });

    if (!rolePermissions) {
      throw new NotFoundException(`Role ${role} not found`);
    }

    return rolePermissions;
  }

  async getAllRolesWithPermissions(): Promise<any[]> {
    return this.rolePermissionRepository.find();
  }

  // User Statistics
  async getUserStatistics(): Promise<any> {
    const totalUsers = await this.userRepository.count();
    
    const activeUsers = await this.userRepository.count({
      where: { status: UserStatus.ACTIVE },
    });

    const pendingUsers = await this.userRepository.count({
      where: { status: UserStatus.PENDING },
    });

    // Get user counts by role
    const usersByRole: Partial<{ [key in UserRole]: number }> = {};
    for (const role of Object.values(UserRole)) {
      usersByRole[role] = await this.userRepository.count({
        where: { role: role },
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
}
