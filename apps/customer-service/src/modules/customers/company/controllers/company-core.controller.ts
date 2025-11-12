import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CompanyCoreService } from '../services/company-core.service';
import { 
  CreateCompanyDto, 
  UpdateCompanyDto, 
  CompanyResponseDto,
  ContactsDto,
  OwnerDto,
  AssociateDto,
  ActivitiesDto,
  CapitalDto
} from '../dto/company-core.dto';

/**
 * Contrôleur pour la gestion du profil principal des entreprises
 * Gère les contacts, propriétaires, associés, activités et capital
 */
@ApiTags('company-core')
@Controller('companies/core')
export class CompanyCoreController {
  constructor(private readonly companyCoreService: CompanyCoreService) {}

  /**
   * Créer un nouveau profil d'entreprise
   */
  @Post()
  @ApiOperation({ 
    summary: 'Créer une nouvelle entreprise',
    description: 'Crée un nouveau profil d\'entreprise avec toutes les informations de base' 
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Entreprise créée avec succès',
    type: CompanyResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Données invalides' 
  })
  async createCompany(@Body() createCompanyDto: CreateCompanyDto): Promise<CompanyResponseDto> {
    try {
      return await this.companyCoreService.createCompany(createCompanyDto);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new HttpException(
        { 
          message: 'Erreur lors de la création de l\'entreprise', 
          error: errorMessage 
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Récupérer une entreprise par ID
   */
  @Get(':id')
  @ApiOperation({ 
    summary: 'Récupérer une entreprise',
    description: 'Récupère les détails d\'une entreprise par son ID' 
  })
  @ApiParam({ name: 'id', description: 'ID de l\'entreprise' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Entreprise trouvée',
    type: CompanyResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Entreprise non trouvée' 
  })
  async getCompanyById(@Param('id') id: string): Promise<CompanyResponseDto> {
    try {
      return await this.companyCoreService.getCompanyById(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new HttpException(
        { 
          message: 'Erreur lors de la récupération de l\'entreprise', 
          error: errorMessage 
        },
        HttpStatus.NOT_FOUND
      );
    }
  }

  /**
   * Mettre à jour une entreprise
   */
  @Put(':id')
  @ApiOperation({ 
    summary: 'Mettre à jour une entreprise',
    description: 'Met à jour les informations d\'une entreprise' 
  })
  @ApiParam({ name: 'id', description: 'ID de l\'entreprise' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Entreprise mise à jour avec succès',
    type: CompanyResponseDto 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Entreprise non trouvée' 
  })
  async updateCompany(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto
  ): Promise<CompanyResponseDto> {
    try {
      return await this.companyCoreService.updateCompany(id, updateCompanyDto);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new HttpException(
        { 
          message: 'Erreur lors de la mise à jour de l\'entreprise', 
          error: errorMessage 
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Récupérer les entreprises par secteur
   */
  @Get('sector/:sector')
  @ApiOperation({ 
    summary: 'Récupérer les entreprises par secteur',
    description: 'Récupère toutes les entreprises d\'un secteur donné' 
  })
  @ApiParam({ name: 'sector', description: 'Secteur d\'activité' })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page', example: 10 })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Liste des entreprises du secteur',
    schema: {
      type: 'object',
      properties: {
        companies: {
          type: 'array',
          items: { $ref: '#/components/schemas/CompanyResponseDto' }
        },
        total: { type: 'number' }
      }
    }
  })
  async getCompaniesBySector(
    @Param('sector') sector: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10
  ): Promise<{ companies: CompanyResponseDto[], total: number }> {
    try {
      return await this.companyCoreService.getCompaniesBySector(sector, page, limit);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new HttpException(
        { 
          message: 'Erreur lors de la récupération des entreprises', 
          error: errorMessage 
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Rechercher des entreprises
   */
  @Get('search/:searchTerm')
  @ApiOperation({ 
    summary: 'Rechercher des entreprises',
    description: 'Recherche des entreprises par nom, numéro d\'enregistrement ou secteur' 
  })
  @ApiParam({ name: 'searchTerm', description: 'Terme de recherche' })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page', example: 10 })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Résultats de la recherche',
    schema: {
      type: 'object',
      properties: {
        companies: {
          type: 'array',
          items: { $ref: '#/components/schemas/CompanyResponseDto' }
        },
        total: { type: 'number' }
      }
    }
  })
  async searchCompanies(
    @Param('searchTerm') searchTerm: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10
  ): Promise<{ companies: CompanyResponseDto[], total: number }> {
    try {
      return await this.companyCoreService.searchCompanies(searchTerm, page, limit);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new HttpException(
        { 
          message: 'Erreur lors de la recherche d\'entreprises', 
          error: errorMessage 
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Mettre à jour les contacts d'une entreprise
   */
  @Put(':id/contacts')
  @ApiOperation({ 
    summary: 'Mettre à jour les contacts',
    description: 'Met à jour les informations de contact d\'une entreprise' 
  })
  @ApiParam({ name: 'id', description: 'ID de l\'entreprise' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Contacts mis à jour avec succès',
    type: CompanyResponseDto 
  })
  async updateContacts(
    @Param('id') id: string,
    @Body() contacts: ContactsDto
  ): Promise<CompanyResponseDto> {
    try {
      return await this.companyCoreService.updateContacts(id, contacts);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new HttpException(
        { 
          message: 'Erreur lors de la mise à jour des contacts', 
          error: errorMessage 
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Mettre à jour le propriétaire d'une entreprise
   */
  @Put(':id/owner')
  @ApiOperation({ 
    summary: 'Mettre à jour le propriétaire',
    description: 'Met à jour les informations du propriétaire d\'une entreprise' 
  })
  @ApiParam({ name: 'id', description: 'ID de l\'entreprise' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Propriétaire mis à jour avec succès',
    type: CompanyResponseDto 
  })
  async updateOwner(
    @Param('id') id: string,
    @Body() owner: OwnerDto
  ): Promise<CompanyResponseDto> {
    try {
      return await this.companyCoreService.updateOwner(id, owner);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new HttpException(
        { 
          message: 'Erreur lors de la mise à jour du propriétaire', 
          error: errorMessage 
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Ajouter un associé à une entreprise
   */
  @Post(':id/associates')
  @ApiOperation({ 
    summary: 'Ajouter un associé',
    description: 'Ajoute un nouvel associé à une entreprise' 
  })
  @ApiParam({ name: 'id', description: 'ID de l\'entreprise' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Associé ajouté avec succès',
    type: CompanyResponseDto 
  })
  async addAssociate(
    @Param('id') id: string,
    @Body() associate: AssociateDto
  ): Promise<CompanyResponseDto> {
    try {
      return await this.companyCoreService.addAssociate(id, associate);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new HttpException(
        { 
          message: 'Erreur lors de l\'ajout de l\'associé', 
          error: errorMessage 
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Supprimer un associé d'une entreprise
   */
  @Delete(':companyId/associates/:associateIndex')
  @ApiOperation({ 
    summary: 'Supprimer un associé',
    description: 'Supprime un associé d\'une entreprise' 
  })
  @ApiParam({ name: 'companyId', description: 'ID de l\'entreprise' })
  @ApiParam({ name: 'associateIndex', description: 'Index de l\'associé à supprimer' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Associé supprimé avec succès',
    type: CompanyResponseDto 
  })
  async removeAssociate(
    @Param('companyId') companyId: string,
    @Param('associateIndex') associateIndex: string
  ): Promise<CompanyResponseDto> {
    try {
      const index = parseInt(associateIndex, 10);
      if (isNaN(index)) {
        throw new Error('Index d\'associé invalide');
      }
      return await this.companyCoreService.removeAssociate(companyId, index);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new HttpException(
        { 
          message: 'Erreur lors de la suppression de l\'associé', 
          error: errorMessage 
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Mettre à jour les activités d'une entreprise
   */
  @Put(':id/activities')
  @ApiOperation({ 
    summary: 'Mettre à jour les activités',
    description: 'Met à jour les activités d\'une entreprise' 
  })
  @ApiParam({ name: 'id', description: 'ID de l\'entreprise' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Activités mises à jour avec succès',
    type: CompanyResponseDto 
  })
  async updateActivities(
    @Param('id') id: string,
    @Body() activities: ActivitiesDto
  ): Promise<CompanyResponseDto> {
    try {
      return await this.companyCoreService.updateActivities(id, activities);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new HttpException(
        { 
          message: 'Erreur lors de la mise à jour des activités', 
          error: errorMessage 
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Mettre à jour le capital d'une entreprise
   */
  @Put(':id/capital')
  @ApiOperation({ 
    summary: 'Mettre à jour le capital',
    description: 'Met à jour les informations de capital d\'une entreprise' 
  })
  @ApiParam({ name: 'id', description: 'ID de l\'entreprise' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Capital mis à jour avec succès',
    type: CompanyResponseDto 
  })
  async updateCapital(
    @Param('id') id: string,
    @Body() capital: CapitalDto
  ): Promise<CompanyResponseDto> {
    try {
      return await this.companyCoreService.updateCapital(id, capital);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new HttpException(
        { 
          message: 'Erreur lors de la mise à jour du capital', 
          error: errorMessage 
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Désactiver une entreprise
   */
  @Put(':id/deactivate')
  @ApiOperation({ 
    summary: 'Désactiver une entreprise',
    description: 'Désactive une entreprise (soft delete)' 
  })
  @ApiParam({ name: 'id', description: 'ID de l\'entreprise' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Entreprise désactivée avec succès',
    type: CompanyResponseDto 
  })
  async deactivateCompany(@Param('id') id: string): Promise<CompanyResponseDto> {
    try {
      return await this.companyCoreService.deactivateCompany(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      throw new HttpException(
        { 
          message: 'Erreur lors de la désactivation de l\'entreprise', 
          error: errorMessage 
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}