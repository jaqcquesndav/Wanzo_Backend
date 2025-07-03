# Tests unitaires et surveillance pour le customer-service

Ce document explique comment exécuter les tests unitaires et configurer la surveillance avec Prometheus et Grafana pour le service client.

## Tests unitaires

### Structure des tests

Les tests unitaires sont organisés par module et suivent la structure du code source :

```
src/
  modules/
    users/
      controllers/
        __tests__/             <- Tests des contrôleurs utilisateurs
          user.controller.spec.ts
          admin-user.controller.spec.ts
      services/
        __tests__/             <- Tests des services utilisateurs
          user.service.spec.ts
    customers/
      controllers/
        __tests__/             <- Tests des contrôleurs clients
          company.controller.spec.ts
          financial-institution.controller.spec.ts
      services/
        __tests__/             <- Tests des services clients
          sme.service.spec.ts
          institution.service.spec.ts
    cloudinary/
      __tests__/               <- Tests du service Cloudinary
        cloudinary.service.spec.ts
    auth/
      guards/
        __tests__/             <- Tests des guards
          admin-role.guard.spec.ts
    kafka/
      producers/
        __tests__/             <- Tests des producteurs Kafka
          customer-events.producer.spec.ts
```

### Exécution des tests

Pour exécuter tous les tests unitaires :

```powershell
cd apps/customer-service
npm test
```

Pour exécuter un fichier de test spécifique :

```powershell
cd apps/customer-service
npm test -- src/modules/users/services/__tests__/user.service.spec.ts
```

Pour exécuter les tests avec couverture :

```powershell
cd apps/customer-service
npm test -- --coverage
```

### Configuration des tests

Les tests utilisent Jest comme framework de test. La configuration se trouve dans `jest.config.js` à la racine du service.

Le fichier `test/setup-jest.ts` contient la configuration globale pour les tests, y compris les mocks pour TypeORM, Kafka et Cloudinary.

## Surveillance avec Prometheus et Grafana

### Architecture de surveillance

Le customer-service inclut :
- Un module de santé (HealthModule) pour vérifier l'état du service et des dépendances
- Un module de surveillance (MonitoringModule) pour exposer les métriques Prometheus

### Métriques disponibles

Les métriques suivantes sont collectées :

1. **Métriques d'API**
   - Durée des requêtes HTTP
   - Comptage des requêtes par statut
   - Taux d'erreurs

2. **Métriques métier**
   - Nombre d'utilisateurs, SME et institutions
   - Création d'utilisateurs et clients
   - Upload de fichiers
   - Connexions utilisateurs

3. **Métriques système**
   - Utilisation du CPU
   - Utilisation de la mémoire
   - Opérations de disque

### Configuration de Prometheus

Prometheus est configuré dans le fichier `monitoring/prometheus.yml`. Le service expose ses métriques sur le point de terminaison `/metrics`.

### Tableaux de bord Grafana

Des tableaux de bord Grafana prêts à l'emploi sont disponibles dans `monitoring/grafana/` :

- `customer-service-overview.json` - Vue d'ensemble du service
- `customer-service-api-metrics.json` - Métriques détaillées des API
- `customer-service-health.json` - Statut de santé du service

### Démarrer la surveillance

1. Assurez-vous que Docker est installé
2. Lancez la pile de surveillance :

```powershell
cd monitoring
docker-compose up -d
```

3. Accédez à Grafana sur http://localhost:3000 (utilisateur: admin, mot de passe: admin)
4. Importez les tableaux de bord depuis le dossier `monitoring/grafana/`

### Points de terminaison de santé

Le service expose les points de terminaison suivants pour la surveillance de santé :

- `/health` - Vérification complète de la santé du service
- `/health/readiness` - Vérification de préparation (base de données, Kafka)
- `/health/liveness` - Vérification de vie (mémoire, CPU)

## Intégration continue

Les tests sont automatiquement exécutés dans le pipeline CI/CD. Le pipeline :

1. Exécute tous les tests unitaires
2. Vérifie la couverture de code
3. Construit le service
4. Déploie la version si les tests réussissent

## Résolution des problèmes

### Problèmes courants avec les tests

- **Mocks non définis** : Vérifiez que tous les dépendances externes sont correctement mockées dans `setup-jest.ts`
- **Erreurs de base de données** : Les tests utilisent un mock de TypeORM, vérifiez la configuration du mock
- **Erreurs asynchrones** : Utilisez async/await ou then/catch correctement dans les tests

### Problèmes de surveillance

- **Métriques manquantes** : Vérifiez que le service est correctement configuré dans `prometheus.yml`
- **Graphiques vides** : Vérifiez que Prometheus peut atteindre le service sur le réseau Docker
- **Erreurs Grafana** : Vérifiez que la source de données Prometheus est correctement configurée
