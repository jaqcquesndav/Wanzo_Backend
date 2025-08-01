import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionCategoryService } from '../services/transaction-category.service';
import { CreateTransactionCategoryDto, UpdateTransactionCategoryDto } from '../dtos/transaction-category.dto';

@ApiTags('transaction-categories')
@Controller('transaction-categories')
export class TransactionCategoryController {
  constructor(private readonly categoryService: TransactionCategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle catégorie de transaction' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'La catégorie a été créée avec succès.' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Données invalides ou incomplètes' 
  })
  async create(
    @Request() req,
    @Body() createCategoryDto: CreateTransactionCategoryDto
  ) {
    // Simuler l'utilisateur et la société pour la démo
    const companyId = req.user?.companyId || 'demo-company-id';
    
    return this.categoryService.create(
      companyId,
      createCategoryDto
    );
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les catégories de transaction' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Liste des catégories récupérée avec succès' 
  })
  async findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('parentId') parentId?: string,
    @Query('searchTerm') searchTerm?: string,
    @Query('includeInactive') includeInactive?: boolean,
    @Query('transactionType') transactionType?: 'income' | 'expense' | 'both',
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    // Simuler l'utilisateur et la société pour la démo
    const companyId = req.user?.companyId || 'demo-company-id';
    
    return this.categoryService.findAll(
      companyId,
      {
        page,
        limit,
        parentId: parentId === 'null' ? null : parentId,
        searchTerm,
        includeInactive,
        transactionType,
        sortBy,
        sortOrder,
      }
    );
  }

  @Get('tree')
  @ApiOperation({ summary: 'Obtenir l\'arborescence des catégories de transaction' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Arborescence récupérée avec succès' 
  })
  async getCategoryTree(
    @Request() req,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    // Simuler l'utilisateur et la société pour la démo
    const companyId = req.user?.companyId || 'demo-company-id';
    
    return this.categoryService.getCategoryTree(
      companyId,
      includeInactive
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une catégorie de transaction par son ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Catégorie récupérée avec succès' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Catégorie non trouvée' 
  })
  async findOne(@Request() req, @Param('id') id: string) {
    // Simuler l'utilisateur et la société pour la démo
    const companyId = req.user?.companyId || 'demo-company-id';
    
    return this.categoryService.findOne(
      companyId,
      id
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une catégorie de transaction' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Catégorie mise à jour avec succès' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Catégorie non trouvée' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Données invalides ou conflit' 
  })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateTransactionCategoryDto
  ) {
    // Simuler l'utilisateur et la société pour la démo
    const companyId = req.user?.companyId || 'demo-company-id';
    
    return this.categoryService.update(
      companyId,
      id,
      updateCategoryDto
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une catégorie de transaction' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Catégorie supprimée avec succès' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Catégorie non trouvée' 
  })
  @ApiResponse({ 
    status: HttpStatus.CONFLICT, 
    description: 'Catégorie contient des sous-catégories ou est utilisée' 
  })
  async remove(@Request() req, @Param('id') id: string) {
    // Simuler l'utilisateur et la société pour la démo
    const companyId = req.user?.companyId || 'demo-company-id';
    
    await this.categoryService.remove(companyId, id);
    return { message: 'Catégorie supprimée avec succès' };
  }
}
