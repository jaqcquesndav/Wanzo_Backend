# Système de Demandes de Crédit

Ce document décrit le système de demandes de crédit dans l'application Wanzo Portfolio, en détaillant les concepts, les flux de travail et les structures de données.

## Modèle de données

### CreditRequest (Demande de crédit)

Une demande de crédit représente une requête formelle d'un membre/client pour obtenir un financement. Elle comporte les attributs suivants :

| Attribut | Type | Description |
|----------|------|-------------|
| id | string | Identifiant unique de la demande |
| memberId | string | Identifiant du membre/client |
| productId | string | Identifiant du produit de crédit |
| receptionDate | string (date) | Date de réception de la demande |
| requestAmount | number | Montant demandé |
| periodicity | enum | Périodicité de remboursement (daily, weekly, biweekly, monthly, quarterly, semiannual, annual) |
| interestRate | number | Taux d'intérêt proposé |
| reason | string | Motif de la demande |
| scheduleType | enum | Type d'échéancier (constant, degressive) |
| schedulesCount | number | Nombre d'échéances |
| deferredPaymentsCount | number | Nombre de paiements différés |
| gracePeriod | number (optional) | Période de grâce en mois |
| financingPurpose | string | Objet du financement |
| creditManagerId | string | Identifiant du gestionnaire de crédit |
| status | enum | Statut de la demande |
| isGroup | boolean | Indique s'il s'agit d'une demande de groupe |
| groupId | string (optional) | Identifiant du groupe (si demande de groupe) |
| distributions | array (optional) | Répartition entre membres (si demande de groupe) |
| rejectionReason | string (optional) | Motif de rejet (si rejetée) |
| createdAt | string (datetime) | Date de création |
| updatedAt | string (datetime) | Date de dernière mise à jour |

### CreditRequestStatus (Statut de demande de crédit)

Les statuts possibles pour une demande de crédit sont les suivants :

| Statut | Description |
|--------|-------------|
| draft | Brouillon, demande en cours de création |
| submitted | Soumise, en attente de traitement initial |
| under_review | En revue initiale |
| pending | En attente de décision |
| analysis | En cours d'analyse approfondie |
| approved | Approuvée, prête pour décaissement |
| rejected | Rejetée |
| canceled | Annulée par le client ou l'institution |
| disbursed | Décaissée, contrat créé |
| active | Active (après décaissement) |
| closed | Fermée/terminée |
| defaulted | En défaut de paiement |
| restructured | Restructurée |
| consolidated | Consolidée avec d'autres crédits |
| in_litigation | En contentieux |

## Flux de traitement des demandes

### 1. Création de la demande

- La demande est créée avec le statut `draft` ou directement en `submitted`
- Les informations de base du client et du produit sont renseignées
- Les détails du financement (montant, durée, etc.) sont spécifiés

### 2. Soumission et revue initiale

- La demande passe au statut `submitted`
- Un gestionnaire de crédit effectue une revue initiale
- Après vérification des informations, la demande passe au statut `under_review` ou `pending`

### 3. Analyse approfondie

- La demande passe au statut `analysis`
- Le gestionnaire de crédit procède à une analyse détaillée
- Évaluation de la capacité de remboursement, des garanties, etc.

### 4. Décision

- Après analyse, la demande passe au statut `approved` ou `rejected`
- Si rejetée, un motif de rejet est enregistré
- Si approuvée, elle est prête pour le décaissement

### 5. Décaissement

- La demande approuvée passe au statut `disbursed`
- Un contrat de crédit est créé automatiquement
- Le contrat est initialement au statut `active`

## Intégration dans l'interface utilisateur

Les demandes de crédit sont accessibles depuis l'onglet "Demandes" du portefeuille de crédit. L'interface permet de :

- Visualiser la liste des demandes avec filtres et tri
- Créer une nouvelle demande
- Consulter les détails d'une demande
- Mettre à jour le statut d'une demande
- Exporter la liste des demandes en Excel ou PDF

## Architecture technique

### Composants UI

- `CreditRequestsList` : Liste des demandes avec filtres et actions
- `CreditRequestForm` : Formulaire de création/modification
- `CreditRequestDetails` : Affichage détaillé d'une demande

### Hooks

- `useCreditRequests` : Gestion de l'état et des opérations sur les demandes

### Services

- `creditRequestApi` : Service d'API pour les opérations CRUD sur les demandes
- `creditRequestsStorageService` : Service de stockage local (fallback)

## Bonnes pratiques et recommandations

- Utiliser systématiquement le type `CreditRequest` pour garantir la cohérence
- Gérer les changements de statut via la fonction dédiée `changeRequestStatus`
- Mettre à jour la documentation API lorsque le modèle de données évolue
- Utiliser le service API plutôt que d'accéder directement au stockage local
- Valider les données de demande avant soumission pour garantir l'intégrité
