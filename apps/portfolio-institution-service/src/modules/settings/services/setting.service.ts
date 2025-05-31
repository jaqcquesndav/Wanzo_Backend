import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';
import { CreateSettingDto, UpdateSettingDto } from '../dtos/setting.dto';

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Setting)
    private settingRepository: Repository<Setting>,
  ) {}

  async findAll(institutionId: string): Promise<Setting[]> {
    return await this.settingRepository.find({
      where: { institutionId },
      order: { key: 'ASC' },
    });
  }

  async findPublic(institutionId: string): Promise<Setting[]> {
    return await this.settingRepository.find({
      where: { institutionId, isPublic: true },
      order: { key: 'ASC' },
    });
  }

  async findByKey(institutionId: string, key: string): Promise<Setting> {
    const setting = await this.settingRepository.findOne({
      where: { institutionId, key },
    });

    if (!setting) {
      throw new NotFoundException(`Setting with key ${key} not found`);
    }

    return setting;
  }

  async create(institutionId: string, createSettingDto: CreateSettingDto, userId: string): Promise<Setting> {
    const setting = this.settingRepository.create({
      ...createSettingDto,
      institutionId,
      createdBy: userId,
    });

    return await this.settingRepository.save(setting);
  }

  async update(institutionId: string, key: string, updateSettingDto: UpdateSettingDto): Promise<Setting> {
    const setting = await this.findByKey(institutionId, key);
    Object.assign(setting, updateSettingDto);
    return await this.settingRepository.save(setting);
  }

  async delete(institutionId: string, key: string): Promise<{ success: boolean; message: string }> {
    const setting = await this.findByKey(institutionId, key);

    if (setting.isSystem) {
      throw new Error('Cannot delete system settings');
    }

    await this.settingRepository.remove(setting);
    return { success: true, message: 'Setting deleted successfully' };
  }
}