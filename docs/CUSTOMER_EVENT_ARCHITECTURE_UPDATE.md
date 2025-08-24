# Mise à jour de l'Architecture Événementielle Customer Service

## Vue d'ensemble

Cette mise à jour corrige l'architecture événementielle pour s'assurer que le service portfolio-institution utilise correctement les événements du customer service au lieu des événements d'organisation.

## Changements Effectués

### 1. Configuration Kafka Partagée (`packages/shared/src/events/kafka-config.ts`)

#### Nouveaux Événements Customer Service :
```typescript
export enum CustomerEventTopics {
  CUSTOMER_CREATED = 'customer.created',
  CUSTOMER_UPDATED = 'customer.updated',
  CUSTOMER_SYNC_REQUEST = 'customer.sync.request',
  CUSTOMER_SYNC_RESPONSE = 'customer.sync.response',
}

export interface CustomerCreatedEvent {
  customerId: string;
  type: 'INSTITUTION' | 'SME';
  name: string;
  registrationNumber: string;
  licenseNumber?: string;
  taxId: string;
  vatNumber?: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  timestamp: string;
}

export interface CustomerUpdatedEvent {
  customerId: string;
  type: 'INSTITUTION' | 'SME';
  updatedFields: Partial<Omit<CustomerCreatedEvent, 'customerId' | 'type' | 'timestamp'>>;
  timestamp: string;
}

export interface CustomerSyncRequestEvent {
  customerId: string;
  requestId: string;
  requestedBy: string;
  timestamp: string;
}

export interface CustomerSyncResponseEvent {
  customerId: string;
  requestId: string;
  found: boolean;
  customerData?: CustomerCreatedEvent;
  timestamp: string;
}
```

### 2. Portfolio Institution Service - Consumer Events

#### Fichier : `apps/portfolio-institution-service/src/modules/events/consumers/institution-events.consumer.ts`

**AVANT** : Écoutait les événements d'organisation
```typescript
@EventPattern(OrganizationEventTopics.ORGANIZATION_CREATED)
@EventPattern(OrganizationEventTopics.ORGANIZATION_UPDATED)
@EventPattern(OrganizationEventTopics.ORGANIZATION_SYNC_RESPONSE)
```

**APRÈS** : Écoute les événements customer avec filtrage par type
```typescript
@EventPattern(CustomerEventTopics.CUSTOMER_CREATED)
async handleCustomerCreated(@Payload() event: CustomerCreatedEvent): Promise<void> {
  // Traiter seulement les institutions financières
  if (event.type !== 'INSTITUTION') {
    this.logger.log(`Skipping customer ${event.customerId} - not an institution`);
    return;
  }
  // ... traitement des institutions
}

@EventPattern(CustomerEventTopics.CUSTOMER_UPDATED)
@EventPattern(CustomerEventTopics.CUSTOMER_SYNC_RESPONSE)
```

### 3. Portfolio Institution Service - Auth Service

#### Fichier : `apps/portfolio-institution-service/src/modules/auth/services/auth.service.ts`

**AVANT** : Émettait des requêtes de synchronisation d'organisation
```typescript
const syncEvent: OrganizationSyncRequestEvent = {
  organizationId: institutionId,
  // ...
};
this.kafkaClient.emit(OrganizationEventTopics.ORGANIZATION_SYNC_REQUEST, syncEvent);
```

**APRÈS** : Émet des requêtes de synchronisation customer
```typescript
const syncEvent: CustomerSyncRequestEvent = {
  customerId: institutionId,
  requestId: `portfolio_institution_${institutionId}_${Date.now()}`,
  requestedBy: 'portfolio_institution_service',
  timestamp: new Date().toISOString()
};
this.kafkaClient.emit(CustomerEventTopics.CUSTOMER_SYNC_REQUEST, syncEvent);
```

## Architecture Terminologique Clarifiée

### Customer Service (Source de Vérité)
- **Terminologie** : Tout est un "customer"
- **Types** : `INSTITUTION` pour les institutions financières, `SME` pour les PME
- **Événements** : `CustomerEventTopics.*`

### Services Consommateurs

#### Accounting Service
- **Terminologie** : "organization" 
- **Filtrage** : Écoute tous les types de customers
- **Événements** : Toujours `OrganizationEventTopics.*`

#### Gestion Commerciale Service  
- **Terminologie** : "company"
- **Filtrage** : Écoute `type === 'SME'` uniquement
- **Événements** : Toujours `OrganizationEventTopics.*` (pour compatibilité)

#### Portfolio Institution Service
- **Terminologie** : "institution"
- **Filtrage** : Écoute `type === 'INSTITUTION'` uniquement  
- **Événements** : **CORRIGÉ** pour utiliser `CustomerEventTopics.*`

## Avantages de cette Architecture

### 1. Séparation Claire des Responsabilités
- Customer Service : Authorité unique pour tous les clients
- Services métier : Spécialisés par domaine avec filtrage approprié

### 2. Cohérence Terminologique
- Customer Service utilise "customer" pour tout
- Chaque service utilise sa terminologie métier appropriée
- Filtrage par type permet la spécialisation

### 3. Évolutivité
- Ajout facile de nouveaux types de customers
- Services peuvent ignorer les types qui ne les concernent pas
- API Gateway peut router vers le bon service selon le type

## Flux d'Authentification Corrigé

### Portfolio Institution Service

1. **Validation JWT** → Extraction userId
2. **Vérification locale** → Recherche institution par userId
3. **Si manquante** → Émission `CustomerEventTopics.CUSTOMER_SYNC_REQUEST`
4. **Réception** → `CustomerEventTopics.CUSTOMER_SYNC_RESPONSE` 
5. **Filtrage** → Si `type === 'INSTITUTION'` → Synchronisation
6. **Accès** → Accordé uniquement si institution trouvée

## Tests de Validation

### À Implémenter
1. **Test Customer Service** : Création d'institution avec `type: 'INSTITUTION'`
2. **Test Portfolio Service** : Réception et filtrage des événements
3. **Test Authentication** : Vérification du flux complet
4. **Test Error Handling** : Gestion des institutions manquantes

## Prochaines Étapes

1. **Implémentation Customer Service** : Événements customer avec types
2. **Tests d'Intégration** : Validation du flux complet
3. **Documentation API** : Mise à jour des spécifications
4. **Migration Data** : Si nécessaire pour les données existantes

---

**Date de Mise à Jour** : $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Auteur** : GitHub Copilot
**Version** : 1.0
