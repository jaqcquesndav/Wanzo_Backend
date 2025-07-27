# Cycle de vie d'un ordre de paiement

Ce document décrit le processus complet du cycle de vie d'un ordre de paiement dans l'application Wanzo Portfolio, de sa création à son traitement final.

## Vue d'ensemble

Un ordre de paiement dans Wanzo Portfolio suit un workflow prédéfini impliquant plusieurs étapes et différents acteurs. Le diagramme ci-dessous représente ce flux :

```
Création (draft) → Soumission (pending) → Approbation (approved) → Paiement (paid)
                           ↓
                        Rejet (rejected)
```

## Étapes détaillées

### 1. Création (draft)

- **Acteur**: Gestionnaire de portefeuille
- **Action**: Crée un nouvel ordre de paiement dans le système
- **Statut**: `draft`
- **Description**:
  - L'utilisateur remplit le formulaire d'ordre de paiement avec les informations nécessaires
  - Le système génère automatiquement un numéro d'ordre unique (format: OP-YYYY-XXXX)
  - L'ordre est enregistré avec le statut "draft" (brouillon)
  - À ce stade, l'ordre peut être modifié ou supprimé

### 2. Soumission (pending)

- **Acteur**: Gestionnaire de portefeuille
- **Action**: Soumet l'ordre pour approbation
- **Statut**: `pending`
- **Description**:
  - L'utilisateur vérifie toutes les informations et soumet l'ordre
  - Le système change le statut en "pending" (en attente)
  - Des notifications sont envoyées aux approbateurs autorisés
  - À ce stade, l'ordre ne peut plus être modifié par le créateur

### 3. Approbation / Rejet

- **Acteur**: Approbateur (Directeur financier, Administrateur)
- **Action**: Approuve ou rejette l'ordre de paiement
- **Statut**: `approved` ou `rejected`
- **Description**:
  - L'approbateur examine les détails de l'ordre
  - Il peut approuver l'ordre, le rejetant, ou demander des modifications
  - En cas d'approbation, le statut devient "approved" et la date d'approbation est enregistrée
  - En cas de rejet, le statut devient "rejected" avec un motif obligatoire
  - Des notifications sont envoyées au créateur et aux autres parties prenantes

### 4. Paiement

- **Acteur**: Comptable
- **Action**: Marque l'ordre comme payé après exécution du paiement réel
- **Statut**: `paid`
- **Description**:
  - Le comptable effectue le paiement via le système bancaire
  - Une fois le paiement confirmé, il marque l'ordre comme "paid" dans le système
  - La date de paiement et les détails de la transaction sont enregistrés
  - Des notifications sont envoyées au créateur et aux autres parties prenantes
  - L'ordre est archivé mais reste accessible pour consultation

## Autorisations et contrôles

Le système applique les contrôles suivants à chaque étape :

| Action | Rôles autorisés | Conditions |
|--------|-----------------|------------|
| Créer | Gestionnaire de portefeuille | L'utilisateur doit être associé au portefeuille |
| Soumettre | Gestionnaire de portefeuille | Doit être le créateur de l'ordre |
| Approuver | Directeur financier, Administrateur | L'ordre doit être en statut "pending" |
| Rejeter | Directeur financier, Administrateur | L'ordre doit être en statut "pending" |
| Marquer comme payé | Comptable, Directeur financier | L'ordre doit être en statut "approved" |
| Annuler | Administrateur | Possible à toute étape sauf "paid" |

## Journalisation et audit

Toutes les actions sur un ordre de paiement sont enregistrées dans un journal d'audit avec les informations suivantes :
- Date et heure de l'action
- Utilisateur ayant effectué l'action
- Type d'action (création, modification, changement de statut, etc.)
- Détails spécifiques (ex: changement de montant de X à Y)

Ce journal est accessible via l'API `getPaymentHistory` pour assurer la traçabilité complète.

## Intégration avec d'autres systèmes

Les ordres de paiement peuvent être intégrés avec :

1. **Système bancaire** : Export au format SEPA ou autre format bancaire
2. **Comptabilité** : Génération d'écritures comptables
3. **Rapports financiers** : Inclusion dans les tableaux de bord et rapports

## Délais et rappels

Le système gère également les délais et rappels :

- Notification aux approbateurs pour les ordres en attente depuis plus de 48h
- Alerte pour les ordres approuvés mais non payés après 5 jours ouvrables
- Rappel mensuel pour les ordres en statut "draft" depuis plus de 30 jours

## Considérations de sécurité

- Toutes les actions sont soumises à une authentification forte
- Les montants dépassant certains seuils peuvent nécessiter une double approbation
- Les changements de coordonnées bancaires sont particulièrement surveillés
- L'historique complet est conservé pour des raisons d'audit et de conformité
