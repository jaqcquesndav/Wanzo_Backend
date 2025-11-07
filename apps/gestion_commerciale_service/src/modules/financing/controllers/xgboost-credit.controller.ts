import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  HttpStatus,
  ParseUUIDPipe 
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiQuery 
} from '@nestjs/swagger';
import { CreditScoreApiService } from '../services/credit-api.service';
import { 
  CalculateCreditScoreDto,
  DetailedCreditScoreResponseDto,
  GetCreditScoreHistoryDto,
  UpdateCreditScoreDto 
} from '../dto/credit-score.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../auth/entities/user.entity';

@ApiTags('credit-score-xgboost')
@Controller('financing/credit-score')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CreditScoreXGBoostController {
  constructor(
    private readonly creditScoreApiService: CreditScoreApiService,
  ) {}

  @Get(':companyId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT)
  @ApiOperation({ 
    summary: 'Obtenir la cote crédit XGBoost d\'une entreprise',
    description: 'Retourne la cote crédit XGBoost la plus récente ou calcule une nouvelle si expirée'
  })
  @ApiParam({ name: 'companyId', description: 'ID de l\'entreprise' })
  @ApiQuery({ name: 'forceRecalculation', required: false, type: Boolean, description: 'Forcer le recalcul même si valide' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Date de début d\'analyse (ISO)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Date de fin d\'analyse (ISO)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Cote crédit XGBoost obtenue avec succès',
    type: DetailedCreditScoreResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Entreprise non trouvée' 
  })
  @ApiResponse({ 
    status: HttpStatus.SERVICE_UNAVAILABLE, 
    description: 'Service de calcul XGBoost indisponible' 
  })
  async getCreditScore(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query('forceRecalculation') forceRecalculation?: boolean,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const creditScore = await this.creditScoreApiService.getCreditScore({
      companyId,
      forceRecalculation: forceRecalculation || false,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });

    return {
      success: true,
      data: creditScore,
      message: 'Cote crédit XGBoost obtenue avec succès',
      metadata: {
        valid: this.creditScoreApiService.isScoreValid(creditScore),
        daysUntilExpiration: this.creditScoreApiService.getDaysUntilExpiration(creditScore),
        expiringSoon: this.creditScoreApiService.isScoreExpiringSoon(creditScore)
      }
    };
  }

  @Post(':companyId/calculate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Calculer une nouvelle cote crédit XGBoost',
    description: 'Force le calcul d\'une nouvelle cote crédit avec les paramètres spécifiés'
  })
  @ApiParam({ name: 'companyId', description: 'ID de l\'entreprise' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Nouvelle cote crédit XGBoost calculée avec succès',
    type: DetailedCreditScoreResponseDto
  })
  async calculateCreditScore(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() calculateDto: CalculateCreditScoreDto,
  ) {
    const creditScore = await this.creditScoreApiService.recalculateCreditScore(
      companyId,
      calculateDto.calculatedBy,
      calculateDto.startDate,
      calculateDto.endDate
    );

    return {
      success: true,
      data: creditScore,
      message: 'Nouvelle cote crédit XGBoost calculée avec succès',
      calculation: {
        trigger: 'manual',
        processingTime: '< 30s',
        modelVersion: creditScore.modelVersion
      }
    };
  }

  @Get(':companyId/history')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT)
  @ApiOperation({ 
    summary: 'Obtenir l\'historique des cotes crédit XGBoost',
    description: 'Retourne l\'historique complet des calculs de cote crédit pour une entreprise'
  })
  @ApiParam({ name: 'companyId', description: 'ID de l\'entreprise' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite des résultats (défaut: 10)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Décalage pour pagination (défaut: 0)' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Historique des cotes crédit obtenu avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              score: { type: 'object' },
              trigger: { type: 'string' },
              calculatedBy: { type: 'string' },
              scoreChange: { type: 'object' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            limit: { type: 'number' },
            offset: { type: 'number' },
            total: { type: 'number' }
          }
        }
      }
    }
  })
  async getCreditScoreHistory(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const history = await this.creditScoreApiService.getCreditScoreHistory(
      companyId,
      limit || 10,
      offset || 0
    );

    return {
      success: true,
      data: history,
      message: 'Historique des cotes crédit obtenu avec succès',
      pagination: {
        limit: limit || 10,
        offset: offset || 0,
        total: history.length
      }
    };
  }

  @Get(':companyId/stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT)
  @ApiOperation({ 
    summary: 'Obtenir les statistiques des cotes crédit XGBoost',
    description: 'Retourne les statistiques agrégées des cotes crédit pour une entreprise'
  })
  @ApiParam({ name: 'companyId', description: 'ID de l\'entreprise' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statistiques des cotes crédit obtenues avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            totalCalculations: { type: 'number' },
            averageScore: { type: 'number' },
            scoresTrend: { type: 'string', enum: ['improving', 'declining', 'stable'] },
            lastCalculation: { type: 'string', format: 'date-time' },
            validUntil: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  async getCreditScoreStats(
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ) {
    const stats = await this.creditScoreApiService.getCreditScoreStats(companyId);

    return {
      success: true,
      data: stats,
      message: 'Statistiques des cotes crédit obtenues avec succès'
    };
  }

  @Get(':companyId/components')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Obtenir les composants détaillés de la cote crédit XGBoost',
    description: 'Retourne l\'analyse détaillée des composants du score XGBoost'
  })
  @ApiParam({ name: 'companyId', description: 'ID de l\'entreprise' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Composants de la cote crédit obtenus avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            components: {
              type: 'object',
              properties: {
                cashFlowQuality: { type: 'number' },
                businessStability: { type: 'number' },
                financialHealth: { type: 'number' },
                paymentBehavior: { type: 'number' },
                growthTrend: { type: 'number' }
              }
            },
            explanation: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  })
  async getCreditScoreComponents(
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ) {
    const creditScore = await this.creditScoreApiService.getCreditScore({
      companyId,
      forceRecalculation: false
    });

    return {
      success: true,
      data: {
        components: creditScore.components,
        explanation: creditScore.explanation,
        recommendations: creditScore.recommendations,
        metadata: {
          modelVersion: creditScore.modelVersion,
          dataSource: creditScore.dataSource,
          confidenceScore: creditScore.confidenceScore
        }
      },
      message: 'Composants de la cote crédit obtenus avec succès'
    };
  }

  @Post(':companyId/validate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Valider la cote crédit d\'une demande de financement',
    description: 'Vérifie et met à jour la cote crédit pour une demande de financement spécifique'
  })
  @ApiParam({ name: 'companyId', description: 'ID de l\'entreprise' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Validation de la cote crédit terminée'
  })
  async validateCreditScoreForFinancing(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Body() body: { financingRequestId: string, requiredScore?: number },
  ) {
    const creditScore = await this.creditScoreApiService.getCreditScore({
      companyId,
      forceRecalculation: false
    });

    const isValid = this.creditScoreApiService.isScoreValid(creditScore);
    const meetsRequirement = !body.requiredScore || creditScore.score >= body.requiredScore;

    return {
      success: true,
      data: {
        creditScore: creditScore.score,
        riskLevel: creditScore.riskLevel,
        scoreClass: creditScore.scoreClass,
        isValid,
        meetsRequirement,
        recommendation: creditScore.recommendations[0] || 'Analyse en cours'
      },
      validation: {
        financingRequestId: body.financingRequestId,
        validatedAt: new Date(),
        status: isValid && meetsRequirement ? 'approved' : 'review_required'
      },
      message: 'Validation de la cote crédit terminée'
    };
  }

  /**
   * Méthode utilitaire pour déterminer la santé depuis un score
   */
  private determineHealthFromScore(score: number): string {
    if (score >= 91) return 'excellent';
    if (score >= 71) return 'good';
    if (score >= 51) return 'fair';
    if (score >= 31) return 'poor';
    return 'critical';
  }
}