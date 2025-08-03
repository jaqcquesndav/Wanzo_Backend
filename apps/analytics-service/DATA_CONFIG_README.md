# Configuration Centralisée des Données Financières RDC

## Vue d'ensemble

Ce système centralise toutes les données de référence utilisées dans le microservice d'analyse des risques financiers de Wanzo. Il remplace les données éparpillées qui étaient auparavant dispersées dans différents services.

## Architecture

### 1. Structure des Fichiers

```
apps/analytics-service/src/
├── config/
│   ├── data-types.ts                    # Interfaces TypeScript
│   └── drc-financial-data.config.ts     # Données centralisées
├── services/
│   └── financial-data-config.service.ts # Service d'accès
└── modules/financial-data-config/
    ├── financial-data-config.module.ts
    └── financial-data-config.controller.ts
```

### 2. Composants Principaux

#### A. Types de Données (`data-types.ts`)
- `Province` : Provinces RDC avec indicateurs économiques
- `EconomicSector` : Secteurs économiques avec métriques de risque
- `FinancialInstitution` : Institutions financières et leurs caractéristiques
- `RiskThreshold` : Seuils et niveaux de risque
- `CurrencyConfig` : Configuration des devises et taux de change

#### B. Configuration Centralisée (`drc-financial-data.config.ts`)
- **DRC_PROVINCES** : 26 provinces avec données complètes
- **ECONOMIC_SECTORS** : 14 secteurs économiques avec métriques
- **FINANCIAL_INSTITUTIONS** : 10 institutions principales
- **RISK_THRESHOLDS** : 4 niveaux de risque configurés
- **CURRENCY_CONFIG** : Devises supportées (CDF, USD, EUR)
- **ANALYTICS_CONSTANTS** : Constantes pour analyses et détection fraude

#### C. Service d'Accès (`financial-data-config.service.ts`)
Service centralisé avec méthodes utilitaires pour :
- Filtrage et recherche des données
- Conversions de devises
- Calculs de risque
- Validation d'intégrité

## Données Disponibles

### Provinces (26 au total)
Chaque province contient :
- **Informations générales** : ID, nom, code, population
- **Géolocalisation** : Coordonnées, superficie
- **Indicateurs économiques** : PIB, inclusion financière, densité d'entreprises
- **Score de risque** : Évaluation quantitative (0-10)

Exemples de provinces :
- Kinshasa (KIN) - Capitale économique
- Haut-Katanga (HKA) - Centre minier
- Nord-Kivu (NKV) - Zone de conflit

### Secteurs Économiques (14 au total)
Chaque secteur inclut :
- **Classification** : Code secteur, nom, description
- **Métriques de risque** : Niveau (LOW/MEDIUM/HIGH/CRITICAL), taux de défaut
- **Données économiques** : Croissance, volatilité, nombre de PME
- **Revenus moyens** : Chiffre d'affaires moyen des entreprises

Exemples de secteurs :
- Exploitation minière (MIN) - Risque HIGH, défaut 12.5%
- Agriculture (AGR) - Risque MEDIUM, défaut 8.3%
- Télécommunications (TEL) - Risque LOW, défaut 4.1%

### Institutions Financières (10 au total)
Chaque institution comprend :
- **Identification** : Nom, licence, type d'institution
- **Métriques financières** : Actifs totaux, ratio de capital
- **Évaluation risque** : Score de risque, importance systémique
- **Informations réglementaires** : Statut, supervision

Exemples d'institutions :
- Banque Centrale du Congo (BCC) - Banque centrale
- Rawbank - Banque commerciale principale
- FINCA DRC - Institution de microfinance

## Utilisation

### 1. Injection du Service

```typescript
import { FinancialDataConfigService } from '../../services/financial-data-config.service';

@Injectable()
export class MonService {
  constructor(
    private readonly financialDataConfig: FinancialDataConfigService
  ) {}
}
```

### 2. Accès aux Données

```typescript
// Toutes les provinces
const provinces = this.financialDataConfig.getAllProvinces();

// Province spécifique
const kinshasa = this.financialDataConfig.getProvinceByCode('KIN');

// Provinces à haut risque
const highRiskProvinces = this.financialDataConfig.getProvincesByRiskLevel(7, 10);

// Secteurs par niveau de risque
const criticalSectors = this.financialDataConfig.getSectorsByRiskLevel('CRITICAL');

// Institutions systémiques
const systemicInstitutions = this.financialDataConfig.getSystemicallyImportantInstitutions();
```

### 3. Conversions de Devises

```typescript
// Conversion CDF vers USD
const usdAmount = this.financialDataConfig.convertCDFtoUSD(2500000);

// Conversion générale
const converted = this.financialDataConfig.convertCurrency(1000, 'USD', 'CDF');
```

### 4. Recherche et Filtrage

```typescript
// Recherche globale
const results = this.financialDataConfig.globalSearch('mining');

// Statistiques système
const stats = this.financialDataConfig.getSystemStatistics();

// Validation intégrité
const validation = this.financialDataConfig.validateDataIntegrity();
```

## API REST

Le contrôleur expose les données via endpoints REST :

### Endpoints Principaux

```
GET /api/v1/financial-data-config/provinces
GET /api/v1/financial-data-config/provinces/:id
GET /api/v1/financial-data-config/provinces/code/:code
GET /api/v1/financial-data-config/sectors
GET /api/v1/financial-data-config/sectors/risk/:level
GET /api/v1/financial-data-config/institutions
GET /api/v1/financial-data-config/institutions/type/:type
GET /api/v1/financial-data-config/convert?amount=X&from=CDF&to=USD
GET /api/v1/financial-data-config/search?q=terme
GET /api/v1/financial-data-config/statistics
```

### Exemples d'Usage API

```bash
# Toutes les provinces
curl "http://localhost:3000/api/v1/financial-data-config/provinces"

# Province Kinshasa
curl "http://localhost:3000/api/v1/financial-data-config/provinces/code/KIN"

# Secteurs à haut risque
curl "http://localhost:3000/api/v1/financial-data-config/sectors/risk/HIGH"

# Conversion 1000 USD vers CDF
curl "http://localhost:3000/api/v1/financial-data-config/convert?amount=1000&from=USD&to=CDF"

# Recherche "mining"
curl "http://localhost:3000/api/v1/financial-data-config/search?q=mining"
```

## Migration depuis l'Ancien Système

### Avant (Données Éparpillées)

```typescript
// Dans financial-risk-graph.service.ts
const provinces = [
  { id: 'geo-kinshasa', name: 'Kinshasa', ... },
  { id: 'geo-katanga', name: 'Katanga', ... },
  // ...données hardcodées
];

const sectors = [
  { id: 'sec-mining', name: 'Exploitation minière', ... },
  // ...autres données hardcodées
];
```

### Après (Données Centralisées)

```typescript
// Utilisation du service centralisé
const provinces = this.financialDataConfig.getAllProvinces();
const sectors = this.financialDataConfig.getAllSectors();
const institutions = this.financialDataConfig.getAllInstitutions();
```

## Avantages du Système Centralisé

### 1. **Maintenance Simplifiée**
- Une seule source de vérité pour toutes les données
- Modifications centralisées sans impact sur les services
- Cohérence garantie entre modules

### 2. **Type Safety**
- Interfaces TypeScript strictes
- Validation à la compilation
- Autocomplétion et documentation

### 3. **Performance**
- Données en mémoire (pas de base de données)
- Accès instantané via injection de dépendance
- Cache automatique par le système NestJS

### 4. **Flexibilité**
- API REST pour accès externe
- Méthodes utilitaires prêtes à l'emploi
- Recherche et filtrage avancés

### 5. **Validation et Qualité**
- Contrôles d'intégrité automatiques
- Détection des doublons et incohérences
- Rapports de validation détaillés

## Configuration et Personnalisation

### Ajout de Nouvelles Provinces

```typescript
// Dans drc-financial-data.config.ts
export const DRC_PROVINCES: Province[] = [
  // ...provinces existantes
  {
    id: 'nouvelle-province',
    name: 'Nouvelle Province',
    code: 'NPR',
    // ...autres propriétés
  }
];
```

### Modification des Seuils de Risque

```typescript
// Dans drc-financial-data.config.ts
export const RISK_THRESHOLDS: RiskThreshold[] = [
  {
    level: 'CRITICAL',
    minScore: 8.0,  // Modifier ici
    maxScore: 10.0,
    // ...
  }
];
```

### Ajout de Nouvelles Devises

```typescript
// Dans drc-financial-data.config.ts
export const CURRENCY_CONFIG: CurrencyConfig[] = [
  // ...devises existantes
  {
    code: 'ZAR',
    name: 'Rand Sud-Africain',
    symbol: 'R',
    exchangeRate: 18.5  // Taux par rapport à USD
  }
];
```

## Tests et Validation

### Test d'Intégrité

```typescript
// Validation automatique
const validation = financialDataConfigService.validateDataIntegrity();
console.log('Erreurs:', validation.errors);
console.log('Avertissements:', validation.warnings);
```

### Tests Unitaires

```typescript
describe('FinancialDataConfigService', () => {
  it('should return all provinces', () => {
    const provinces = service.getAllProvinces();
    expect(provinces).toHaveLength(26);
  });

  it('should find province by code', () => {
    const kinshasa = service.getProvinceByCode('KIN');
    expect(kinshasa?.name).toBe('Kinshasa');
  });
});
```

## Monitoring et Métriques

Le système fournit des statistiques pour monitoring :

```typescript
const stats = financialDataConfigService.getSystemStatistics();
/*
{
  geography: {
    totalProvinces: 26,
    totalPopulation: 95000000,
    avgRiskScore: 6.2
  },
  economy: {
    totalSectors: 14,
    totalSMEs: 12000,
    highRiskSectors: 4
  },
  financial: {
    totalInstitutions: 10,
    totalAssets: 15000000000,
    systemicallyImportant: 3
  }
}
*/
```

## Support et Maintenance

### Logging
Le service utilise le système de logging NestJS pour tracer les opérations.

### Erreurs Communes
- **Province non trouvée** : Vérifier les codes de provinces
- **Conversion impossible** : S'assurer que les devises sont supportées
- **Données manquantes** : Exécuter la validation d'intégrité

### Contact
Pour questions techniques ou demandes d'évolution, contacter l'équipe de développement Wanzo.
