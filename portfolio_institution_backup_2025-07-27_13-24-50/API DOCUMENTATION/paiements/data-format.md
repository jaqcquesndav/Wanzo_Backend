# Format de données des Ordres de Paiement

Ce document décrit la structure des données utilisées pour les ordres de paiement dans l'application Wanzo Portfolio.

## Structure PaymentOrderData

```typescript
interface PaymentOrderData {
  id: string;                // Identifiant unique de l'ordre de paiement
  orderNumber: string;       // Numéro d'ordre formaté (ex: OP-2023-001)
  date: string;              // Date prévue du paiement au format YYYY-MM-DD
  amount: number;            // Montant du paiement (en centimes ou valeur entière selon la devise)
  currency: string;          // Code de la devise (XAF, EUR, USD, etc.)
  beneficiary: {             // Informations sur le bénéficiaire
    name: string;            // Nom du bénéficiaire
    accountNumber: string;   // Numéro de compte
    bankName: string;        // Nom de la banque
    swiftCode?: string;      // Code SWIFT (optionnel)
    address?: string;        // Adresse du bénéficiaire (optionnel)
  };
  reference: string;         // Référence du paiement (ex: numéro de contrat)
  description: string;       // Description détaillée du paiement
  portfolioId: string;       // ID du portefeuille auquel est associé le paiement
  portfolioName: string;     // Nom du portefeuille
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'paid';  // Statut actuel
  approvedBy?: string;       // ID de l'utilisateur qui a approuvé (si applicable)
  approvedAt?: string;       // Date d'approbation (si applicable)
  rejectedBy?: string;       // ID de l'utilisateur qui a rejeté (si applicable)
  rejectedAt?: string;       // Date de rejet (si applicable)
  paidBy?: string;           // ID de l'utilisateur qui a marqué comme payé (si applicable)
  paidAt?: string;           // Date de paiement effectif (si applicable)
  createdBy: string;         // ID de l'utilisateur qui a créé l'ordre
  createdAt: string;         // Date de création
  updatedAt: string;         // Date de dernière mise à jour
}
```

## Cycle de vie d'un ordre de paiement

Un ordre de paiement passe par plusieurs états au cours de son cycle de vie :

1. **draft** (brouillon) : L'ordre vient d'être créé et peut encore être modifié.
2. **pending** (en attente) : L'ordre a été soumis pour approbation.
3. **approved** (approuvé) : L'ordre a été approuvé et est prêt à être payé.
4. **rejected** (rejeté) : L'ordre a été rejeté et ne sera pas traité.
5. **paid** (payé) : L'ordre a été payé et est considéré comme complet.

## Validation des données

Les règles de validation suivantes s'appliquent aux ordres de paiement :

- `orderNumber` : Doit être unique dans le système
- `date` : Doit être une date valide au format YYYY-MM-DD
- `amount` : Doit être un nombre positif
- `currency` : Doit être un code de devise valide (XAF, EUR, USD, etc.)
- `beneficiary.name` : Obligatoire, ne peut pas être vide
- `beneficiary.accountNumber` : Obligatoire, doit respecter le format de numéro de compte bancaire
- `beneficiary.bankName` : Obligatoire, ne peut pas être vide
- `reference` : Obligatoire, ne peut pas être vide
- `portfolioId` : Doit correspondre à un portefeuille existant

## Permissions et rôles

Les actions sur les ordres de paiement sont soumises à des restrictions basées sur les rôles des utilisateurs :

- **Création** : Gestionnaires de portefeuille
- **Modification** : Uniquement l'auteur (si status="draft") ou les administrateurs
- **Approbation** : Administrateurs, directeurs financiers
- **Rejet** : Administrateurs, directeurs financiers
- **Marquage comme payé** : Comptables, directeurs financiers

## Intégration avec d'autres modules

Les ordres de paiement sont généralement liés à d'autres entités du système :

- **Contrats de crédit** : Un paiement peut être lié à un déboursement de crédit
- **Remboursements** : Un paiement peut représenter un remboursement de prêt
- **Portefeuilles** : Chaque paiement est associé à un portefeuille spécifique

## Pièces jointes

Un ordre de paiement peut avoir des pièces jointes pour justifier la transaction. Ces pièces ne sont pas incluses dans la structure principale mais sont référencées via l'ID de l'ordre de paiement.
