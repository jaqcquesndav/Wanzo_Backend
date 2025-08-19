import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionUser } from '../entities/institution-user.entity';
import { CreateInstitutionUserDto, UpdateInstitutionUserDto } from '../dtos/institution-user.dto';

@Injectable()
export class InstitutionUserService {
  constructor(
    @InjectRepository(InstitutionUser)
    private userRepository: Repository<InstitutionUser>,
  ) {}

  async create(
    institutionId: string,
    createUserDto: CreateInstitutionUserDto,
    createdBy: string,
  ): Promise<InstitutionUser> {
    // Vérifier si l'email existe déjà
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const kiotaId = `KIOTA-USR-${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`;

    const user = this.userRepository.create({
      ...createUserDto,
      kiotaId,
      institutionId,
      createdBy,
    });

    return await this.userRepository.save(user);
  }

  async findAll(
    institutionId: string,
    page = 1,
    perPage = 10,
  ): Promise<{
    users: InstitutionUser[];
    total: number;
    page: number;
    perPage: number;
  }> {
    const [users, total] = await this.userRepository.findAndCount({
      where: { institutionId },
      skip: (page - 1) * perPage,
      take: perPage,
      order: { createdAt: 'DESC' },
    });

    return {
      users,
      total,
      page,
      perPage,
    };
  }

  async findById(id: string): Promise<InstitutionUser> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateInstitutionUserDto): Promise<InstitutionUser> {
    const user = await this.findById(id);
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const user = await this.findById(id);
    
    // Désactiver l'utilisateur au lieu de le supprimer
    user.active = false;
    await this.userRepository.save(user);
    
    return {
      success: true,
      message: 'User deactivated successfully',
    };
  }

  async enable2FA(id: string, secret: string): Promise<InstitutionUser> {
    const user = await this.findById(id);
    user.twoFactorEnabled = true;
    user.twoFactorSecret = secret;
    return await this.userRepository.save(user);
  }

  async disable2FA(id: string): Promise<InstitutionUser> {
    const user = await this.findById(id);
    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    return await this.userRepository.save(user);
  }
}
