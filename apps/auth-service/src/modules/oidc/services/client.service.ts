import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OIDCClient } from '../entities/client.entity';
import { CreateClientDto, UpdateClientDto } from '../dtos/client.dto';
import * as crypto from 'crypto';

@Injectable()
export class ClientService {
  constructor(
    @InjectRepository(OIDCClient)
    private clientRepository: Repository<OIDCClient>,
  ) {}

  async findAll(): Promise<OIDCClient[]> {
    return await this.clientRepository.find({
      where: { active: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<OIDCClient> {
    const client = await this.clientRepository.findOne({ where: { id } });
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    return client;
  }

  async findByClientId(clientId: string): Promise<OIDCClient | null> {
    return await this.clientRepository.findOne({
      where: { clientId, active: true },
    });
  }

  async create(createClientDto: CreateClientDto): Promise<OIDCClient> {
    const clientId = crypto.randomBytes(16).toString('hex');
    const clientSecret = crypto.randomBytes(32).toString('hex');

    const client = this.clientRepository.create({
      ...createClientDto,
      clientId,
      clientSecret,
    });

    return await this.clientRepository.save(client);
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<OIDCClient> {
    const client = await this.findById(id);
    Object.assign(client, updateClientDto);
    return await this.clientRepository.save(client);
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const client = await this.findById(id);
    client.active = false;
    await this.clientRepository.save(client);
    return {
      success: true,
      message: 'Client deactivated successfully',
    };
  }

  async regenerateSecret(id: string): Promise<{ success: boolean; clientSecret: string }> {
    const client = await this.findById(id);
    client.clientSecret = crypto.randomBytes(32).toString('hex');
    await this.clientRepository.save(client);
    return {
      success: true,
      clientSecret: client.clientSecret,
    };
  }
}