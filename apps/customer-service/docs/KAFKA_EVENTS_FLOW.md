# Communication entre les services via Kafka

## Vue d'ensemble

Ce document décrit les événements Kafka utilisés pour la communication entre les différents services, en particulier avec le `customer-service` qui gère de manière centralisée les données clients.

## Types d'événements

### Événements émis par customer-service

#### Événements customer
- `customer.created` - Émis lorsqu'un nouveau client est créé
- `customer.updated` - Émis lorsque les informations d'un client sont mises à jour
- `customer.validated` - Émis lorsqu'un client est validé par un administrateur
- `customer.suspended` - Émis lorsqu'un client est suspendu
- `customer.reactivated` - Émis lorsqu'un client suspendu est réactivé
- `customer.deleted` - Émis lorsqu'un client est supprimé

#### Événements utilisateur
- `user.created` - Émis lorsqu'un nouvel utilisateur est créé
- `user.updated` - Émis lorsque les informations d'un utilisateur sont mises à jour
- `user.deleted` - Émis lorsqu'un utilisateur est supprimé
- `user.password.reset` - Émis lorsqu'une demande de réinitialisation de mot de passe est effectuée

#### Événements abonnement
- `subscription.created` - Émis lorsqu'un nouvel abonnement est créé
- `subscription.updated` - Émis lorsqu'un abonnement est mis à jour
- `subscription.renewed` - Émis lorsqu'un abonnement est renouvelé
- `subscription.cancelled` - Émis lorsqu'un abonnement est annulé
- `subscription.expired` - Émis lorsqu'un abonnement expire

#### Événements token
- `token.purchased` - Émis lorsque des tokens sont achetés
- `token.used` - Émis lorsque des tokens sont utilisés
- `token.allocated` - Émis lorsque des tokens sont alloués gratuitement à un client

### Événements reçus par customer-service

#### Requêtes de données
- `customer.data.request` - Demande de données client par un autre service
- `customer.update.request` - Demande de mise à jour de données client

#### Actions administratives
- `admin.customer.action` - Action administrative sur un client (validation, suspension, etc.)

#### Requêtes spécifiques par service
- `accounting.customer.request` - Demandes spécifiques du service de comptabilité
- `mobile.user.action` - Actions utilisateur venant de l'application mobile
- `portfolio-sme.customer.update` - Mises à jour des données PME
- `portfolio-institution.customer.update` - Mises à jour des données institution

## Format des événements

### Événement customer.created
```json
{
  "customerId": "uuid",
  "customerType": "sme|institution",
  "timestamp": "ISO8601",
  "targetService": "service-name"
}
```

### Événement customer.updated
```json
{
  "customerId": "uuid", 
  "updatedFields": ["field1", "field2"],
  "timestamp": "ISO8601",
  "targetService": "service-name"
}
```

### Événement customer.validated
```json
{
  "customerId": "uuid",
  "adminId": "uuid",
  "timestamp": "ISO8601",
  "targetService": "service-name"
}
```

### Événement customer.suspended
```json
{
  "customerId": "uuid",
  "adminId": "uuid",
  "reason": "text",
  "timestamp": "ISO8601",
  "targetService": "service-name"
}
```

## Flux d'événements entre services

### 1. Admin-service → Customer-service
- L'admin-service envoie des actions administratives via `admin.customer.action`
- L'admin-service peut demander des données via `customer.data.request`
- L'admin-service peut demander des mises à jour via `customer.update.request`

### 2. Customer-service → Admin-service
- Le customer-service notifie de tous les événements liés aux clients
- Le customer-service répond aux requêtes de données sur un topic spécifique

### 3. Accounting-service ↔ Customer-service
- L'accounting-service demande des informations de facturation
- Le customer-service notifie des changements dans les abonnements et les tokens

### 4. Portfolio-services ↔ Customer-service
- Les services portfolio envoient des mises à jour des informations spécifiques
- Le customer-service notifie des changements de statut des clients

### 5. App-mobile-service ↔ Customer-service
- L'app-mobile-service envoie des actions utilisateur
- Le customer-service notifie des changements de statut client/utilisateur

## Implémentation

1. Chaque service doit implémenter les consumers Kafka nécessaires pour traiter les événements pertinents
2. Le customer-service utilise `CustomerEventsDistributor` pour propager les événements aux services concernés
3. La classe `ExternalRequestsConsumer` dans le customer-service traite les demandes entrantes

## Exemples d'utilisation

### Envoi d'une action administrative
```typescript
// Dans admin-service
await this.customerSyncService.performCustomerAction({
  customerId: "uuid",
  adminId: "admin-uuid",
  action: "validate",
  details: { notes: "Validation après vérification des documents" }
});
```

### Traitement d'un événement customer.validated
```typescript
// Dans un autre service
@OnEvent('customer.validated')
async handleCustomerValidated(data: any): Promise<void> {
  // Traiter l'événement de validation client
  console.log(`Client ${data.customerId} validé par ${data.adminId}`);
}
```

## Considérations de sécurité

1. Chaque service ne doit s'abonner qu'aux événements qui le concernent
2. Les autorisations sont vérifiées côté customer-service avant d'exécuter une action
3. Chaque service a des droits spécifiques sur les différentes ressources (customer, user, subscription)

## Monitoring

Tous les événements Kafka sont journalisés et peuvent être suivis via Prometheus et Grafana.
