import { Controller, Get, Post, Body, Param, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TokenService } from '../services/token.service';
import { TokenUsage, TokenServiceType } from '../entities/token-usage.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PurchaseTokenDto } from '../dto/purchase-token.dto';

class RecordTokenUsageDto {
  customerId!: string;
  userId?: string;
  amount!: number;
  serviceType!: string;
  requestId?: string;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}

@ApiTags('tokens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('land/api/v1/tokens')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Post('purchase')
  @ApiOperation({ summary: 'Purchase tokens for a customer' })
  @ApiResponse({ status: 201, description: 'Tokens purchased successfully' })
  async purchaseTokens(@Body() purchaseTokenDto: PurchaseTokenDto) {
    return this.tokenService.purchaseTokens(purchaseTokenDto);
  }

  @Get('balance/:customerId')
  @ApiOperation({ summary: 'Get token balance for a customer' })
  @ApiResponse({ status: 200, description: 'Token balance retrieved successfully' })
  async getTokenBalance(@Param('customerId') customerId: string) {
    const balance = await this.tokenService.getTokenBalance(customerId);
    return { balance };
  }

  @Get('balance')
  @ApiOperation({ summary: 'Récupérer le solde de tokens de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Solde de tokens récupéré avec succès' })
  async getCurrentUserTokenBalance(@Req() req: any) {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    const balance = await this.tokenService.getTokenBalanceByAuth0Id(auth0Id);
    return { 
      balance: balance.balance,
      totalPurchased: balance.totalPurchased
    };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Récupérer l\'historique des transactions de tokens de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Historique des transactions récupéré' })
  async getCurrentUserTransactions(
    @Req() req: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    const auth0Id = req.user?.sub;
    if (!auth0Id) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    
    return this.tokenService.getTokenTransactionsByAuth0Id(auth0Id, +page, +limit);
  }

  @Post('usage')
  @ApiOperation({ summary: 'Enregistrer une utilisation de tokens' })
  @ApiResponse({ status: 201, description: 'Utilisation enregistrée avec succès' })
  async recordUsage(@Body() usageDto: RecordTokenUsageDto): Promise<TokenUsage> {
    return this.tokenService.recordTokenUsage(usageDto);
  }

  @Get('usage/:customerId')
  @ApiOperation({ summary: 'Récupérer l\'historique d\'utilisation des tokens pour un client' })
  @ApiResponse({ status: 200, description: 'Historique récupéré avec succès' })
  async getUsageHistory(
    @Param('customerId') customerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ): Promise<{ usages: TokenUsage[], total: number, page: number, limit: number }> {
    const startDateTime = startDate ? new Date(startDate) : undefined;
    const endDateTime = endDate ? new Date(endDate) : undefined;
    
    const [usages, total] = await this.tokenService.getTokenUsageHistory(
      customerId, 
      startDateTime, 
      endDateTime, 
      +page, 
      +limit
    );
    
    return {
      usages,
      total,
      page: +page,
      limit: +limit
    };
  }

  @Get('usage/:customerId/total')
  @ApiOperation({ summary: 'Récupérer le total des tokens utilisés par un client' })
  @ApiResponse({ status: 200, description: 'Total récupéré avec succès' })
  async getTotalUsage(
    @Param('customerId') customerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<{ total: number }> {
    const startDateTime = startDate ? new Date(startDate) : undefined;
    const endDateTime = endDate ? new Date(endDate) : undefined;
    
    const total = await this.tokenService.getTotalTokenUsage(
      customerId, 
      startDateTime, 
      endDateTime
    );
    
    return { total };
  }

  @Get('usage/:customerId/by-service')
  @ApiOperation({ summary: 'Récupérer l\'utilisation des tokens par service' })
  @ApiResponse({ status: 200, description: 'Données récupérées avec succès' })
  async getUsageByService(
    @Param('customerId') customerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<{ serviceType: TokenServiceType, total: number }[]> {
    const startDateTime = startDate ? new Date(startDate) : undefined;
    const endDateTime = endDate ? new Date(endDate) : undefined;
    
    return this.tokenService.getTokenUsageByService(
      customerId, 
      startDateTime, 
      endDateTime
    );
  }
}
