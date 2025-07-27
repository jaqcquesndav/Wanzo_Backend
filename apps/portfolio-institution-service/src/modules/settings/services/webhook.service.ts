import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from '../entities/webhook.entity';
import { CreateWebhookDto, UpdateWebhookDto, WebhookTestResponseDto } from '../dtos/webhook.dto';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(Webhook)
    private webhookRepository: Repository<Webhook>,
  ) {}

  async findAll(institutionId: string): Promise<Webhook[]> {
    return await this.webhookRepository.find({
      where: { institutionId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(institutionId: string, id: string): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({
      where: { id, institutionId },
      select: ['id', 'event', 'url', 'active', 'secret', 'lastResponse', 'createdAt', 'updatedAt'],
    });

    if (!webhook) {
      throw new NotFoundException(`Webhook with ID ${id} not found`);
    }

    return webhook;
  }

  async create(institutionId: string, createWebhookDto: CreateWebhookDto, userId: string): Promise<Webhook> {
    const webhook = this.webhookRepository.create({
      ...createWebhookDto,
      id: `webhook-${uuidv4().substring(0, 6)}`,
      institutionId,
      createdBy: userId,
    });

    return await this.webhookRepository.save(webhook);
  }

  async update(institutionId: string, id: string, updateWebhookDto: UpdateWebhookDto): Promise<Webhook> {
    const webhook = await this.findById(institutionId, id);
    Object.assign(webhook, updateWebhookDto);
    return await this.webhookRepository.save(webhook);
  }

  async delete(institutionId: string, id: string): Promise<void> {
    const webhook = await this.findById(institutionId, id);
    await this.webhookRepository.remove(webhook);
  }

  async test(institutionId: string, id: string): Promise<WebhookTestResponseDto> {
    const webhook = await this.findById(institutionId, id);

    if (!webhook.active) {
      throw new BadRequestException('Cannot test inactive webhook');
    }

    // Créer un payload de test
    const testPayload = {
      event: webhook.event,
      test: true,
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test event',
      },
    };

    // Signer le payload si un secret est défini
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (webhook.secret) {
      const signature = this.signPayload(testPayload, webhook.secret);
      headers['X-Wanzo-Signature'] = signature;
    }

    const startTime = Date.now();
    
    try {
      const response = await axios.post(webhook.url, testPayload, { headers, timeout: 5000 });
      const latency = Date.now() - startTime;

      // Sauvegarder la réponse
      const lastResponse = {
        statusCode: response.status,
        response: JSON.stringify(response.data),
        latency,
        timestamp: new Date(),
      };

      webhook.lastResponse = lastResponse;
      await this.webhookRepository.save(webhook);

      return {
        success: true,
        message: 'Webhook testé avec succès',
        details: {
          statusCode: response.status,
          response: JSON.stringify(response.data),
          latency,
        },
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      let statusCode = 500;
      let responseData = 'Erreur de connexion';

      if (error.response) {
        statusCode = error.response.status;
        responseData = JSON.stringify(error.response.data);
      }

      // Sauvegarder la réponse d'erreur
      const lastResponse = {
        statusCode,
        response: responseData,
        latency,
        timestamp: new Date(),
      };

      webhook.lastResponse = lastResponse;
      await this.webhookRepository.save(webhook);

      return {
        success: false,
        message: 'Le test du webhook a échoué',
        details: {
          statusCode,
          response: responseData,
          latency,
        },
      };
    }
  }

  private signPayload(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    const signature = hmac.update(JSON.stringify(payload)).digest('hex');
    return signature;
  }

  async triggerWebhooks(event: string, payload: any): Promise<void> {
    const webhooks = await this.webhookRepository.find({
      where: { event, active: true },
    });

    webhooks.forEach(webhook => {
      this.sendWebhookPayload(webhook, payload);
    });
  }

  private async sendWebhookPayload(webhook: Webhook, payload: any): Promise<void> {
    // Préparer le payload
    const webhookPayload = {
      event: webhook.event,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    // Signer le payload si un secret est défini
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (webhook.secret) {
      const signature = this.signPayload(webhookPayload, webhook.secret);
      headers['X-Wanzo-Signature'] = signature;
    }

    const startTime = Date.now();
    
    try {
      const response = await axios.post(webhook.url, webhookPayload, { headers, timeout: 5000 });
      const latency = Date.now() - startTime;

      // Sauvegarder la réponse
      const lastResponse = {
        statusCode: response.status,
        response: JSON.stringify(response.data),
        latency,
        timestamp: new Date(),
      };

      webhook.lastResponse = lastResponse;
      await this.webhookRepository.save(webhook);
    } catch (error: any) {
      // Gérer l'erreur mais ne pas bloquer le processus
      const latency = Date.now() - startTime;
      let statusCode = 500;
      let responseData = 'Erreur de connexion';

      if (error.response) {
        statusCode = error.response.status;
        responseData = JSON.stringify(error.response.data);
      }

      // Sauvegarder la réponse d'erreur
      const lastResponse = {
        statusCode,
        response: responseData,
        latency,
        timestamp: new Date(),
      };

      webhook.lastResponse = lastResponse;
      await this.webhookRepository.save(webhook);
    }
  }
}
