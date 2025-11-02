# Implémentation de l'API des Garanties

Cette documentation décrit l'implémentation actuelle de l'API des garanties dans le système Wanzo Portfolio.

## État d'implémentation

L'API des garanties est maintenant implémentée et prête à être utilisée dans le code frontend. Les services API, les types et les hooks nécessaires ont tous été créés et sont compatibles avec la documentation API.

## Services implémentés

### Service API

Le service API pour les garanties est implémenté dans `src/services/api/traditional/guarantee.api.ts` et expose les méthodes suivantes :

- `getContractGuarantees` : Récupère toutes les garanties d'un contrat spécifique
- `getGuaranteeDetails` : Récupère les détails d'une garantie spécifique
- `createGuarantee` : Crée une nouvelle garantie
- `updateGuarantee` : Met à jour une garantie existante
- `validateGuarantee` : Valide une garantie
- `rejectGuarantee` : Rejette une garantie
- `revaluateGuarantee` : Réévalue une garantie
- `addGuaranteeDocument` : Ajoute un document à une garantie
- `getGuaranteeTypes` : Récupère la liste des types de garanties disponibles
- `getGuaranteeStats` : Récupère les statistiques des garanties pour un portefeuille

### Hooks React

Les hooks React suivants ont été créés pour faciliter l'utilisation de l'API dans les composants :

- `useContractGuarantees` : Gère les garanties d'un contrat spécifique
- `useGuaranteeTypes` : Récupère les types de garanties disponibles
- `useGuaranteeStats` : Obtient des statistiques sur les garanties d'un portefeuille

## Types de données

Les types de données suivants sont utilisés pour les garanties :

- `Guarantee` : Structure principale pour une garantie
- `GuaranteeType` : Types de garanties disponibles

## Intégration avec le reste de l'application

L'API des garanties est intégrée avec les composants UI existants et peut être utilisée dans les pages de portefeuille traditionnel. Elle est compatible avec le système de cache et de synchronisation existant.

## Tests et validation

Les services API ont été testés manuellement pour s'assurer qu'ils fonctionnent correctement avec les données de test. Des tests automatisés pourront être ajoutés dans une phase ultérieure.

## Prochaines étapes

1. Mettre à jour les composants UI pour utiliser les nouveaux hooks plutôt que l'ancien service de stockage
2. Ajouter la validation des données côté client
3. Améliorer la gestion des erreurs pour les cas spécifiques
4. Ajouter des tests automatisés pour les services API et hooks
