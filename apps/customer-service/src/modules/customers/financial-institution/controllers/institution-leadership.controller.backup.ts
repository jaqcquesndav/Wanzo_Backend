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
import { InstitutionLeadershipService } from '../services/institution-leadership.service';
import {
  InstitutionLeadershipDataDto,
  CreateInstitutionLeadershipDto,
  UpdateInstitutionLeadershipDto,
  InstitutionLeadershipResponseDto,
  ExecutiveRole,
  PositionLevel,
  AppointmentStatus,
} from '../dto/institution-leadership.dto';

/**
 * Contrôleur pour la gestion du leadership des institutions financières
 * Gère les dirigeants, conseil d'administration et structure organisationnelle
 */
@ApiTags('Financial Institution Leadership Management')
@Controller('institutions/:institutionId/leadership')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class InstitutionLeadershipController {
  constructor(private readonly institutionLeadershipService: InstitutionLeadershipService) {}

  /**
   * Nommer un nouveau dirigeant
   */
  @Post()
  @ApiOperation({
    summary: 'Nommer un nouveau dirigeant',
    description: 'Nomme un nouveau membre du leadership à une institution financière',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiBody({ type: InstitutionLeadershipDataDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Dirigeant nommé avec succès',
    type: InstitutionLeadershipResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution non trouvée',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données de dirigeant invalides ou poste déjà occupé',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Personne déjà nommée à un autre poste dans cette institution',
  })
  async appointLeader(
    @Param('institutionId') institutionId: string,
    @Body() leadershipData: InstitutionLeadershipDataDto,
  ): Promise<InstitutionLeadershipResponseDto> {
    try {
      const createLeadershipDto: CreateInstitutionLeadershipDto = {
        institutionId,
        leadership: leadershipData,
      };
      return await this.institutionLeadershipService.appointLeader(createLeadershipDto as any);
    } catch (error) {
      if ((error as Error).message.includes('déjà nommée')) {
        throw new HttpException((error as Error).message, HttpStatus.CONFLICT);
      }
      const status = (error as Error).message.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException((error as Error).message, status);
    }
  }

  /**
   * Récupérer tous les dirigeants d'une institution
   */
  @Get()
  @ApiOperation({
    summary: 'Récupérer tous les dirigeants',
    description: 'Récupère tous les membres du leadership d\'une institution financière',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiQuery({
    name: 'role',
    description: 'Filtrer par rôle exécutif',
    required: false,
    enum: ExecutiveRole,
  })
  @ApiQuery({
    name: 'level',
    description: 'Filtrer par niveau de position',
    required: false,
    enum: PositionLevel,
  })
  @ApiQuery({
    name: 'status',
    description: 'Filtrer par statut de nomination',
    required: false,
    enum: AppointmentStatus,
  })
  @ApiQuery({
    name: 'current',
    description: 'Filtrer par mandats actuels uniquement',
    required: false,
    type: 'boolean',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dirigeants récupérés avec succès',
    type: [InstitutionLeadershipResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution non trouvée',
  })
  async getInstitutionLeadership(
    @Param('institutionId') institutionId: string,
    @Query('role') role?: ExecutiveRole,
    @Query('level') level?: PositionLevel,
    @Query('status') status?: AppointmentStatus,
    @Query('current') current?: boolean,
  ): Promise<InstitutionLeadershipResponseDto[]> {
    try {
      const filters = { role, level, status, current };
      return await this.institutionLeadershipService.getInstitutionLeadership(institutionId, filters as any);
    } catch (error) {
      const httpStatus = (error as Error).message.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException((error as Error).message, httpStatus);
    }
  }

  /**
   * Récupérer un dirigeant spécifique
   */
  @Get(':leadershipId')
  @ApiOperation({
    summary: 'Récupérer un dirigeant par ID',
    description: 'Récupère les informations détaillées d\'un membre du leadership spécifique',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiParam({
    name: 'leadershipId',
    description: 'Identifiant unique du dirigeant',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dirigeant récupéré avec succès',
    type: InstitutionLeadershipResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution ou dirigeant non trouvé',
  })
  async getLeadershipById(
    @Param('institutionId') institutionId: string,
    @Param('leadershipId') leadershipId: string,
  ): Promise<InstitutionLeadershipResponseDto> {
    try {
      return await this.institutionLeadershipService.getLeadershipById(leadershipId) as any;
    } catch (error) {
      throw new HttpException((error as Error).message, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Mettre à jour les informations d'un dirigeant
   */
  @Put(':leadershipId')
  @ApiOperation({
    summary: 'Mettre à jour un dirigeant',
    description: 'Met à jour les informations d\'un membre du leadership existant',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiParam({
    name: 'leadershipId',
    description: 'Identifiant unique du dirigeant',
    type: 'string',
  })
  @ApiBody({ type: InstitutionLeadershipDataDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dirigeant mis à jour avec succès',
    type: InstitutionLeadershipResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution ou dirigeant non trouvé',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données de dirigeant invalides',
  })
  async updateLeadership(
    @Param('institutionId') institutionId: string,
    @Param('leadershipId') leadershipId: string,
    @Body() leadershipData: Partial<InstitutionLeadershipDataDto>,
  ): Promise<InstitutionLeadershipResponseDto> {
    try {
      const updateLeadershipDto: UpdateInstitutionLeadershipDto = {
        institutionId,
        leadershipId,
        leadership: leadershipData,
      };
      return await this.institutionLeadershipService.updateLeadership(leadershipId, updateLeadershipDto as any);
    } catch (error) {
      const status = (error as Error).message.includes('non trouvé') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException((error as Error).message, status);
    }
  }

  /**
   * Révoquer un dirigeant
   */
  @Delete(':leadershipId')
  @ApiOperation({
    summary: 'Révoquer un dirigeant',
    description: 'Révoque ou met fin au mandat d\'un membre du leadership',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiParam({
    name: 'leadershipId',
    description: 'Identifiant unique du dirigeant',
    type: 'string',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string' },
        effectiveDate: { type: 'string', format: 'date' },
      },
      required: ['reason'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dirigeant révoqué avec succès',
    type: InstitutionLeadershipResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution ou dirigeant non trouvé',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Révocation impossible (dirigeant déjà révoqué ou raison manquante)',
  })
  async revokeLeadership(
    @Param('institutionId') institutionId: string,
    @Param('leadershipId') leadershipId: string,
    @Body() revocationData: { reason: string; effectiveDate?: string },
  ): Promise<InstitutionLeadershipResponseDto> {
    try {
      return await this.institutionLeadershipService.revokeLeadership(
        leadershipId,
        revocationData.reason,
        revocationData.effectiveDate,
      ) as any;
    } catch (error) {
      const status = (error as Error).message.includes('non trouvé') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException((error as Error).message, status);
    }
  }

  /**
   * Récupérer les dirigeants par rôle (STUB)
   */
  @Get('role/:role')
  @ApiOperation({
    summary: 'Récupérer les dirigeants par rôle',
    description: 'Récupère tous les dirigeants d\'un rôle donné pour une institution',
  })
  @ApiParam({
    name: 'institutionId',
    description: 'Identifiant unique de l\'institution',
    type: 'string',
  })
  @ApiParam({
    name: 'role',
    description: 'Rôle exécutif',
    enum: ExecutiveRole,
  })
  @ApiQuery({
    name: 'current',
    description: 'Filtrer par mandats actuels uniquement',
    required: false,
    type: 'boolean',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dirigeants récupérés avec succès',
    type: [InstitutionLeadershipResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Institution non trouvée',
  })
  async getLeadershipByRole(
    @Param('institutionId') institutionId: string,
    @Param('role') role: ExecutiveRole,
    @Query('current') current?: boolean,
  ): Promise<InstitutionLeadershipResponseDto[]> {
    try {
      // TODO: Implémenter cette méthode dans le service
      throw new Error('Méthode getLeadershipByRole non implémentée');
    } catch (error) {
      throw new HttpException((error as Error).message, HttpStatus.NOT_IMPLEMENTED);
    }
  }

  /**
   * Organisation et validation corrigées - Les autres méthodes nécessitent l'implémentation
   * côté service pour éviter les erreurs TypeScript
   */
}