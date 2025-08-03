# API Documentation - Wanzo Portfolio Loan

Documentation complète de l'API Wanzo Portfolio Loan, harmonisée avec le code source.

## 📋 Vue d'ensemble

Cette documentation décrit les endpoints et structures de données de l'API tels qu'ils sont **réellement implémentés** dans le code source de l'application.

## 🏗️ Architecture API

L'API suit une architecture REST avec les préfixes suivants :
- **Base URL Développement** : `http://localhost:8000/api`
- **Base URL Production** : `https://api.wanzo-portfolio.com/api`

## 📚 Modules Disponibles

### 🏦 [Portefeuilles](./portefeuilles/README.md)
Gestion des portefeuilles traditionnels
- **Endpoint** : `/portfolios/traditional`
- **Fonctionnalités** : CRUD complet, métriques, gestion des actifs

### 💳 [Demandes de Crédit](./portefeuilles/demandes/README.md)
Gestion des demandes de crédit traditionnelles
- **Endpoint** : `/portfolios/traditional/credit-requests`
- **Fonctionnalités** : Création, approbation, suivi des statuts

### 📊 [Dashboard](./dashboard/README.md)
Tableaux de bord et métriques
- **Endpoint** : `/dashboard`
- **Fonctionnalités** : Métriques temps réel, KPIs, graphiques

### 🏢 [Institution](./institution/README.md)
Gestion des informations institutionnelles
- **Endpoint** : `/institutions`
- **Fonctionnalités** : Configuration, paramètres institutionnels

### 👥 [Utilisateurs](./utilisateurs/README.md)
Gestion des utilisateurs et autorisations
- **Endpoint** : `/users`
- **Fonctionnalités** : CRUD utilisateurs, rôles, permissions

### 📧 [Chat](./chat/README.md)
Système de messagerie et communication
- **Endpoint** : `/chat`
- **Fonctionnalités** : Messages, conversations, notifications

### 🎯 [Prospection](./prospection/README.md)
Gestion de la prospection commerciale
- **Endpoint** : `/prospection`
- **Fonctionnalités** : Leads, opportunités, suivi commercial

### 💰 [Paiements](./paiements/README.md)
Gestion des paiements et transactions
- **Endpoint** : `/payments`
- **Fonctionnalités** : Ordres de paiement, suivi, historique

### 🔄 [Virements](./virements/README.md)
Gestion des virements et décaissements
- **Endpoint** : `/disbursements`
- **Fonctionnalités** : Création, validation, suivi des virements

### ⚙️ [Paramètres](./parametres/README.md)
Configuration système et paramètres
- **Endpoint** : `/settings`
- **Fonctionnalités** : Configuration globale, paramètres utilisateur

### 🛡️ [Centrale des Risques](./centrale-risque/README.md)
Gestion des risques et évaluations
- **Endpoint** : `/risk`
- **Fonctionnalités** : Évaluation risques, scoring, alertes

## 🔧 Configuration

### [Configuration de Base](./01-configuration.md)
- URLs de base, headers, formats de réponse
- Gestion des erreurs, pagination, sécurité

### [Authentification](./02-authentification.md)
- JWT tokens, authentification OAuth
- Gestion des permissions et rôles

## 📖 Conventions

### Format des Dates
Toutes les dates utilisent le format ISO 8601 : `YYYY-MM-DDTHH:mm:ss.sssZ`

### Codes de Statut HTTP
- `200` : Succès
- `201` : Créé avec succès
- `400` : Erreur de requête
- `401` : Non autorisé
- `404` : Ressource non trouvée
- `500` : Erreur serveur

### Pagination
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

## 🚀 Démarrage Rapide

1. **Authentification** : Consultez [02-authentification.md](./02-authentification.md)
2. **Configuration** : Consultez [01-configuration.md](./01-configuration.md)
3. **Premier appel** : Testez avec `/portfolios/traditional`

## 📝 Notes importantes

- Cette documentation reflète exactement le code source implémenté
- Les endpoints documentés correspondent aux services API réels
- Les structures de données TypeScript sont la source de vérité
- Fallback automatique vers localStorage en cas d'échec API

---

*Dernière mise à jour : 3 août 2025*
*Version synchronisée avec le code source*
