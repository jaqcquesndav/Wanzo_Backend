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
import { FinancialTransactionService } from '../services/financial-transaction.service';
import { CreateFinancialTransactionDto, UpdateFinancialTransactionDto } from '../dtos/financial-transaction.dto';
import { FilterTransactionsDto } from '../dtos/filter-transactions.dto';
import { TransactionStatus } from '../entities/financial-transaction.entity';

@ApiTags('financial-transactions')
@Controller('financial-transactions')
export class FinancialTransactionController {
  constructor(private readonly transactionService: FinancialTransactionService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle transaction financière' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'La transaction a été créée avec succès.' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Données invalides ou incomplètes' 
  })
  async create(
    @Request() req,
    @Body() createTransactionDto: CreateFinancialTransactionDto
  ) {
    // Simuler l'utilisateur et la société pour la démo
    const companyId = req.user?.companyId || 'demo-company-id';
    const userId = req.user?.userId || 'demo-user-id';
    
    return this.transactionService.create(
      companyId,
      userId,
      createTransactionDto
    );
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les transactions financières avec filtres' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Liste des transactions récupérée avec succès' 
  })
  async findAll(@Request() req, @Query() filterDto: FilterTransactionsDto) {
    // Simuler l'utilisateur et la société pour la démo
    const companyId = req.user?.companyId || 'demo-company-id';
    
    return this.transactionService.findAll(
      companyId,
      filterDto
    );
  }

  @Get('summary')
  @ApiOperation({ summary: 'Obtenir un résumé des transactions avec des statistiques' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Résumé récupéré avec succès' 
  })
  async getSummary(@Request() req, @Query() filterDto: FilterTransactionsDto) {
    // Simuler l'utilisateur et la société pour la démo
    const companyId = req.user?.companyId || 'demo-company-id';
    
    return this.transactionService.getTransactionsSummary(
      companyId,
      filterDto
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une transaction financière par son ID' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Transaction récupérée avec succès' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Transaction non trouvée' 
  })
  async findOne(@Request() req, @Param('id') id: string) {
    // Simuler l'utilisateur et la société pour la démo
    const companyId = req.user?.companyId || 'demo-company-id';
    
    return this.transactionService.findOne(
      companyId,
      id
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une transaction financière' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Transaction mise à jour avec succès' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Transaction non trouvée' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Données invalides ou transaction non modifiable' 
  })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateFinancialTransactionDto
  ) {
    // Simuler l'utilisateur et la société pour la démo
    const companyId = req.user?.companyId || 'demo-company-id';
    
    return this.transactionService.update(
      companyId,
      id,
      updateTransactionDto
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une transaction financière' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Transaction supprimée avec succès' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Transaction non trouvée' 
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Transaction non supprimable' 
  })
  async remove(@Request() req, @Param('id') id: string) {
    // Simuler l'utilisateur et la société pour la démo
    const companyId = req.user?.companyId || 'demo-company-id';
    
    await this.transactionService.remove(companyId, id);
    return { message: 'Transaction supprimée avec succès' };
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Mettre à jour le statut d\'une transaction' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statut mis à jour avec succès' 
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Transaction non trouvée' 
  })
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body('status') status: TransactionStatus
  ) {
    // Simuler l'utilisateur et la société pour la démo
    const companyId = req.user?.companyId || 'demo-company-id';
    const userId = req.user?.userId || 'demo-user-id';
    
    return this.transactionService.updateStatus(
      companyId,
      id,
      status,
      userId
    );
  }
}
