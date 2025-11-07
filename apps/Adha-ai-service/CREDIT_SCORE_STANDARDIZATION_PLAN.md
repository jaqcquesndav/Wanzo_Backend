# Plan de Standardisation Cote Crédit XGBoost - Actions Concrètes

## 🎯 État Actuel Détecté

### ✅ **Services avec Credit Score**
1. **Accounting Service** ✅
   - Score: 0-100 (structure complète)
   - Endpoints: `/credit-score/calculate`, `/credit-score/predict`
   - DTOs complets avec métadonnées

2. **Portfolio Institution Service** ✅
   - Entity `CreditRisk`: `creditScore: number` (0-100)
   - Entity `CreditScoreHistory`: `scoreValue: number`
   - Interface `SMEFinancialData`: `credit_score: number`
   - Interface `SMEProspectData`: `financial_metrics.credit_score: number`

3. **Customer Service** ✅
   - Endpoint: `/financial/ai/credit-scoring`
   - Response: `creditScore: number` (1-100) ⚠️ **Incohérence échelle**

### ❌ **Services SANS Credit Score**
4. **Gestion Commerciale Service** ❌
   - Entity `FinancingRecord`: **AUCUN champ credit score**
   - DTO `FinancingRequestResponseDto`: **AUCUN champ credit score**

### ⚠️ **Services avec Échelle Différente**
5. **Analytics Service** ⚠️
   - Entity `RiskProfile`: `riskScore: number` (0-10) **ÉCHELLE DIFFÉRENTE**

## 🔧 Actions de Standardisation Requises

### 1. **Gestion Commerciale Service** - Ajouter Champs Credit Score

#### A. Modifier l'Entity `FinancingRecord`
```typescript
// Fichier: apps/gestion_commerciale_service/src/modules/financing/entities/financing-record.entity.ts

// AJOUTER ces champs après le champ 'notes':
@ApiProperty({ 
  description: 'Score de crédit XGBoost (1-100)', 
  example: 75,
  nullable: true 
})
@Column({ type: 'int', nullable: true })
creditScore: number;

@ApiProperty({ 
  description: 'Date de calcul du score crédit', 
  nullable: true 
})
@Column({ type: 'timestamp', nullable: true })
creditScoreCalculatedAt: Date;

@ApiProperty({ 
  description: 'Version du modèle XGBoost utilisée',
  example: 'xgboost-v1.0',
  nullable: true 
})
@Column({ nullable: true })
creditScoreModelVersion: string;

@ApiProperty({ 
  description: 'Niveau de risque basé sur le score',
  enum: ['LOW', 'MEDIUM', 'HIGH'],
  nullable: true 
})
@Column({ nullable: true })
riskLevel: string;

@ApiProperty({ 
  description: 'Score de confiance du modèle (0-1)',
  nullable: true 
})
@Column('decimal', { precision: 5, scale: 4, nullable: true })
confidenceScore: number;
```

#### B. Modifier le DTO `FinancingRequestResponseDto`
```typescript
// Fichier: apps/gestion_commerciale_service/src/modules/financing/dto/financing-request-response.dto.ts

// AJOUTER ces propriétés après 'updatedAt':
@ApiProperty({ 
  description: 'Score de crédit XGBoost (1-100)', 
  example: 75,
  required: false 
})
creditScore?: number;

@ApiProperty({ 
  description: 'Date de calcul du score crédit',
  required: false 
})
creditScoreCalculatedAt?: Date;

@ApiProperty({ 
  description: 'Version du modèle XGBoost',
  example: 'xgboost-v1.0',
  required: false 
})
creditScoreModelVersion?: string;

@ApiProperty({ 
  description: 'Niveau de risque basé sur le score',
  enum: ['LOW', 'MEDIUM', 'HIGH'],
  required: false 
})
riskLevel?: string;

@ApiProperty({ 
  description: 'Score de confiance du modèle',
  required: false 
})
confidenceScore?: number;

// MODIFIER la méthode fromEntity():
static fromEntity(record: FinancingRecord): FinancingRequestResponseDto {
  // ... code existant
  
  // AJOUTER ces lignes avant le return:
  dto.creditScore = record.creditScore;
  dto.creditScoreCalculatedAt = record.creditScoreCalculatedAt;
  dto.creditScoreModelVersion = record.creditScoreModelVersion;
  dto.riskLevel = record.riskLevel;
  dto.confidenceScore = record.confidenceScore;
  
  return dto;
}
```

#### C. Créer Migration Base de Données
```sql
-- Migration: add_credit_score_to_financing_requests.sql
ALTER TABLE financing_requests 
ADD COLUMN credit_score INTEGER NULL,
ADD COLUMN credit_score_calculated_at TIMESTAMP NULL,
ADD COLUMN credit_score_model_version VARCHAR(50) NULL,
ADD COLUMN risk_level VARCHAR(10) NULL,
ADD COLUMN confidence_score DECIMAL(5,4) NULL;

-- Index pour performance
CREATE INDEX idx_financing_requests_credit_score ON financing_requests(credit_score);
CREATE INDEX idx_financing_requests_risk_level ON financing_requests(risk_level);
```

### 2. **Analytics Service** - Standardiser Échelle Score

#### A. Ajouter Champ Credit Score Standardisé
```typescript
// Fichier: apps/analytics-service/src/modules/risk-analysis/entities/risk-profile.entity.ts

// AJOUTER ce champ après 'riskScore':
@ApiProperty({ 
  description: 'Score de crédit standardisé (1-100) - Compatible XGBoost',
  example: 75,
  minimum: 1,
  maximum: 100,
  nullable: true
})
@Column({ type: 'int', nullable: true })
creditScore?: number;

// AJOUTER méthode de conversion:
/**
 * Convertit le riskScore (0-10) vers creditScore (1-100)
 */
static convertRiskScoreToCreditScore(riskScore: number): number {
  // Conversion: 0-10 -> 1-100 (inversée car risk faible = credit élevé)
  // Risk 0-2 (VERY_LOW) -> Credit 81-100
  // Risk 2-4 (LOW) -> Credit 61-80  
  // Risk 4-6 (MEDIUM) -> Credit 41-60
  // Risk 6-8 (HIGH) -> Credit 21-40
  // Risk 8-10 (VERY_HIGH) -> Credit 1-20
  
  const invertedScore = 10 - riskScore; // Inverser l'échelle
  const creditScore = Math.round((invertedScore / 10) * 99) + 1; // Convertir vers 1-100
  return Math.max(1, Math.min(100, creditScore)); // Borner entre 1-100
}
```

### 3. **Customer Service** - Corriger Échelle Score

#### A. Standardiser l'Échelle 1-100
```typescript
// Fichier: apps/customer-service/src/modules/subscriptions/controllers/financial-institution.controller.ts

// MODIFIER la réponse pour être cohérente:
async calculateCreditScore(/* ... */): Promise<{
  creditScore: number;        // Garder 1-100 (déjà correct)
  scoreClass: string;
  probability: number;
  explanation: string[];
  tokensCost: number;
}> {
  return {
    creditScore: 720,         // ⚠️ ERREUR: 720 > 100!
    // CORRIGER vers:
    creditScore: 72,          // Score cohérent 1-100
    scoreClass: 'Good',
    // ... reste identique
  };
}
```

### 4. **Créer Interfaces Standardisées Partagées**

#### A. Interface StandardCreditScore
```typescript
// Fichier: packages/shared/src/interfaces/credit-score.interface.ts

export enum RiskLevel {
  LOW = 'LOW',        // Score 71-100
  MEDIUM = 'MEDIUM',  // Score 41-70
  HIGH = 'HIGH'       // Score 1-40
}

export enum CreditScoreClass {
  EXCELLENT = 'EXCELLENT',  // 91-100
  VERY_GOOD = 'VERY_GOOD',  // 81-90
  GOOD = 'GOOD',            // 71-80
  FAIR = 'FAIR',            // 51-70
  POOR = 'POOR',            // 31-50
  VERY_POOR = 'VERY_POOR'   // 1-30
}

export interface StandardCreditScore {
  score: number;                    // 1-100 (obligatoire)
  riskLevel: RiskLevel;            // Catégorie de risque
  scoreClass: CreditScoreClass;    // Classification détaillée
  calculatedAt: Date;              // Date calcul
  validUntil: Date;                // Date expiration (30 jours)
  modelVersion: string;            // "xgboost-v1.0"
  dataSource: string;              // "adha-ai-transactions"
  confidenceScore: number;         // 0-1 (confiance modèle)
}

export interface CreditScoreComponents {
  cashFlowQuality: number;         // 0-100
  businessStability: number;       // 0-100
  financialHealth: number;         // 0-100
  paymentBehavior: number;         // 0-100
  growthTrend: number;            // 0-100
}

export interface DetailedCreditScore extends StandardCreditScore {
  components: CreditScoreComponents;
  explanation: string[];           // Facteurs explicatifs
  recommendations: string[];       // Recommandations
}

// Utilitaires
export class CreditScoreUtils {
  static determineRiskLevel(score: number): RiskLevel {
    if (score >= 71) return RiskLevel.LOW;
    if (score >= 41) return RiskLevel.MEDIUM;
    return RiskLevel.HIGH;
  }
  
  static determineScoreClass(score: number): CreditScoreClass {
    if (score >= 91) return CreditScoreClass.EXCELLENT;
    if (score >= 81) return CreditScoreClass.VERY_GOOD;
    if (score >= 71) return CreditScoreClass.GOOD;
    if (score >= 51) return CreditScoreClass.FAIR;
    if (score >= 31) return CreditScoreClass.POOR;
    return CreditScoreClass.VERY_POOR;
  }
}
```

### 5. **Nouveaux Endpoints pour Intégration XGBoost**

#### A. Gestion Commerciale - Endpoints Credit Score
```typescript
// Fichier: apps/gestion_commerciale_service/src/modules/financing/controllers/financing.controller.ts

@Controller('financing')
class FinancingController {
  
  @Get(':id/credit-score')
  @ApiOperation({ summary: 'Récupérer le score crédit d\'une demande de financement' })
  async getCreditScore(@Param('id') financingId: string): Promise<StandardCreditScore> {
    // Appel vers Adha AI XGBoost service
    return await this.financingService.getCreditScore(financingId);
  }
  
  @Post(':id/calculate-credit-score')
  @ApiOperation({ summary: 'Calculer/recalculer le score crédit avec XGBoost' })
  async calculateCreditScore(@Param('id') financingId: string): Promise<DetailedCreditScore> {
    // Force le recalcul via Adha AI
    return await this.financingService.calculateCreditScore(financingId);
  }
  
  @Get(':id/credit-score-history')  
  @ApiOperation({ summary: 'Historique des scores crédit' })
  async getCreditScoreHistory(@Param('id') financingId: string): Promise<StandardCreditScore[]> {
    // Récupère l'historique depuis Portfolio Institution
    return await this.portfolioIntegrationService.getScoreHistory(financingId);
  }
}
```

## 📋 Ordre d'Implémentation Recommandé

### Phase 1: Standardisation (1-2 semaines)
1. ✅ Créer interfaces partagées (`packages/shared`)
2. ✅ Modifier entité `FinancingRecord` + migration DB
3. ✅ Modifier DTO `FinancingRequestResponseDto`
4. ✅ Corriger échelle `Customer Service` (720 -> 72)
5. ✅ Ajouter champ `creditScore` dans `Analytics Service`

### Phase 2: Endpoints API (1 semaine)
6. ✅ Créer endpoints credit score dans `Gestion Commerciale`
7. ✅ Tester intégration avec services existants

### Phase 3: XGBoost Adha AI (3-4 semaines)
8. ✅ Implémenter XGBoost dans Adha AI Service
9. ✅ Connecter tous les services vers Adha AI
10. ✅ Tests end-to-end complets

Cette standardisation garantit la cohérence avant l'implémentation XGBoost dans Adha AI ! 🎯