# 📊 DOCUMENTATION MODULE PROSPECTION
## Portfolio Institution Service

### 🎯 **OBJECTIF DU MODULE**

Le module de prospection fournit un **accès read-only** aux profils d'entreprises synchronisées depuis le service accounting, avec leurs données financières et scores de crédit pour l'analyse de portefeuille.

⚠️ **IMPORTANT** : Ce module NE PERMET PAS :
- ❌ Création locale d'entreprises
- ❌ Gestion d'opportunités commerciales  
- ❌ Modification des données entreprises
- ❌ Suppression d'entreprises

### 🔄 **FONCTIONNALITÉS CONFORMES**

#### 1. **Consultation Read-Only**
- Lecture des profils d'entreprises synchronisées
- Filtrage et recherche par secteur, taille, statut
- Pagination des résultats
- Accès aux métriques financières et ESG

#### 2. **Synchronisation Accounting Service**
- Sync automatique des PME autorisées au partage
- Sync ponctuelle d'une PME spécifique
- Vérification des autorisations de partage
- Mise à jour des données financières

#### 3. **Scores de Crédit**
- Consommation des scores depuis le service dédié
- Intégration des ratings financiers
- Métriques ESG associées

### 🏗️ **ARCHITECTURE TECHNIQUE**

#### **Contrôleurs Actifs**
- `CompaniesController` - Consultation et synchronisation
- `SMEIntegrationController` - Intégration accounting service

#### **Services**
- `CompanyService` - Logique consultation et sync
- `ProspectionCreditScoreConsumerService` - Scores de crédit

#### **Entités**
- `Company` - Profil entreprise avec métriques

#### **DTOs**
- `CompanyFiltersDto` - Filtres de recherche

### 📋 **ENDPOINTS API**

#### **Base URL** : `/portfolio/api/v1/companies`

| Méthode | Endpoint | Description | Statut |
|---------|----------|-------------|---------|
| `GET` | `/` | Liste entreprises avec filtres | ✅ Actif |
| `GET` | `/:id` | Détails d'une entreprise | ✅ Actif |
| `POST` | `/sync-authorized-smes` | Sync toutes PME autorisées | ✅ Actif |
| `POST` | `/sync-sme/:smeId` | Sync PME spécifique | ✅ Actif |
| `GET` | `/authorized-smes/list` | Liste PME autorisées | ✅ Actif |
| `GET` | `/check-authorization/:smeId` | Vérifier autorisation | ✅ Actif |
| `GET` | `/with-data-sharing` | Filtrer par autorisation | ✅ Actif |

#### **Exemples d'appels**
```bash
# Consultation avec filtres
GET /portfolio/api/v1/companies?sector=agriculture&size=small&page=1&limit=10

# Synchronisation PME autorisées
POST /portfolio/api/v1/companies/sync-authorized-smes

# Vérification autorisation
GET /portfolio/api/v1/companies/check-authorization/sme-123
```

### 🔐 **SÉCURITÉ & AUTORISATIONS**

#### **Rôles Requis**
- **Consultation** : Tous les rôles authentifiés
- **Synchronisation** : `admin`, `portfolio_manager`

#### **Autorisations Données**
- Seules les PME ayant autorisé le partage sont accessibles
- Vérification systematique des consentements
- Respect RGPD/protection données

### 📊 **FLUX DE DONNÉES**

```
Accounting Service → (Autorisation PME) → Portfolio Service
                                         ↓
                                    Company Entity
                                         ↓
                                   Read-Only Access
```

### ⚙️ **CONFIGURATION**

#### **Variables d'Environnement**
```env
# Accounting Service Integration
ACCOUNTING_SERVICE_URL=http://accounting-service:3000
ACCOUNTING_SERVICE_API_KEY=your-api-key

# Credit Score Service
CREDIT_SCORE_SERVICE_URL=http://credit-score-service:3000
```

### 🔄 **PROCESSUS DE SYNCHRONISATION**

1. **Vérification des autorisations** dans accounting service
2. **Extraction des données PME** autorisées
3. **Transformation vers format Company**
4. **Sauvegarde ou mise à jour** en base locale
5. **Log des résultats** de synchronisation

### 📈 **MÉTRIQUES DISPONIBLES**

#### **Données Financières**
- Chiffre d'affaires et croissance
- Marge bénéficiaire
- Flux de trésorerie
- Ratio d'endettement
- Fonds de roulement
- **Score de crédit**

#### **Métriques ESG**
- Empreinte carbone
- Rating environnemental
- Rating social et gouvernance
- Ratio de genre

### 🚀 **ÉVOLUTION FUTURE**

#### **Améliorations Prévues**
- ✅ Système de scores de crédit avancé
- ✅ Métriques ESG étendues
- ✅ API de filtrage avancé
- ✅ Cache intelligent des données

#### **Conformité Maintenue**
- ❌ Pas de création locale d'entreprises
- ❌ Pas de gestion d'opportunités
- ❌ Accès read-only uniquement
- ✅ Synchronisation depuis source de vérité

---

### 📚 **DOCUMENTATION TECHNIQUE**

Pour plus de détails sur l'implémentation :
- Architecture NestJS modulaire
- TypeORM pour persistance
- Validation automatique des DTOs
- Gestion d'erreurs centralisée
- Logs structurés pour audit

**Module 100% conforme aux exigences métier de prospection read-only.**