import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Product } from './entities/product.entity';

@ApiTags('produits')
@ApiBearerAuth('JWT-auth')
@Controller('products') // Corresponds to /api/products due to global prefix
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Créer un produit', 
    description: 'Crée un nouveau produit avec les informations fournies.'
  })
  @ApiBody({ 
    type: CreateProductDto,
    description: 'Données du produit à créer'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Produit créé avec succès',
    type: Product
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Récupérer tous les produits', 
    description: 'Récupère la liste de tous les produits avec pagination.'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    description: 'Numéro de page pour la pagination', 
    type: Number 
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    description: 'Nombre d\'éléments par page', 
    type: Number 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des produits récupérée avec succès',
    type: [Product]
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  findAll() { // Add query params for pagination, sorting, filtering as per docs
    // Example: @Query('page') page: number, @Query('limit') limit: number
    return this.productsService.findAll();
  }
  @Get(':id')
  @ApiOperation({ 
    summary: 'Récupérer un produit spécifique', 
    description: 'Récupère un produit par son identifiant unique'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Identifiant unique du produit', 
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Produit récupéré avec succès',
    type: Product
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Produit non trouvé'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Mettre à jour un produit', 
    description: 'Met à jour les informations d\'un produit existant'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Identifiant unique du produit', 
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({ 
    type: UpdateProductDto,
    description: 'Données du produit à mettre à jour'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Produit mis à jour avec succès',
    type: Product
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Produit non trouvé'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Or 200 OK with a message as per docs
  @ApiOperation({ 
    summary: 'Supprimer un produit', 
    description: 'Supprime un produit par son identifiant unique'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Identifiant unique du produit', 
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Produit supprimé avec succès'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Produit non trouvé'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}
