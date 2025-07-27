import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreference, PreferenceCategory } from '../entities/user-preference.entity';
import { User } from '../entities/user.entity';
import { UserPreferenceDto } from '../dto/user.dto';

@Injectable()
export class UserPreferenceService {
  constructor(
    @InjectRepository(UserPreference)
    private userPreferenceRepository: Repository<UserPreference>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async setPreference(
    institutionId: string, 
    userId: string, 
    preferenceDto: UserPreferenceDto
  ): Promise<UserPreference> {
    // Check if user exists in this institution
    const user = await this.userRepository.findOne({
      where: { id: userId, institutionId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found in institution ${institutionId}`);
    }

    // Check if preference already exists
    let preference = await this.userPreferenceRepository.findOne({
      where: {
        userId,
        category: preferenceDto.category as PreferenceCategory,
        key: preferenceDto.key
      }
    });

    if (preference) {
      // Update existing preference
      preference.value = preferenceDto.value;
      preference.updatedBy = userId;
    } else {
      // Create new preference
      preference = this.userPreferenceRepository.create({
        userId,
        institutionId,
        category: preferenceDto.category as PreferenceCategory,
        key: preferenceDto.key,
        value: preferenceDto.value,
        createdBy: userId
      });
    }

    return await this.userPreferenceRepository.save(preference);
  }

  async getPreferences(institutionId: string, userId: string): Promise<UserPreference[]> {
    // Check if user exists in this institution
    const user = await this.userRepository.findOne({
      where: { id: userId, institutionId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found in institution ${institutionId}`);
    }

    return await this.userPreferenceRepository.find({
      where: { userId }
    });
  }

  async getPreferencesByCategory(
    institutionId: string, 
    userId: string, 
    category: PreferenceCategory
  ): Promise<UserPreference[]> {
    // Check if user exists in this institution
    const user = await this.userRepository.findOne({
      where: { id: userId, institutionId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found in institution ${institutionId}`);
    }

    return await this.userPreferenceRepository.find({
      where: { 
        userId,
        category
      }
    });
  }

  async deletePreference(
    institutionId: string, 
    userId: string, 
    preferenceId: string
  ): Promise<void> {
    // Check if user exists in this institution
    const user = await this.userRepository.findOne({
      where: { id: userId, institutionId }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found in institution ${institutionId}`);
    }

    const preference = await this.userPreferenceRepository.findOne({
      where: { 
        id: preferenceId,
        userId
      }
    });

    if (!preference) {
      throw new NotFoundException(`Preference with ID ${preferenceId} not found`);
    }

    await this.userPreferenceRepository.remove(preference);
  }
}
