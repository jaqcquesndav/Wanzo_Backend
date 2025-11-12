import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionServices } from '../entities/institution-services.entity';
import { 
  CreateFinancialServiceDto, 
  UpdateFinancialServiceDto, 
  FinancialServiceResponseDto,
  ServiceCategory,
  ServiceType,
  ServiceStatus
} from '../dto/institution-services.dto';
import * as crypto from 'crypto';

/**
 * Service pour la gestion des services financiers des institutions
 * Gère le catalogue de services, tarifs, conditions et performances
 */
@Injectable()
export class InstitutionServicesService {
  constructor(
    @InjectRepository(InstitutionServices)
    private readonly servicesRepository: Repository<InstitutionServices>,
  ) {}

  /**
   * Ajouter un nouveau service financier à une institution
   */
  async addService(institutionId: string, createServiceDto: CreateFinancialServiceDto): Promise<FinancialServiceResponseDto> {
    try {
      // Vérification de l'unicité du code de service
      await this.checkServiceCodeUniqueness(institutionId, createServiceDto.service.code);

      // Création du nouveau service avec ID unique
      const serviceId = crypto.randomUUID();
      const currentDate = new Date().toISOString();
      
      const newService = this.servicesRepository.create({
        id: serviceId,
        institutionId,
        code: createServiceDto.service.code,
        name: createServiceDto.service.name,
        description: createServiceDto.service.description,
        category: createServiceDto.service.category,
        type: createServiceDto.service.type,
        status: createServiceDto.service.status || ServiceStatus.ACTIVE,
        pricing: createServiceDto.service.pricing,
        conditions: createServiceDto.service.conditions,
        requirements: createServiceDto.service.requirements || [],
        benefits: createServiceDto.service.benefits || [],
        limitations: createServiceDto.service.limitations || [],
        targetAudience: createServiceDto.service.targetAudience || [],
        availableChannels: createServiceDto.service.availableChannels || [],
        processingTime: createServiceDto.service.processingTime,
        minimumAmount: createServiceDto.service.minimumAmount,
        maximumAmount: createServiceDto.service.maximumAmount,
        currency: createServiceDto.service.currency || 'USD',
        isActive: true,
        launchDate: createServiceDto.service.launchDate ? new Date(createServiceDto.service.launchDate) : new Date(),
        lastUpdated: new Date(currentDate),
        usage: {
          totalTransactions: 0,
          totalVolume: 0,
          monthlyGrowth: 0,
          customerSatisfaction: 0,
          averageProcessingTime: 0,
        },
        createdAt: new Date(currentDate),
        updatedAt: new Date(currentDate),
      });

      const savedService = await this.servicesRepository.save(newService);
      
      return this.mapServiceToResponseDto(savedService);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de l'ajout du service: ${errorMessage}`);
    }
  }

  /**
   * Mettre à jour un service existant
   */
  async updateService(serviceId: string, updateServiceDto: UpdateFinancialServiceDto): Promise<FinancialServiceResponseDto> {
    try {
      const service = await this.servicesRepository.findOne({ where: { id: serviceId } });
      
      if (!service) {
        throw new Error('Service non trouvé');
      }

      // Vérification de l'unicité du code si modifié
      if (updateServiceDto.service?.code && updateServiceDto.service.code !== service.code) {
        await this.checkServiceCodeUniqueness(service.institutionId, updateServiceDto.service.code, serviceId);
      }

      // Mise à jour des données
      const updatedService = this.servicesRepository.merge(service, {
        ...updateServiceDto.service,
        lastUpdated: new Date(),
        updatedAt: new Date(),
      });

      const savedService = await this.servicesRepository.save(updatedService);
      
      return this.mapServiceToResponseDto(savedService);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la mise à jour du service: ${errorMessage}`);
    }
  }

  /**
   * Récupérer tous les services d'une institution
   */
  async getServices(institutionId: string, page = 1, limit = 10): Promise<{ services: FinancialServiceResponseDto[], total: number }> {
    try {
      const [services, total] = await this.servicesRepository.findAndCount({
        where: { institutionId },
        skip: (page - 1) * limit,
        take: limit,
        order: { category: 'ASC', name: 'ASC' }
      });

      return {
        services: services.map(service => this.mapServiceToResponseDto(service)),
        total
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des services: ${errorMessage}`);
    }
  }

  /**
   * Récupérer un service par ID
   */
  async getServiceById(serviceId: string): Promise<FinancialServiceResponseDto> {
    try {
      const service = await this.servicesRepository.findOne({ where: { id: serviceId } });
      
      if (!service) {
        throw new Error('Service non trouvé');
      }

      return this.mapServiceToResponseDto(service);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération du service: ${errorMessage}`);
    }
  }

  /**
   * Récupérer les services par catégorie
   */
  async getServicesByCategory(institutionId: string, category: ServiceCategory): Promise<FinancialServiceResponseDto[]> {
    try {
      const services = await this.servicesRepository.find({
        where: { institutionId, category },
        order: { name: 'ASC' }
      });

      return services.map(service => this.mapServiceToResponseDto(service));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des services par catégorie: ${errorMessage}`);
    }
  }

  /**
   * Récupérer les services par type
   */
  async getServicesByType(institutionId: string, type: ServiceType): Promise<FinancialServiceResponseDto[]> {
    try {
      const services = await this.servicesRepository.find({
        where: { institutionId, type },
        order: { name: 'ASC' }
      });

      return services.map(service => this.mapServiceToResponseDto(service));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des services par type: ${errorMessage}`);
    }
  }

  /**
   * Récupérer les services actifs
   */
  async getActiveServices(institutionId: string): Promise<FinancialServiceResponseDto[]> {
    try {
      const services = await this.servicesRepository.find({
        where: { institutionId, isActive: true, status: ServiceStatus.ACTIVE },
        order: { category: 'ASC', name: 'ASC' }
      });

      return services.map(service => this.mapServiceToResponseDto(service));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des services actifs: ${errorMessage}`);
    }
  }

  /**
   * Récupérer les services les plus populaires
   */
  async getPopularServices(institutionId: string, limit = 5): Promise<FinancialServiceResponseDto[]> {
    try {
      const services = await this.servicesRepository
        .createQueryBuilder('service')
        .where('service.institutionId = :institutionId', { institutionId })
        .andWhere('service.isActive = :isActive', { isActive: true })
        .orderBy('service.usage->\'totalTransactions\'', 'DESC')
        .limit(limit)
        .getMany();

      return services.map(service => this.mapServiceToResponseDto(service));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des services populaires: ${errorMessage}`);
    }
  }

  /**
   * Supprimer un service (soft delete)
   */
  async deleteService(serviceId: string): Promise<void> {
    try {
      const service = await this.servicesRepository.findOne({ where: { id: serviceId } });
      
      if (!service) {
        throw new Error('Service non trouvé');
      }

      // Soft delete en désactivant le service
      service.isActive = false;
      service.status = ServiceStatus.DISCONTINUED;
      service.discontinuedDate = new Date();
      service.updatedAt = new Date();
      
      await this.servicesRepository.save(service);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la suppression du service: ${errorMessage}`);
    }
  }

  /**
   * Mettre à jour le statut d'un service
   */
  async updateServiceStatus(serviceId: string, status: ServiceStatus): Promise<FinancialServiceResponseDto> {
    try {
      const service = await this.servicesRepository.findOne({ where: { id: serviceId } });
      
      if (!service) {
        throw new Error('Service non trouvé');
      }

      service.status = status;
      service.isActive = status === ServiceStatus.ACTIVE;
      service.lastUpdated = new Date();
      service.updatedAt = new Date();
      
      if (status === ServiceStatus.DISCONTINUED) {
        service.discontinuedDate = new Date();
      }
      
      const updatedService = await this.servicesRepository.save(service);
      
      return this.mapServiceToResponseDto(updatedService);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la mise à jour du statut: ${errorMessage}`);
    }
  }

  /**
   * Générer un catalogue de services
   */
  async generateServiceCatalog(institutionId: string): Promise<any> {
    try {
      const services = await this.servicesRepository.find({
        where: { institutionId, isActive: true },
        order: { category: 'ASC', type: 'ASC', name: 'ASC' }
      });

      // Regroupement par catégorie
      const servicesByCategory: { [key: string]: any[] } = {};
      
      for (const service of services) {
        const category = service.category;
        if (!servicesByCategory[category]) {
          servicesByCategory[category] = [];
        }
        
        servicesByCategory[category].push({
          id: service.id,
          code: service.code,
          name: service.name,
          description: service.description,
          type: service.type,
          pricing: service.pricing,
          processingTime: service.processingTime,
          availableChannels: service.availableChannels,
          benefits: service.benefits,
        });
      }

      return {
        institutionId,
        totalServices: services.length,
        servicesByCategory,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la génération du catalogue: ${errorMessage}`);
    }
  }

  /**
   * Rechercher des services
   */
  async searchServices(institutionId: string, query: string): Promise<FinancialServiceResponseDto[]> {
    try {
      const services = await this.servicesRepository
        .createQueryBuilder('service')
        .where('service.institutionId = :institutionId', { institutionId })
        .andWhere('service.isActive = :isActive', { isActive: true })
        .andWhere('(service.name ILIKE :query OR service.description ILIKE :query OR service.code ILIKE :query)', 
          { query: `%${query}%` })
        .orderBy('service.name', 'ASC')
        .getMany();

      return services.map(service => this.mapServiceToResponseDto(service));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la recherche de services: ${errorMessage}`);
    }
  }

  /**
   * Générer des statistiques de services
   */
  async generateServiceStatistics(institutionId: string): Promise<any> {
    try {
      const services = await this.servicesRepository.find({
        where: { institutionId }
      });

      const activeServices = services.filter(service => service.isActive);
      
      // Statistiques par catégorie
      const categoryStats: { [key: string]: number } = {};
      for (const service of services) {
        categoryStats[service.category] = (categoryStats[service.category] || 0) + 1;
      }

      // Statistiques par type
      const typeStats: { [key: string]: number } = {};
      for (const service of services) {
        typeStats[service.type] = (typeStats[service.type] || 0) + 1;
      }

      // Statistiques par statut
      const statusStats: { [key: string]: number } = {};
      for (const service of services) {
        statusStats[service.status] = (statusStats[service.status] || 0) + 1;
      }

      // Calcul des totaux d'usage
      const totalTransactions = services.reduce((sum, service) => 
        sum + (service.usage?.totalTransactions || 0), 0);
      const totalVolume = services.reduce((sum, service) => 
        sum + (service.usage?.totalVolume || 0), 0);

      // Services les plus performants
      const topServices = services
        .filter(service => service.usage?.totalTransactions > 0)
        .sort((a, b) => (b.usage?.totalTransactions || 0) - (a.usage?.totalTransactions || 0))
        .slice(0, 5)
        .map(service => ({
          id: service.id,
          name: service.name,
          category: service.category,
          transactions: service.usage?.totalTransactions || 0,
          volume: service.usage?.totalVolume || 0,
        }));

      return {
        summary: {
          totalServices: services.length,
          activeServices: activeServices.length,
          totalTransactions,
          totalVolume,
        },
        categoryStats,
        typeStats,
        statusStats,
        topServices,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération des statistiques: ${errorMessage}`);
    }
  }

  // Méthodes privées

  /**
   * Vérifier l'unicité du code de service
   */
  private async checkServiceCodeUniqueness(institutionId: string, code: string, excludeServiceId?: string): Promise<void> {
    const existingService = await this.servicesRepository
      .createQueryBuilder('service')
      .where('service.institutionId = :institutionId', { institutionId })
      .andWhere('service.code = :code', { code })
      .andWhere(excludeServiceId ? 'service.id != :excludeServiceId' : '1=1', { excludeServiceId })
      .getOne();

    if (existingService) {
      throw new Error(`Un service avec le code "${code}" existe déjà`);
    }
  }

  /**
   * Mapper l'entité Service vers ServiceResponseDto
   */
  private mapServiceToResponseDto(service: InstitutionServices): FinancialServiceResponseDto {
    return {
      id: service.id,
      institutionId: service.institutionId,
      code: service.code,
      name: service.name,
      description: service.description,
      category: service.category,
      type: service.type,
      status: service.status,
      pricing: service.pricing,
      conditions: service.conditions,
      requirements: service.requirements || [],
      benefits: service.benefits || [],
      limitations: service.limitations || [],
      targetAudience: service.targetAudience || [],
      availableChannels: service.availableChannels || [],
      processingTime: service.processingTime,
      minimumAmount: service.minimumAmount,
      maximumAmount: service.maximumAmount,
      currency: service.currency,
      isActive: service.isActive,
      launchDate: service.launchDate?.toISOString(),
      discontinuedDate: service.discontinuedDate?.toISOString(),
      lastUpdated: service.lastUpdated.toISOString(),
      usage: service.usage,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    };
  }
}