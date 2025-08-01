import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Customer } from './entities/customer.entity';

@ApiTags('clients')
@ApiBearerAuth('JWT-auth')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Créer un client', 
    description: 'Crée un nouveau client avec les informations fournies.'
  })
  @ApiBody({ 
    type: CreateCustomerDto,
    description: 'Données du client à créer'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Client créé avec succès',
    type: Customer
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Récupérer tous les clients', 
    description: 'Récupère la liste de tous les clients avec pagination, recherche et tri.'
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
  @ApiQuery({ 
    name: 'search', 
    required: false, 
    description: 'Termes de recherche (nom, email ou téléphone)', 
    type: String 
  })
  @ApiQuery({ 
    name: 'sortBy', 
    required: false, 
    description: 'Champ sur lequel trier (createdAt, fullName, etc.)', 
    type: String 
  })
  @ApiQuery({ 
    name: 'sortOrder', 
    required: false, 
    description: 'Ordre de tri (ASC ou DESC)', 
    enum: ['ASC', 'DESC']
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des clients récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        customers: { type: 'array', items: { $ref: '#/components/schemas/Customer' } },
        total: { type: 'number', description: 'Nombre total de clients' },
        page: { type: 'number', description: 'Page actuelle' },
        limit: { type: 'number', description: 'Nombre d\'éléments par page' }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC'
  ) {
    return this.customersService.findAll({
      page: page ? +page : undefined,
      limit: limit ? +limit : undefined,
      search,
      sortBy,
      sortOrder: sortOrder as 'ASC' | 'DESC'
    });
  }
  @Get(':id')
  @ApiOperation({ 
    summary: 'Récupérer un client spécifique', 
    description: 'Récupère un client par son identifiant unique'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Identifiant unique du client', 
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Client récupéré avec succès',
    type: Customer
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Client non trouvé'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Mettre à jour un client', 
    description: 'Met à jour les informations d\'un client existant'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Identifiant unique du client', 
    type: 'string',
    format: 'uuid'
  })
  @ApiBody({ 
    type: UpdateCustomerDto,
    description: 'Données du client à mettre à jour'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Client mis à jour avec succès',
    type: Customer
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Données invalides'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Client non trouvé'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT) // Or 200 OK with a message
  @ApiOperation({ 
    summary: 'Supprimer un client', 
    description: 'Supprime un client par son identifiant unique'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Identifiant unique du client', 
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Client supprimé avec succès'
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Client non trouvé'
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Non autorisé'
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.remove(id);
  }
}
