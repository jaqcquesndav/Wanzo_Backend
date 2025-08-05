# Centralisation des Souscriptions dans Customer-Service

## Résumé

Le module de souscription a été supprimé du microservice `gestion_commerciale_service` pour centraliser la gestion des abonnements dans le microservice `customer-service`. Cette décision a été prise afin d'éviter la duplication de code, de simplifier l'architecture et d'éviter les incohérences de données entre services.

## Justification

1. **Éviter la duplication de code** : Avoir la logique de souscription dans plusieurs services créait de la redondance.
2. **Cohérence des données** : Un seul point de vérité pour les informations d'abonnement.
3. **Simplification de l'architecture** : Chaque service a maintenant une responsabilité claire.
4. **Meilleure gestion des événements** : Les services n'ont plus qu'à écouter les événements de souscription.

## Modifications Effectuées

1. **Suppression des entités de souscription** :
   - `SubscriptionTier` et `UserSubscription` ont été retirées du modèle de données.
   
2. **Conservation d'un service de souscription stub** :
   - Le service `SubscriptionService` a été conservé comme stub pour assurer la compatibilité avec le code existant.
   - Il renvoie maintenant des valeurs par défaut pour ne pas bloquer les fonctionnalités.

3. **Désactivation des consumers d'événements** :
   - Les consumers d'événements liés aux souscriptions ont été conservés mais désactivés.
   - Ils journalisent simplement les événements reçus sans effectuer d'actions.

4. **Nettoyage du module d'authentification** :
   - Suppression des références au service de souscription dans le module d'authentification.

5. **Mise à jour des dépendances de base de données** :
   - Suppression des tables liées aux souscriptions dans le fichier de synchronisation de base de données.

## Architecture Actuelle

1. `customer-service` est maintenant le service central pour :
   - La création des abonnements
   - La gestion du cycle de vie des abonnements
   - L'émission des événements d'abonnement via Kafka

2. Les autres services comme `gestion_commerciale_service` :
   - Écoutent passivement les événements d'abonnement
   - Appliquent les restrictions d'accès en fonction des événements reçus

## Impact sur l'Application

Cette centralisation n'a pas d'impact sur les fonctionnalités de l'application, mais améliore la structure du code et réduit la duplication. Les utilisateurs continuent d'accéder aux mêmes fonctionnalités, mais la gestion interne est plus cohérente.
