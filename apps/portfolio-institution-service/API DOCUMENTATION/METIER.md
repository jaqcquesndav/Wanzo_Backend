# Flux Métier de Gestion des Crédits dans Wanzo Portfolio

Ce document décrit les processus métier, les workflows et les interactions entre le frontend et le backend de l'application Wanzo Portfolio pour la gestion des crédits. L'objectif est de fournir une compréhension claire des fonctionnalités et des responsabilités de chaque partie du système.

## Table des matières

1. [Vue d'ensemble du processus crédit](#1-vue-densemble-du-processus-crédit)
2. [Gestion des demandes de crédit](#2-gestion-des-demandes-de-crédit)
3. [Conversion d'une demande en contrat](#3-conversion-dune-demande-en-contrat)
4. [Gestion des contrats de crédit](#4-gestion-des-contrats-de-crédit)
5. [Gestion des déboursements (virements)](#5-gestion-des-déboursements-virements)
6. [Gestion des échéances et remboursements](#6-gestion-des-échéances-et-remboursements)
7. [Actions sur les contrats](#7-actions-sur-les-contrats)
8. [Gestion des documents](#8-gestion-des-documents)
9. [Intégration entre les modules](#9-intégration-entre-les-modules)
10. [Responsabilités Frontend vs Backend](#10-responsabilités-frontend-vs-backend)

## 1. Vue d'ensemble du processus crédit

Le cycle de vie d'un crédit dans Wanzo Portfolio suit ces étapes principales:

1. **Création de la demande** : Enregistrement des informations du client et des caractéristiques du crédit souhaité
2. **Traitement de la demande** : Analyse, revue, approbation ou rejet
3. **Création du contrat** : Conversion d'une demande approuvée en contrat
4. **Déboursement des fonds** : Virement du montant accordé vers le compte du client
5. **Suivi des remboursements** : Gestion des échéances, enregistrement des paiements
6. **Gestion des incidents** : Traitement des retards, défauts, restructurations
7. **Clôture** : Fin du contrat après remboursement complet ou suite à d'autres actions

## 2. Gestion des demandes de crédit

### 2.1 Structure d'une demande de crédit

Une demande de crédit (`CreditRequest`) contient:
- Informations d'identification (ID de la demande, du client, du produit)
- Caractéristiques du crédit (montant, taux, durée, périodicité)
- Type d'échéancier (constant, dégressif)
- Objet du financement
- Statut et historique des modifications

### 2.2 Flux de traitement d'une demande

1. **Création** : Saisie des informations via un formulaire avec statut `draft` ou `submitted`
2. **Soumission et revue initiale** : Passage au statut `under_review`
3. **Analyse approfondie** : Passage au statut `analysis` avec évaluation des risques
4. **Décision** : Passage au statut `approved` ou `rejected`
5. **Décaissement** (si approuvée) : Passage au statut `disbursed` avec création du contrat

### 2.3 Composants UI impliqués

- `CreditRequestsList` : Liste des demandes avec filtres et recherche
- `CreditRequestForm` : Formulaire de création/modification
- `CreditRequestDetails` : Affichage des détails d'une demande
- Modaux pour les changements de statut (approbation, rejet, etc.)

### 2.4 API et services backend nécessaires

- `GET /portfolios/traditional/funding-requests` : Liste des demandes avec filtres
- `GET /portfolios/traditional/funding-requests/{id}` : Détails d'une demande
- `POST /portfolios/traditional/funding-requests` : Création d'une demande
- `PUT /portfolios/traditional/funding-requests/{id}` : Mise à jour d'une demande
- `POST /portfolios/traditional/funding-requests/{id}/assign` : Assignation pour analyse
- `POST /portfolios/traditional/funding-requests/{id}/analyze` : Soumission d'analyse
- `POST /portfolios/traditional/funding-requests/{id}/approve` : Approbation
- `POST /portfolios/traditional/funding-requests/{id}/reject` : Rejet
- `POST /portfolios/traditional/funding-requests/{id}/cancel` : Annulation

## 3. Conversion d'une demande en contrat

### 3.1 Processus de conversion

1. Une demande avec le statut `approved` peut être convertie en contrat
2. L'utilisateur accède à la fonction via la page de détails de la demande
3. Un formulaire permet de spécifier les détails supplémentaires pour le contrat:
   - Date de début
   - Termes et conditions spécifiques
4. Le backend génère:
   - Le numéro de contrat
   - L'échéancier de remboursement
   - Les données de base du contrat à partir de la demande

### 3.2 Constitution des détails initiaux du contrat

Le contrat est créé avec ces informations:
- Données reprises de la demande:
  - Client (ID, nom)
  - Type de produit
  - Montant approuvé
  - Taux d'intérêt approuvé
  - Durée approuvée
- Données générées ou ajoutées:
  - Numéro de contrat (format standardisé)
  - Échéancier de remboursement calculé
  - Date de début effective
  - Date de fin calculée
  - Référence à la demande d'origine

### 3.3 API et services backend nécessaires

- `POST /portfolios/traditional/funding-requests/{id}/create-contract` : Création du contrat à partir d'une demande
- Calcul de l'échéancier selon le type d'amortissement (constant, dégressif, etc.)
- Génération des documents contractuels

## 4. Gestion des contrats de crédit

### 4.1 Structure d'un contrat de crédit

Un contrat de crédit (`CreditContract`) contient:
- Informations d'identification (ID, numéro de contrat, client, produit)
- Caractéristiques financières (montant, taux, dates)
- Échéancier de remboursement
- Garanties associées
- Historique des déboursements
- Documents associés
- Historique des modifications (restructurations, etc.)
- Statut et dates clés

### 4.2 Composants UI impliqués

- `CreditContractsList` : Liste des contrats avec filtres et recherche
- `CreditContractDetailPage` : Page de détail d'un contrat avec onglets
- `PaymentScheduleTable` : Tableau des échéances
- `ContractActionsMenu` : Menu d'actions disponibles sur le contrat
- Modaux pour les différentes actions (configuration, édition, suspension, etc.)

### 4.3 API et services backend nécessaires

- `GET /portfolios/traditional/credit-contracts` : Liste des contrats avec filtres
- `GET /portfolios/traditional/credit-contracts/{id}` : Détails d'un contrat
- `POST /portfolios/traditional/credit-contracts` : Création d'un contrat
- `PUT /portfolios/traditional/credit-contracts/{id}` : Mise à jour d'un contrat
- `POST /portfolios/traditional/credit-contracts/{id}/default` : Marquer en défaut
- `POST /portfolios/traditional/credit-contracts/{id}/restructure` : Restructurer
- `POST /portfolios/traditional/credit-contracts/{id}/complete` : Clôturer
- `GET /portfolios/traditional/{portfolioId}/credit-contracts/{contractId}/schedule` : Échéancier
- `POST /portfolios/traditional/credit-contracts/{id}/generate-document` : Générer document

## 5. Gestion des déboursements (virements)

### 5.1 Processus de déboursement

1. Création d'une demande de déboursement pour un contrat actif
2. Spécification du montant, de la date souhaitée et des coordonnées bancaires
3. Vérification des prérequis (contrat signé, garanties validées, etc.)
4. Approbation par les personnes autorisées
5. Exécution du virement (mise à jour du statut + ajout des preuves)
6. Confirmation de la réception des fonds par le client

### 5.2 Types de déboursements

- **Déboursement unique** : Virement complet du montant du crédit
- **Déboursement par tranches** : Plan de virements multiples selon un calendrier

### 5.3 Composants UI impliqués

- `DisbursementsList` : Liste des déboursements d'un contrat
- `DisbursementForm` : Formulaire de création d'une demande
- `DisbursementApprovalForm` : Interface d'approbation
- `DisbursementExecutionForm` : Interface d'exécution
- `DocumentUploadForm` : Upload des justificatifs

### 5.4 API et services backend nécessaires

- `GET /portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements` : Liste
- `GET /portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements/{disbursementId}` : Détails
- `POST /portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements` : Création
- `POST /portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements/{disbursementId}/approve` : Approbation
- `POST /portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements/{disbursementId}/reject` : Rejet
- `POST /portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements/{disbursementId}/execute` : Exécution
- `POST /portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements/{disbursementId}/cancel` : Annulation
- `POST /portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements/schedule` : Plan par tranches

## 6. Gestion des échéances et remboursements

### 6.1 Structure des échéances

Une échéance de paiement contient:
- Date d'échéance
- Montant principal
- Montant des intérêts
- Montant total
- Statut (pending, paid, partial, late, defaulted)
- Informations de paiement (si applicable)

### 6.2 Génération de l'échéancier

L'échéancier est généré par le backend lors de la création du contrat, en fonction de:
- Montant du crédit
- Taux d'intérêt
- Durée
- Périodicité
- Méthode d'amortissement (constant, dégressif, etc.)
- Période de grâce (si applicable)

### 6.3 Types de remboursements

- **Paiement standard** : Paiement complet d'une échéance
- **Paiement partiel** : Paiement incomplet nécessitant un complément ultérieur
- **Paiement anticipé** : Paiement de plusieurs échéances à l'avance
- **Remboursement anticipé total** : Clôture anticipée du contrat

### 6.4 Processus de remboursement

1. Enregistrement du paiement avec les détails (méthode, référence, date)
2. Association à une ou plusieurs échéances
3. Mise à jour du statut de l'échéance et du contrat
4. Calcul des indicateurs (montant restant, pourcentage, glissement)
5. Génération des reçus et justificatifs

### 6.5 Composants UI impliqués

- `PaymentScheduleTable` : Tableau des échéances
- `EnhancedRepaymentsTable` : Tableau des remboursements avec fonctionnalités avancées
- `RepaymentForm` : Formulaire d'enregistrement d'un paiement
- `DocumentUploadForm` : Upload des justificatifs de paiement

### 6.6 API et services backend nécessaires

- `GET /portfolios/traditional/{portfolioId}/credit-contracts/{contractId}/schedule` : Échéancier
- `POST /portfolios/traditional/{portfolioId}/contracts/{contractId}/repayments` : Paiement standard
- `POST /portfolios/traditional/{portfolioId}/contracts/{contractId}/repayments/partial` : Paiement partiel
- `POST /portfolios/traditional/{portfolioId}/contracts/{contractId}/repayments/{repaymentId}/complete` : Complément
- `POST /portfolios/traditional/{portfolioId}/contracts/{contractId}/repayments/advance` : Paiement anticipé
- `POST /portfolios/traditional/{portfolioId}/contracts/{contractId}/repayments/early-payoff` : Remboursement total
- `POST /portfolios/traditional/{portfolioId}/contracts/{contractId}/repayments/{scheduleId}/penalties` : Pénalités
- `GET /portfolios/traditional/credit-contracts/{contractId}/payments/compare-with-schedule` : Comparaison

## 7. Actions sur les contrats

### 7.1 Configuration et édition

- **Configuration initiale** : Finalisation des paramètres après création
- **Édition des paramètres** : Modification des données non critiques

### 7.2 Suspension d'un contrat

- Blocage temporaire du contrat pour diverses raisons
- Mise en attente des échéances
- Notification aux parties prenantes

### 7.3 Mise en défaut

- Marquage d'un contrat comme défaillant
- Enregistrement du motif et de la date
- Déclenchement des procédures de recouvrement

### 7.4 Restructuration

- Modification des termes du contrat (taux, durée, échéances)
- Conservation de l'historique des conditions précédentes
- Génération d'un nouvel échéancier

### 7.5 Mise en contentieux

- Transfert du dossier au service juridique
- Suivi des procédures légales
- Enregistrement des coûts et délais

### 7.6 Clôture d'un contrat

- Finalisation après remboursement complet
- Enregistrement de la date et des conditions de clôture
- Archivage des documents

### 7.7 API et services backend nécessaires

- `PUT /portfolios/traditional/credit-contracts/{id}` : Édition générale
- `POST /portfolios/traditional/credit-contracts/{id}/suspend` : Suspension
- `POST /portfolios/traditional/credit-contracts/{id}/default` : Mise en défaut
- `POST /portfolios/traditional/credit-contracts/{id}/restructure` : Restructuration
- `POST /portfolios/traditional/credit-contracts/{id}/litigation` : Mise en contentieux
- `POST /portfolios/traditional/credit-contracts/{id}/complete` : Clôture

## 8. Gestion des documents

### 8.1 Types de documents

- Contrats originaux
- Avenants
- Justificatifs de garanties
- Ordres de virement
- Preuves de paiement
- Notifications officielles
- Documents d'identification

### 8.2 Processus de gestion documentaire

1. Upload du document avec catégorisation
2. Association à l'entité appropriée (demande, contrat, déboursement, etc.)
3. Stockage sécurisé avec métadonnées
4. Contrôle d'accès selon les permissions
5. Versionning si applicable

### 8.3 Composants UI impliqués

- `DocumentsList` : Liste des documents associés à une entité
- `DocumentUploadForm` : Interface d'upload avec métadonnées
- `DocumentViewer` : Visualisation des documents

### 8.4 API et services backend nécessaires

- `POST /portfolios/traditional/funding-requests/{id}/documents` : Documents de demande
- `POST /portfolios/traditional/credit-contracts/{id}/documents` : Documents de contrat
- `POST /portfolios/traditional/{portfolioId}/contracts/{contractId}/disbursements/{disbursementId}/documents` : Documents de déboursement
- `POST /portfolios/traditional/{portfolioId}/contracts/{contractId}/repayments/{id}/documents` : Justificatifs de paiement
- Services de stockage sécurisé des fichiers (avec encryption si nécessaire)

## 9. Intégration entre les modules

### 9.1 Liens entre demandes et contrats

- Un contrat est lié à une demande via `funding_request_id`
- Une demande peut accéder à son contrat via `contract_id`
- Les indicateurs globaux tiennent compte des deux entités

### 9.2 Liens entre contrats et déboursements

- Les déboursements sont liés au contrat via `contract_id`
- Le contrat maintient une liste des déboursements
- Le montant déboursé total est calculé à partir des déboursements

### 9.3 Liens entre contrats et remboursements

- Les remboursements sont liés au contrat via `contract_id`
- Chaque paiement peut être associé à une échéance spécifique
- Le statut du contrat est affecté par l'état des remboursements

### 9.4 Mise à jour des statuts en cascade

- La mise à jour d'un paiement affecte le statut des échéances
- La mise à jour des échéances affecte le statut du contrat
- Les actions sur le contrat peuvent affecter les échéances futures

## 10. Responsabilités Frontend vs Backend

### 10.1 Responsabilités du Frontend

- **Présentation des données** : Affichage des listes, détails, tableaux
- **Interaction utilisateur** : Formulaires, validations côté client, actions
- **Gestion de l'état local** : Utilisation de hooks (useCreditRequests, useCreditContracts, etc.)
- **Navigation et workflow** : Guidage de l'utilisateur à travers les étapes
- **Formatage et localisation** : Formatage des montants, dates selon la locale
- **Expérience utilisateur** : Feedback, notifications, indicateurs visuels
- **Export de données** : Génération de PDF, Excel pour les tableaux

### 10.2 Responsabilités du Backend

- **Logique métier** : Validation des règles métier et contraintes
- **Stockage des données** : Persistance sécurisée dans la base de données
- **Calculs financiers** : 
  - Génération des échéanciers selon les différentes méthodes d'amortissement
  - Calcul des intérêts, pénalités, montants restants
  - Détermination des statuts basés sur les dates et montants
- **Sécurité et contrôle d'accès** : Vérification des permissions
- **Génération de documents officiels** : Contrats, reçus, attestations
- **Intégration avec des systèmes externes** : Systèmes bancaires, comptables
- **Journalisation et audit** : Traçabilité des actions et modifications

### 10.3 Points d'attention pour l'implémentation

- **Cohérence des calculs** : Les calculs financiers doivent être uniquement dans le backend pour éviter les divergences
- **Validation en deux temps** : Frontend pour le confort utilisateur, backend pour la sécurité
- **Gestion des erreurs** : Feedback clair des erreurs backend vers l'utilisateur
- **Optimisation des requêtes** : Minimiser les allers-retours, utiliser la pagination
- **Gestion du cache** : Mise en place de stratégies de cache pour les données peu changeantes
- **Fallback** : Mécanismes de repli en cas d'indisponibilité temporaire du backend

## Conclusion

La gestion de portefeuille de crédit dans Wanzo Portfolio implique un workflow complexe depuis la demande initiale jusqu'à la clôture du contrat, avec plusieurs étapes intermédiaires comme l'approbation, le déboursement, et le suivi des remboursements.

Le frontend est responsable de fournir une interface intuitive permettant aux utilisateurs de naviguer dans ce workflow, tandis que le backend garantit l'intégrité des données, la sécurité, et l'exactitude des calculs financiers.

Cette séparation claire des responsabilités, combinée à une API bien définie, permet un développement modulaire et maintenable de l'application, tout en offrant une expérience utilisateur fluide et cohérente.
