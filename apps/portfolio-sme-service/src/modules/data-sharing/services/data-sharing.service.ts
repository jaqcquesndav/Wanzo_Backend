import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSharingConfig } from '../entities/data-sharing-config.entity';
import { DataSharingHistory } from '../entities/data-sharing-history.entity';
import { UpdateDataSharingConfigDto } from '../dtos/data-sharing.dto';

@Injectable()
export class DataSharingService {
  constructor(
    @InjectRepository(DataSharingConfig)
    private configRepository: Repository<DataSharingConfig>,
    @InjectRepository(DataSharingHistory)
    private historyRepository: Repository<DataSharingHistory>,
  ) {}

  async getConfig(companyId: string): Promise<DataSharingConfig> {
    const config = await this.configRepository.findOne({
      where: { companyId },
    });

    if (!config) {
      // Create default config if none exists
      return await this.configRepository.save({
        companyId,
        sharingEnabled: false,
      });
    }

    return config;
  }

  async updateConfig(
    companyId: string, 
    userId: string,
    updateDto: UpdateDataSharingConfigDto
  ): Promise<DataSharingConfig> {
    let config = await this.getConfig(companyId);

    // Save previous state for history
    const previousState = { ...config };

    // Update sharing configuration
    Object.assign(config, {
      ...updateDto,
      grantedBy: userId,
      consentGrantedAt: updateDto.sharingEnabled ? new Date() : null,
    });

    const updatedConfig = await this.configRepository.save(config);

    // Log the change in history
    await this.historyRepository.save({
      configId: config.id,
      action: 'update',
      previousState,
      newState: updatedConfig,
      performedBy: userId,
    });

    return updatedConfig;
  }

  async checkSharingEnabled(companyId: string, institutionId: string): Promise<boolean> {
    const config = await this.getConfig(companyId);

    return (
      config.sharingEnabled &&
      config.institutionId === institutionId &&
      (!config.consentExpiresAt || config.consentExpiresAt > new Date())
    );
  }

  async revokeConsent(companyId: string, userId: string): Promise<void> {
    const config = await this.getConfig(companyId);
    
    const previousState = { ...config };

    // Revoke consent
    config.sharingEnabled = false;
    config.consentGrantedAt = undefined;
    config.consentExpiresAt = undefined;
    config.institutionId = undefined;
    
    const updatedConfig = await this.configRepository.save(config);

    // Log the change in history
    await this.historyRepository.save({
      configId: config.id,
      action: 'revoke_consent',
      previousState,
      newState: updatedConfig,
      performedBy: userId,
    });
  }

  async getHistory(companyId: string): Promise<DataSharingHistory[]> {
    const config = await this.getConfig(companyId);
    
    return await this.historyRepository.find({
      where: { configId: config.id },
      order: { performedAt: 'DESC' },
    });
  }
}