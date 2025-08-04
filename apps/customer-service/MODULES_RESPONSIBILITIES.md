# 📚 RESPONSABILITÉS DES MODULES - CUSTOMER SERVICE

## 🏗️ **ARCHITECTURE CLARIFIÉE**

### 👥 **SYSTEM-USERS** (ex-users)
**Responsabilité** : Gestion des utilisateurs internes du système
- **Entités** : User, UserActivity
- **Utilisateurs cibles** : 
  - Admins système
  - Employés de l'entreprise
  - Gestionnaires de comptes
- **Fonctionnalités** :
  - Authentification des employés
  - Gestion des rôles internes
  - Activités des utilisateurs système

### 👔 **CUSTOMERS**
**Responsabilité** : Gestion des clients de l'entreprise
- **Entités** : Customer, SmeSpecificData, FinancialInstitutionSpecificData
- **Clients cibles** :
  - PME (Small & Medium Enterprises)
  - Institutions Financières
- **Fonctionnalités** :
  - Onboarding des clients
  - Validation KYC
  - Profils clients

### 💰 **SUBSCRIPTIONS**
**Responsabilité** : Gestion des abonnements et pricing
- **Entités** : Subscription, SubscriptionPlan, FeatureUsageTracking, CustomerFeatureLimit, CustomerTokenBalance, TokenTransaction
- **Fonctionnalités** :
  - Plans d'abonnement
  - **Configuration centralisée des prix** ✅
  - Contrôle d'accès aux features
  - Gestion des tokens et consommation
  - **Contrôleurs Commercial & Financial** ✅

### 🪙 **TOKENS**
**Responsabilité** : Gestion technique des tokens
- **Entités** : TokenPackage, TokenBalance, TokenTransaction, TokenUsage
- **Fonctionnalités** :
  - Achat de tokens
  - Historique d'usage
  - Packages de tokens
  - Usage tracking par application

### 💳 **BILLING**
**Responsabilité** : Facturation et paiements
- **Entités** : Invoice, Payment
- **Fonctionnalités** :
  - Génération de factures
  - Traitement des paiements
  - Historique des transactions financières
  - Intégration avec gateways de paiement

## 🔄 **FRONTIÈRES CLARIFIÉES**

### **SUBSCRIPTIONS vs TOKENS**
- **SUBSCRIPTIONS** : Plans, pricing config, feature access
- **TOKENS** : Implémentation technique des tokens, packages

### **SUBSCRIPTIONS vs BILLING**
- **SUBSCRIPTIONS** : "Qu'est-ce que le client peut consommer ?"
- **BILLING** : "Comment on facture ce que le client a consommé ?"

### **CUSTOMERS vs SYSTEM-USERS**
- **CUSTOMERS** : Clients externes de l'entreprise
- **SYSTEM-USERS** : Employés internes qui gèrent le système

## ✅ **CHANGEMENTS APPLIQUÉS**

### ✅ **CONSOLIDATION COMMERCIAL/FINANCIAL**
- Contrôleurs déplacés vers `subscriptions/controllers/`
- Modules `commercial` et `financial` supprimés
- Imports mis à jour dans `subscriptions.module.ts`

### ✅ **CLARIFICATION USERS → SYSTEM-USERS**
- Module `users` renommé en `system-users`
- Tous les imports mis à jour dans :
  - Modules principaux
  - Services
  - Tests
  - Entités

### ✅ **DÉFINITION DES FRONTIÈRES**
- Documentation des responsabilités
- Séparation claire des préoccupations
- Éviter les overlaps fonctionnels

## 🎯 **RÉSULTAT**

Architecture plus cohérente avec :
- **Responsabilités clairement définies**
- **Noms de modules explicites**
- **Éviter la duplication de code**
- **Faciliter la maintenance**
