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
import { InstitutionBranchService } from '../services/institution-branch.service';
import {
  InstitutionBranchDataDto,
  CreateInstitutionBranchDto,
  UpdateInstitutionBranchDto,
  InstitutionBranchResponseDto,
  BranchType,
  BranchStatus,
} from '../dto/institution-branches.dto';

/**
 * Contrôleur pour la gestion des succursales et agences des institutions financières
 * Gère la création, modification et supervision des points de service
 */
@ApiTags('Financial Institution Branch Management')
@Controller('institutions/:institutionId/branches')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class InstitutionBranchController {
  constructor(private readonly institutionBranchService: InstitutionBranchService) {}

  /**
   * Ajouter une nouvelle succursale
   */
  @Post()
  @ApiOperation({
    summary: 'Ajouter une nouvelle succursale',
    description: 'Ajoute une nouvelle succursale ou agence à une institution financière',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiBody({ type: InstitutionBranchDataDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Succursale ajoutée avec succès',
    type: InstitutionBranchResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution non trouvée',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données de succursale invalides ou code déjà existant',
  })
  async addBranch(
    @Param('institutionId') institutionId: string,
    @Body() branchData: InstitutionBranchDataDto,
  ): Promise<InstitutionBranchResponseDto> {
    try {
      const createBranchDto: CreateInstitutionBranchDto = {
        institutionId,
        branch: branchData,
      };
      // Utiliser les paramètres corrects selon la signature du service
      return await this.institutionBranchService.addBranch(institutionId, createBranchDto as any);
    } catch (error) {
      const status = (error as Error).message.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException((error as Error).message, status);
    }
  }

  /**
   * Récupérer toutes les succursales d'une institution
   */
  @Get()
  @ApiOperation({
    summary: 'Récupérer toutes les succursales',
    description: 'Récupère toutes les succursales d\'une institution financière',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiQuery({
    name: 'type',
    description: 'Type de succursale pour filtrer',
    enum: BranchType,
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: 'Statut de succursale pour filtrer',
    enum: BranchStatus,
    required: false,
  })
  @ApiQuery({
    name: 'city',
    description: 'Ville pour filtrer les succursales',
    type: 'string',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Succursales récupérées avec succès',
    type: [InstitutionBranchResponseDto],
  })
  async getBranches(
    @Param('institutionId') institutionId: string,
    @Query('type') type?: BranchType,
    @Query('status') status?: BranchStatus,
    @Query('city') city?: string,
  ): Promise<InstitutionBranchResponseDto[]> {
    try {
      // Utiliser la méthode disponible dans le service
      const result = await this.institutionBranchService.getBranches(institutionId);
      return result.branches as any;
    } catch (error) {
      const httpStatus = (error as Error).message.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException((error as Error).message, httpStatus);
    }
  }

  /**
   * Récupérer une succursale spécifique
   */
  @Get(':branchId')
  @ApiOperation({
    summary: 'Récupérer une succursale par ID',
    description: 'Récupère les informations détaillées d\'une succursale spécifique',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiParam({
    name: 'branchId',
    description: 'Identifiant unique de la succursale',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Succursale récupérée avec succès',
    type: InstitutionBranchResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution ou succursale non trouvée',
  })
  async getBranchById(
    @Param('institutionId') institutionId: string,
    @Param('branchId') branchId: string,
  ): Promise<InstitutionBranchResponseDto> {
    try {
      return await this.institutionBranchService.getBranchById(branchId) as any;
    } catch (error) {
      throw new HttpException((error as Error).message, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Mettre à jour une succursale
   */
  @Put(':branchId')
  @ApiOperation({
    summary: 'Mettre à jour une succursale',
    description: 'Met à jour les informations d\'une succursale existante',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiParam({
    name: 'branchId',
    description: 'Identifiant unique de la succursale',
    type: 'string',
  })
  @ApiBody({ type: UpdateInstitutionBranchDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Succursale mise à jour avec succès',
    type: InstitutionBranchResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution ou succursale non trouvée',
  })
  async updateBranch(
    @Param('institutionId') institutionId: string,
    @Param('branchId') branchId: string,
    @Body() updateBranchDto: UpdateInstitutionBranchDto,
  ): Promise<InstitutionBranchResponseDto> {
    try {
      return await this.institutionBranchService.updateBranch(branchId, updateBranchDto as any);
    } catch (error) {
      const status = (error as Error).message.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException((error as Error).message, status);
    }
  }

  /**
   * Supprimer une succursale
   */
  @Delete(':branchId')
  @ApiOperation({
    summary: 'Supprimer une succursale',
    description: 'Supprime une succursale de manière permanente',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiParam({
    name: 'branchId',
    description: 'Identifiant unique de la succursale',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Succursale supprimée avec succès',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution ou succursale non trouvée',
  })
  async deleteBranch(
    @Param('institutionId') institutionId: string,
    @Param('branchId') branchId: string,
  ): Promise<void> {
    try {
      await this.institutionBranchService.deleteBranch(branchId);
    } catch (error) {
      const status = (error as Error).message.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException((error as Error).message, status);
    }
  }

  /**
   * Récupérer les succursales par type (STUB)
   */
  @Get('by-type/:type')
  @ApiOperation({
    summary: 'Récupérer les succursales par type',
    description: 'Récupère toutes les succursales d\'un type spécifique',
  })
  async getBranchesByType(
    @Param('institutionId') institutionId: string,
    @Param('type') type: BranchType,
  ): Promise<InstitutionBranchResponseDto[]> {
    try {
      // TODO: Implémenter cette méthode dans le service
      throw new Error('Méthode getBranchesByType non implémentée');
    } catch (error) {
      throw new HttpException((error as Error).message, HttpStatus.NOT_IMPLEMENTED);
    }
  }

  /**
   * Récupérer les succursales par ville (STUB)
   */
  @Get('by-city/:city')
  @ApiOperation({
    summary: 'Récupérer les succursales par ville',
    description: 'Récupère toutes les succursales d\'une ville spécifique',
  })
  async getBranchesByCity(
    @Param('institutionId') institutionId: string,
    @Param('city') city: string,
  ): Promise<InstitutionBranchResponseDto[]> {
    try {
      // TODO: Implémenter cette méthode dans le service
      throw new Error('Méthode getBranchesByCity non implémentée');
    } catch (error) {
      throw new HttpException((error as Error).message, HttpStatus.NOT_IMPLEMENTED);
    }
  }

  /**
   * Ajouter un service à une succursale (STUB)
   */
  @Post(':branchId/services')
  @ApiOperation({
    summary: 'Ajouter un service à une succursale',
    description: 'Ajoute un nouveau service à une succursale',
  })
  async addBranchService(
    @Param('institutionId') institutionId: string,
    @Param('branchId') branchId: string,
    @Body() serviceData: any,
  ): Promise<any> {
    try {
      // TODO: Implémenter cette méthode dans le service
      throw new Error('Méthode addBranchService non implémentée');
    } catch (error) {
      throw new HttpException((error as Error).message, HttpStatus.NOT_IMPLEMENTED);
    }
  }

  /**
   * Obtenir les statistiques d'une succursale (STUB)
   */
  @Get(':branchId/statistics')
  @ApiOperation({
    summary: 'Obtenir les statistiques d\'une succursale',
    description: 'Récupère les statistiques de performance d\'une succursale',
  })
  async getBranchStatistics(
    @Param('institutionId') institutionId: string,
    @Param('branchId') branchId: string,
  ): Promise<any> {
    try {
      // TODO: Implémenter cette méthode dans le service
      throw new Error('Méthode getBranchStatistics non implémentée');
    } catch (error) {
      throw new HttpException((error as Error).message, HttpStatus.NOT_IMPLEMENTED);
    }
  }

  /**
   * Trouver les succursales à proximité (STUB)
   */
  @Get('nearby')
  @ApiOperation({
    summary: 'Trouver les succursales à proximité',
    description: 'Trouve les succursales dans un rayon spécifique autour d\'une position',
  })
  async findNearbyBranches(
    @Param('institutionId') institutionId: string,
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius = 10,
  ): Promise<InstitutionBranchResponseDto[]> {
    try {
      // TODO: Implémenter cette méthode dans le service
      throw new Error('Méthode findNearbyBranches non implémentée');
    } catch (error) {
      throw new HttpException((error as Error).message, HttpStatus.NOT_IMPLEMENTED);
    }
  }
}