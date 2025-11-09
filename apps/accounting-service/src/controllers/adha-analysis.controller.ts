import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  RequireDocumentAnalysis,
  RequireAITokens,
  RequireAutomatedAccounting,
  RequirePredictiveAnalytics 
} from '../../../../packages/shared/src';
import { AdhaAnalysisService } from '../services/adha-analysis.service';

@ApiTags('adha-analysis')
@ApiBearerAuth()
@Controller('adha-analysis')
@UseGuards(JwtAuthGuard)
export class AdhaAnalysisController {
  constructor(private readonly adhaAnalysisService: AdhaAnalysisService) {}

  /**
   * Analyser un document comptable avec l'IA ADHA
   * Consomme 1 crédit d'analyse de document
   */
  @Post('document-analysis')
  @RequireDocumentAnalysis(1)
  @ApiOperation({ 
    summary: 'Analyser un document comptable',
    description: 'Analyse un document comptable avec l\'IA ADHA pour extraire les informations pertinentes.'
  })
  async analyzeDocument(@Body() documentData: any) {
    return this.adhaAnalysisService.analyzeDocument(documentData);
  }

  /**
   * Classification automatique des transactions
   * Consomme des tokens IA selon la complexité
   */
  @Post('classify-transactions')
  @RequireAITokens(100) // Estimation de tokens pour classification
  @ApiOperation({ 
    summary: 'Classifier des transactions automatiquement',
    description: 'Classifie automatiquement les transactions comptables selon leur nature.'
  })
  async classifyTransactions(@Body() transactions: any[]) {
    return this.adhaAnalysisService.classifyTransactions(transactions);
  }

  /**
   * Génération automatique d'écritures comptables
   * Consomme 1 crédit d'écriture automatisée + tokens IA
   */
  @Post('generate-entries')
  @RequireAutomatedAccounting(1)
  @RequireAITokens(200) // Estimation pour génération d'écritures
  @ApiOperation({ 
    summary: 'Générer des écritures automatiquement',
    description: 'Génère automatiquement des écritures comptables basées sur l\'analyse IA.'
  })
  async generateEntries(@Body() analysisData: any) {
    return this.adhaAnalysisService.generateAutomatedEntries(analysisData);
  }

  /**
   * Détection d'anomalies comptables
   * Consomme 1 crédit d'analyse prédictive
   */
  @Post('detect-anomalies')
  @RequirePredictiveAnalytics(1)
  @ApiOperation({ 
    summary: 'Détecter des anomalies comptables',
    description: 'Détecte les anomalies dans les données comptables avec l\'analyse prédictive.'
  })
  async detectAnomalies(@Body() accountingData: any) {
    return this.adhaAnalysisService.detectAnomalies(accountingData);
  }

  /**
   * Prédiction de flux de trésorerie
   * Consomme 1 crédit d'analyse prédictive
   */
  @Post('cash-flow-prediction')
  @RequirePredictiveAnalytics(1)
  @ApiOperation({ 
    summary: 'Prédire les flux de trésorerie',
    description: 'Prédit les flux de trésorerie futurs basés sur l\'historique comptable.'
  })
  async predictCashFlow(@Body() historicalData: any) {
    return this.adhaAnalysisService.predictCashFlow(historicalData);
  }

  /**
   * Chat IA pour assistance comptable
   * Consomme des tokens selon la conversation
   */
  @Post('ai-chat')
  @RequireAITokens(50) // Tokens de base, peuvent être ajustés dynamiquement
  @ApiOperation({ 
    summary: 'Chat IA pour assistance comptable',
    description: 'Conversation avec l\'IA ADHA pour obtenir une assistance comptable.'
  })
  async aiChat(@Body() chatData: { message: string; context?: any }) {
    return this.adhaAnalysisService.processChatMessage(chatData);
  }

  /**
   * Réconciliation automatique
   * Consomme tokens IA selon le volume de données
   */
  @Post('auto-reconciliation')
  @RequireAITokens(150)
  @ApiOperation({ 
    summary: 'Réconciliation automatique',
    description: 'Effectue une réconciliation automatique des comptes avec l\'IA.'
  })
  async autoReconciliation(@Body() reconciliationData: any) {
    return this.adhaAnalysisService.performAutoReconciliation(reconciliationData);
  }

  /**
   * Suggestions d'optimisation fiscale
   * Consomme 1 crédit d'analyse prédictive + tokens IA
   */
  @Post('tax-optimization')
  @RequirePredictiveAnalytics(1)
  @RequireAITokens(300) // Analyse complexe nécessitant plus de tokens
  @ApiOperation({ 
    summary: 'Suggestions d\'optimisation fiscale',
    description: 'Génère des suggestions d\'optimisation fiscale basées sur l\'analyse des données.'
  })
  async taxOptimizationSuggestions(@Body() financialData: any) {
    return this.adhaAnalysisService.generateTaxOptimizations(financialData);
  }
}