# Documentation Swagger des Microservices Wanzo

Ce document répertorie les URLs d'accès aux documentations Swagger/OpenAPI pour tous les microservices du projet Wanzo.

## État actuel des endpoints de documentation

**Note importante**: Les tentatives d'accès aux services retournent actuellement des erreurs 404 "Cannot GET /", indiquant que les services ne sont pas accessibles ou ne fonctionnent pas correctement. Le message d'erreur spécifique est:

```json
{"success":false,"message":"Cannot GET /","data":null,"statusCode":404,"error":"Cannot GET /"}
```

Ce problème est plus fondamental que simplement l'absence de documentation Swagger et indique que:
- Les services peuvent ne pas être en cours d'exécution
- Les services ne sont pas correctement exposés ou accessibles
- Les ports peuvent être incorrectement mappés
- Les conteneurs Docker peuvent avoir des problèmes de réseau

## URLs des Documentations API (issues du code source)

### Customer Service
- **Documentation URL**: `/api/docs`
- **Port**: 3011
- **URL complète**: http://localhost:3011/api/docs
- **État actuel**: Cannot GET /api/docs
- **Description**: API pour la gestion des clients, utilisateurs, abonnements et tokens

### Admin Service
- **Documentation URL**: `/api-docs`
- **Port**: 3001
- **URL complète**: http://localhost:3001/api-docs
- **État actuel**: Cannot GET /api-docs
- **Description**: Documentation complète des API du service d'administration Wanzo (gestion des utilisateurs, des entreprises, des finances, etc.)

### Accounting Service
- **Documentation URL**: `/api`
- **Port**: 3003
- **URL complète**: http://localhost:3003/api
- **État actuel**: Cannot GET /api
- **Description**: The Kiota Accounting Service API documentation

### Portfolio Institution Service
- **Documentation URL**: `/api-docs`
- **Port**: 3004
- **URL complète**: http://localhost:3004/api-docs
- **État actuel**: Cannot GET /api-docs
- **Description**: API pour la gestion des portefeuilles de crédits institutionnels

### Gestion Commerciale Service
- **Documentation URL**: `/api/docs`
- **Port**: 3005
- **URL complète**: http://localhost:3005/api/docs
- **État actuel**: Cannot GET /api/docs
- **Description**: Documentation complète des API du service mobile Wanzo

## Problèmes et solutions pour accéder aux services et leur documentation

### Causes possibles des erreurs "Cannot GET /"

1. **Services non démarrés**: Les conteneurs peuvent être créés mais ne sont pas en cours d'exécution.

2. **Problèmes de réseau Docker**: Des problèmes de configuration réseau empêchent l'accès aux conteneurs.

3. **Mauvais mapping de ports**: Les ports exposés des conteneurs ne correspondent pas aux ports attendus.

4. **Configuration incorrecte**: Les services ne sont pas correctement configurés pour répondre aux requêtes HTTP.

5. **Problèmes d'initialisation**: Les services peuvent avoir rencontré des erreurs au démarrage et ne fonctionnent pas correctement.

### Solutions proposées

1. **Vérifier l'état des conteneurs Docker**:
   ```bash
   docker ps
   ```
   Assurez-vous que tous les conteneurs sont en état "Up" et "healthy".

2. **Vérifier les logs des conteneurs** pour identifier d'éventuelles erreurs:
   ```bash
   docker logs <container_name>
   ```

3. **Tester la connectivité de base** avec chaque conteneur:
   ```bash
   docker exec -it <container_name> curl localhost:<internal_port>
   ```

4. **Vérifier le mapping des ports** entre l'hôte et les conteneurs:
   ```bash
   docker port <container_name>
   ```

5. **Reconstruire et redémarrer les conteneurs** si nécessaire:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

6. **Ajouter une configuration réseau Docker explicite** pour assurer la communication entre les conteneurs:
   ```yaml
   networks:
     wanzo-network:
       driver: bridge
   ```
   Et pour chaque service:
   ```yaml
   networks:
     - wanzo-network
   ```

## Implémentation d'une API de documentation simplifiée

Si les problèmes d'accès persistent, une solution pratique est d'ajouter un endpoint de documentation simple dans notre API Gateway mock. Voici une implémentation que vous pouvez ajouter à `mock-service-simple.js` :

```javascript
// Documentation centralisée des APIs
app.get('/api-docs', (req, res) => {
  res.json({
    apiGateway: {
      version: '1.0',
      services: {
        admin: {
          description: 'Service d\'administration',
          baseUrl: services.admin,
          endpoints: [
            { path: '/api/users', method: 'GET', description: 'Liste tous les utilisateurs' },
            { path: '/api/users/:id', method: 'GET', description: 'Détails d\'un utilisateur' }
          ]
        },
        customer: {
          description: 'Service client',
          baseUrl: services.customer,
          endpoints: [
            { path: '/api/customers', method: 'GET', description: 'Liste tous les clients' },
            { path: '/api/customers/:id', method: 'GET', description: 'Détails d\'un client' },
            { path: '/api/subscriptions', method: 'GET', description: 'Liste tous les abonnements' }
          ]
        },
        // Ajouter les autres services...
      }
    }
  });
});
```

Cette solution documentera les endpoints disponibles directement dans l'API Gateway jusqu'à ce que la documentation Swagger complète soit accessible.
