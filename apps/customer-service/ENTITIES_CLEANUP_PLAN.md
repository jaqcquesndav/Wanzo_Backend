# 🧹 Plan de Nettoyage des Entities - Module Principal

## 📋 Analyse des Entities à Nettoyer

### Structure Actuelle - `/customers/entities/`

| Entity | Taille | Status | Action Recommandée |
|--------|--------|--------|-------------------|
| `customer.entity.ts` | Core | ✅ **GARDER** | Entity principale commune |
| `customer-user.entity.ts` | Core | ✅ **GARDER** | Relation utilisateurs-clients |
| `customer-document.entity.ts` | Core | ✅ **GARDER** | Documents clients génériques |
| `customer-activity.entity.ts` | Core | ✅ **GARDER** | Activités clients génériques |
| `validation-process.entity.ts` | Core | ✅ **GARDER** | Processus validation générique |
| | | | |
| `sme.entity.ts` | Legacy | ❌ **SUPPRIMER** | Remplacé par `company/entities/company.entity.ts` |
| `sme-specific-data.entity.ts` | Legacy | ❌ **SUPPRIMER** | Remplacé par `company/entities/company-*` |
| `institution.entity.ts` | Legacy | ❌ **SUPPRIMER** | Remplacé par `financial-institution/entities/*` |
| `financial-institution-specific-data.entity.ts` | Legacy | ❌ **SUPPRIMER** | Remplacé par sous-module |
| `asset-data.entity.ts` | Spécifique | ❌ **SUPPRIMER** | Déplacé vers `company/entities/company-assets.entity.ts` |
| `stock-data.entity.ts` | Spécifique | ❌ **SUPPRIMER** | Déplacé vers `company/entities/company-stocks.entity.ts` |
| `enterprise-identification-form.entity.ts` | Spécifique | ❌ **SUPPRIMER** | Fonctionnalité à recréer dans company module |

---

## 🎯 Entities à Conserver (Module Principal)

### ✅ Entities Communes Principales
```
/customers/entities/
├── customer.entity.ts                    ✅ Entity principale
├── customer-user.entity.ts               ✅ Relations users (si existe)
├── customer-document.entity.ts           ✅ Documents génériques
├── customer-activity.entity.ts           ✅ Activités génériques  
└── validation-process.entity.ts          ✅ Processus validation
```

### 🏗️ Entities Spécialisées (Sous-modules)
```
/company/entities/
├── company.entity.ts                     ✅ Nouvelle entity principale
├── company-assets.entity.ts              ✅ Remplace asset-data.entity.ts
├── company-core.entity.ts                ✅ Données core entreprise
└── company-stocks.entity.ts              ✅ Remplace stock-data.entity.ts

/financial-institution/entities/
├── financial-institution.entity.ts      ✅ Nouvelle entity principale
├── institution-branch.entity.ts         ✅ Branches
├── institution-core.entity.ts           ✅ Données core institution
├── institution-leadership.entity.ts     ✅ Leadership
├── institution-regulatory.entity.ts     ✅ Regulatory
└── institution-services.entity.ts       ✅ Services
```

---

## 🗑️ Plan de Suppression

### Phase 1: Entities Legacy SME
- ❌ `sme.entity.ts` (remplacé par `company.entity.ts`)
- ❌ `sme-specific-data.entity.ts` (logique dans company-*)
- ❌ `asset-data.entity.ts` (déplacé vers `company-assets.entity.ts`)
- ❌ `stock-data.entity.ts` (déplacé vers `company-stocks.entity.ts`)

### Phase 2: Entities Legacy Institution  
- ❌ `institution.entity.ts` (remplacé par `financial-institution.entity.ts`)
- ❌ `financial-institution-specific-data.entity.ts` (logique dans institution-*)

### Phase 3: Entities Fonctionnelles Spécialisées
- ❌ `enterprise-identification-form.entity.ts` (à recréer dans company si nécessaire)

---

## ⚠️ Vérifications Avant Suppression

### Dépendances à Vérifier
```bash
# Vérifier les usages avant suppression
grep -r "sme.entity" src/
grep -r "SmeEntity" src/
grep -r "asset-data.entity" src/
grep -r "AssetData" src/
```

### Migrations de Base de Données
- ⚠️ **Tables existantes** : Vérifier si migration BDD nécessaire
- ⚠️ **Relations FK** : Adapter les relations vers nouvelles entities
- ⚠️ **Données existantes** : Plan de migration des données

---

## 🎯 Résultat Final

### Structure Nettoyée
```
/customers/
├── entities/                 # 🧹 NETTOYÉ - Seulement entities communes
│   ├── customer.entity.ts
│   ├── customer-document.entity.ts
│   ├── customer-activity.entity.ts
│   └── validation-process.entity.ts
├── company/entities/         # ✅ SPÉCIALISÉ - Entities entreprises
│   ├── company.entity.ts
│   ├── company-assets.entity.ts
│   ├── company-core.entity.ts
│   └── company-stocks.entity.ts
└── financial-institution/entities/  # ✅ SPÉCIALISÉ - Entities institutions
    ├── financial-institution.entity.ts
    ├── institution-branch.entity.ts
    ├── institution-core.entity.ts
    └── [autres entities institution]
```

### Bénéfices
- ✅ **Séparation claire** : Entities communes vs spécialisées
- ✅ **Pas de duplication** : Chaque entity à sa place
- ✅ **Architecture modulaire** : Entities dans leurs modules respectifs
- ✅ **Maintenance simplifiée** : Moins d'entities dans le module principal

**Prêt à procéder au nettoyage ? 🚀**