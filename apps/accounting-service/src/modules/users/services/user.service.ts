import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto, UserQueryDto, InviteUserDto } from '../dtos/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email }
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userRepository.create({
      ...createUserDto,
      status: UserStatus.ACTIVE
    });
    
    return await this.userRepository.save(user);
  }

  async findAll(organizationId: string, query: UserQueryDto) {
    const { page = 1, pageSize = 20, role, status, search } = query;
    
    let queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.organizationId = :organizationId', { organizationId });

    // Apply filters
    if (role) {
      queryBuilder = queryBuilder.andWhere('user.role = :role', { role });
    }

    if (status) {
      queryBuilder = queryBuilder.andWhere('user.status = :status', { status });
    }

    if (search) {
      queryBuilder = queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply pagination
    const skip = (page - 1) * pageSize;
    queryBuilder = queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(pageSize);

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async findOne(id: string, organizationId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, organizationId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email }
    });
  }

  async update(id: string, organizationId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id, organizationId);

    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async remove(id: string, organizationId: string): Promise<void> {
    const user = await this.findOne(id, organizationId);
    await this.userRepository.remove(user);
  }

  async inviteUser(organizationId: string, inviteUserDto: InviteUserDto, invitedBy: string): Promise<User> {
    // Check if user with email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: inviteUserDto.email }
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.userRepository.create({
      ...inviteUserDto,
      organizationId,
      status: UserStatus.PENDING,
      invitedBy,
      invitedAt: new Date()
    });
    
    const savedUser = await this.userRepository.save(user);

    // Here you would typically send an invitation email
    // await this.emailService.sendInvitation(savedUser);

    return savedUser;
  }

  async activateUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.status = UserStatus.ACTIVE;
    user.activatedAt = new Date();

    return await this.userRepository.save(user);
  }

  async deactivateUser(id: string, organizationId: string): Promise<User> {
    const user = await this.findOne(id, organizationId);
    
    user.status = UserStatus.INACTIVE;
    
    return await this.userRepository.save(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, {
      lastLoginAt: new Date()
    });
  }

  async getUserStats(organizationId: string) {
    const totalUsers = await this.userRepository.count({
      where: { organizationId }
    });

    const activeUsers = await this.userRepository.count({
      where: { organizationId, status: UserStatus.ACTIVE }
    });

    const pendingUsers = await this.userRepository.count({
      where: { organizationId, status: UserStatus.PENDING }
    });

    const inactiveUsers = await this.userRepository.count({
      where: { organizationId, status: UserStatus.INACTIVE }
    });

    return {
      totalUsers,
      activeUsers,
      pendingUsers,
      inactiveUsers
    };
  }

  async reinviteUser(id: string, organizationId: string, invitedBy: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id, organizationId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== UserStatus.PENDING) {
      throw new ConflictException('Only pending users can be reinvited');
    }

    // Update invitation details
    await this.userRepository.update(id, {
      invitedBy,
      invitedAt: new Date()
    });

    // Here you would typically trigger an email service to send the invitation
    // For now, we'll just log it
    console.log(`Reinvitation sent to ${user.email} by ${invitedBy}`);
  }

  async getAvailablePermissions() {
    // Return predefined permissions based on the documentation
    return [
      {
        code: "view_journals",
        name: "Consulter les journaux",
        category: "journals"
      },
      {
        code: "create_entries",
        name: "Créer des écritures",
        category: "journals"
      },
      {
        code: "validate_entries",
        name: "Valider des écritures",
        category: "journals"
      },
      {
        code: "manage_users",
        name: "Gérer les utilisateurs",
        category: "administration"
      },
      {
        code: "view_reports",
        name: "Consulter les rapports",
        category: "reports"
      },
      {
        code: "export_data",
        name: "Exporter les données",
        category: "data"
      }
    ];
  }
}
