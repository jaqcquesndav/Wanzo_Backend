import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ValidationPipe, UsePipes, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity'; // Assuming User entity is needed for company context

@ApiTags('suppliers')
@ApiBearerAuth('JWT-auth')
@Controller('suppliers')
@UseGuards(JwtAuthGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Créer un nouveau fournisseur', description: 'Ajoute un nouveau fournisseur associé à l\'entreprise de l\'utilisateur actuel' })
  @ApiBody({ type: CreateSupplierDto })
  @ApiResponse({ status: 201, description: 'Fournisseur créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  create(@Body() createSupplierDto: CreateSupplierDto, @CurrentUser() user: User) {
    // Assuming companyId is part of the user object or can be derived
    if (!user.companyId) {
      throw new Error('User is not associated with a company.'); // Or handle more gracefully
    }
    return this.suppliersService.create(createSupplierDto, user.companyId);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les fournisseurs', description: 'Récupère la liste paginée des fournisseurs associés à l\'entreprise de l\'utilisateur' })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page (commence à 1)', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page', type: Number })
  @ApiResponse({ status: 200, description: 'Liste des fournisseurs récupérée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  findAll(@CurrentUser() user: User, @Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    if (!user.companyId) {
      throw new Error('User is not associated with a company.');
    }
    return this.suppliersService.findAll(user.companyId, { page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un fournisseur', description: 'Récupère les détails d\'un fournisseur spécifique par son ID' })
  @ApiParam({ name: 'id', description: 'Identifiant unique du fournisseur' })
  @ApiResponse({ status: 200, description: 'Fournisseur récupéré avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Fournisseur non trouvé' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    if (!user.companyId) {
      throw new Error('User is not associated with a company.');
    }
    return this.suppliersService.findOne(id, user.companyId);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Mettre à jour un fournisseur', description: 'Modifie les informations d\'un fournisseur existant' })
  @ApiParam({ name: 'id', description: 'Identifiant unique du fournisseur' })
  @ApiBody({ type: UpdateSupplierDto })
  @ApiResponse({ status: 200, description: 'Fournisseur mis à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Fournisseur non trouvé' })
  update(@Param('id') id: string, @Body() updateSupplierDto: UpdateSupplierDto, @CurrentUser() user: User) {
    if (!user.companyId) {
      throw new Error('User is not associated with a company.');
    }
    return this.suppliersService.update(id, updateSupplierDto, user.companyId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un fournisseur', description: 'Supprime un fournisseur existant' })
  @ApiParam({ name: 'id', description: 'Identifiant unique du fournisseur' })
  @ApiResponse({ status: 200, description: 'Fournisseur supprimé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Fournisseur non trouvé' })
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    if (!user.companyId) {
      throw new Error('User is not associated with a company.');
    }
    return this.suppliersService.remove(id, user.companyId);
  }
}
