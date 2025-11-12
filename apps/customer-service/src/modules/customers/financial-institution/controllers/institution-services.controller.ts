import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpException,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { InstitutionServicesService } from '../services/institution-services.service';
import {
  InstitutionServicesDataDto,
  CreateInstitutionServicesDto,
  UpdateInstitutionServicesDto,
  InstitutionServicesResponseDto,
  ServiceCategory,
  ServiceStatus,
  ServiceType,
} from '../dto/institution-services.dto';

/**
 * Contrôleur pour la gestion des services financiers des institutions
 * Gère les produits bancaires, tarifications et conditions d'accès
 */
@ApiTags('Financial Institution Services Management')
@Controller('institutions/:institutionId/services')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class InstitutionServicesController {
  constructor(private readonly institutionServicesService: InstitutionServicesService) {}

  /**
   * Ajouter un nouveau service financier
   */
  @Post()
  @ApiOperation({
    summary: 'Ajouter un nouveau service financier',
    description: 'Ajoute un nouveau service ou produit financier à une institution',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiBody({ type: InstitutionServicesDataDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Service financier ajouté avec succès',
    type: InstitutionServicesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution non trouvée',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données de service invalides ou service déjà existant',
  })
  async addFinancialService(
    @Param('institutionId') institutionId: string,
    @Body() serviceData: InstitutionServicesDataDto,
  ): Promise<InstitutionServicesResponseDto> {
    try {
      const createServiceDto: CreateInstitutionServicesDto = {
        institutionId,
        service: serviceData,
      };
      return await this.institutionServicesService.addService(institutionId, createServiceDto as any);
    } catch (error) {
      const status = (error as Error).message.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException((error as Error).message, status);
    }
  }

  /**
   * Récupérer tous les services financiers d'une institution
   */
  @Get()
  @ApiOperation({
    summary: 'Récupérer tous les services financiers',
    description: 'Récupère tous les services et produits financiers d\'une institution',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiQuery({
    name: 'category',
    description: 'Filtrer par catégorie de service',
    required: false,
    enum: ServiceCategory,
  })
  @ApiQuery({
    name: 'status',
    description: 'Filtrer par statut de service',
    required: false,
    enum: ServiceStatus,
  })
  @ApiQuery({
    name: 'type',
    description: 'Filtrer par type de service',
    required: false,
    enum: ServiceType,
  })
  @ApiQuery({
    name: 'active',
    description: 'Filtrer par services actifs uniquement',
    required: false,
    type: 'boolean',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Services financiers récupérés avec succès',
    type: [InstitutionServicesResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution non trouvée',
  })
  async getInstitutionServices(
    @Param('institutionId') institutionId: string,
    @Query('category') category?: ServiceCategory,
    @Query('status') status?: ServiceStatus,
    @Query('type') type?: ServiceType,
    @Query('active') active?: boolean,
  ): Promise<InstitutionServicesResponseDto[]> {
    try {
      const filters = { category, status, type, active };
      const result = await this.institutionServicesService.getServices(institutionId);
      return result.services as any;
    } catch (error) {
      const httpStatus = (error as Error).message.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException((error as Error).message, httpStatus);
    }
  }

  /**
   * Récupérer un service financier spécifique
   */
  @Get(':serviceId')
  @ApiOperation({
    summary: 'Récupérer un service financier par ID',
    description: 'Récupère les informations détaillées d\'un service financier spécifique',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiParam({
    name: 'serviceId',
    description: 'Identifiant unique du service financier',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service financier récupéré avec succès',
    type: InstitutionServicesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution ou service financier non trouvé',
  })
  async getFinancialServiceById(
    @Param('institutionId') institutionId: string,
    @Param('serviceId') serviceId: string,
  ): Promise<InstitutionServicesResponseDto> {
    try {
      return await this.institutionServicesService.getServiceById(serviceId) as any;
    } catch (error) {
      throw new HttpException((error as Error).message, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Mettre à jour un service financier
   */
  @Put(':serviceId')
  @ApiOperation({
    summary: 'Mettre à jour un service financier',
    description: 'Met à jour les informations d\'un service financier existant',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiParam({
    name: 'serviceId',
    description: 'Identifiant unique du service financier',
    type: 'string',
  })
  @ApiBody({ type: UpdateInstitutionServicesDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Service financier mis à jour avec succès',
    type: InstitutionServicesResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution ou service financier non trouvé',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données de service invalides',
  })
  async updateFinancialService(
    @Param('institutionId') institutionId: string,
    @Param('serviceId') serviceId: string,
    @Body() updateServiceDto: UpdateInstitutionServicesDto,
  ): Promise<InstitutionServicesResponseDto> {
    try {
      return await this.institutionServicesService.updateService(serviceId, updateServiceDto as any);
    } catch (error) {
      const status = (error as Error).message.includes('non trouvé') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException((error as Error).message, status);
    }
  }

  /**
   * Supprimer un service financier
   */
  @Delete(':serviceId')
  @ApiOperation({
    summary: 'Supprimer un service financier',
    description: 'Supprime un service financier de manière permanente',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiParam({
    name: 'serviceId',
    description: 'Identifiant unique du service financier',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Service financier supprimé avec succès',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution ou service financier non trouvé',
  })
  async deleteFinancialService(
    @Param('institutionId') institutionId: string,
    @Param('serviceId') serviceId: string,
  ): Promise<void> {
    try {
      await this.institutionServicesService.deleteService(serviceId);
    } catch (error) {
      const status = (error as Error).message.includes('non trouvé') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException((error as Error).message, status);
    }
  }

  /**
   * Récupérer les services par catégorie (STUB)
   */
  @Get('category/:category')
  @ApiOperation({
    summary: 'Récupérer les services par catégorie',
    description: 'Récupère tous les services d\'une catégorie spécifique',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiParam({
    name: 'category',
    description: 'Catégorie de service',
    enum: ServiceCategory,
  })
  @ApiQuery({
    name: 'active',
    description: 'Filtrer par services actifs uniquement',
    required: false,
    type: 'boolean',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Services récupérés avec succès',
    type: [InstitutionServicesResponseDto],
  })
  async getServicesByCategory(
    @Param('institutionId') institutionId: string,
    @Param('category') category: ServiceCategory,
    @Query('active') active?: boolean,
  ): Promise<InstitutionServicesResponseDto[]> {
    try {
      // TODO: Implémenter cette méthode dans le service
      throw new Error('Méthode getServicesByCategory non implémentée');
    } catch (error) {
      throw new HttpException((error as Error).message, HttpStatus.NOT_IMPLEMENTED);
    }
  }

  /**
   * Comparer les tarifs (STUB)
   */
  @Get('pricing/compare')
  @ApiOperation({
    summary: 'Comparer les tarifs des services',
    description: 'Compare les tarifs des services financiers de l\'institution',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiQuery({
    name: 'services',
    description: 'Liste des IDs de services à comparer (séparés par des virgules)',
    required: true,
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Comparaison des tarifs effectuée avec succès',
    schema: {
      type: 'object',
      properties: {
        services: { type: 'array' },
        comparison: { type: 'object' },
        recommendations: { type: 'array' },
      },
    },
  })
  async comparePricing(
    @Param('institutionId') institutionId: string,
    @Query('services') serviceIds: string,
  ): Promise<any> {
    try {
      // TODO: Implémenter cette méthode dans le service
      throw new Error('Méthode comparePricing non implémentée');
    } catch (error) {
      throw new HttpException((error as Error).message, HttpStatus.NOT_IMPLEMENTED);
    }
  }

  /**
   * Obtenir les statistiques des services (STUB)
   */
  @Get('analytics/statistics')
  @ApiOperation({
    summary: 'Obtenir les statistiques des services',
    description: 'Récupère des statistiques détaillées sur les services financiers',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistiques des services récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        totalServices: { type: 'number' },
        activeServices: { type: 'number' },
        servicesByCategory: { type: 'object' },
        popularServices: { type: 'array' },
        revenueByService: { type: 'object' },
      },
    },
  })
  async getServiceStatistics(
    @Param('institutionId') institutionId: string,
  ): Promise<any> {
    try {
      // TODO: Implémenter cette méthode dans le service
      throw new Error('Méthode getServiceStatistics non implémentée');
    } catch (error) {
      throw new HttpException((error as Error).message, HttpStatus.NOT_IMPLEMENTED);
    }
  }
}