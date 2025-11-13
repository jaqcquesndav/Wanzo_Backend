import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionServicesEntity } from '../entities/institution-services.entity';
import { 
  CreateFinancialServiceDto, 
  UpdateFinancialServiceDto, 
  FinancialServiceResponseDto,
  ServiceStatus,
  ServiceCategory,
  ServiceType
} from '../dto/institution-services.dto';
import * as crypto from 'crypto';

/**
 * Service pour la gestion des services financiers des institutions
 * Gère le catalogue de services, tarifs, conditions et performances
 */
@Injectable()
export class InstitutionServicesService {
  constructor(
    @InjectRepository(InstitutionServicesEntity)
    private readonly servicesRepository: Repository<InstitutionServicesEntity>,
  ) {}

  /**
   * Ajouter un nouveau service financier à une institution
   */
  async addService(institutionId: string, createServiceDto: CreateFinancialServiceDto): Promise<FinancialServiceResponseDto> {
    try {
      const serviceData = createServiceDto.service;
      
      // Vérification de l'unicité du code de service
      await this.checkServiceCodeUniqueness(institutionId, serviceData.serviceCode);

      // Création du nouveau service avec ID unique
      const serviceId = crypto.randomUUID();
      const currentDate = new Date().toISOString();
      
      const newService = this.servicesRepository.create({
        institutionId,
        serviceCode: serviceData.serviceCode,
        serviceName: serviceData.serviceName,
        description: serviceData.description,
        category: serviceData.category,
        type: serviceData.type,
        status: serviceData.status || ServiceStatus.ACTIVE,
        isActive: true,
        launchDate: createServiceDto.service.launchDate ? new Date(createServiceDto.service.launchDate) : new Date(),
      } as any);

      const savedService = await this.servicesRepository.save(newService);
      
      return this.mapServiceToResponseDto(Array.isArray(savedService) ? savedService[0] : savedService);
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

      const serviceData = updateServiceDto.service;
      
      // Vérification de l'unicité du code si modifié
      if (serviceData?.serviceCode && serviceData.serviceCode !== service.serviceCode) {
        await this.checkServiceCodeUniqueness(service.institutionId, serviceData.serviceCode, serviceId);
      }

      // Mapping des données
      const updateData: any = {};
      if (serviceData?.serviceCode) updateData.code = serviceData.serviceCode;
      if (serviceData?.serviceName) updateData.name = serviceData.serviceName;
      if (serviceData?.description) updateData.description = serviceData.description;
      if (serviceData?.category) updateData.category = serviceData.category;
      if (serviceData?.type) updateData.type = serviceData.type;
      if (serviceData?.status) updateData.status = serviceData.status;
      if (serviceData?.benefits) updateData.benefits = serviceData.benefits;
      
      updateData.lastUpdated = new Date();
      updateData.updatedAt = new Date();

      // Mise à jour des données
      const updatedService = this.servicesRepository.merge(service, updateData);

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
        order: { category: 'ASC', serviceName: 'ASC' }
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
        order: { serviceName: 'ASC' }
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
        order: { serviceName: 'ASC' }
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
        order: { category: 'ASC', serviceName: 'ASC' }
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
      service.discontinuationDate = new Date();
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
      // service.lastUpdated = new Date(); // Propriété non existante
      service.updatedAt = new Date();
      
      if (status === ServiceStatus.DISCONTINUED) {
        service.discontinuationDate = new Date();
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
        order: { category: 'ASC', type: 'ASC', serviceName: 'ASC' }
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
          code: service.serviceCode,
          name: service.serviceName,
          description: service.description,
          type: service.type,
          pricing: service.fees,
          processingTime: {},
          availableChannels: service.getAvailableChannels?.() || [],
          benefits: [],
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

      // Calcul des totaux d'usage (propriété usage n'existe pas dans l'entité)
      const totalTransactions = 0; // TODO: Implémenter tracking usage
      const totalVolume = 0; // TODO: Implémenter tracking usage

      // Services les plus performants (simplifiés sans données usage)
      const topServices = services
        .slice(0, 5)
        .map(service => ({
          id: service.id,
          name: service.serviceName,
          category: service.category,
          transactions: 0,
          volume: 0,
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
  private mapServiceToResponseDto(service: InstitutionServicesEntity): FinancialServiceResponseDto {
    return {
      id: service.id,
      institutionId: service.institutionId,
      serviceCode: service.serviceCode,
      serviceName: service.serviceName,
      description: service.description || '',
      category: service.category as any,
      type: service.type as any,
      status: service.status as any,
      availability: 'always' as any,
      benefits: [],
      interestRate: service.interestRates?.loanRate?.effectiveRate,
      minimumInterestRate: service.interestRates?.savingsRate?.tiers?.[0]?.rate,
      maximumInterestRate: service.interestRates?.savingsRate?.tiers?.slice(-1)[0]?.rate,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    };
  }
}