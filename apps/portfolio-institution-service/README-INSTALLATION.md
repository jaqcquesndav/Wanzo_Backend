# Portfolio Institution Service - Installation et Dépannage

## Installation des dépendances

Pour installer toutes les dépendances nécessaires à l'exécution de ce service:

```bash
npm install
```

## Dépannage des erreurs de démarrage

### Erreur: "command finished with error: command C:\nvm4w\nodejs\npm.cmd run dev exited (1)"

Cette erreur peut être causée par des dépendances manquantes dans le fichier `package.json`. Les dépendances suivantes sont essentielles au bon fonctionnement du service:

#### 1. Dépendances OpenTelemetry (Tracing)

Le service utilise OpenTelemetry pour le traçage des requêtes. Les packages suivants sont requis:

```json
"@opentelemetry/auto-instrumentations-node": "^0.43.0",
"@opentelemetry/exporter-prometheus": "^0.48.0",
"@opentelemetry/resources": "^1.22.0",
"@opentelemetry/sdk-node": "^0.48.0",
"@opentelemetry/sdk-trace-base": "^1.22.0",
"@opentelemetry/semantic-conventions": "^1.22.0",
```

#### 2. Dépendances de sécurité et de journalisation

```json
"helmet": "^7.1.0",
"nest-winston": "^1.10.0",
"winston": "^3.11.0"
```

### Autres problèmes potentiels

1. **Modules partagés**: Le service utilise le module partagé `@wanzo/shared/events/kafka-config`. Assurez-vous que ce module est correctement installé et accessible.

2. **Variables d'environnement**: Le service a besoin de certaines variables d'environnement. Assurez-vous qu'un fichier `.env` est présent dans le dossier du service.

## Scripts disponibles

- `npm run dev`: Compile et exécute le service en mode développement
- `npm start`: Exécute le service compilé
- `npm run build`: Compile le service
- `npm test`: Exécute les tests unitaires
- `npm run test:integration`: Exécute les tests d'intégration
- `npm run test:e2e`: Exécute les tests de bout en bout

## Mise à jour des dépendances

Si vous ajoutez de nouvelles fonctionnalités qui nécessitent des dépendances supplémentaires, assurez-vous de les ajouter au fichier `package.json` en utilisant:

```bash
npm install nom-package --save  # Pour les dépendances de production
npm install nom-package --save-dev  # Pour les dépendances de développement
```

## Connexion à Kafka

Ce service se connecte à Kafka en utilisant la configuration définie dans le module partagé `@wanzo/shared/events/kafka-config`. Assurez-vous que Kafka est correctement configuré et accessible.
