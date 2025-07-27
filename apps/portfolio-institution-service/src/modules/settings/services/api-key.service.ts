import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey, ApiKeyStatus } from '../entities/api-key.entity';
import { CreateApiKeyDto, UpdateApiKeyDto, ApiKeyResponseDto } from '../dtos/api-key.dto';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  async findAll(institutionId: string): Promise<ApiKey[]> {
    return await this.apiKeyRepository.find({
      where: { institutionId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(institutionId: string, id: string): Promise<ApiKey> {
    const apiKey = await this.apiKeyRepository.findOne({
      where: { id, institutionId },
    });

    if (!apiKey) {
      throw new NotFoundException(`API key with ID ${id} not found`);
    }

    return apiKey;
  }

  async create(institutionId: string, createApiKeyDto: CreateApiKeyDto, userId: string): Promise<ApiKeyResponseDto> {
    // Vérifier si une clé avec ce nom existe déjà
    const existingKey = await this.apiKeyRepository.findOne({
      where: { name: createApiKeyDto.name, institutionId },
    });

    if (existingKey) {
      throw new ConflictException(`API key with name ${createApiKeyDto.name} already exists`);
    }

    // Générer une clé API unique
    const keyPrefix = 'wz_api_';
    const keyValue = keyPrefix + crypto.randomBytes(32).toString('hex');

    const apiKey = this.apiKeyRepository.create({
      ...createApiKeyDto,
      id: `apikey-${uuidv4().substring(0, 6)}`,
      key: keyValue,
      status: ApiKeyStatus.ACTIVE,
      institutionId,
      createdBy: userId,
    });

    const savedApiKey = await this.apiKeyRepository.save(apiKey);

    // Ne retourner la clé complète que lors de la création
    return {
      id: savedApiKey.id,
      name: savedApiKey.name,
      key: savedApiKey.key,
      permissions: savedApiKey.permissions,
      status: savedApiKey.status,
      createdAt: savedApiKey.createdAt,
      lastUsed: savedApiKey.lastUsed,
    };
  }

  async update(institutionId: string, id: string, updateApiKeyDto: UpdateApiKeyDto): Promise<ApiKey> {
    const apiKey = await this.findById(institutionId, id);

    // Si le nom est modifié, vérifier qu'il n'existe pas déjà
    if (updateApiKeyDto.name && updateApiKeyDto.name !== apiKey.name) {
      const existingKey = await this.apiKeyRepository.findOne({
        where: { name: updateApiKeyDto.name, institutionId },
      });

      if (existingKey && existingKey.id !== id) {
        throw new ConflictException(`API key with name ${updateApiKeyDto.name} already exists`);
      }
    }

    Object.assign(apiKey, updateApiKeyDto);
    return await this.apiKeyRepository.save(apiKey);
  }

  async revoke(institutionId: string, id: string): Promise<void> {
    const apiKey = await this.findById(institutionId, id);
    apiKey.status = ApiKeyStatus.REVOKED;
    await this.apiKeyRepository.save(apiKey);
  }

  async delete(institutionId: string, id: string): Promise<void> {
    const apiKey = await this.findById(institutionId, id);
    await this.apiKeyRepository.remove(apiKey);
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.apiKeyRepository.update(id, { lastUsed: new Date() });
  }
}
