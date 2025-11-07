import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreditScoringService, CreditScoringRequest } from '../services/credit-scoring.service';
import { CalculateCreditScoreDto, CreditScoreResponseDto } from '../dtos/credit-score.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('credit-score')
@Controller('credit-score')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CreditScoreController {
  constructor(
    private readonly creditScoringService: CreditScoringService,
  ) {}

  @Post('calculate')
  @Roles('admin', 'analyst')
  @ApiOperation({ 
    summary: 'Calculer la cote crédit officielle XGBoost',
    description: 'Calcule la cote crédit de référence basée sur le modèle XGBoost et les données transactionnelles'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Cote crédit XGBoost calculée avec succès',
    type: CreditScoreResponseDto
  })
  async calculateOfficialCreditScore(@Body() calculateDto: CalculateCreditScoreDto): Promise<{
    success: boolean;
    creditScore: CreditScoreResponseDto;
    message: string;
  }> {
    const score = await this.creditScoringService.calculateCreditScore({
      companyId: calculateDto.companyId,
      startDate: calculateDto.startDate || new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
      endDate: calculateDto.endDate || new Date(),
      method: 'ml',
      includeDetails: true
    });
    return {
      success: true,
      creditScore: {
        score: score.score.score,
        riskLevel: score.score.riskLevel,
        scoreClass: score.score.scoreClass,
        components: score.details?.components || {
          cashFlowQuality: 0,
          businessStability: 0,
          financialHealth: 0,
          paymentBehavior: 0,
          growthTrend: 0
        },
        riskAssessment: {
          level: score.score.riskLevel.toLowerCase() as 'low' | 'medium' | 'high',
          factors: score.details?.explanation || [],
          recommendations: score.details?.recommendations || []
        },
        metadata: {
          modelVersion: score.score.modelVersion,
          dataSource: score.score.dataSource,
          confidenceScore: score.metadata.confidenceLevel,
          dataQualityScore: this.getDataQualityScore(score.metadata.dataQuality),
          calculatedAt: score.metadata.calculatedAt,
          validUntil: score.score.validUntil
        }
      },
      message: 'Cote crédit XGBoost calculée avec succès - Score de référence officiel'
    };
  }

  @Get('legacy/traditional')
  @ApiOperation({ 
    summary: '[DÉPRÉCIÉ] Calcul traditionnel - Utiliser /calculate à la place',
    deprecated: true 
  })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async calculateTraditionalScore(
    @Query('companyId') companyId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const score = await this.creditScoringService.calculateCreditScore({
      companyId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      method: 'traditional',
      includeDetails: true
    });

    return {
      success: true,
      deprecated: true,
      message: 'Cette méthode est dépréciée. Utilisez uniquement la cote crédit XGBoost.',
      score,
    };
  }

  @Post('get')
  @Roles('admin', 'analyst', 'system')
  @ApiOperation({ 
    summary: 'Obtenir ou calculer cote crédit XGBoost - Endpoint de distribution',
    description: 'Point d\'entrée principal pour tous les services demandant une cote crédit XGBoost'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Cote crédit XGBoost obtenue avec succès'
  })
  async getCreditScoreForDistribution(@Body() request: {
    companyId: string;
    startDate?: Date;
    endDate?: Date;
    forceRecalculation?: boolean;
    trigger?: string;
    calculatedBy?: string;
  }) {
    const scoringRequest: CreditScoringRequest = {
      companyId: request.companyId,
      startDate: request.startDate || new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000),
      endDate: request.endDate || new Date(),
      method: 'hybrid', // Utilise la méthode hybride pour de meilleurs résultats
      includeDetails: true,
      forceRecalculation: request.forceRecalculation
    };

    const score = await this.creditScoringService.calculateCreditScore(scoringRequest);
    
    return {
      success: true,
      score: score.score,
      details: score.details,
      metadata: score.metadata,
      message: 'Cote crédit XGBoost calculée avec succès'
    };
  }

  @Get('history')
  @Roles('admin', 'analyst', 'system')
  @ApiOperation({ 
    summary: 'Obtenir historique des cotes crédit XGBoost',
    description: 'Endpoint pour récupérer l\'historique des calculs de cote crédit'
  })
  @ApiQuery({ name: 'companyId', required: true })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  async getCreditScoreHistoryForDistribution(
    @Query('companyId') companyId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    // Implémentation temporaire - sera remplacée par le service de distribution
    return {
      success: true,
      history: [],
      message: 'Historique des cotes crédit (implémentation en cours)'
    };
  }

  @Get('stats')
  @Roles('admin', 'analyst', 'system')
  @ApiOperation({ 
    summary: 'Obtenir statistiques des cotes crédit XGBoost',
    description: 'Endpoint pour récupérer les statistiques agrégées'
  })
  @ApiQuery({ name: 'companyId', required: true })
  async getCreditScoreStatsForDistribution(
    @Query('companyId') companyId: string,
  ) {
    // Implémentation temporaire - sera remplacée par le service de distribution
    return {
      success: true,
      stats: {
        totalCalculations: 0,
        averageScore: 0,
        scoresTrend: 'stable' as const,
        lastCalculation: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      message: 'Statistiques des cotes crédit (implémentation en cours)'
    };
  }

  private getDataQualityScore(dataQuality: 'excellent' | 'good' | 'fair' | 'poor'): number {
    const qualityScores = {
      excellent: 0.95,
      good: 0.8,
      fair: 0.6,
      poor: 0.4
    };
    return qualityScores[dataQuality] || 0.8;
  }

}
