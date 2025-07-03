# Customer Service - Tableau de bord Grafana

Ce dossier contient la configuration des tableaux de bord Grafana pour surveiller le service client.

## Tableaux de bord disponibles

1. **customer-service-overview.json** - Tableau de bord principal pour la surveillance du service client
2. **customer-service-api-metrics.json** - Métriques détaillées des API du service client
3. **customer-service-health.json** - Statut de santé et disponibilité du service client

## Installation

1. Assurez-vous que Grafana est installé et en cours d'exécution.
2. Importez les tableaux de bord JSON dans votre instance Grafana.
3. Configurez une source de données Prometheus pointant vers votre instance Prometheus.

## Configuration requise

- Grafana v9.0+
- Prometheus v2.40+
- Les métriques du service client doivent être exposées via le point de terminaison `/metrics`

## Métriques surveillées

Le tableau de bord principal surveille les métriques suivantes:

### Métriques d'utilisation
- Nombre total d'utilisateurs
- Nombre total de PME
- Nombre total d'institutions financières
- Nombre d'utilisateurs actifs

### Métriques de performance
- Temps de réponse des API
- Latence des opérations de base de données
- Durée des uploads de documents
- Taux d'erreur des API

### Métriques système
- Utilisation du CPU
- Utilisation de la mémoire
- Opérations de disque
- Connexions réseau

### Métriques métier
- Taux de création d'utilisateurs
- Taux de création de clients
- Nombre d'uploads de documents
- Statut des connexions utilisateurs

## Alertes configurées

Le tableau de bord contient des alertes préconfigurées pour:

1. Temps de réponse API élevé (>1s)
2. Taux d'erreur élevé (>5%)
3. Utilisation de la mémoire élevée (>80%)
4. Utilisation du CPU élevée (>70% pendant plus de 5 minutes)
5. Échec des vérifications de santé

## Personnalisation

Vous pouvez personnaliser les tableaux de bord en:

1. Ajustant les seuils d'alerte
2. Modifiant les périodes de temps affichées
3. Ajoutant des métriques supplémentaires
4. Changeant la disposition des panneaux
