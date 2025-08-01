import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch, ParseUUIDPipe, ValidationPipe, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming JWT guard for company routes
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../auth/entities/user.entity';

@ApiTags('company')
@ApiBearerAuth('JWT-auth')
@Controller('company')
@UseGuards(JwtAuthGuard) // Secure all company routes
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  // This endpoint might be more for admin or specific scenarios.
  // Typically, company creation is part of user registration.
  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Créer une entreprise', description: 'Crée une nouvelle entreprise' })
  @ApiBody({ type: CreateCompanyDto })
  @ApiResponse({ status: 201, description: 'Entreprise créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  create(@Body() createCompanyDto: CreateCompanyDto, @CurrentUser() user: User) {
    // Potentially add logic here to associate company with the user if not handled by AuthService
    // Or restrict who can create companies.
    // For now, let's assume CompanyService handles DTO and creation.
    return this.companyService.create(createCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister toutes les entreprises', description: 'Récupère la liste de toutes les entreprises' })
  @ApiResponse({ status: 200, description: 'Liste des entreprises récupérée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  findAll() {
    // Add filtering/pagination as needed
    return this.companyService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une entreprise', description: 'Récupère les détails d\'une entreprise spécifique par son ID' })
  @ApiParam({ name: 'id', description: 'Identifiant unique de l\'entreprise' })
  @ApiResponse({ status: 200, description: 'Entreprise récupérée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Entreprise non trouvée' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companyService.findOne(id);
  }

  // Endpoint for a user to get their own company details
  @Get('my-company')
  @ApiOperation({ summary: 'Récupérer les détails de mon entreprise', description: 'Récupère les détails de l\'entreprise de l\'utilisateur actuellement authentifié' })
  @ApiResponse({ status: 200, description: 'Entreprise récupérée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Entreprise non trouvée' })
  async findMyCompany(@CurrentUser() user: User) {
    if (!user.companyId) {
      throw new Error('User is not associated with a company.'); // Or handle as per your logic
    }
    return this.companyService.findOne(user.companyId);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Mettre à jour une entreprise', description: 'Modifie les informations d\'une entreprise existante' })
  @ApiParam({ name: 'id', description: 'Identifiant unique de l\'entreprise' })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiResponse({ status: 200, description: 'Entreprise mise à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès interdit - Vous n\'avez pas les droits pour modifier cette entreprise' })
  @ApiResponse({ status: 404, description: 'Entreprise non trouvée' })
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateCompanyDto: UpdateCompanyDto,
    @CurrentUser() user: User // Ensure user is authorized to update this company
  ) {
    // Add authorization logic: e.g., user can only update their own company
    if (user.companyId !== id) {
        throw new Error('Unauthorized to update this company'); // Replace with ForbiddenException
    }
    return this.companyService.update(id, updateCompanyDto);
  }

  // Deletion might be restricted to admins or specific conditions
  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une entreprise', description: 'Supprime une entreprise existante' })
  @ApiParam({ name: 'id', description: 'Identifiant unique de l\'entreprise' })
  @ApiResponse({ status: 200, description: 'Entreprise supprimée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès interdit - Vous n\'avez pas les droits pour supprimer cette entreprise' })
  @ApiResponse({ status: 404, description: 'Entreprise non trouvée' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    // Add authorization logic here
    if (user.companyId !== id /* and user is not admin */) {
        throw new Error('Unauthorized to delete this company'); // Replace with ForbiddenException
    }
    return this.companyService.remove(id);
  }
}
