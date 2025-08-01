import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting, SettingCategory } from '../entities/setting.entity';
import { CreateSettingDto, UpdateSettingDto } from '../dtos/setting.dto';

@Injectable()
export class SettingService {
  private readonly logger = new Logger(SettingService.name);

  constructor(
    @InjectRepository(Setting)
    private settingRepository: Repository<Setting>,
  ) {}

  /**
   * Récupère tous les paramètres pour une entreprise
   */
  async findAll(companyId: string): Promise<Setting[]> {
    this.logger.log(`Récupération de tous les paramètres pour l'entreprise ${companyId}`);
    return await this.settingRepository.find({
      where: { companyId },
      order: { category: 'ASC', key: 'ASC' },
    });
  }

  /**
   * Récupère les paramètres par catégorie
   */
  async findByCategory(companyId: string, category: SettingCategory): Promise<Setting[]> {
    this.logger.log(`Récupération des paramètres de catégorie ${category} pour l'entreprise ${companyId}`);
    return await this.settingRepository.find({
      where: { companyId, category },
      order: { key: 'ASC' },
    });
  }

  /**
   * Récupère les paramètres publics
   */
  async findPublic(companyId: string): Promise<Setting[]> {
    this.logger.log(`Récupération des paramètres publics pour l'entreprise ${companyId}`);
    return await this.settingRepository.find({
      where: { companyId, isPublic: true },
      order: { category: 'ASC', key: 'ASC' },
    });
  }

  /**
   * Récupère un paramètre par sa clé
   */
  async findByKey(companyId: string, key: string): Promise<Setting> {
    this.logger.log(`Recherche du paramètre avec la clé ${key} pour l'entreprise ${companyId}`);
    const setting = await this.settingRepository.findOne({
      where: { companyId, key },
    });

    if (!setting) {
      throw new NotFoundException(`Paramètre avec la clé ${key} non trouvé`);
    }

    return setting;
  }

  /**
   * Crée un nouveau paramètre
   */
  async create(companyId: string, createSettingDto: CreateSettingDto, userId: string): Promise<Setting> {
    // Vérifier si un paramètre avec cette clé existe déjà
    const existing = await this.settingRepository.findOne({
      where: { companyId, key: createSettingDto.key },
    });

    if (existing) {
      throw new BadRequestException(`Un paramètre avec la clé ${createSettingDto.key} existe déjà`);
    }

    this.logger.log(`Création d'un nouveau paramètre ${createSettingDto.key} pour l'entreprise ${companyId}`);

    const setting = this.settingRepository.create({
      ...createSettingDto,
      companyId,
      createdBy: userId,
    });

    return await this.settingRepository.save(setting);
  }

  /**
   * Met à jour un paramètre existant
   */
  async update(companyId: string, key: string, updateSettingDto: UpdateSettingDto): Promise<Setting> {
    const setting = await this.findByKey(companyId, key);

    this.logger.log(`Mise à jour du paramètre ${key} pour l'entreprise ${companyId}`);

    // Mettre à jour les propriétés
    if (updateSettingDto.value !== undefined) {
      setting.value = updateSettingDto.value;
    }
    
    if (updateSettingDto.description !== undefined) {
      setting.description = updateSettingDto.description;
    }
    
    if (updateSettingDto.isPublic !== undefined) {
      setting.isPublic = updateSettingDto.isPublic;
    }

    return await this.settingRepository.save(setting);
  }

  /**
   * Supprime un paramètre
   */
  async remove(companyId: string, key: string): Promise<void> {
    const setting = await this.findByKey(companyId, key);

    if (setting.isSystem) {
      throw new BadRequestException(`Les paramètres système ne peuvent pas être supprimés`);
    }

    this.logger.log(`Suppression du paramètre ${key} pour l'entreprise ${companyId}`);
    await this.settingRepository.remove(setting);
  }

  /**
   * Initialise les paramètres par défaut pour une nouvelle entreprise
   */
  async initializeDefaultSettings(companyId: string, userId: string): Promise<void> {
    this.logger.log(`Initialisation des paramètres par défaut pour l'entreprise ${companyId}`);
    
    const defaultSettings = [
      {
        key: 'general',
        category: SettingCategory.GENERAL,
        value: {
          applicationName: 'Gestion Commerciale',
          defaultCurrency: 'XOF',
          timezone: 'Africa/Dakar',
          dateFormat: 'DD/MM/YYYY',
          language: 'fr'
        },
        description: 'Paramètres généraux',
        isSystem: true,
      },
      {
        key: 'invoice',
        category: SettingCategory.INVOICE,
        value: {
          prefix: 'FACT-',
          startNumber: 1000,
          defaultNotes: 'Merci pour votre confiance',
          paymentTerms: 30
        },
        description: 'Paramètres de facturation',
        isSystem: false,
      },
      {
        key: 'taxes',
        category: SettingCategory.TAXES,
        value: {
          defaultTaxRate: 18,
          taxRates: [
            { name: 'TVA standard', rate: 18 },
            { name: 'TVA réduite', rate: 10 },
            { name: 'Exonéré', rate: 0 }
          ]
        },
        description: 'Paramètres de taxes',
        isSystem: false,
      }
    ];

    for (const defaultSetting of defaultSettings) {
      const existing = await this.settingRepository.findOne({
        where: { companyId, key: defaultSetting.key },
      });

      if (!existing) {
        const setting = this.settingRepository.create({
          ...defaultSetting,
          companyId,
          createdBy: userId,
        });
        await this.settingRepository.save(setting);
      }
    }
  }

  /**
   * Récupère la valeur d'un paramètre par sa clé (avec valeur par défaut)
   */
  async getSettingValue<T>(companyId: string, key: string, defaultValue: T): Promise<T> {
    try {
      const setting = await this.settingRepository.findOne({
        where: { companyId, key },
      });
      
      return setting ? (setting.value as T) : defaultValue;
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Erreur lors de la récupération du paramètre ${key}: ${err.message}`);
      return defaultValue;
    }
  }
}
