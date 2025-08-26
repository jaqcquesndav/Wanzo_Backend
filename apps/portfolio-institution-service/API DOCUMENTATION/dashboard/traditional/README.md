# Dashboard Traditionnel - API OHADA

Documentation complète de l'API Dashboard pour les portefeuilles traditionnels conformes aux standards OHADA/BCEAO.

## 🏗️ Architecture

Le dashboard traditionnel est basé sur une architecture moderne en couches :

```
📱 Pages Layer (Dashboard.tsx)
     ↓
🎨 UI Components (ProfessionalCreditDashboard.tsx)
     ↓
🔗 Hooks Layer (useOHADAMetrics, useDashboardCustomization)
     ↓
📝 Types Layer (ohada.ts, customization.ts)
     ↓
🔌 Service API Layer (ohadaMetrics.api.ts, preferences.api.ts)
```

## 🎯 Conformité OHADA/BCEAO

Le système respecte les standards réglementaires :

- **NPL Ratio** : Seuil BCEAO < 5%
- **Taux de Provisionnement** : Norme OHADA 3-5%
- **Balance Âgée** : Conforme aux exigences OHADA
- **Efficacité de Recouvrement** : Standard > 90%

## 📊 Widgets Configurables

Le dashboard offre 12 widgets personnalisables :

### KPI Widgets
- `overview_metrics` : Métriques globales
- `portfolio_performance` : Performance portefeuille
- `risk_indicators` : Indicateurs de risque

### Analysis Widgets
- `balance_age_analysis` : Analyse balance âgée
- `sector_distribution` : Répartition sectorielle
- `geographic_distribution` : Distribution géographique
- `performance_trends` : Tendances performance

### Compliance Widgets
- `regulatory_compliance` : Conformité réglementaire
- `risk_assessment` : Évaluation des risques

### Activity Widgets
- `recent_activities` : Activités récentes
- `portfolio_health` : Santé du portefeuille
- `client_distribution` : Distribution clients

## 🔧 Personnalisation

Le système de customisation permet :

- **Visibilité des widgets** : Afficher/masquer chaque widget
- **Positions des widgets** : Réorganisation drag & drop
- **Interface flottante** : Sélecteur de widgets draggable
- **Persistance** : Sauvegarde dans localStorage

## 📁 Structure de Documentation

- [`endpoints.md`](./endpoints.md) - Documentation des endpoints API
- [`types.md`](./types.md) - Types TypeScript et interfaces
- [`hooks.md`](./hooks.md) - Hooks React personnalisés
- [`services.md`](./services.md) - Services API et logique métier
- [`components.md`](./components.md) - Composants UI et widgets
- [`examples.md`](./examples.md) - Exemples d'usage et intégration

## 🚀 Démarrage Rapide

```typescript
// Import du composant principal
import { ProfessionalCreditDashboard } from './components/dashboard/ProfessionalCreditDashboard';

// Usage dans une page
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ProfessionalCreditDashboard />
    </div>
  );
}
```

## 📈 Métriques Clés

Le dashboard calcule automatiquement :

- **Total Amount** : Montant total des portefeuilles
- **Active Contracts** : Nombre de contrats actifs
- **NPL Ratio** : Ratio des créances douteuses
- **Collection Efficiency** : Efficacité de recouvrement
- **Balance AGE** : Répartition par âge de créance
- **ROA** : Return on Assets
- **Portfolio Yield** : Rendement du portefeuille

## 🔒 Sécurité et Conformité

- Validation des données selon standards OHADA
- Calculs conformes aux normes BCEAO
- Fallbacks robustes en cas d'erreur
- Persistence sécurisée des préférences
