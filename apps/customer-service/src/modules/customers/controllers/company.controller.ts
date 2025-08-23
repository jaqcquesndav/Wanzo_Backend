import { Controller, Get, Post, Body, Param, Patch, Delete, Query, UseGuards, Req, HttpStatus, HttpCode, UnauthorizedException, NotFoundException, BadRequestException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { SmeService } from '../services/sme.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateCompanyDto, UpdateCompanyDto, CompanyResponseDto, ApiResponseDto, ApiErrorResponseDto, PaginationDto, LocationDto, AssociateDto } from '../dto/company.dto';

// Define the custom MulterFile interface
interface MulterFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
export class CompanyController {
  constructor(private readonly smeService: SmeService) {}

  @Post('test')
  @ApiOperation({ summary: 'Test endpoint without auth' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  async test(@Body() testDto: any): Promise<any> {
    return {
      success: true,
      message: 'Company endpoint is working!',
      data: testDto,
      timestamp: new Date().toISOString()
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Créer une nouvelle entreprise' })
  @ApiResponse({ status: 201, description: 'Entreprise créée avec succès', type: ApiResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides', type: ApiErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Non autorisé', type: ApiErrorResponseDto })
  async create(@Body() createCompanyDto: CreateCompanyDto, @Req() req: any): Promise<ApiResponseDto<CompanyResponseDto>> {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    const company = await this.smeService.create(createCompanyDto, auth0Id);
    return {
      success: true,
      data: company
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Récupérer une entreprise par son ID' })
  @ApiResponse({ status: 200, description: 'Entreprise récupérée', type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Entreprise non trouvée', type: ApiErrorResponseDto })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<CompanyResponseDto>> {
    const company = await this.smeService.findById(id);
    if (!company) {
      throw new NotFoundException('Entreprise non trouvée');
    }
    
    return {
      success: true,
      data: company
    };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mettre à jour une entreprise' })
  @ApiResponse({ status: 200, description: 'Entreprise mise à jour', type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Entreprise non trouvée', type: ApiErrorResponseDto })
  async update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto, @Req() req: any): Promise<ApiResponseDto<CompanyResponseDto>> {
    // Vérifier si l'utilisateur a le droit de modifier cette entreprise
    await this.checkCompanyOwnership(id, req.user?.sub);
    
    const updatedCompany = await this.smeService.update(id, updateCompanyDto);
    return {
      success: true,
      data: updatedCompany
    };
  }

  @Post(':id/logo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Télécharger un logo d\'entreprise' })
  @ApiResponse({ status: 200, description: 'Logo téléchargé', type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Entreprise non trouvée', type: ApiErrorResponseDto })
  async uploadLogo(
    @Param('id') id: string,
    @UploadedFile() file: MulterFile,
    @Req() req: any
  ): Promise<ApiResponseDto<{ logo: string, message: string }>> {
    // Vérifier si l'utilisateur a le droit de modifier cette entreprise
    await this.checkCompanyOwnership(id, req.user?.sub);
    
    // Upload the logo
    const logoUrl = await this.smeService.updateLogo(id, file);
    
    return {
      success: true,
      data: {
        logo: logoUrl,
        message: 'Logo téléchargé avec succès'
      }
    };
  }

  @Post(':id/owner/cv')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('cv'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Télécharger un CV de dirigeant' })
  @ApiResponse({ status: 200, description: 'CV téléchargé', type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Entreprise non trouvée', type: ApiErrorResponseDto })
  async uploadOwnerCV(
    @Param('id') id: string,
    @UploadedFile() file: MulterFile,
    @Req() req: any
  ): Promise<ApiResponseDto<{ cv: string, message: string }>> {
    // Vérifier si l'utilisateur a le droit de modifier cette entreprise
    await this.checkCompanyOwnership(id, req.user?.sub);
    
    // Upload the CV
    const cvUrl = await this.smeService.updateOwnerCV(id, file);
    
    return {
      success: true,
      data: {
        cv: cvUrl,
        message: 'CV téléchargé avec succès'
      }
    };
  }

  @Post(':id/locations')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ajouter un emplacement' })
  @ApiResponse({ status: 201, description: 'Emplacement ajouté', type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Entreprise non trouvée', type: ApiErrorResponseDto })
  async addLocation(
    @Param('id') id: string,
    @Body() locationDto: LocationDto,
    @Req() req: any
  ): Promise<ApiResponseDto<LocationDto>> {
    // Vérifier si l'utilisateur a le droit de modifier cette entreprise
    await this.checkCompanyOwnership(id, req.user?.sub);
    
    const location = await this.smeService.addLocation(id, locationDto);
    return {
      success: true,
      data: location
    };
  }

  @Delete(':id/locations/:locationId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Supprimer un emplacement' })
  @ApiResponse({ status: 200, description: 'Emplacement supprimé', type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Entreprise ou emplacement non trouvé', type: ApiErrorResponseDto })
  async removeLocation(
    @Param('id') id: string,
    @Param('locationId') locationId: string,
    @Req() req: any
  ): Promise<ApiResponseDto<{ message: string }>> {
    // Vérifier si l'utilisateur a le droit de modifier cette entreprise
    await this.checkCompanyOwnership(id, req.user?.sub);
    
    await this.smeService.removeLocation(id, locationId);
    return {
      success: true,
      data: {
        message: 'Emplacement supprimé avec succès'
      }
    };
  }

  @Post(':id/associates')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ajouter un associé' })
  @ApiResponse({ status: 201, description: 'Associé ajouté', type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Entreprise non trouvée', type: ApiErrorResponseDto })
  async addAssociate(
    @Param('id') id: string,
    @Body() associateDto: AssociateDto,
    @Req() req: any
  ): Promise<ApiResponseDto<AssociateDto>> {
    // Vérifier si l'utilisateur a le droit de modifier cette entreprise
    await this.checkCompanyOwnership(id, req.user?.sub);
    
    const associate = await this.smeService.addAssociate(id, associateDto);
    return {
      success: true,
      data: associate
    };
  }

  @Delete(':id/associates/:associateId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Supprimer un associé' })
  @ApiResponse({ status: 200, description: 'Associé supprimé', type: ApiResponseDto })
  @ApiResponse({ status: 404, description: 'Entreprise ou associé non trouvé', type: ApiErrorResponseDto })
  async removeAssociate(
    @Param('id') id: string,
    @Param('associateId') associateId: string,
    @Req() req: any
  ): Promise<ApiResponseDto<{ message: string }>> {
    // Vérifier si l'utilisateur a le droit de modifier cette entreprise
    await this.checkCompanyOwnership(id, req.user?.sub);
    
    await this.smeService.removeAssociate(id, associateId);
    return {
      success: true,
      data: {
        message: 'Associé supprimé avec succès'
      }
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lister les entreprises' })
  @ApiResponse({ status: 200, description: 'Liste des entreprises', type: ApiResponseDto })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('industry') industry?: string,
    @Query('size') size?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: 'ASC' | 'DESC'
  ): Promise<ApiResponseDto<CompanyResponseDto[]>> {
    const [companies, total] = await this.smeService.findAll(
      +page,
      +limit,
      { industry, size },
      sort,
      order
    );
    
    return {
      success: true,
      data: companies,
      meta: {
        pagination: {
          page: +page,
          limit: +limit,
          total,
          pages: Math.ceil(total / +limit)
        }
      }
    };
  }

  /**
   * Vérifie si l'utilisateur est le propriétaire de l'entreprise
   */
  private async checkCompanyOwnership(companyId: string, auth0Id?: string): Promise<void> {
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    const isOwner = await this.smeService.isCompanyOwner(companyId, auth0Id);
    if (!isOwner) {
      throw new UnauthorizedException('Vous n\'êtes pas autorisé à modifier cette entreprise');
    }
  }

  @Patch(':companyId/validate')
  @ApiOperation({ summary: 'Valider une entreprise' })
  @ApiResponse({ 
    status: 200, 
    description: 'Entreprise validée avec succès',
    type: ApiResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Entreprise non trouvée',
    type: ApiErrorResponseDto
  })
  async validateCompany(
    @Param('companyId') companyId: string,
    @Body() data: { validatedBy: string }
  ): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.smeService.validate(companyId, data.validatedBy);
    return {
      success: true,
      data: {
        message: 'Entreprise validée avec succès'
      }
    };
  }

  @Patch(':companyId/suspend')
  @ApiOperation({ summary: 'Suspendre une entreprise' })
  @ApiResponse({ 
    status: 200, 
    description: 'Entreprise suspendue avec succès',
    type: ApiResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Entreprise non trouvée',
    type: ApiErrorResponseDto
  })
  async suspendCompany(
    @Param('companyId') companyId: string,
    @Body() data: { suspendedBy: string; reason: string }
  ): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.smeService.suspend(companyId, data.suspendedBy, data.reason);
    return {
      success: true,
      data: {
        message: 'Entreprise suspendue avec succès'
      }
    };
  }

  @Patch(':companyId/reject')
  @ApiOperation({ summary: 'Rejeter une entreprise' })
  @ApiResponse({ 
    status: 200, 
    description: 'Entreprise rejetée avec succès',
    type: ApiResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Entreprise non trouvée',
    type: ApiErrorResponseDto
  })
  async rejectCompany(
    @Param('companyId') companyId: string,
    @Body() data: { rejectedBy: string; reason: string }
  ): Promise<ApiResponseDto<{ message: string }>> {
    const result = await this.smeService.reject(companyId, data.rejectedBy, data.reason);
    return {
      success: true,
      data: {
        message: 'Entreprise rejetée avec succès'
      }
    };
  }
}
