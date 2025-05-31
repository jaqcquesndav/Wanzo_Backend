import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateUserDto, UpdateUserDto } from '../dtos/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    // Vérifier si l'email existe déjà
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    // Créer et sauvegarder l'utilisateur
    const newUser = this.userRepository.create(dto);
    return this.userRepository.save(newUser);
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll(page = 1, perPage = 10) {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      users,
      total,
      page,
      perPage,
    };
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const user = await this.findById(id);
    await this.userRepository.remove(user);

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }
}
