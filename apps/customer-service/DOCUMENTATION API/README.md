# Documentation de l'API Wanzo

Cette documentation détaille l'API utilisée par l'application Wanzo pour la gestion des profils d'entreprise (PME) et des institutions financières.

## Table des matières

1. [Configuration de base](./01-configuration.md)
   - URL de base
   - Headers obligatoires
   - Format des réponses

2. [Authentification](./02-authentification.md)
   - Flux d'authentification Auth0
   - Gestion des tokens
   - Refresh tokens
   - Permissions et rôles

3. [Utilisateurs](./03-utilisateurs.md)
   - Structure des données utilisateur
   - Création de compte
   - Mise à jour de profil
   - Récupération des informations

4. [Entreprises (PME)](./04-entreprises.md)
   - Structure des données entreprise
   - Création d'un profil entreprise
   - Mise à jour du profil
   - Upload de fichiers (logo, CV)
   - Récupération des informations

5. [Institutions financières](./05-institutions-financieres.md)
   - Structure des données institution
   - Création d'un profil institution
   - Mise à jour du profil
   - Récupération des informations

6. [Abonnements et paiements](./06-abonnements.md)
   - Gestion des plans
   - Souscription à un abonnement
   - Historique des paiements
   - Gestion des tokens

7. [Erreurs et dépannage](./07-erreurs.md)
   - Codes d'erreur communs
   - Résolution des problèmes fréquents

## Conventions de nommage

Les noms de routes et de champs suivent les conventions suivantes :
- Routes API: `/land/api/v1/[ressource]`
- Paramètres URL: camelCase
- Champs JSON: camelCase

## Notes importantes

- Toutes les requêtes doivent être effectuées avec le header d'authentification approprié
- Les réponses JSON incluent toujours un champ `success` indiquant le statut de la requête
- Les données sensibles sont toujours envoyées via HTTPS
- La pagination est supportée sur les endpoints qui retournent des listes
