# Guide de Test : Synchronisation Cross-Service des Connexions Utilisateur

## Objectif
Tester que lorsqu'un utilisateur se connecte depuis une application métier (accounting ou gestion commerciale), le Customer Service est automatiquement informé et propage les données via Kafka vers tous les services concernés.

## Prérequis
1. ✅ Docker containers démarrés (Kafka, PostgreSQL, services)
2. ✅ Bases de données nettoyées et initialisées
3. ✅ Services démarrés sur leurs ports respectifs
4. ✅ Token Auth0 valide avec claims appropriés

## Scénarios de Test

### Scénario 1 : Première Connexion depuis Accounting Service

**Contexte** : Un utilisateur d'institution financière se connecte pour la première fois depuis l'app accounting.

**Étapes** :
1. Faire un appel avec token Auth0 vers l'accounting service
2. Vérifier que l'accounting service appelle `/users/sync/cross-service`
3. Vérifier que Customer Service émet l'événement `user.login`
4. Vérifier que l'utilisateur est créé dans accounting service via consumer
5. Vérifier que l'utilisateur est créé dans Customer Service

**Commandes de test** :

```bash
# 1. Tester l'endpoint accounting avec token Auth0
curl -X GET "http://localhost:3002/health" \
  -H "Authorization: Bearer YOUR_AUTH0_TOKEN" \
  -H "Content-Type: application/json"

# 2. Vérifier les logs du Customer Service
docker logs customer-service-container

# 3. Vérifier les logs de l'Accounting Service
docker logs accounting-service-container

# 4. Vérifier l'utilisateur dans Customer Service DB
docker exec kiota-postgres psql -U postgres -d customer-service -c \
  "SELECT id, auth0_id, email, name, user_type FROM users WHERE auth0_id = 'auth0|YOUR_USER_ID';"

# 5. Vérifier l'utilisateur dans Accounting Service DB
docker exec kiota-postgres psql -U postgres -d accounting-service -c \
  "SELECT id, auth0_id, email, first_name, last_name FROM users WHERE auth0_id = 'auth0|YOUR_USER_ID';"
```

### Scénario 2 : Première Connexion depuis Gestion Commerciale Service

**Contexte** : Un utilisateur PME se connecte pour la première fois depuis l'app gestion commerciale.

**Étapes** :
1. Faire un appel avec token Auth0 vers le gestion commerciale service
2. Vérifier la synchronisation cross-service
3. Vérifier la propagation des événements
4. Vérifier la création locale des utilisateurs

**Commandes de test** :

```bash
# 1. Tester l'endpoint gestion commerciale
curl -X GET "http://localhost:3003/health" \
  -H "Authorization: Bearer YOUR_SME_AUTH0_TOKEN" \
  -H "Content-Type: application/json"

# 2. Vérifier l'utilisateur dans Gestion Commerciale DB
docker exec kiota-postgres psql -U postgres -d gestion_commerciale_service -c \
  "SELECT id, auth0_id, email, first_name, last_name FROM users WHERE auth0_id = 'auth0|YOUR_SME_USER_ID';"
```

### Scénario 3 : Connexion Utilisateur Existant

**Contexte** : Un utilisateur déjà créé se reconnecte depuis une autre application.

**Étapes** :
1. Utiliser un utilisateur existant
2. Se connecter depuis un service différent
3. Vérifier la mise à jour des données
4. Vérifier l'émission d'événements de login

## Vérifications Kafka

### Surveiller les Events user.login

```bash
# Connecter au container Kafka
docker exec -it kafka-container bash

# Consommer les messages du topic user.login
kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic user.login --from-beginning --property print.key=true
```

### Messages Attendus

```json
{
  "userId": "uuid-user-id",
  "auth0Id": "auth0|user-id",
  "customerId": "uuid-customer-id",
  "companyId": "uuid-company-id",
  "financialInstitutionId": "uuid-institution-id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "CUSTOMER_ADMIN",
  "userType": "FINANCIAL_INSTITUTION",
  "accessibleApps": ["accounting"],
  "isFirstLogin": true,
  "metadata": {
    "source": "accounting-service",
    "crossServiceSync": true,
    "originService": "accounting-service"
  },
  "timestamp": "2025-01-XX..."
}
```

## Points de Vérification

### ✅ Logs Customer Service
- `🔄 Cross-service sync from accounting-service for user auth0|...`
- `🔄 [UserService] Starting syncUser for: { auth0Id: '...', email: '...', ... }`
- `✅ [UserService] User already exists:` ou `🆕 [UserService] Creating new user`

### ✅ Logs Accounting Service
- `🔄 Syncing user auth0|... with Customer Service`
- `✅ User sync successful for auth0|...`
- `User still not found after sync, creating locally as fallback` (si consumer lent)

### ✅ Logs Gestion Commerciale Service
- `🔄 Syncing user auth0|... with Customer Service`
- `Access denied: user auth0|... is not an SME user` (pour utilisateurs non-SME)

### ✅ Base de Données
- Utilisateur créé dans `customer-service.users`
- Utilisateur créé dans `accounting-service.users` (via consumer)
- Utilisateur créé dans `gestion_commerciale_service.users` (via consumer)
- `last_login_at` mis à jour pour connexions subséquentes

## Cas d'Erreur à Tester

### 1. Customer Service Indisponible
- L'accounting service doit créer l'utilisateur localement en fallback
- Logs : `Customer Service sync failed: ...`

### 2. Token Auth0 Invalide
- Rejet avec 401 Unauthorized
- Pas de synchronisation tentée

### 3. Claims Manquants dans Token
- Rejet avec `missing company_id or user_type`
- Logs d'avertissement appropriés

### 4. Service Non Autorisé
- Appel direct à `/users/sync/cross-service` sans headers appropriés
- Rejet avec `Service non autorisé`

## Surveillance Continue

### Métriques à Surveiller
- Taux de succès des synchronisations cross-service
- Temps de réponse des appels Customer Service
- Nombre d'utilisateurs créés en fallback
- Latence de propagation des événements Kafka

### Alertes Recommandées
- Échec de synchronisation > 5% sur 5 minutes
- Timeout Customer Service > 3 secondes
- Accumulation dans la queue Kafka

Cette solution garantit que **peu importe l'application** depuis laquelle un utilisateur se connecte, le Customer Service est informé et propage automatiquement les données vers tous les services concernés, avec un système de fallback robuste en cas de défaillance.
