# 🔒 CORRECTIONS SÉCURITÉ CRITIQUES - STRIPE WEBHOOKS

## PROBLÈMES IDENTIFIÉS

### 1. DOUBLE TRAITEMENT WEBHOOK - RISQUE MAJEUR
- Customer-service traite ET délègue les webhooks
- Possible corruption de données et incohérences

### 2. GESTION D'ERREURS DANGEREUSE  
- Webhooks invalides traités en cas d'erreur de validation
- Contournement possible de la sécurité

### 3. EXPOSITION DE DONNÉES SENSIBLES
- Signatures et payloads Stripe en clair dans Kafka
- Risque de replay attacks

## CORRECTIONS REQUISES

### CORRECTION 1: Délégation exclusive
```typescript
// AVANT (DANGEREUX)
if (webhookSecret) {
  try {
    const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    
    // Émettre vers Kafka
    await this.customerEventsProducer.emitSubscriptionEvent({...});
    
    // ET traiter localement - PROBLÈME!
    switch (event.type) {
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;
    }
  } catch (webhookError) {
    this.logger.warn('Erreur validation webhook local, mais délégation réussie', webhookError);
  }
}

// APRÈS (SÉCURISÉ)
if (webhookSecret) {
  const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  
  // SEULEMENT déléguer - pas de traitement local
  await this.customerEventsProducer.emitSubscriptionEvent({
    type: 'stripe.webhook.received',
    subscriptionId: this.extractSubscriptionId(event) || 'unknown',
    customerId: this.extractCustomerId(event) || 'unknown',
    timestamp: new Date(),
    metadata: {
      eventType: event.type,
      eventId: event.id,
      // NE PAS inclure signature et rawPayload
    }
  });
  
  // Le payment-service traitera tout
} else {
  throw new Error('STRIPE_WEBHOOK_SECRET manquant - webhook rejeté');
}
```

### CORRECTION 2: Validation stricte
```typescript
// AVANT (DANGEREUX)
} catch (webhookError) {
  this.logger.warn('Erreur validation webhook local, mais délégation réussie', webhookError);
}

// APRÈS (SÉCURISÉ)
} catch (webhookError) {
  this.logger.error('Webhook signature invalide - rejeté', webhookError);
  throw new BadRequestException('Webhook signature invalide');
}
```

### CORRECTION 3: Sécurisation Kafka
```typescript
// AVANT (EXPOSÉ)
metadata: {
  eventType: event.type,
  eventId: event.id,
  signature,              // ← DANGEREUX
  rawPayload: payload     // ← DANGEREUX
}

// APRÈS (SÉCURISÉ)
metadata: {
  eventType: event.type,
  eventId: event.id,
  // signature et rawPayload supprimés
  processedAt: new Date().toISOString(),
  source: 'customer-service'
}
```

## ARCHITECTURE RECOMMANDÉE

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Customer-Service│    │  Payment-Service │    │  Admin-Service  │
│                 │    │                  │    │                 │
│ 1. Reçoit webhook│    │ 2. Traite tout   │    │ 3. Analytics    │
│ 2. Valide signature    │    le business       │    seulement    │
│ 3. Délègue SEULEMENT│    │    logic via Kafka  │                 │
│    via Kafka     │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## TESTS DE SÉCURITÉ REQUIS

1. **Test signature invalide** : Vérifier rejet complet
2. **Test replay attack** : Vérifier timestamp validation  
3. **Test double traitement** : Vérifier cohérence données
4. **Test Kafka security** : Vérifier pas d'exposition payload

## MONITORING SÉCURITÉ

```typescript
// Ajout dans webhook handler
this.logger.log('Webhook security metrics', {
  eventId: event.id,
  eventType: event.type,
  signatureValid: true,
  delegatedToPaymentService: true,
  localProcessing: false, // Doit être false
  timestamp: new Date()
});
```