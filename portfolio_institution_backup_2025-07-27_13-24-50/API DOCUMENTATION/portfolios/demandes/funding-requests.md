# API des Demandes de Financement

> **Note**: Cette documentation concerne l'ancienne implémentation des demandes de financement (`FundingRequests`). Le système a été standardisé pour utiliser le modèle `CreditRequest`. Veuillez consulter le document principal README.md pour les API à jour.

## Structure de données

```typescript
export interface FundingRequest {
  id: string;
  company: string;
  product: string;
  amount: number;
  status: 'en attente' | 'validée' | 'refusée' | 'décaissée';
  created_at: string;
  portfolioId: string;
  maturity?: string; // Échéance
  dueDate?: string; // Date d'échéance
  projectFile?: string; // Lien vers le fichier du projet
  attachments?: Array<{id: string, name: string, url: string}>; // Pièces jointes
  productDetails?: {
    type: string;
    rate: number;
    term: string;
  }; // Détails du produit sollicité
}
```

Cette structure est remplacée par le modèle standardisé `CreditRequest` qui offre plus de champs et une meilleure cohérence avec les autres parties du système.

## Migration

Pour migrer du modèle `FundingRequest` vers `CreditRequest`, utilisez la table de correspondance suivante :

| FundingRequest | CreditRequest | Notes |
|----------------|---------------|-------|
| id | id | Même usage |
| company | memberId | Référence l'ID du membre plutôt que le nom d'entreprise |
| product | productId | Référence l'ID du produit plutôt que son nom |
| amount | requestAmount | Même concept, nom différent |
| status | status | Les valeurs sont standardisées (pending, approved, rejected, disbursed) |
| created_at | createdAt | Même concept, format camelCase |
| portfolioId | N/A | À ajouter dans les filtres d'API |
| maturity | schedulesCount | Lié au nombre d'échéances |
| dueDate | N/A | Calculé à partir de la date de début et de la périodicité |
| projectFile | N/A | À gérer via un système de pièces jointes séparé |
| attachments | N/A | À gérer via un système de pièces jointes séparé |
| productDetails | N/A | Les détails sont stockés dans la référence au produit |

## Recommandations

Utilisez exclusivement le modèle `CreditRequest` pour toutes les nouvelles fonctionnalités et mises à jour. Le modèle `FundingRequest` est déprécié et sera supprimé dans une future version.
