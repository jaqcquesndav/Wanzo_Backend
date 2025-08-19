import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting, SettingCategory } from '../entities/setting.entity';
import { CreateSettingDto, UpdateSettingDto, GeneralSettingsDto, SecuritySettingsDto, NotificationSettingsDto } from '../dtos/setting.dto';

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

  async findByCategory(institutionId: string, category: SettingCategory): Promise<Setting[]> {
    return await this.settingRepository.find({
      where: { institutionId, category },
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
    // Vérifier si un paramètre avec cette clé existe déjà
    const existing = await this.settingRepository.findOne({
      where: { institutionId, key: createSettingDto.key },
    });

    if (existing) {
      throw new BadRequestException(`Setting with key ${createSettingDto.key} already exists`);
    }

    const setting = this.settingRepository.create({
      ...createSettingDto,
      institutionId,
      createdBy: userId,
    });

    return await this.settingRepository.save(setting);
  }

  async update(institutionId: string, key: string, updateSettingDto: UpdateSettingDto): Promise<Setting> {
    const setting = await this.findByKey(institutionId, key);
    
    // Empêcher la modification des paramètres système par cette méthode
    if (setting.isSystem) {
      throw new BadRequestException('Cannot update system settings using this method');
    }
    
    Object.assign(setting, updateSettingDto);
    return await this.settingRepository.save(setting);
  }

  async delete(institutionId: string, key: string): Promise<{ success: boolean; message: string }> {
    const setting = await this.findByKey(institutionId, key);

    if (setting.isSystem) {
      throw new BadRequestException('Cannot delete system settings');
    }

    await this.settingRepository.remove(setting);
    return { success: true, message: 'Setting deleted successfully' };
  }

  // Méthodes spécifiques pour les différentes catégories de paramètres
  async getGeneralSettings(institutionId: string): Promise<GeneralSettingsDto> {
    const settings = await this.findByCategory(institutionId, SettingCategory.GENERAL);
    
    // Si aucun paramètre n'existe, retourner des valeurs par défaut
    if (settings.length === 0) {
      return {
        applicationName: 'Wanzo Portfolio Institution',
        primaryColor: '#336699',
        secondaryColor: '#99CCFF',
        tertiaryColor: '#FFFFFF',
        currency: 'XOF',
        language: 'fr',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h'
      };
    }

    // Construire l'objet à partir des paramètres individuels
    const result: any = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    return result as GeneralSettingsDto;
  }

  async updateGeneralSettings(
    institutionId: string, 
    generalSettings: GeneralSettingsDto, 
    userId: string
  ): Promise<GeneralSettingsDto> {
    // Pour chaque propriété, mettre à jour ou créer le paramètre correspondant
    for (const [key, value] of Object.entries(generalSettings)) {
      try {
        const existing = await this.findByKey(institutionId, key);
        await this.update(institutionId, key, { value });
      } catch (error) {
        if (error instanceof NotFoundException) {
          await this.create(institutionId, {
            key,
            value,
            category: SettingCategory.GENERAL,
            isPublic: true
          }, userId);
        } else {
          throw error;
        }
      }
    }

    return await this.getGeneralSettings(institutionId);
  }

  async getSecuritySettings(institutionId: string): Promise<SecuritySettingsDto> {
    const settings = await this.findByCategory(institutionId, SettingCategory.SECURITY);
    
    // Si aucun paramètre n'existe, retourner des valeurs par défaut
    if (settings.length === 0) {
      return {
        passwordPolicy: {
          minLength: 10,
          requireLowercase: true,
          requireUppercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          expiryDays: 90
        },
        sessionTimeout: 30,
        mfaEnabled: false,
        mfaMethods: ['authenticator']
      };
    }

    // Construire l'objet à partir des paramètres individuels
    const result: any = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    return result as SecuritySettingsDto;
  }

  async updateSecuritySettings(
    institutionId: string, 
    securitySettings: SecuritySettingsDto, 
    userId: string
  ): Promise<SecuritySettingsDto> {
    // Pour chaque propriété, mettre à jour ou créer le paramètre correspondant
    for (const [key, value] of Object.entries(securitySettings)) {
      try {
        const existing = await this.findByKey(institutionId, key);
        await this.update(institutionId, key, { value });
      } catch (error) {
        if (error instanceof NotFoundException) {
          await this.create(institutionId, {
            key,
            value,
            category: SettingCategory.SECURITY,
            isPublic: false
          }, userId);
        } else {
          throw error;
        }
      }
    }

    return await this.getSecuritySettings(institutionId);
  }

  async getNotificationSettings(institutionId: string): Promise<NotificationSettingsDto> {
    const settings = await this.findByCategory(institutionId, SettingCategory.NOTIFICATIONS);
    
    // Si aucun paramètre n'existe, retourner des valeurs par défaut
    if (settings.length === 0) {
      return {
        emailEnabled: true,
        pushEnabled: false,
        desktopEnabled: false,
        notificationSettings: {
          portfolio_update: {
            enabled: true,
            channels: ['email']
          },
          risk_alert: {
            enabled: true,
            channels: ['email']
          },
          payment_due: {
            enabled: true,
            channels: ['email']
          }
        }
      };
    }

    // Construire l'objet à partir des paramètres individuels
    const result: any = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }

    return result as NotificationSettingsDto;
  }

  async updateNotificationSettings(
    institutionId: string, 
    notificationSettings: NotificationSettingsDto, 
    userId: string
  ): Promise<NotificationSettingsDto> {
    // Pour chaque propriété, mettre à jour ou créer le paramètre correspondant
    for (const [key, value] of Object.entries(notificationSettings)) {
      try {
        const existing = await this.findByKey(institutionId, key);
        await this.update(institutionId, key, { value });
      } catch (error) {
        if (error instanceof NotFoundException) {
          await this.create(institutionId, {
            key,
            value,
            category: SettingCategory.NOTIFICATIONS,
            isPublic: true
          }, userId);
        } else {
          throw error;
        }
      }
    }

    return await this.getNotificationSettings(institutionId);
  }
}
