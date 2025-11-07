import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { 
  RequireFeature, 
  CurrentCustomer, 
  RequestCustomer 
} from '../decorators/feature-access.decorator';
import { FeatureAccessGuard } from '../guards/feature-access.guard';
import { FeatureCode } from '../../../config/subscription-pricing.config';

export class CompanyProspectingDto {
  sector?: string;
  minRevenue?: number;
  maxRevenue?: number;
  location?: string;
  riskLevel?: 'low' | 'medium' | 'high';
}

export class RiskAssessmentDto {
  companyId!: string;
  assessmentType: 'basic' | 'detailed' | 'comprehensive' = 'basic';
}

export class PortfolioAnalysisDto {
  includeRiskMetrics?: boolean;
  includePerformance?: boolean;
  period?: 'monthly' | 'quarterly' | 'yearly';
}

@ApiTags('Financial Institution Services')
@Controller('financial')
@ApiBearerAuth()
@UseGuards(FeatureAccessGuard)
export class FinancialInstitutionController {

  @Get('companies/prospect')
  @RequireFeature(FeatureCode.COMPANY_PROSPECTING)
  @ApiOperation({ summary: 'Rechercher des entreprises à prospecter' })
  async prospectCompanies(
    @CurrentCustomer() customer: RequestCustomer,
    @Query() query: CompanyProspectingDto
  ): Promise<{
    companies: any[];
    total: number;
    filters: any;
    limitReached?: boolean;
  }> {
    // Simuler la recherche d'entreprises
    const companies = [
      {
        id: '1',
        name: 'TechCorp SA',
        sector: 'Technology',
        revenue: 2500000,
        riskScore: 0.25,
        location: 'Kinshasa',
        employees: 45
      },
      {
        id: '2', 
        name: 'Commerce Plus SARL',
        sector: 'Retail',
        revenue: 1200000,
        riskScore: 0.35,
        location: 'Lubumbashi',
        employees: 28
      }
    ];

    return {
      companies,
      total: companies.length,
      filters: query,
      limitReached: customer.planId?.includes('freemium') && companies.length >= 10
    };
  }

  @Post('companies/:companyId/risk-assessment')
  @RequireFeature(FeatureCode.RISK_ASSESSMENT, 8000) // Coûte 8000 tokens
  @ApiOperation({ summary: 'Évaluer le risque d\'une entreprise' })
  async assessCompanyRisk(
    @CurrentCustomer() customer: RequestCustomer,
    @Param('companyId') companyId: string,
    @Body() dto: RiskAssessmentDto
  ): Promise<{
    assessmentId: string;
    riskScore: number;
    riskLevel: string;
    factors: any[];
    tokensCost: number;
  }> {
    const tokensCost = {
      'basic': 8000,
      'detailed': 15000,
      'comprehensive': 25000
    }[dto.assessmentType];

    return {
      assessmentId: `risk-${Date.now()}`,
      riskScore: 0.32,
      riskLevel: 'Medium',
      factors: [
        { factor: 'Financial Stability', score: 0.8, weight: 0.4 },
        { factor: 'Market Position', score: 0.65, weight: 0.3 },
        { factor: 'Management Quality', score: 0.75, weight: 0.3 }
      ],
      tokensCost
    };
  }

  @Get('portfolio/analysis')
  @RequireFeature(FeatureCode.PORTFOLIO_MANAGEMENT)
  @ApiOperation({ summary: 'Analyser le portefeuille' })
  async analyzePortfolio(
    @CurrentCustomer() customer: RequestCustomer,
    @Query() query: PortfolioAnalysisDto
  ): Promise<{
    portfolioValue: number;
    riskMetrics?: any;
    performance?: any;
    recommendations: string[];
  }> {
    const analysis: any = {
      portfolioValue: 12500000,
      recommendations: [
        'Diversifier dans le secteur technologique',
        'Réduire l\'exposition au secteur minier',
        'Considérer des PME en croissance'
      ]
    };

    if (query.includeRiskMetrics) {
      analysis.riskMetrics = {
        var: 0.025,
        sharpeRatio: 1.34,
        maxDrawdown: 0.12
      };
    }

    if (query.includePerformance) {
      analysis.performance = {
        ytdReturn: 0.087,
        volatility: 0.15,
        benchmark: 0.065
      };
    }

    return analysis;
  }

  @Post('ai/credit-scoring')
  @RequireFeature(FeatureCode.CREDIT_SCORING, 12000) // Coûte 12000 tokens
  @ApiOperation({ summary: 'Calculer le score de crédit avec l\'IA' })
  async calculateCreditScore(
    @CurrentCustomer() customer: RequestCustomer,
    @Body() body: { companyData: any; financialHistory: any }
  ): Promise<{
    creditScore: number;
    scoreClass: string;
    probability: number;
    explanation: string[];
    tokensCost: number;
  }> {
    return {
      creditScore: 72, // CORRIGÉ: 720 → 72 (échelle 1-100 standardisée)
      scoreClass: 'Good',
      probability: 0.85,
      explanation: [
        'Historique de paiement régulier',
        'Ratios financiers sains',
        'Croissance stable du chiffre d\'affaires',
        'Secteur d\'activité stable'
      ],
      tokensCost: 12000
    };
  }

  @Get('companies/:companyId/financial-analysis')
  @RequireFeature(FeatureCode.DOCUMENT_ANALYSIS, 10000) // Coûte 10000 tokens
  @ApiOperation({ summary: 'Analyser les documents financiers d\'une entreprise' })
  async analyzeCompanyFinancials(
    @CurrentCustomer() customer: RequestCustomer,
    @Param('companyId') companyId: string
  ): Promise<{
    analysisId: string;
    financialHealth: number;
    keyMetrics: any;
    alerts: string[];
    tokensCost: number;
  }> {
    return {
      analysisId: `fin-analysis-${Date.now()}`,
      financialHealth: 0.78,
      keyMetrics: {
        liquidityRatio: 1.45,
        debtToEquity: 0.65,
        returnOnAssets: 0.12,
        profitMargin: 0.08
      },
      alerts: [
        'Légère diminution de la liquidité',
        'Augmentation de l\'endettement'
      ],
      tokensCost: 10000
    };
  }

  @Get('market/insights')
  @RequireFeature(FeatureCode.PREDICTIVE_ANALYTICS, 20000) // Coûte 20000 tokens
  @ApiOperation({ summary: 'Obtenir des insights sur le marché' })
  async getMarketInsights(
    @CurrentCustomer() customer: RequestCustomer,
    @Query('sector') sector?: string
  ): Promise<{
    insights: any[];
    trends: any[];
    opportunities: any[];
    tokensCost: number;
  }> {
    return {
      insights: [
        {
          title: 'Croissance du secteur fintech',
          impact: 'high',
          confidence: 0.89
        },
        {
          title: 'Stabilisation du secteur minier',
          impact: 'medium',
          confidence: 0.76
        }
      ],
      trends: [
        { metric: 'Digital Adoption', direction: 'up', magnitude: 0.23 },
        { metric: 'SME Credit Demand', direction: 'up', magnitude: 0.15 }
      ],
      opportunities: [
        {
          sector: 'Agribusiness',
          potential: 'high',
          risk: 'medium',
          description: 'Expansion des PME agricoles avec besoins de financement'
        }
      ],
      tokensCost: 20000
    };
  }

  @Post('users/manage')
  @RequireFeature(FeatureCode.MULTI_USER_ACCESS)
  @ApiOperation({ summary: 'Gérer les utilisateurs de l\'institution' })
  async manageUsers(
    @CurrentCustomer() customer: RequestCustomer,
    @Body() body: { action: 'list' | 'invite' | 'remove'; email?: string; role?: string }
  ): Promise<{
    users?: any[];
    action: string;
    result: string;
  }> {
    if (body.action === 'list') {
      return {
        users: [
          { id: '1', email: 'analyst1@institution.com', role: 'analyst', active: true },
          { id: '2', email: 'manager@institution.com', role: 'manager', active: true }
        ],
        action: 'list',
        result: 'success'
      };
    }

    return {
      action: body.action,
      result: 'success'
    };
  }

  @Get('api/usage')
  @RequireFeature(FeatureCode.API_ACCESS)
  @ApiOperation({ summary: 'Consulter l\'usage de l\'API' })
  async getAPIUsage(@CurrentCustomer() customer: RequestCustomer): Promise<{
    dailyUsage: number;
    monthlyUsage: number;
    limit: number;
    remainingQuota: number;
  }> {
    return {
      dailyUsage: 750,
      monthlyUsage: 18500,
      limit: 30000,
      remainingQuota: 11500
    };
  }

  @Get('support/priority')
  @RequireFeature(FeatureCode.PRIORITY_SUPPORT)
  @ApiOperation({ summary: 'Accéder au support prioritaire' })
  async getPrioritySupport(@CurrentCustomer() customer: RequestCustomer): Promise<{
    supportLevel: string;
    responseTime: string;
    contactMethods: string[];
  }> {
    return {
      supportLevel: 'Priority',
      responseTime: '< 2 hours',
      contactMethods: ['phone', 'email', 'chat', 'dedicated_manager']
    };
  }
}
