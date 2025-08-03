# Portfolio Institution Service - Test Documentation

Ce document décrit la suite de tests complète pour le microservice `portfolio-institution-service`.

## 📋 Vue d'ensemble

La suite de tests comprend trois niveaux de tests pour assurer la qualité et la fiabilité du code :

- **Tests unitaires** : Validation des services et contrôleurs individuels
- **Tests d'intégration** : Validation des endpoints API et des interactions avec la base de données
- **Tests End-to-End** : Validation des workflows complets et des scénarios métier

## 🏗️ Structure des tests

```
test/
├── unit/                          # Tests unitaires
│   ├── portfolios/
│   │   ├── portfolio.service.spec.ts
│   │   ├── credit-request.service.spec.ts
│   │   └── portfolio.controller.spec.ts
│   └── institution/
│       └── institution.service.spec.ts
├── integration/                   # Tests d'intégration
│   ├── portfolios/
│   │   ├── portfolio.integration.spec.ts
│   │   └── credit-requests.integration.spec.ts
│   ├── institution/
│   │   └── institution.integration.spec.ts
│   └── e2e/
│       └── workflow.e2e.spec.ts   # Tests end-to-end
├── setup.ts                      # Configuration globale des tests
└── jest.config.test.js           # Configuration Jest
```

## 🚀 Exécution des tests

### Prérequis

```bash
# Installer les dépendances
npm install

# S'assurer que les entités et DTOs sont correctement configurés
npm run build
```

### Commandes de test

```bash
# Exécuter tous les tests
npm run test

# Tests unitaires uniquement
npm run test:unit

# Tests d'intégration uniquement
npm run test:integration

# Tests end-to-end uniquement
npm run test:e2e

# Tous les tests avec couverture
npm run test:cov

# Tests en mode watch (développement)
npm run test:watch

# Tests pour CI/CD
npm run test:ci
```

### Scripts automatisés

```bash
# Linux/Mac
./run-tests.sh

# Windows PowerShell
.\run-tests.ps1
```

## 📊 Couverture de tests

Les seuils de couverture configurés :

- **Branches** : 70%
- **Fonctions** : 70%
- **Lignes** : 70%
- **Statements** : 70%

Le rapport de couverture est généré dans `coverage/lcov-report/index.html`.

## 🧪 Tests unitaires

### Services testés

#### PortfolioService
- ✅ Création de portfolios traditionnels
- ✅ Récupération de portfolios avec filtres
- ✅ Mise à jour de portfolios
- ✅ Fermeture de portfolios
- ✅ Gestion des erreurs et exceptions

#### CreditRequestService
- ✅ Création de demandes de crédit
- ✅ Approbation/rejet de demandes
- ✅ Transitions d'état
- ✅ Validation des données métier

#### InstitutionService
- ✅ Gestion des institutions financières
- ✅ Mise à jour du statut réglementaire
- ✅ Gestion des documents
- ✅ Validation des contraintes métier

### Contrôleurs testés

#### PortfolioController
- ✅ Endpoints CRUD pour portfolios
- ✅ Validation des DTOs
- ✅ Gestion des réponses HTTP
- ✅ Authentification et autorisation

## 🔗 Tests d'intégration

### Modules testés

#### Module Portfolios
- ✅ POST `/portfolios/traditional` - Création de portfolio
- ✅ GET `/portfolios/traditional` - Liste des portfolios
- ✅ GET `/portfolios/traditional/:id` - Détail d'un portfolio
- ✅ PUT `/portfolios/traditional/:id` - Mise à jour
- ✅ DELETE `/portfolios/traditional/:id` - Suppression

#### Module Credit Requests
- ✅ POST `/portfolios/traditional/credit-requests` - Création
- ✅ GET `/portfolios/traditional/credit-requests` - Liste avec filtres
- ✅ PUT `/portfolios/traditional/credit-requests/:id` - Mise à jour
- ✅ POST `/portfolios/traditional/credit-requests/:id/approve` - Approbation
- ✅ POST `/portfolios/traditional/credit-requests/:id/reject` - Rejet
- ✅ DELETE `/portfolios/traditional/credit-requests/:id` - Suppression

#### Module Institution
- ✅ POST `/institution` - Création d'institution
- ✅ GET `/institution` - Liste avec filtres et pagination
- ✅ GET `/institution/:id` - Détail d'une institution
- ✅ PUT `/institution/:id` - Mise à jour
- ✅ PUT `/institution/:id/regulatory-status` - Changement de statut
- ✅ POST `/institution/:id/documents` - Upload de documents
- ✅ DELETE `/institution/:id` - Suppression

## 🌐 Tests End-to-End

### Workflows testés

#### Workflow complet de gestion de portfolio
1. Création d'une institution financière
2. Création d'un portfolio lié à l'institution
3. Création de demandes de crédit pour le portfolio
4. Approbation d'une demande de crédit
5. Mise à jour des métriques du portfolio
6. Vérification de la cohérence des données

#### Workflow de gestion réglementaire
1. Création d'institution avec statut actif
2. Création de portfolios liés
3. Suspension de l'institution
4. Vérification de l'impact sur les portfolios
5. Réactivation de l'institution

#### Workflow d'approbation de crédit complexe
1. Création de multiples demandes de crédit
2. Approbation, rejet et maintien en attente
3. Vérification des statuts finaux
4. Génération de statistiques

## ⚙️ Configuration

### Base de données de test

Les tests utilisent SQLite en mémoire pour :
- ✅ Isolation complète entre les tests
- ✅ Performance optimale
- ✅ Pas de dépendances externes

### Mocking et stubs

- ✅ Services externes mockés
- ✅ Authentification simulée
- ✅ Repositories TypeORM mockés pour tests unitaires

### Variables d'environnement

```env
NODE_ENV=test
JWT_SECRET=test-jwt-secret
DATABASE_URL=sqlite::memory:
```

## 🐛 Debugging des tests

### Logs de debug

```bash
# Activer les logs détaillés
DEBUG=* npm run test

# Tests avec inspection Node.js
npm run test:debug
```

### Problèmes courants

1. **Erreurs de timeout** : Augmenter `testTimeout` dans jest.config.js
2. **Erreurs de base de données** : Vérifier que les entités sont correctement importées
3. **Erreurs d'authentification** : Vérifier les mocks dans setup.ts

## 📝 Bonnes pratiques

### Écriture de tests

1. **Nommage clair** : Description explicite de ce qui est testé
2. **Arrange-Act-Assert** : Structure claire des tests
3. **Isolation** : Chaque test doit être indépendant
4. **Données de test** : Utiliser des factories ou des fixtures

### Maintenance

1. **Mise à jour régulière** : Adapter aux changements d'API
2. **Refactoring** : Maintenir la lisibilité des tests
3. **Documentation** : Commenter les cas complexes

## 🎯 Métriques et monitoring

### Indicateurs de qualité

- **Temps d'exécution** : < 30 secondes pour la suite complète
- **Taux de réussite** : 100% en continu
- **Couverture** : > 70% sur tous les indicateurs

### Integration CI/CD

Les tests sont configurés pour s'exécuter automatiquement :
- ✅ À chaque push sur une branche
- ✅ Avant chaque merge request
- ✅ Lors des déploiements

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/docs)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [TypeORM Testing](https://typeorm.io/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)

---

*Dernière mise à jour : Août 2025*
