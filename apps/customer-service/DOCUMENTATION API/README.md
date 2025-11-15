# Documentation API Wanzo Land - Version 2.0

Cette documentation détaille l'API REST moderne de Wanzo Land, une plateforme complète de gestion d'entreprise, de finance et d'IA pour les PME et institutions financières en Afrique.

## 🚀 Architecture Moderne (Novembre 2025)

**Stack Technologique** :
- **Frontend** : React 18 + TypeScript + Vite
- **Authentication** : Auth0 (PKCE Flow)
- **State Management** : React Context + Hooks personnalisés
- **API Client** : Axios avec intercepteurs
- **Styling** : Tailwind CSS

**Base URL** : `http://localhost:8000/land/api/v1`  
**Authentification** : Auth0 Bearer Token  
**Pattern** : Services API modulaires avec hooks React

## 📋 Table des Matières

1. [**Configuration**](./01-configuration.md)
   - Stack technique moderne
   - Configuration Auth0 PKCE
   - Structure modulaire frontend
   - Variables d'environnement

2. [**Authentification**](./02-authentification.md)
   - Auth0 PKCE Flow
   - Gestion des tokens
   - Sécurité renforcée

3. [**Utilisateurs**](./03-utilisateurs.md)
   - Gestion des profils utilisateurs
   - API utilisateurs modernisée
   - Types et interfaces

4. [**Entreprises (PME)**](./04-company.md)
   - Formulaire d'identification étendu
   - Données patrimoine et performance
   - Spécificités startup/traditionnelle

5. [**Institutions Financières**](./05-institutions-financieres.md)
   - Module dédié aux institutions
   - Outils de prospection PME
   - Centrale de risque intégrée

6. [**Abonnements Modernes**](./06-abonnements.md)
   - Plans structurés SME/Financial
   - **Tokens intégrés aux plans**
   - Billing mensuel/annuel avec réductions

7. [**Gestion d'Erreurs**](./07-erreurs.md)
   - Codes d'erreur standardisés
   - Gestion centralisée des erreurs

8. [**Système de Tarification**](./08-pricing-system.md)
   - Configuration des plans modernes
   - Allocation de tokens par plan
   - Fonctionnalités granulaires

9. [**Chat Adha - Assistant IA**](./09-chat-adha.md)
   - Documentation complète du chat IA
   - API endpoints et structures de données
   - Système de résilience et mode dégradé

10. [**Guide Interface Utilisateur**](./09-ui-interfaces-guide.md)
    - Composants React modernes
    - Hooks personnalisés
    - Patterns d'interface

11. [**Endpoints Exacts**](./ENDPOINTS_EXACT.md)
    - Référence complète des endpoints
    - Examples de requêtes/réponses

## 🎯 Changements Majeurs v2.0

### ⚡ Nouvelles Fonctionnalités
- **🔐 Auth0 PKCE** : Authentification moderne et sécurisée
- **🏢 Entreprises Étendues** : Formulaire d'identification complet
- **🏦 Institutions Financières** : Module dédié avec outils spécialisés
- **🤖 Chat IA Adha** : Assistant intelligent avec mode dégradé
- **📱 Interface Modernisée** : UI/UX repensée avec Tailwind CSS

### 🔄 Architecture Modernisée
- **React 18** : Hooks modernes et performances optimisées
- **TypeScript Strict** : Type safety renforcée
- **Vite Build** : Build system rapide et moderne
- **Module API** : Services API modulaires et hooks dédiés

### 💰 Système d'Abonnements Refondu

#### ❌ SUPPRIMÉ : Achat de Tokens Indépendants
- Plus d'endpoints `/tokens/purchase`
- Plus de packages de tokens séparés
- Plus de `TokenPurchasePackage` interface

#### ✅ NOUVEAU : Tokens Intégrés aux Plans
```typescript
interface SubscriptionPlan {
  tokenAllocation: {
    monthlyTokens: number;      // Tokens inclus par mois
    rolloverLimit: number;      // Limite de report
    rolloverPeriods: number;    // Périodes de report autorisées
  };
}
```

### 📊 Types Modernisés

#### Nouveaux Types Principaux
```typescript
enum CustomerType {
  SME = 'sme',                    // PME
  FINANCIAL_INSTITUTION = 'financial'  // Institutions Financières
}

enum BillingPeriod {
  MONTHLY = 'monthly',
  ANNUAL = 'annual'
}

interface EnterpriseIdentificationForm {
  generalInfo: GeneralInfo;
  legalInfo: LegalInfo;
  patrimonyAndMeans: PatrimonyAndMeans;
  specificities: Specificities;
  performance: Performance;
}
```

## 🛠️ Endpoints API Modernes

### 👤 Authentification & Utilisateurs
```
GET    /users/profile              # Profil utilisateur
PUT    /users/profile              # Mise à jour profil
POST   /users/associations         # Associations utilisateur
```

### 🏢 Entreprises (PME)
```
GET    /companies                  # Liste entreprises
POST   /companies                  # Créer entreprise
GET    /companies/{id}            # Détails entreprise
PUT    /companies/{id}            # Mettre à jour
DELETE /companies/{id}            # Supprimer
```

### 🏦 Institutions Financières
```
GET    /financial-institutions     # Liste institutions
POST   /financial-institutions     # Créer institution
GET    /financial-institutions/{id} # Détails institution
PUT    /financial-institutions/{id} # Mettre à jour
```

### 📋 Catalogue des Plans
```
GET    /pricing/plans             # Plans disponibles (recommandé)
GET    /pricing/plans/:id         # Détails d'un plan
GET    /pricing/comparison        # Comparer les plans
```

### 💳 Gestion des Abonnements
```
GET    /subscription/plans        # Plans disponibles (alternatif)
POST   /subscription              # Créer abonnement
GET    /subscription/current      # Mon abonnement actuel
PUT    /subscriptions/{id}        # Modifier abonnement
DELETE /subscriptions/{id}        # Annuler abonnement
```

### 🪙 Tokens (Gestion Intégrée)
```
GET    /tokens/balance            # Solde tokens actuel
GET    /tokens/transactions       # Historique transactions
POST   /tokens/usage             # Enregistrer utilisation
```

### 🤖 Chat Adha (Assistant IA)
```
GET    /health                   # Vérification connexion IA
POST   /chat/message             # Envoi message avec contexte
GET    /chat/conversations/{id}  # Historique conversation
POST   /chat/conversations       # Sauvegarde conversation
DELETE /chat/conversations/{id}  # Suppression conversation
```

## 🔧 Configuration Technique

### Auth0 Configuration
```typescript
{
  domain: 'dev-your-domain.us.auth0.com',
  clientId: 'your-client-id',
  authorizationParams: {
    redirect_uri: window.location.origin,
    scope: 'openid profile email'
  },
  useRefreshTokens: true,
  cacheLocation: 'localstorage'
}
```

### Services API Modulaires
```typescript
// Services principaux
- api.ts                 # Configuration Axios
- userApi.ts            # Service utilisateurs
- companyApi.ts         # Service entreprises
- financialInstitutionApi.ts # Service institutions
- modernSubscription.ts  # Service abonnements moderne
- chatApiService.ts     # Service chat IA Adha

// Hooks personnalisés
- useUserApi.ts         # Hook API utilisateurs
- useCompanyApi.ts      # Hook API entreprises
- useModernSubscription.ts # Hook abonnements moderne
- useChat.ts            # Hook chat IA intégré
```

## 📁 Structure Projet Frontend

```
src/
├── components/          # Composants React modulaires
│   ├── auth/           # Authentification
│   ├── company/        # Gestion entreprises
│   ├── financial-institution/ # Institutions financières
│   ├── abonnement/     # Gestion abonnements
│   ├── chatbot/        # Chat IA Adha intégré
│   └── ui/             # Composants UI réutilisables
├── hooks/              # Hooks React personnalisés
├── services/           # Services API
├── types/              # Types TypeScript
├── config/             # Configuration
└── context/            # Contexts React
```

## 🚦 État d'Implémentation

### ✅ Complètement Implémenté
- **Auth0 PKCE Flow** : Authentification moderne
- **Entreprises Étendues** : Formulaire complet d'identification
- **Institutions Financières** : Module dédié
- **Plans d'Abonnement** : Structure moderne avec tokens intégrés
- **Chat IA Adha** : Assistant intelligent avec résilience
- **Interface Utilisateur** : Composants React modernes
- **API Services** : Services modulaires avec hooks

### 🔄 En Cours d'Optimisation
- **Performance** : Optimisations de cache et lazy loading
- **Tests** : Tests unitaires et d'intégration
- **Documentation** : Finalisation de la documentation technique

### 📋 Roadmap
- **Mobile App** : Application mobile native (Q1 2026)
- **API GraphQL** : Migration vers GraphQL (Q2 2026)
- **Advanced AI** : Fonctionnalités IA avancées
- **Multi-tenant** : Support multi-tenant

## 🔒 Sécurité

### Authentification
- **Auth0 PKCE** : Flow sécurisé sans secret client
- **Token Rotation** : Rotation automatique des tokens
- **Scopes Granulaires** : Permissions fines par fonctionnalité

### API Security
- **Rate Limiting** : 1000 req/h par utilisateur
- **Input Validation** : Validation stricte côté client/serveur
- **CORS** : Configuration stricte des origines autorisées

## 📞 Support et Contact

Pour toute question technique ou demande de support :
- **Documentation** : Consultez cette documentation complète
- **Issues** : Créez une issue sur le repository Git
- **Contact** : Équipe technique Wanzo Land

---

**Version** : 2.0.0  
**Dernière mise à jour** : Novembre 2025  
**Compatibilité** : Breaking changes par rapport à v1.x - Consultez le [CHANGELOG](../CHANGELOG.md)
