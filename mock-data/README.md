# Données de Mock pour les Microservices Wanzo

Ce répertoire contient des données de mock pour tous les microservices de l'application Wanzo. Ces données sont structurées pour respecter l'architecture microservices où **chaque microservice possède sa propre base de données**.

## Structure du projet

- `index.js` - Point d'entrée pour accéder aux données mock de manière centralisée
- `db-loader.js` - Script pour charger les données dans les bases PostgreSQL de chaque service
- `customer-service.mock.js` - Données de mock pour le service client
- `accounting-service.mock.js` - Données de mock pour le service de comptabilité
- `gestion_commerciale_service.mock.js` - Données de mock pour le service de gestion commerciale
- (D'autres fichiers de mock seront ajoutés pour les services restants)

## Architecture des bases de données

Chaque microservice dispose de sa propre base de données PostgreSQL, conformément aux principes d'architecture microservices :

- **customer-service** : Gère les clients, utilisateurs et consommation de tokens
- **accounting-service** : Gère les journaux comptables, années fiscales et organisations
- **gestion_commerciale_service** : Gère les entreprises, fournisseurs et produits

Les données de mock sont organisées pour respecter cette séparation des données.

## Utilisation des scripts

### Pour générer des fichiers SQL

Générer un fichier SQL pour un service spécifique :
```bash
node db-loader.js generate customerService
```

Générer des fichiers SQL pour tous les services :
```bash
node db-loader.js generate
```

### Pour charger les données dans les bases de données

Charger les données dans la base d'un service spécifique (via fichier SQL) :
```bash
node db-loader.js load customerService
```

Charger les données dans la base d'un service spécifique (insertion directe) :
```bash
node db-loader.js load customerService --direct
```

Charger les données dans toutes les bases de données :
```bash
node db-loader.js load
```

## Configuration des connexions

Les connexions aux bases de données sont configurées dans le fichier `db-loader.js`. Par défaut, les scripts utilisent les valeurs suivantes, qui peuvent être remplacées par des variables d'environnement :

- Host: localhost
- Port: 5432
- User: postgres
- Password: postgres
- Database: nom_du_service_db (ex: customer_service_db)

## Variables d'environnement

Pour personnaliser les connexions aux bases de données, utilisez les variables d'environnement suivantes :

Pour customer-service :
```
CUSTOMER_DB_HOST
CUSTOMER_DB_PORT
CUSTOMER_DB_NAME
CUSTOMER_DB_USER
CUSTOMER_DB_PASSWORD
```

Pour accounting-service :
```
ACCOUNTING_DB_HOST
ACCOUNTING_DB_PORT
ACCOUNTING_DB_NAME
ACCOUNTING_DB_USER
ACCOUNTING_DB_PASSWORD
```

Pour gestion_commerciale_service :
```
GESTION_COMMERCIALE_DB_HOST
GESTION_COMMERCIALE_DB_PORT
GESTION_COMMERCIALE_DB_NAME
GESTION_COMMERCIALE_DB_USER
GESTION_COMMERCIALE_DB_PASSWORD
```

## Utilisation avec Docker

Si vous utilisez Docker, vous pouvez configurer les variables d'environnement dans votre fichier docker-compose.yml et exécuter les scripts dans le conteneur approprié.

Exemple pour exécuter le script dans un conteneur Docker :

```bash
docker-compose exec api-service node /app/mock-data/db-loader.js load customerService
```

## Extension des données de mock

Pour ajouter de nouvelles données de mock ou modifier les existantes, éditez le fichier correspondant au service concerné. Chaque fichier expose des helpers qui peuvent être utilisés pour générer facilement de nouvelles données.

## Notes importantes

1. Ces scripts vont uniquement **ajouter** des données aux bases existantes. Ils n'effectueront pas de migration de schéma.
2. Les données sont insérées avec `ON CONFLICT DO NOTHING` pour éviter les erreurs en cas de doublons.
3. Assurez-vous que les tables existent déjà avant d'exécuter les scripts.
