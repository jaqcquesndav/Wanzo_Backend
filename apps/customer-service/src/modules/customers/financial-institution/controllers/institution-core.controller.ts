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
  ParseIntPipe,
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
import { InstitutionCoreService } from '../services/institution-core.service';
import {
  CreateFinancialInstitutionDto,
  UpdateFinancialInstitutionDto,
  FinancialInstitutionResponseDto,
  InstitutionType,
  InstitutionStatus,
  LicenseType,
} from '../dto/institution-core.dto';

/**
 * Contrôleur pour la gestion du profil principal des institutions financières
 * Gère les informations de base, licences, contacts et conformité réglementaire
 */
@ApiTags('Financial Institution Core Management')
@Controller('financial-institutions/core')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class InstitutionCoreController {
  constructor(private readonly institutionCoreService: InstitutionCoreService) {}

  /**
   * Créer une nouvelle institution financière
   */
  @Post()
  @ApiOperation({
    summary: 'Créer une nouvelle institution financière',
    description: 'Crée un nouveau profil d\'institution financière avec toutes les informations de base',
  })
  @ApiBody({ type: CreateFinancialInstitutionDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Institution financière créée avec succès',
    type: FinancialInstitutionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données invalides ou nom d\'institution déjà existant',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Institution financière déjà existante',
  })
  async createInstitution(
    @Body() institutionData: CreateFinancialInstitutionDto,
  ): Promise<FinancialInstitutionResponseDto> {
    try {
      return await this.institutionCoreService.createInstitution(institutionData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la création de l\'institution';
      if (errorMessage.includes('déjà existant')) {
        throw new HttpException(errorMessage, HttpStatus.CONFLICT);
      }
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Récupérer toutes les institutions financières avec filtres
   */
  @Get()
  @ApiOperation({
    summary: 'Récupérer toutes les institutions financières',
    description: 'Récupère la liste des institutions financières avec possibilité de filtrage',
  })
  @ApiQuery({
    name: 'type',
    description: 'Type d\'institution',
    required: false,
    enum: InstitutionType,
  })
  @ApiQuery({
    name: 'status',
    description: 'Statut de l\'institution',
    required: false,
    enum: InstitutionStatus,
  })
  @ApiQuery({
    name: 'page',
    description: 'Numéro de page',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Nombre d\'éléments par page',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Institutions financières récupérées avec succès',
    type: [FinancialInstitutionResponseDto],
  })
  async getAllInstitutions(
    @Query('type') type?: InstitutionType,
    @Query('status') status?: InstitutionStatus,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<FinancialInstitutionResponseDto[]> {
    try {
      const filters = { type, status };
      const pagination = { page: page || 1, limit: limit || 10 };
      return await this.institutionCoreService.getInstitutionsByFilters(filters, pagination);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la récupération des institutions';
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Récupérer une institution financière par ID
   */
  @Get(':institutionId')
  @ApiOperation({
    summary: 'Récupérer une institution financière par ID',
    description: 'Récupère les informations complètes d\'une institution financière',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution financière',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Institution financière récupérée avec succès',
    type: FinancialInstitutionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution financière non trouvée',
  })
  async getInstitutionById(
    @Param('institutionId') institutionId: string,
  ): Promise<FinancialInstitutionResponseDto> {
    try {
      return await this.institutionCoreService.getInstitutionById(institutionId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Institution financière non trouvée';
      throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Mettre à jour une institution financière
   */
  @Put(':institutionId')
  @ApiOperation({
    summary: 'Mettre à jour une institution financière',
    description: 'Met à jour les informations d\'une institution financière existante',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution financière',
    type: 'string',
  })
  @ApiBody({ type: CreateFinancialInstitutionDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Institution financière mise à jour avec succès',
    type: FinancialInstitutionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution financière non trouvée',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données invalides',
  })
  async updateInstitution(
    @Param('institutionId') institutionId: string,
    @Body() updateData: Partial<CreateFinancialInstitutionDto>,
  ): Promise<FinancialInstitutionResponseDto> {
    try {
      const updateInstitutionDto: UpdateFinancialInstitutionDto = {
        ...updateData,
      };
      return await this.institutionCoreService.updateInstitution(institutionId, updateInstitutionDto);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'institution';
      const status = errorMessage.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Supprimer une institution financière
   */
  @Delete(':institutionId')
  @ApiOperation({
    summary: 'Supprimer une institution financière',
    description: 'Supprime définitivement une institution financière (si pas de contraintes)',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution financière',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Institution financière supprimée avec succès',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution financière non trouvée',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Impossible de supprimer en raison de contraintes',
  })
  async deleteInstitution(@Param('institutionId') institutionId: string): Promise<{ success: boolean }> {
    try {
      await this.institutionCoreService.deleteInstitution(institutionId);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'institution';
      if (errorMessage.includes('contraintes')) {
        throw new HttpException(errorMessage, HttpStatus.CONFLICT);
      }
      if (errorMessage.includes('non trouvée')) {
        throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
      }
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Rechercher des institutions financières
   */
  @Get('search')
  @ApiOperation({
    summary: 'Rechercher des institutions financières',
    description: 'Recherche des institutions financières par nom, code ou autres critères',
  })
  @ApiQuery({
    name: 'term',
    description: 'Terme de recherche',
    type: 'string',
    required: true,
  })
  @ApiQuery({
    name: 'type',
    description: 'Type d\'institution',
    required: false,
    enum: InstitutionType,
  })
  @ApiQuery({
    name: 'status',
    description: 'Statut de l\'institution',
    required: false,
    enum: InstitutionStatus,
  })
  @ApiQuery({
    name: 'page',
    description: 'Numéro de page',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Nombre d\'éléments par page',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Résultats de recherche récupérés avec succès',
    type: [FinancialInstitutionResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Terme de recherche requis',
  })
  async searchInstitutions(
    @Query('term') searchTerm: string,
    @Query('type') type?: InstitutionType,
    @Query('status') status?: InstitutionStatus,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<FinancialInstitutionResponseDto[]> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        throw new HttpException('Terme de recherche requis', HttpStatus.BAD_REQUEST);
      }
      const filters = { type, status };
      const pagination = { page: page || 1, limit: limit || 10 };
      return await this.institutionCoreService.searchInstitutionsByName(searchTerm, filters, pagination);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la recherche d\'institutions';
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Récupérer les institutions par type
   */
  @Get('type/:type')
  @ApiOperation({
    summary: 'Récupérer les institutions par type',
    description: 'Récupère toutes les institutions d\'un type donné',
  })
  @ApiParam({
    name: 'type',
    description: 'Type d\'institution',
    enum: InstitutionType,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Institutions récupérées avec succès',
    type: [FinancialInstitutionResponseDto],
  })
  async getInstitutionsByType(
    @Param('type') type: InstitutionType,
  ): Promise<FinancialInstitutionResponseDto[]> {
    try {
      return await this.institutionCoreService.getInstitutionsByType(type);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la récupération des institutions par type';
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Mettre à jour le statut d'une institution
   */
  @Put(':institutionId/status')
  @ApiOperation({
    summary: 'Mettre à jour le statut d\'une institution',
    description: 'Change le statut d\'une institution financière (actif, inactif, suspendu, etc.)',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution financière',
    type: 'string',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { enum: Object.values(InstitutionStatus) },
        reason: { type: 'string' },
      },
      required: ['status'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statut de l\'institution mis à jour avec succès',
    type: FinancialInstitutionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution financière non trouvée',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Statut invalide',
  })
  async updateInstitutionStatus(
    @Param('institutionId') institutionId: string,
    @Body('status') newStatus: InstitutionStatus,
    @Body('reason') reason?: string,
  ): Promise<FinancialInstitutionResponseDto> {
    try {
      if (!Object.values(InstitutionStatus).includes(newStatus)) {
        throw new HttpException('Statut d\'institution invalide', HttpStatus.BAD_REQUEST);
      }
      return await this.institutionCoreService.updateInstitution(institutionId, { 
        status: newStatus as any,
        statusChangeReason: reason 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du statut';
      const status = errorMessage.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Ajouter une licence à une institution
   */
  @Post(':institutionId/licenses')
  @ApiOperation({
    summary: 'Ajouter une licence',
    description: 'Ajoute une nouvelle licence à une institution financière',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution financière',
    type: 'string',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        licenseType: { enum: Object.values(LicenseType) },
        licenseNumber: { type: 'string' },
        issuer: { type: 'string' },
        issuedDate: { type: 'string' },
        expiryDate: { type: 'string' },
      },
      required: ['licenseType', 'licenseNumber', 'issuer', 'issuedDate'],
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Licence ajoutée avec succès',
    type: FinancialInstitutionResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution financière non trouvée',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Licence déjà existante',
  })
  async addLicense(
    @Param('institutionId') institutionId: string,
    @Body() licenseData: {
      licenseType: LicenseType;
      licenseNumber: string;
      issuer: string;
      issuedDate: string;
      expiryDate?: string;
    },
  ): Promise<FinancialInstitutionResponseDto> {
    try {
      return await this.institutionCoreService.updateInstitution(institutionId, {
        licenses: [licenseData] as any
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajout de la licence';
      if (errorMessage.includes('déjà existant')) {
        throw new HttpException(errorMessage, HttpStatus.CONFLICT);
      }
      const status = errorMessage.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Récupérer les statistiques des institutions
   */
  @Get('analytics/statistics')
  @ApiOperation({
    summary: 'Récupérer les statistiques des institutions',
    description: 'Récupère des statistiques générales sur les institutions financières',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistiques récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        totalInstitutions: { type: 'number' },
        activeInstitutions: { type: 'number' },
        institutionsByType: { type: 'object' },
        institutionsByStatus: { type: 'object' },
        totalLicenses: { type: 'number' },
        expiredLicenses: { type: 'number' },
      },
    },
  })
  async getInstitutionStatistics(): Promise<{
    totalInstitutions: number;
    activeInstitutions: number;
    institutionsByType: Record<InstitutionType, number>;
    institutionsByStatus: Record<InstitutionStatus, number>;
    totalLicenses: number;
    expiredLicenses: number;
  }> {
    try {
      return await this.institutionCoreService.getInstitutionStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la récupération des statistiques';
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}