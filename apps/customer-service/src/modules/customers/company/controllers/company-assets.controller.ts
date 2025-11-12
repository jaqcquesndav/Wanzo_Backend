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
import { CompanyAssetsService } from '../services/company-assets.service';
import {
  AssetDataDto,
  CreateAssetDto,
  UpdateAssetDto,
  AssetResponseDto,
  AssetType,
  AssetState,
} from '../dto/company-assets.dto';

/**
 * Contrôleur pour la gestion des actifs des entreprises
 * Gère les biens immobiliers, véhicules, équipements et autres actifs
 */
@ApiTags('Company Assets Management')
@Controller('companies/:companyId/assets')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class CompanyAssetsController {
  constructor(private readonly companyAssetsService: CompanyAssetsService) {}

  /**
   * Ajouter un actif à une entreprise
   */
  @Post()
  @ApiOperation({
    summary: 'Ajouter un actif',
    description: 'Ajoute un nouvel actif à une entreprise',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiBody({ type: AssetDataDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Actif ajouté avec succès',
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise non trouvée',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données d\'actif invalides',
  })
  async addAsset(
    @Param('companyId') companyId: string,
    @Body() asset: AssetDataDto,
  ): Promise<AssetResponseDto> {
    try {
      const createAssetDto: CreateAssetDto = {
        companyId,
        asset,
      };
      return await this.companyAssetsService.addAsset(createAssetDto);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajout de l\'actif';
      const status = errorMessage.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Récupérer tous les actifs d'une entreprise
   */
  @Get()
  @ApiOperation({
    summary: 'Récupérer tous les actifs',
    description: 'Récupère tous les actifs d\'une entreprise',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Actifs récupérés avec succès',
    type: [AssetResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise non trouvée',
  })
  async getCompanyAssets(@Param('companyId') companyId: string): Promise<AssetResponseDto[]> {
    try {
      return await this.companyAssetsService.getCompanyAssets(companyId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la récupération des actifs';
      const status = errorMessage.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Récupérer un actif spécifique
   */
  @Get(':assetId')
  @ApiOperation({
    summary: 'Récupérer un actif par ID',
    description: 'Récupère les informations détaillées d\'un actif spécifique',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiParam({
    name: 'assetId',
    description: 'Identifiant unique de l\'actif',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Actif récupéré avec succès',
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise ou actif non trouvé',
  })
  async getAssetById(
    @Param('companyId') companyId: string,
    @Param('assetId') assetId: string,
  ): Promise<AssetResponseDto> {
    try {
      return await this.companyAssetsService.getAssetById(companyId, assetId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Actif non trouvé';
      throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Mettre à jour un actif
   */
  @Put(':assetId')
  @ApiOperation({
    summary: 'Mettre à jour un actif',
    description: 'Met à jour les informations d\'un actif existant',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiParam({
    name: 'assetId',
    description: 'Identifiant unique de l\'actif',
    type: 'string',
  })
  @ApiBody({ type: AssetDataDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Actif mis à jour avec succès',
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise ou actif non trouvé',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données d\'actif invalides',
  })
  async updateAsset(
    @Param('companyId') companyId: string,
    @Param('assetId') assetId: string,
    @Body() assetData: Partial<AssetDataDto>,
  ): Promise<AssetResponseDto> {
    try {
      const updateAssetDto: UpdateAssetDto = {
        companyId,
        assetId,
        asset: assetData,
      };
      return await this.companyAssetsService.updateAsset(updateAssetDto);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'actif';
      const status = errorMessage.includes('non trouvé') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Récupérer les actifs par type
   */
  @Get('type/:assetType')
  @ApiOperation({
    summary: 'Récupérer les actifs par type',
    description: 'Récupère tous les actifs d\'un type donné pour une entreprise',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiParam({
    name: 'assetType',
    description: 'Type d\'actif',
    enum: AssetType,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Actifs récupérés avec succès',
    type: [AssetResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise non trouvée',
  })
  async getAssetsByType(
    @Param('companyId') companyId: string,
    @Param('assetType') assetType: AssetType,
  ): Promise<AssetResponseDto[]> {
    try {
      return await this.companyAssetsService.getAssetsByType(companyId, assetType);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la récupération des actifs par type';
      const status = errorMessage.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Récupérer les actifs par état
   */
  @Get('state/:assetState')
  @ApiOperation({
    summary: 'Récupérer les actifs par état',
    description: 'Récupère tous les actifs d\'un état donné pour une entreprise',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiParam({
    name: 'assetState',
    description: 'État de l\'actif',
    enum: AssetState,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Actifs récupérés avec succès',
    type: [AssetResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise non trouvée',
  })
  async getAssetsByState(
    @Param('companyId') companyId: string,
    @Param('assetState') assetState: AssetState,
  ): Promise<AssetResponseDto[]> {
    try {
      return await this.companyAssetsService.getAssetsByState(companyId, assetState);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la récupération des actifs par état';
      const status = errorMessage.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Supprimer un actif
   */
  @Delete(':assetId')
  @ApiOperation({
    summary: 'Supprimer un actif',
    description: 'Supprime définitivement un actif d\'une entreprise',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiParam({
    name: 'assetId',
    description: 'Identifiant unique de l\'actif',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Actif supprimé avec succès',
    schema: { type: 'object', properties: { success: { type: 'boolean' } } },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise ou actif non trouvé',
  })
  async deleteAsset(
    @Param('companyId') companyId: string,
    @Param('assetId') assetId: string,
  ): Promise<{ success: boolean }> {
    try {
      const result = await this.companyAssetsService.deleteAsset(companyId, assetId);
      return { success: result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la suppression de l\'actif';
      throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Mettre à jour l'état d'un actif
   */
  @Put(':assetId/state')
  @ApiOperation({
    summary: 'Mettre à jour l\'état d\'un actif',
    description: 'Change l\'état d\'un actif (disponible, en maintenance, vendu, etc.)',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiParam({
    name: 'assetId',
    description: 'Identifiant unique de l\'actif',
    type: 'string',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        state: { enum: Object.values(AssetState) },
      },
      required: ['state'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'État de l\'actif mis à jour avec succès',
    type: AssetResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise ou actif non trouvé',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'État d\'actif invalide',
  })
  async updateAssetState(
    @Param('companyId') companyId: string,
    @Param('assetId') assetId: string,
    @Body('state') newState: AssetState,
  ): Promise<AssetResponseDto> {
    try {
      if (!Object.values(AssetState).includes(newState)) {
        throw new HttpException('État d\'actif invalide', HttpStatus.BAD_REQUEST);
      }
      return await this.companyAssetsService.updateAssetState(companyId, assetId, newState);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'état de l\'actif';
      const status = errorMessage.includes('non trouvé') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Calculer la valeur totale des actifs
   */
  @Get('analytics/total-value')
  @ApiOperation({
    summary: 'Calculer la valeur totale des actifs',
    description: 'Calcule la valeur totale de tous les actifs d\'une entreprise',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Valeur totale calculée avec succès',
    schema: {
      type: 'object',
      properties: {
        totalValue: { type: 'number' },
        currency: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise non trouvée',
  })
  async calculateTotalAssetValue(
    @Param('companyId') companyId: string,
  ): Promise<{ totalValue: number; currency: string }> {
    try {
      const totalValue = await this.companyAssetsService.calculateTotalAssetValue(companyId);
      return { totalValue, currency: 'CDF' }; // Default currency
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du calcul de la valeur totale';
      const status = errorMessage.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Récupérer les statistiques des actifs
   */
  @Get('analytics/statistics')
  @ApiOperation({
    summary: 'Récupérer les statistiques des actifs',
    description: 'Récupère des statistiques détaillées sur les actifs d\'une entreprise',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistiques récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        totalAssets: { type: 'number' },
        totalValue: { type: 'number' },
        assetsByType: { type: 'object' },
        assetsByState: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise non trouvée',
  })
  async getAssetStatistics(@Param('companyId') companyId: string): Promise<{
    totalAssets: number;
    totalValue: number;
    assetsByType: Record<AssetType, number>;
    assetsByState: Record<AssetState, number>;
  }> {
    try {
      return await this.companyAssetsService.getAssetStatistics(companyId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la récupération des statistiques';
      const status = errorMessage.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(errorMessage, status);
    }
  }
}