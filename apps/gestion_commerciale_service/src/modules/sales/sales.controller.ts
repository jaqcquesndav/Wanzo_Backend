import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, ValidationPipe, UsePipes } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { Sale } from './entities/sale.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

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
    description: 'Récupère la liste de toutes les ventes'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des ventes récupérée avec succès',
    type: [Sale]
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  findAll(): Promise<Sale[]> {
    return this.salesService.findAll();
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
}
