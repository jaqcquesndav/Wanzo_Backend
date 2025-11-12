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
import { CompanyStocksService } from '../services/company-stocks.service';
import {
  StockDataDto,
  CreateStockDto,
  UpdateStockDto,
  StockResponseDto,
  StockMovementDto,
  StockCategory,
  StockState,
} from '../dto/company-stocks.dto';

/**
 * Contrôleur pour la gestion des stocks et inventaires des entreprises
 * Gère les matières premières, produits finis, mouvements de stock
 */
@ApiTags('Company Stocks Management')
@Controller('companies/:companyId/stocks')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class CompanyStocksController {
  constructor(private readonly companyStocksService: CompanyStocksService) {}

  /**
   * Ajouter un article de stock
   */
  @Post()
  @ApiOperation({
    summary: 'Ajouter un article de stock',
    description: 'Ajoute un nouvel article au stock d\'une entreprise',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiBody({ type: StockDataDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Article de stock ajouté avec succès',
    type: StockResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise non trouvée',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données de stock invalides ou SKU déjà existant',
  })
  async addStock(
    @Param('companyId') companyId: string,
    @Body() stock: StockDataDto,
  ): Promise<StockResponseDto> {
    try {
      const createStockDto: CreateStockDto = {
        companyId,
        stock,
      };
      return await this.companyStocksService.addStock(createStockDto);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajout du stock';
      const status = errorMessage.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Récupérer tous les stocks d'une entreprise
   */
  @Get()
  @ApiOperation({
    summary: 'Récupérer tous les stocks',
    description: 'Récupère tous les articles de stock d\'une entreprise',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stocks récupérés avec succès',
    type: [StockResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise non trouvée',
  })
  async getCompanyStocks(@Param('companyId') companyId: string): Promise<StockResponseDto[]> {
    try {
      return await this.companyStocksService.getCompanyStocks(companyId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la récupération des stocks';
      const status = errorMessage.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Récupérer un stock spécifique
   */
  @Get(':stockId')
  @ApiOperation({
    summary: 'Récupérer un stock par ID',
    description: 'Récupère les informations détaillées d\'un article de stock spécifique',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiParam({
    name: 'stockId',
    description: 'Identifiant unique du stock',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stock récupéré avec succès',
    type: StockResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise ou stock non trouvé',
  })
  async getStockById(
    @Param('companyId') companyId: string,
    @Param('stockId') stockId: string,
  ): Promise<StockResponseDto> {
    try {
      return await this.companyStocksService.getStockById(companyId, stockId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Stock non trouvé';
      throw new HttpException(errorMessage, HttpStatus.NOT_FOUND);
    }
  }

  /**
   * Mettre à jour un stock
   */
  @Put(':stockId')
  @ApiOperation({
    summary: 'Mettre à jour un stock',
    description: 'Met à jour les informations d\'un article de stock existant',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiParam({
    name: 'stockId',
    description: 'Identifiant unique du stock',
    type: 'string',
  })
  @ApiBody({ type: StockDataDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stock mis à jour avec succès',
    type: StockResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise ou stock non trouvé',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données de stock invalides',
  })
  async updateStock(
    @Param('companyId') companyId: string,
    @Param('stockId') stockId: string,
    @Body() stockData: Partial<StockDataDto>,
  ): Promise<StockResponseDto> {
    try {
      const updateStockDto: UpdateStockDto = {
        companyId,
        stockId,
        stock: stockData,
      };
      return await this.companyStocksService.updateStock(updateStockDto);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du stock';
      const status = errorMessage.includes('non trouvé') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Récupérer les stocks par catégorie
   */
  @Get('category/:category')
  @ApiOperation({
    summary: 'Récupérer les stocks par catégorie',
    description: 'Récupère tous les stocks d\'une catégorie donnée pour une entreprise',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiParam({
    name: 'category',
    description: 'Catégorie de stock',
    enum: StockCategory,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stocks récupérés avec succès',
    type: [StockResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise non trouvée',
  })
  async getStocksByCategory(
    @Param('companyId') companyId: string,
    @Param('category') category: StockCategory,
  ): Promise<StockResponseDto[]> {
    try {
      return await this.companyStocksService.getStocksByCategory(companyId, category);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la récupération des stocks par catégorie';
      const status = errorMessage.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Récupérer les stocks en faible quantité
   */
  @Get('analytics/low-stock')
  @ApiOperation({
    summary: 'Récupérer les stocks en faible quantité',
    description: 'Récupère tous les articles dont la quantité est inférieure ou égale au seuil minimum',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Stocks en faible quantité récupérés avec succès',
    type: [StockResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise non trouvée',
  })
  async getLowStockItems(@Param('companyId') companyId: string): Promise<StockResponseDto[]> {
    try {
      return await this.companyStocksService.getLowStockItems(companyId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la récupération des stocks faibles';
      const status = errorMessage.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Enregistrer une entrée de stock
   */
  @Post(':stockId/in')
  @ApiOperation({
    summary: 'Enregistrer une entrée de stock',
    description: 'Enregistre un mouvement d\'entrée de stock (réception, retour, ajustement positif)',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiParam({
    name: 'stockId',
    description: 'Identifiant unique du stock',
    type: 'string',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quantite: { type: 'number', minimum: 0.01 },
        motif: { type: 'string' },
        referenceDocument: { type: 'string' },
        prixUnitaire: { type: 'number', minimum: 0 },
        responsable: { type: 'string' },
        dateMouvement: { type: 'string' },
      },
      required: ['quantite', 'motif'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entrée de stock enregistrée avec succès',
    type: StockResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise ou stock non trouvé',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données de mouvement invalides',
  })
  async stockIn(
    @Param('companyId') companyId: string,
    @Param('stockId') stockId: string,
    @Body() movementData: {
      quantite: number;
      motif: string;
      referenceDocument?: string;
      prixUnitaire?: number;
      responsable?: string;
      dateMouvement?: string;
    },
  ): Promise<StockResponseDto> {
    try {
      const movement = {
        ...movementData,
        stockId,
        typeMouvement: 'entree' as const,
        dateMouvement: movementData.dateMouvement || new Date().toISOString(),
      };
      return await this.companyStocksService.stockIn(companyId, stockId, movement);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'entrée de stock';
      const status = errorMessage.includes('non trouvé') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Enregistrer une sortie de stock
   */
  @Post(':stockId/out')
  @ApiOperation({
    summary: 'Enregistrer une sortie de stock',
    description: 'Enregistre un mouvement de sortie de stock (vente, consommation, ajustement négatif)',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiParam({
    name: 'stockId',
    description: 'Identifiant unique du stock',
    type: 'string',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quantite: { type: 'number', minimum: 0.01 },
        motif: { type: 'string' },
        referenceDocument: { type: 'string' },
        prixUnitaire: { type: 'number', minimum: 0 },
        responsable: { type: 'string' },
        dateMouvement: { type: 'string' },
      },
      required: ['quantite', 'motif'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sortie de stock enregistrée avec succès',
    type: StockResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise ou stock non trouvé',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Quantité insuffisante ou données invalides',
  })
  async stockOut(
    @Param('companyId') companyId: string,
    @Param('stockId') stockId: string,
    @Body() movementData: {
      quantite: number;
      motif: string;
      referenceDocument?: string;
      prixUnitaire?: number;
      responsable?: string;
      dateMouvement?: string;
    },
  ): Promise<StockResponseDto> {
    try {
      const movement = {
        ...movementData,
        stockId,
        typeMouvement: 'sortie' as const,
        dateMouvement: movementData.dateMouvement || new Date().toISOString(),
      };
      return await this.companyStocksService.stockOut(companyId, stockId, movement);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la sortie de stock';
      const status = errorMessage.includes('non trouvé') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Effectuer un ajustement d'inventaire
   */
  @Put(':stockId/adjust')
  @ApiOperation({
    summary: 'Effectuer un ajustement d\'inventaire',
    description: 'Ajuste la quantité en stock suite à un inventaire physique',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Identifiant unique de l\'entreprise',
    type: 'string',
  })
  @ApiParam({
    name: 'stockId',
    description: 'Identifiant unique du stock',
    type: 'string',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newQuantity: { type: 'number', minimum: 0 },
        reason: { type: 'string' },
      },
      required: ['newQuantity', 'reason'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ajustement d\'inventaire effectué avec succès',
    type: StockResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise ou stock non trouvé',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données d\'ajustement invalides',
  })
  async adjustStock(
    @Param('companyId') companyId: string,
    @Param('stockId') stockId: string,
    @Body() adjustmentData: { newQuantity: number; reason: string },
  ): Promise<StockResponseDto> {
    try {
      return await this.companyStocksService.adjustStock(
        companyId,
        stockId,
        adjustmentData.newQuantity,
        adjustmentData.reason,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'ajustement de stock';
      const status = errorMessage.includes('non trouvé') ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Calculer la valeur totale du stock
   */
  @Get('analytics/total-value')
  @ApiOperation({
    summary: 'Calculer la valeur totale du stock',
    description: 'Calcule la valeur totale de tous les stocks d\'une entreprise',
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
  async calculateTotalStockValue(
    @Param('companyId') companyId: string,
  ): Promise<{ totalValue: number; currency: string }> {
    try {
      const totalValue = await this.companyStocksService.calculateTotalStockValue(companyId);
      return { totalValue, currency: 'CDF' }; // Default currency
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du calcul de la valeur totale';
      const status = errorMessage.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(errorMessage, status);
    }
  }

  /**
   * Récupérer les statistiques des stocks
   */
  @Get('analytics/statistics')
  @ApiOperation({
    summary: 'Récupérer les statistiques des stocks',
    description: 'Récupère des statistiques détaillées sur les stocks d\'une entreprise',
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
        totalItems: { type: 'number' },
        totalValue: { type: 'number' },
        lowStockItems: { type: 'number' },
        outOfStockItems: { type: 'number' },
        stockByCategory: { type: 'object' },
        stockByState: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Entreprise non trouvée',
  })
  async getStockStatistics(@Param('companyId') companyId: string): Promise<{
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    stockByCategory: Record<StockCategory, number>;
    stockByState: Record<StockState, number>;
  }> {
    try {
      return await this.companyStocksService.getStockStatistics(companyId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors de la récupération des statistiques';
      const status = errorMessage.includes('non trouvée') ? HttpStatus.NOT_FOUND : HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(errorMessage, status);
    }
  }
}