import { Controller, Get, Post, Put, Body, Patch, Param, Delete, ParseUUIDPipe, ValidationPipe, UsePipes, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { CompleteSaleDto } from './dto/complete-sale.dto';
import { CancelSaleDto } from './dto/cancel-sale.dto';
import { Sale } from './entities/sale.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('ventes')
@ApiBearerAuth('JWT-auth')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}
  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ 
    summary: 'Créer une vente', 
    description: 'Crée une nouvelle vente avec les articles spécifiés' 
  })
  @ApiBody({ 
    type: CreateSaleDto,
    description: 'Données de la vente à créer'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Vente créée avec succès',
    type: Sale
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  create(@Body() createSaleDto: CreateSaleDto): Promise<Sale> {
    return this.salesService.create(createSaleDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Récupérer toutes les ventes', 
    description: 'Récupère la liste de toutes les ventes avec filtrage et pagination'
  })
  @ApiQuery({ name: 'page', description: 'Numéro de page pour la pagination', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Nombre d\'éléments par page', required: false, type: Number })
  @ApiQuery({ name: 'dateFrom', description: 'Date de début au format ISO8601 (YYYY-MM-DD)', required: false, type: String })
  @ApiQuery({ name: 'dateTo', description: 'Date de fin au format ISO8601 (YYYY-MM-DD)', required: false, type: String })
  @ApiQuery({ name: 'customerId', description: 'Filtrer par ID client', required: false, type: String })
  @ApiQuery({ name: 'status', description: 'Filtrer par statut', required: false, type: String })
  @ApiQuery({ name: 'minAmount', description: 'Montant minimal', required: false, type: Number })
  @ApiQuery({ name: 'maxAmount', description: 'Montant maximal', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', description: 'Champ sur lequel trier', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', description: 'Ordre de tri (asc ou desc)', required: false, type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des ventes récupérée avec succès',
    type: [Sale]
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('minAmount') minAmount?: number,
    @Query('maxAmount') maxAmount?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ): Promise<Sale[]> {
    return this.salesService.findAll({
      page,
      limit,
      dateFrom,
      dateTo,
      customerId,
      status,
      minAmount,
      maxAmount,
      sortBy,
      sortOrder,
    });
  }
  @Get(':id')
  @ApiOperation({ 
    summary: 'Récupérer une vente spécifique', 
    description: 'Récupère une vente par son identifiant unique'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Identifiant unique de la vente', 
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Vente récupérée avec succès',
    type: Sale
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Vente non trouvée'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Sale> {
    return this.salesService.findOne(id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ 
    summary: 'Mettre à jour une vente', 
    description: 'Met à jour les informations d\'une vente existante'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Identifiant unique de la vente', 
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({ 
    type: UpdateSaleDto,
    description: 'Données de la vente à mettre à jour'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Vente mise à jour avec succès',
    type: Sale
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Vente non trouvée'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateSaleDto: UpdateSaleDto): Promise<Sale> {
    return this.salesService.update(id, updateSaleDto);
  }
  @Delete(':id')
  @ApiOperation({ 
    summary: 'Supprimer une vente', 
    description: 'Supprime une vente par son identifiant unique'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Identifiant unique de la vente', 
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Vente supprimée avec succès'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Vente non trouvée'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.salesService.remove(id);
  }

  @Put(':id/complete')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ 
    summary: 'Marquer une vente comme complétée', 
    description: 'Marque une vente existante comme complétée et enregistre les informations de paiement'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Identifiant unique de la vente', 
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({ 
    type: CompleteSaleDto,
    description: 'Informations de paiement'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Vente marquée comme complétée avec succès',
    type: Sale
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Vente non trouvée'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  completeSale(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() completeSaleDto: CompleteSaleDto
  ): Promise<Sale> {
    return this.salesService.completeSale(id, completeSaleDto);
  }

  @Put(':id/cancel')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ 
    summary: 'Annuler une vente', 
    description: 'Marque une vente existante comme annulée'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Identifiant unique de la vente', 
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({ 
    type: CancelSaleDto,
    description: 'Raison de l\'annulation (optionnelle)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Vente annulée avec succès',
    type: Sale
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Vente non trouvée'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  cancelSale(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() cancelSaleDto: CancelSaleDto
  ): Promise<Sale> {
    return this.salesService.cancelSale(id, cancelSaleDto);
  }
}
