import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto, UserRole } from '../dtos/user.dto';
import * as bcrypt from 'bcryptjs';

interface PaginatedUsers {
  users: User[];
  page: number;
  perPage: number;
  total: number;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(
    page = 1, 
    perPage = 10, 
    search?: string,
    companyId?: string
  ): Promise<PaginatedUsers> {
    const where: FindOptionsWhere<User> = {};
    
    if (search) {
      where.name = Like(`%${search}%`);
    }
    
    if (companyId) {
      where.companyId = companyId;
    }
    
    const [users, total] = await this.userRepository.findAndCount({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      order: { createdAt: 'DESC' }
    });

    return {
      users,
      page,
      perPage,
      total,
    };
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Vérifier si l'email existe déjà
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const kiotaId = `KIOTA-USR-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      kiotaId,
    });

    return await this.userRepository.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    
    // Si le rôle est mis à jour, vérifier qu'il est valide
    if (updateUserDto.role) {
      if (!Object.values(UserRole).includes(updateUserDto.role)) {
        throw new BadRequestException(`Invalid role: ${updateUserDto.role}`);
      }
    }
    
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);
    return { success: true, message: 'User deleted successfully' };
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.findById(userId);
    
    // Vérifier que le mot de passe actuel est correct
    const isValid = await this.validatePassword(user, currentPassword);
    if (!isValid) {
      throw new BadRequestException('Current password is incorrect');
    }
    
    // Hasher et enregistrer le nouveau mot de passe
    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
    
    return true;
  }
}