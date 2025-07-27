import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { SystemLog, LogLevel } from '../entities/system-log.entity';
import { SystemMaintenance } from '../entities/system-maintenance.entity';
import { SystemInfoResponseDto, SystemLogFilterDto, MaintenanceScheduleDto } from '../dtos/system.dto';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SystemService {
  private version = 'v2.5.3'; // À extraire de la configuration ou du package.json

  constructor(
    @InjectRepository(SystemLog)
    private systemLogRepository: Repository<SystemLog>,
    @InjectRepository(SystemMaintenance)
    private maintenanceRepository: Repository<SystemMaintenance>,
  ) {}

  async getSystemInfo(): Promise<SystemInfoResponseDto> {
    // Récupérer les informations de maintenance
    const maintenance = await this.maintenanceRepository.findOne({
      where: { scheduled: true },
      order: { startTime: 'ASC' },
    });

    // Calculer l'utilisation du stockage (exemple simplifié)
    const totalSize = 5000000000; // 5 GB - à remplacer par une mesure réelle
    const usedSize = Math.floor(totalSize * 0.5); // exemple - à remplacer par une mesure réelle

    return {
      environment: process.env.NODE_ENV || 'development',
      version: this.version,
      lastUpdate: new Date('2025-07-15T08:30:00Z'), // À remplacer par une valeur réelle
      storage: {
        totalSize,
        usedSize,
        percentage: Math.floor((usedSize / totalSize) * 100),
      },
      maintenance: maintenance ? {
        scheduled: true,
        startTime: maintenance.startTime,
        endTime: maintenance.endTime,
        message: maintenance.message,
      } : {
        scheduled: false,
      },
      limits: {
        maxUploadSize: 10485760, // 10 MB
        maxUsers: 500,
        maxPortfolios: 1000,
        apiRateLimit: 100,
      },
    };
  }

  async getLogs(filter: SystemLogFilterDto): Promise<{
    data: SystemLog[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.systemLogRepository.createQueryBuilder('log');

    if (filter.level) {
      queryBuilder.andWhere('log.level = :level', { level: filter.level });
    }

    if (filter.service) {
      queryBuilder.andWhere('log.service = :service', { service: filter.service });
    }

    if (filter.startDate && filter.endDate) {
      queryBuilder.andWhere('log.timestamp BETWEEN :startDate AND :endDate', {
        startDate: new Date(filter.startDate),
        endDate: new Date(filter.endDate),
      });
    } else if (filter.startDate) {
      queryBuilder.andWhere('log.timestamp >= :startDate', { startDate: new Date(filter.startDate) });
    } else if (filter.endDate) {
      queryBuilder.andWhere('log.timestamp <= :endDate', { endDate: new Date(filter.endDate) });
    }

    if (filter.search) {
      queryBuilder.andWhere('log.message LIKE :search', { search: `%${filter.search}%` });
    }

    const [logs, total] = await queryBuilder
      .orderBy('log.timestamp', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createLog(
    level: LogLevel,
    service: string,
    message: string,
    details?: any,
    institutionId?: string,
    userId?: string,
  ): Promise<SystemLog> {
    const log = this.systemLogRepository.create({
      level,
      service,
      message,
      details,
      institutionId,
      userId,
    });

    return await this.systemLogRepository.save(log);
  }

  async scheduleMaintenance(maintenanceDto: MaintenanceScheduleDto, userId: string): Promise<SystemMaintenance> {
    // Vérifier s'il existe déjà une maintenance planifiée
    const existingMaintenance = await this.maintenanceRepository.findOne({
      where: { scheduled: true },
    });

    if (existingMaintenance) {
      throw new ConflictException('Une maintenance est déjà planifiée');
    }

    const startTime = new Date(maintenanceDto.startTime);
    const endTime = new Date(maintenanceDto.endTime);

    // Vérifier que les dates sont valides
    if (startTime <= new Date() || endTime <= startTime) {
      throw new BadRequestException('Les dates de maintenance sont invalides');
    }

    const maintenance = this.maintenanceRepository.create({
      startTime,
      endTime,
      message: maintenanceDto.message,
      notifyUsers: maintenanceDto.notifyUsers || false,
      scheduled: true,
      createdBy: userId,
    });

    const savedMaintenance = await this.maintenanceRepository.save(maintenance);

    // Si notification demandée, ajouter une tâche pour envoyer les notifications
    if (savedMaintenance.notifyUsers) {
      // Logique pour envoyer des notifications aux utilisateurs
      // Par exemple, ajouter à une file d'attente ou envoyer immédiatement
      savedMaintenance.notificationSent = true;
      await this.maintenanceRepository.save(savedMaintenance);
    }

    return savedMaintenance;
  }

  async cancelMaintenance(): Promise<{ success: boolean; message: string }> {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { scheduled: true },
    });

    if (!maintenance) {
      throw new NotFoundException('Aucune maintenance planifiée');
    }

    maintenance.scheduled = false;
    await this.maintenanceRepository.save(maintenance);

    return { success: true, message: 'Maintenance annulée avec succès' };
  }
}
