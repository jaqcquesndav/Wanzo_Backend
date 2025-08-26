# Types TypeScript - Dashboard Traditionnel OHADA

Types TypeScript complets pour le dashboard traditionnel conforme aux standards OHADA/BCEAO.

## 📊 Types OHADA Core

### OHADAMetrics

Interface principale pour les métriques OHADA d'un portefeuille.

```typescript
interface OHADAMetrics {
  id: string;
  name: string;
  sector: string;
  
  // Métriques financières de base
  totalAmount: number;
  activeContracts: number;
  avgLoanSize: number;
  
  // Ratios OHADA critiques
  nplRatio: number; // NPL ratio (%)
  provisionRate: number; // Taux de provisionnement (%)
  collectionEfficiency: number; // Efficacité de recouvrement (%)
  
  // Balance âgée conforme OHADA
  balanceAGE: BalanceAGE;
  
  // Ratios de performance
  roa: number; // Return on Assets (%)
  portfolioYield: number; // Rendement du portefeuille (%)
  riskLevel: 'Faible' | 'Moyen' | 'Élevé';
  growthRate: number; // Taux de croissance (%)
  
  // Données temporelles
  monthlyPerformance: number[];
  lastActivity: string;
  
  // Conformité réglementaire
  regulatoryCompliance?: RegulatoryCompliance;
}
```

### BalanceAGE

Structure de balance âgée selon les normes OHADA.

```typescript
interface BalanceAGE {
  current: number; // 0-30 jours (%)
  days30: number; // 31-60 jours (%)
  days60: number; // 61-90 jours (%)
  days90Plus: number; // 90+ jours (%)
}
```

### RegulatoryCompliance

Conformité réglementaire OHADA/BCEAO.

```typescript
interface RegulatoryCompliance {
  bceaoCompliant: boolean; // Conformité BCEAO (NPL < 5%)
  ohadaProvisionCompliant: boolean; // Conformité OHADA provisions
  riskRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC';
}
```

### OHADAMetricsResponse

Réponse API pour les métriques OHADA.

```typescript
interface OHADAMetricsResponse {
  success: boolean;
  data: OHADAMetrics[];
  metadata: {
    totalPortfolios: number;
    calculationDate: string;
    regulatoryFramework: 'OHADA' | 'BCEAO';
    complianceStatus: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
  };
  benchmarks: {
    avgNplRatio: number; // Seuil BCEAO: 5%
    avgProvisionRate: number; // Norme OHADA: 3-5%
    avgROA: number; // Marché CEMAC: 3.2%
    avgYield: number; // Marché: 14.5%
    collectionEfficiency: number; // Standard: 90%
  };
}
```

## 🎛️ Types Customisation Dashboard

### WidgetType

Énumération des types de widgets disponibles.

```typescript
enum WidgetType {
  // KPI Widgets
  OVERVIEW_METRICS = 'overview_metrics',
  PORTFOLIO_PERFORMANCE = 'portfolio_performance',
  RISK_INDICATORS = 'risk_indicators',
  
  // Analysis Widgets
  BALANCE_AGE_ANALYSIS = 'balance_age_analysis',
  SECTOR_DISTRIBUTION = 'sector_distribution',
  GEOGRAPHIC_DISTRIBUTION = 'geographic_distribution',
  PERFORMANCE_TRENDS = 'performance_trends',
  
  // Compliance Widgets
  REGULATORY_COMPLIANCE = 'regulatory_compliance',
  RISK_ASSESSMENT = 'risk_assessment',
  
  // Activity Widgets
  RECENT_ACTIVITIES = 'recent_activities',
  PORTFOLIO_HEALTH = 'portfolio_health',
  CLIENT_DISTRIBUTION = 'client_distribution'
}
```

### WidgetCategory

Catégories de widgets pour l'organisation.

```typescript
enum WidgetCategory {
  KPI = 'KPI',
  ANALYSIS = 'ANALYSIS',
  COMPLIANCE = 'COMPLIANCE',
  ACTIVITY = 'ACTIVITY'
}
```

### WidgetConfig

Configuration d'un widget individuel.

```typescript
interface WidgetConfig {
  id: WidgetType;
  title: string;
  description: string;
  category: WidgetCategory;
  defaultVisible: boolean;
  position: number;
  config?: Record<string, any>;
}
```

### DashboardPreferences

Préférences utilisateur pour le dashboard.

```typescript
interface DashboardPreferences {
  userId: string;
  widgets: Record<WidgetType, {
    visible: boolean;
    position: number;
    config?: Record<string, any>;
  }>;
  selectorPosition?: {
    x: number;
    y: number;
    minimized: boolean;
  };
  lastUpdated: string;
}
```

### CustomizationContextType

Type pour le contexte de customisation.

```typescript
interface CustomizationContextType {
  preferences: DashboardPreferences | null;
  availableWidgets: WidgetConfig[];
  updateWidgetVisibility: (widgetId: WidgetType, visible: boolean) => Promise<void>;
  updateWidgetPosition: (widgetId: WidgetType, position: number) => Promise<void>;
  resetToDefault: () => Promise<void>;
  loadPreferences: (userId: string) => Promise<void>;
  savePreferences: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}
```

## 🔧 Types Utilitaires

### PortfolioSelection

Interface pour la sélection de portefeuille.

```typescript
interface PortfolioSelection {
  mode: 'global' | 'individual';
  selectedPortfolioId?: string;
  label: string;
}
```

### PeriodFilter

Interface pour les filtres de période.

```typescript
interface PeriodFilter {
  type: 'custom' | 'month' | 'quarter' | 'semester' | 'year';
  startDate?: string;
  endDate?: string;
  label: string;
}
```

### TraditionalPortfolio

Interface pour un portefeuille traditionnel.

```typescript
interface TraditionalPortfolio {
  id: string;
  name: string;
  type: 'traditional';
  target_sectors?: string[];
  metrics?: {
    total_credits: number;
    nb_credits: number;
    avg_credit: number;
  };
  created_at: string;
  updated_at: string;
}
```

## 📈 Types Activités

### ActivityItem

Interface pour les activités récentes du dashboard.

```typescript
interface ActivityItem {
  id: string;
  type: 'demande' | 'contrat' | 'virement' | 'remboursement' | 'garantie' | 'validation';
  description: string;
  user: string;
  portfolio: string;
  contractId?: string;
  amount?: number;
  status: 'en_cours' | 'termine' | 'rejete' | 'en_attente';
  timestamp: string;
}
```

### ActivityStatus

États possibles pour les activités.

```typescript
type ActivityStatus = 'en_cours' | 'termine' | 'rejete' | 'en_attente';
```

### ActivityType

Types d'activités disponibles.

```typescript
type ActivityType = 'demande' | 'contrat' | 'virement' | 'remboursement' | 'garantie' | 'validation';
```

## 🎨 Types UI

### SelectorPosition

Position du sélecteur de widgets flottant.

```typescript
interface SelectorPosition {
  x: number;
  y: number;
  minimized: boolean;
}
```

### WidgetProps

Props communes aux composants de widgets.

```typescript
interface WidgetProps {
  data?: any;
  loading?: boolean;
  error?: string | null;
  className?: string;
  onRefresh?: () => void;
}
```

## 🔄 Types Hooks

### UseOHADAMetricsReturn

Type de retour du hook useOHADAMetrics.

```typescript
interface UseOHADAMetricsReturn {
  // Données
  metrics: OHADAMetrics[];
  globalMetrics: OHADAMetrics | null;
  
  // États
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  
  // Actions
  loadMetrics: () => Promise<void>;
  refreshMetrics: () => void;
  getPortfolioMetrics: (portfolioId: string) => OHADAMetrics | null;
  getComplianceSummary: () => ComplianceSummary;
}
```

### ComplianceSummary

Résumé de conformité réglementaire.

```typescript
interface ComplianceSummary {
  status: 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';
  riskLevel: 'Faible' | 'Moyen' | 'Élevé';
  totalPortfolios: number;
  nonCompliantCount: number;
  complianceRate: string;
}
```

### UseDashboardCustomizationReturn

Type de retour du hook useDashboardCustomization.

```typescript
type UseDashboardCustomizationReturn = CustomizationContextType;
```

## 🔐 Types Authentification

### AuthUser

Utilisateur authentifié pour le dashboard.

```typescript
interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  permissions: string[];
  institution?: string;
}
```

## 📊 Types Configuration par Défaut

### DefaultWidgetConfig

Configuration par défaut des widgets.

```typescript
const DEFAULT_WIDGETS: WidgetConfig[] = [
  {
    id: WidgetType.OVERVIEW_METRICS,
    title: 'Métriques Globales',
    description: 'Vue d\'ensemble des métriques OHADA',
    category: WidgetCategory.KPI,
    defaultVisible: true,
    position: 0
  },
  {
    id: WidgetType.PORTFOLIO_PERFORMANCE,
    title: 'Performance Portefeuille',
    description: 'Analyse de performance des portefeuilles',
    category: WidgetCategory.KPI,
    defaultVisible: true,
    position: 1
  },
  {
    id: WidgetType.RISK_INDICATORS,
    title: 'Indicateurs de Risque',
    description: 'Métriques de risque et NPL',
    category: WidgetCategory.KPI,
    defaultVisible: true,
    position: 2
  },
  {
    id: WidgetType.BALANCE_AGE_ANALYSIS,
    title: 'Analyse Balance Âgée',
    description: 'Répartition par âge des créances',
    category: WidgetCategory.ANALYSIS,
    defaultVisible: true,
    position: 3
  },
  {
    id: WidgetType.SECTOR_DISTRIBUTION,
    title: 'Répartition Sectorielle',
    description: 'Distribution des portefeuilles par secteur',
    category: WidgetCategory.ANALYSIS,
    defaultVisible: true,
    position: 4
  },
  {
    id: WidgetType.GEOGRAPHIC_DISTRIBUTION,
    title: 'Distribution Géographique',
    description: 'Répartition géographique des portefeuilles',
    category: WidgetCategory.ANALYSIS,
    defaultVisible: false,
    position: 5
  },
  {
    id: WidgetType.PERFORMANCE_TRENDS,
    title: 'Tendances Performance',
    description: 'Évolution temporelle des performances',
    category: WidgetCategory.ANALYSIS,
    defaultVisible: true,
    position: 6
  },
  {
    id: WidgetType.REGULATORY_COMPLIANCE,
    title: 'Conformité Réglementaire',
    description: 'Statut de conformité OHADA/BCEAO',
    category: WidgetCategory.COMPLIANCE,
    defaultVisible: true,
    position: 7
  },
  {
    id: WidgetType.RISK_ASSESSMENT,
    title: 'Évaluation des Risques',
    description: 'Analyse détaillée des risques',
    category: WidgetCategory.COMPLIANCE,
    defaultVisible: false,
    position: 8
  },
  {
    id: WidgetType.RECENT_ACTIVITIES,
    title: 'Activités Récentes',
    description: 'Historique des dernières activités',
    category: WidgetCategory.ACTIVITY,
    defaultVisible: true,
    position: 9
  },
  {
    id: WidgetType.PORTFOLIO_HEALTH,
    title: 'Santé des Portefeuilles',
    description: 'Indicateurs de santé globale',
    category: WidgetCategory.ACTIVITY,
    defaultVisible: false,
    position: 10
  },
  {
    id: WidgetType.CLIENT_DISTRIBUTION,
    title: 'Distribution Clients',
    description: 'Répartition et analyse clientèle',
    category: WidgetCategory.ACTIVITY,
    defaultVisible: false,
    position: 11
  }
];
```

## 🎯 Types d'Usage

Ces types sont utilisés dans :

- **Composants UI** : `ProfessionalCreditDashboard`, `WidgetSelector`, etc.
- **Hooks** : `useOHADAMetrics`, `useDashboardCustomization`
- **Services API** : `ohadaMetrics.api.ts`, `preferences.api.ts`
- **Pages** : `Dashboard.tsx` et composants dérivés
