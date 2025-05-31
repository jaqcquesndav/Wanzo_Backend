import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';
import { CreateSettingDto, UpdateSettingDto } from '../dtos/setting.dto';
import { ActivityService } from '../../activities/services/activity.service';

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Setting)
    private settingRepository: Repository<Setting>,
    private activityService: ActivityService,
  ) {}

  async findAll(includeSystem = false) {
    return await this.settingRepository.find({
      where: includeSystem ? {} : { isSystem: false },
    });
  }

  async findPublic() {
    return await this.settingRepository.find({
      where: { isPublic: true },
    });
  }

  async findByKey(key: string) {
    const setting = await this.settingRepository.findOne({ where: { key } });
    if (!setting) {
      throw new NotFoundException(`Setting with key ${key} not found`);
    }
    return setting;
  }

  async create(createSettingDto: CreateSettingDto, userId: string) {
    const setting = this.settingRepository.create(createSettingDto);
    const savedSetting = await this.settingRepository.save(setting);

    await this.activityService.logUserActivity(
      userId,
      'SETTING_CREATED',
      `Setting ${setting.key} was created`,
      { settingId: savedSetting.id }
    );

    return savedSetting;
  }

  async update(key: string, updateSettingDto: UpdateSettingDto, userId: string) {
    const setting = await this.findByKey(key);
    
    Object.assign(setting, updateSettingDto);
    const updatedSetting = await this.settingRepository.save(setting);

    await this.activityService.logUserActivity(
      userId,
      'SETTING_UPDATED',
      `Setting ${setting.key} was updated`,
      { settingId: setting.id }
    );

    return updatedSetting;
  }

  async delete(key: string, userId: string) {
    const setting = await this.findByKey(key);
    
    if (setting.isSystem) {
      throw new Error('Cannot delete system settings');
    }

    await this.settingRepository.remove(setting);

    await this.activityService.logUserActivity(
      userId,
      'SETTING_DELETED',
      `Setting ${setting.key} was deleted`,
      { settingKey: key }
    );

    return { success: true, message: 'Setting deleted successfully' };
  }
}