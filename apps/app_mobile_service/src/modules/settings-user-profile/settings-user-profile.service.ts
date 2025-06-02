import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfile } from './entities/user-profile.entity';
import { AppSettings } from './entities/app-settings.entity';
import { NotificationSettings } from './entities/notification-settings.entity';
import { BusinessSector } from './entities/business-sector.entity';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { CreateBusinessSectorDto, UpdateBusinessSectorDto } from './dto/business-sector.dto';
import { User } from '../auth/entities/user.entity'; // Assuming User entity path

@Injectable()
export class SettingsUserProfileService {
  private readonly logger = new Logger(SettingsUserProfileService.name);

  constructor(
    @InjectRepository(UserProfile)
    private readonly userProfileRepository: Repository<UserProfile>,
    @InjectRepository(AppSettings)
    private readonly appSettingsRepository: Repository<AppSettings>,
    @InjectRepository(NotificationSettings)
    private readonly notificationSettingsRepository: Repository<NotificationSettings>,
    @InjectRepository(BusinessSector)
    private readonly businessSectorRepository: Repository<BusinessSector>,
    @InjectRepository(User) // To validate user existence
    private readonly userRepository: Repository<User>,
  ) {}

  // --- User Profile Methods ---
  async findUserProfileByUserId(userId: string): Promise<UserProfile> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    let profile = await this.userProfileRepository.findOne({ where: { userId }, relations: ['businessSector'] });
    if (!profile) {
      // Create a default profile if it doesn't exist
      this.logger.log(`No profile found for user ${userId}, creating a new one.`);
      profile = this.userProfileRepository.create({ userId });
      await this.userProfileRepository.save(profile);
    }
    return profile;
  }

  async updateUserProfile(userId: string, updateUserProfileDto: UpdateUserProfileDto): Promise<UserProfile> {
    const profile = await this.findUserProfileByUserId(userId); // Ensures profile exists or is created

    const { businessSectorId, dateOfBirth, ...otherProfileData } = updateUserProfileDto;

    Object.assign(profile, otherProfileData);

    if (dateOfBirth) {
      profile.dateOfBirth = new Date(dateOfBirth);
    }

    if (businessSectorId) {
      const businessSector = await this.businessSectorRepository.findOneBy({ id: businessSectorId });
      if (!businessSector) {
        throw new NotFoundException(`BusinessSector with ID ${businessSectorId} not found`);
      }
      profile.businessSector = businessSector;
      profile.businessSectorId = businessSectorId;
    } else if (businessSectorId === null) { // Explicitly set to null
        profile.businessSector = undefined;
        profile.businessSectorId = undefined;
    }

    try {
      return await this.userProfileRepository.save(profile);
    } catch (error: any) {
      this.logger.error(`Failed to update profile for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // --- App Settings Methods ---
  async findAppSettingsByUserId(userId: string): Promise<AppSettings> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    let settings = await this.appSettingsRepository.findOne({ where: { userId } });
    if (!settings) {
      this.logger.log(`No app settings found for user ${userId}, creating new ones.`);
      settings = this.appSettingsRepository.create({ userId }); // Default values are set in entity
      await this.appSettingsRepository.save(settings);
    }
    return settings;
  }

  async updateAppSettings(userId: string, updateAppSettingsDto: UpdateAppSettingsDto): Promise<AppSettings> {
    const settings = await this.findAppSettingsByUserId(userId);
    Object.assign(settings, updateAppSettingsDto);
    try {
      return await this.appSettingsRepository.save(settings);
    } catch (error: any) {
      this.logger.error(`Failed to update app settings for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // --- Notification Settings Methods ---
  async findNotificationSettingsByUserId(userId: string): Promise<NotificationSettings> {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    let settings = await this.notificationSettingsRepository.findOne({ where: { userId } });
    if (!settings) {
      this.logger.log(`No notification settings found for user ${userId}, creating new ones.`);
      settings = this.notificationSettingsRepository.create({ userId }); // Default values are set in entity
      await this.notificationSettingsRepository.save(settings);
    }
    return settings;
  }

  async updateNotificationSettings(userId: string, updateDto: UpdateNotificationSettingsDto): Promise<NotificationSettings> {
    const settings = await this.findNotificationSettingsByUserId(userId);
    Object.assign(settings, updateDto);
    try {
      return await this.notificationSettingsRepository.save(settings);
    } catch (error: any) {
      this.logger.error(`Failed to update notification settings for user ${userId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  // --- Business Sector Methods (Admin-focused) ---
  async createBusinessSector(createDto: CreateBusinessSectorDto): Promise<BusinessSector> {
    const existing = await this.businessSectorRepository.findOne({ where: { name: createDto.name } });
    if (existing) {
      throw new BadRequestException(`Business sector with name '${createDto.name}' already exists.`);
    }
    const newSector = this.businessSectorRepository.create(createDto);
    try {
      return await this.businessSectorRepository.save(newSector);
    } catch (error: any) {
      this.logger.error(`Failed to create business sector: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAllBusinessSectors(): Promise<BusinessSector[]> {
    try {
      return await this.businessSectorRepository.find();
    } catch (error: any) {
      this.logger.error(`Failed to find all business sectors: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findOneBusinessSector(id: string): Promise<BusinessSector> {
    const sector = await this.businessSectorRepository.findOneBy({ id });
    if (!sector) {
      throw new NotFoundException(`BusinessSector with ID ${id} not found`);
    }
    return sector;
  }

  async updateBusinessSector(id: string, updateDto: UpdateBusinessSectorDto): Promise<BusinessSector> {
    const sector = await this.findOneBusinessSector(id);
    if (updateDto.name && updateDto.name !== sector.name) {
        const existing = await this.businessSectorRepository.findOne({ where: { name: updateDto.name } });
        if (existing && existing.id !== id) {
            throw new BadRequestException(`Business sector with name '${updateDto.name}' already exists.`);
        }
    }
    Object.assign(sector, updateDto);
    try {
      return await this.businessSectorRepository.save(sector);
    } catch (error: any) {
      this.logger.error(`Failed to update business sector ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async deleteBusinessSector(id: string): Promise<void> {
    const sector = await this.findOneBusinessSector(id);
    // Consider checking for dependencies (e.g., if UserProfiles are using this sector)
    // For now, direct delete:
    try {
      await this.businessSectorRepository.remove(sector);
    } catch (error: any) {
      this.logger.error(`Failed to delete business sector ${id}: ${error.message}`, error.stack);
      // Check for constraint violations, e.g., if it's in use
      if (error.code === '23503') { // PostgreSQL foreign key violation
        throw new BadRequestException('This business sector cannot be deleted as it is currently in use.');
      }
      throw error;
    }
  }
}
