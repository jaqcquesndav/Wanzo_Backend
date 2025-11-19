import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { BusinessOperationsService } from './business-operations.service';
import { CreateBusinessOperationDto } from './dto/create-business-operation.dto';
import { UpdateBusinessOperationDto } from './dto/update-business-operation.dto';
import { ListBusinessOperationsDto } from './dto/list-business-operations.dto';
import { ExportOperationsDto } from './dto/export-operations.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BusinessOperation } from './entities/business-operation.entity';

@ApiTags('business-operations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('operations')
export class BusinessOperationsController {
  constructor(private readonly businessOperationsService: BusinessOperationsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle opération' })
  @ApiResponse({ status: 201, description: 'L\'opération a été créée avec succès', type: BusinessOperation })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async create(@Body() createBusinessOperationDto: CreateBusinessOperationDto, @Req() req) {
    const userId = req.user.sub; // Ou utilisez la structure appropriée pour récupérer l'ID utilisateur
    const operation = await this.businessOperationsService.create(createBusinessOperationDto, userId);
    
    return {
      status: 'success',
      data: operation,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer la liste des opérations avec filtrage et pagination' })
  @ApiResponse({
    status: 200,
    description: 'Liste des opérations récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'success' },
        data: {
          type: 'object',
          properties: {
            items: { type: 'array', items: { $ref: '#/components/schemas/BusinessOperation' } },
            totalItems: { type: 'integer', example: 120 },
            totalPages: { type: 'integer', example: 6 },
            currentPage: { type: 'integer', example: 1 },
          },
        },
      },
    },
  })
  async findAll(@Query() queryParams: ListBusinessOperationsDto) {
    const result = await this.businessOperationsService.findAll(queryParams);
    return {
      status: 'success',
      data: result,
    };
  }

  @Get('summary')
  @ApiOperation({ summary: 'Récupérer un résumé des opérations regroupées par type et période' })
  @ApiQuery({ name: 'period', required: true, enum: ['day', 'week', 'month', 'year'], description: 'Période pour laquelle récupérer les données' })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Date de référence (format: YYYY-MM-DD), défaut: aujourd\'hui' })
  @ApiResponse({ status: 200, description: 'Résumé des opérations récupéré avec succès' })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  async getSummary(@Query('period') period: string, @Query('date') date?: string) {
    const summary = await this.businessOperationsService.getOperationsSummary(period, date);
    return {
      status: 'success',
      data: summary,
    };
  }

  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exporter des opérations en PDF ou Excel' })
  @ApiResponse({ status: 200, description: 'Export généré avec succès' })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async exportOperations(@Body() exportDto: ExportOperationsDto, @Req() req) {
    const userId = req.user.sub; // Ou utilisez la structure appropriée pour récupérer l'ID utilisateur
    const result = await this.businessOperationsService.exportOperations(exportDto, userId);
    
    return {
      status: 'success',
      data: result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer les détails d\'une opération spécifique' })
  @ApiParam({ name: 'id', description: 'ID de l\'opération', type: 'string' })
  @ApiResponse({ status: 200, description: 'Opération récupérée avec succès', type: BusinessOperation })
  @ApiResponse({ status: 404, description: 'Opération non trouvée' })
  async findOne(@Param('id') id: string) {
    try {
      const operation = await this.businessOperationsService.findOne(id);
      return {
        status: 'success',
        data: operation,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException(`Opération avec ID ${id} non trouvée`);
    }
  }

  @Get('timeline')
  @ApiOperation({ summary: 'Obtenir la chronologie des opérations récentes' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre d\'opérations à récupérer, défaut: 10' })
  @ApiResponse({ status: 200, description: 'Chronologie récupérée avec succès' })
  async getTimeline(@Query('limit') limit: number = 10) {
    const timeline = await this.businessOperationsService.getOperationsTimeline(limit);
    return {
      status: 'success',
      data: { items: timeline },
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une opération' })
  @ApiParam({ name: 'id', description: 'ID de l\'opération', type: 'string' })
  @ApiResponse({ status: 200, description: 'Opération mise à jour avec succès', type: BusinessOperation })
  @ApiResponse({ status: 404, description: 'Opération non trouvée' })
  async update(@Param('id') id: string, @Body() updateBusinessOperationDto: UpdateBusinessOperationDto) {
    const operation = await this.businessOperationsService.update(id, updateBusinessOperationDto);
    return {
      status: 'success',
      data: operation,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une opération' })
  @ApiParam({ name: 'id', description: 'ID de l\'opération', type: 'string' })
  @ApiResponse({ status: 200, description: 'Opération supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Opération non trouvée' })
  async remove(@Param('id') id: string) {
    await this.businessOperationsService.remove(id);
    return {
      status: 'success',
      message: `Opération avec ID ${id} supprimée avec succès`,
    };
  }
}
