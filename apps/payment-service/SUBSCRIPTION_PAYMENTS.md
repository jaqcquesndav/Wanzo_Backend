# Payment Service - Support des Paiements de Plans d'Abonnement

## Vue d'Ensemble

Le payment-service a été étendu pour supporter les paiements de plans d'abonnement en plus des paiements génériques existants. Cette implémentation respecte la nouvelle politique de Wanzo : **les clients paient pour des plans qui incluent des tokens, non pour des tokens individuels**.

## Architecture

### 1. Compatibilité Rétrograde

L'implémentation préserve 100% de la compatibilité avec l'existant :
- ✅ L'entité `PaymentTransaction` existante reste inchangée
- ✅ Les endpoints SerdiPay existants continuent de fonctionner
- ✅ Le `SerdiPayProvider` n'a pas été modifié
- ✅ Les callbacks existants sont toujours traités

### 2. Nouvelles Fonctionnalités

#### Entité PaymentTransaction Étendue
```typescript
// Nouvelles colonnes ajoutées (nullable pour rétrocompatibilité)
paymentType?: string;        // 'subscription' | 'token' | null
customerId?: string;         // Client qui effectue le paiement  
planId?: string;            // Plan acheté (si subscription)
subscriptionId?: string;    // Référence vers customer-service
```

#### Nouveau DTO pour les Paiements de Plans
```typescript
export class InitiateSubscriptionPaymentDto {
  // Champs SerdiPay (inchangés)
  clientPhone!: string;
  amount!: number;
  currency!: string;
  telecom!: TelecomCode;
  
  // Nouveaux champs pour les subscriptions
  planId!: string;
  customerId!: string;
  planType!: SubscriptionPlanType;
  planName!: string;
  tokensIncluded?: number;
  existingSubscriptionId?: string; // Pour renouvellements
}
```

## Flux de Paiement de Subscription

### 1. Initiation du Paiement
```
1. Frontend/API → POST /subscriptions/payments/initiate
2. Validation du plan avec customer-service
3. Vérification montant vs prix du plan
4. Appel SerdiPay via infrastructure existante
5. Création PaymentTransaction avec nouveaux champs
6. Émission événement Kafka 'subscription.payment.initiated'
```

### 2. Callback SerdiPay
```
1. SerdiPay → POST /subscriptions/payments/callback
2. Traitement via SerdiPayProvider existant
3. Mise à jour statut PaymentTransaction
4. Si SUCCESS:
   - Création/renouvellement subscription dans customer-service
   - Émission événement 'subscription.payment.completed'
5. Si FAILED:
   - Émission événement 'subscription.payment.failed'
```

## Endpoints Ajoutés

### POST `/subscriptions/payments/initiate`
Initie un paiement mobile money pour un plan d'abonnement.

**Request:**
```json
{
  "clientPhone": "243994972450",
  "amount": 50.00,
  "currency": "CDF", 
  "telecom": "AM",
  "planId": "plan-uuid",
  "customerId": "customer-uuid",
  "planType": "monthly",
  "planName": "Standard Monthly Plan",
  "tokensIncluded": 1000
}
```

**Response:**
```json
{
  "transactionId": "transaction-uuid",
  "providerTransactionId": "serdipay-tx-id",
  "sessionId": "serdipay-session-id", 
  "status": "pending",
  "plan": {
    "id": "plan-uuid",
    "name": "Standard Monthly Plan",
    "tokensIncluded": 1000
  }
}
```

### POST `/subscriptions/payments/callback`
Endpoint webhook pour les callbacks SerdiPay (utilise le DTO existant).

### GET `/subscriptions/payments/customer/:customerId`
Récupère l'historique des paiements de subscription d'un client.

### GET `/subscriptions/payments/:transactionId`
Récupère les détails d'une transaction de subscription spécifique.

## Intégration avec Customer Service

### Validation des Plans
```typescript
GET /subscriptions/plans/{planId}?customerId={customerId}
```
Valide que le plan existe et est disponible pour le client.

### Création de Subscription
```typescript
POST /subscriptions
{
  "customerId": "uuid",
  "planId": "uuid", 
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-02-01T00:00:00Z",
  "amount": 50.00,
  "paymentMethod": "mobile_money",
  "paymentReference": "payment-transaction-id"
}
```

### Renouvellement de Subscription
```typescript
POST /subscriptions/{subscriptionId}/renew
{
  "endDate": "2025-03-01T00:00:00Z",
  "paymentReference": "payment-transaction-id"
}
```

## Événements Kafka

### 1. subscription.payment.initiated
Émis lors de l'initiation d'un paiement de subscription.

### 2. subscription.payment.completed  
Émis lors du succès d'un paiement de subscription.

### 3. subscription.payment.failed
Émis lors de l'échec d'un paiement de subscription.

### 4. subscription.payment.action_required
Émis quand une intervention manuelle est nécessaire.

## Configuration

### Variables d'Environnement
```bash
# Existantes (inchangées)
SERDIPAY_BASE_URL=https://serdipay.com/api/public-api/v1
SERDIPAY_EMAIL=your-email
SERDIPAY_PASSWORD=your-password
SERDIPAY_API_ID=your-api-id
SERDIPAY_API_PASSWORD=your-api-password
SERDIPAY_MERCHANT_CODE=your-merchant-code
SERDIPAY_MERCHANT_PIN=your-pin

# Nouvelles
CUSTOMER_SERVICE_URL=http://customer-service:3000
```

## Migration Base de Données

```sql
-- Ajout des nouvelles colonnes (nullable pour rétrocompatibilité)
ALTER TABLE payment_transactions 
ADD COLUMN payment_type VARCHAR(50) NULL,
ADD COLUMN customer_id UUID NULL,
ADD COLUMN plan_id UUID NULL, 
ADD COLUMN subscription_id UUID NULL;

-- Index pour les requêtes
CREATE INDEX idx_payment_transactions_customer_id ON payment_transactions(customer_id);
CREATE INDEX idx_payment_transactions_plan_id ON payment_transactions(plan_id);
CREATE INDEX idx_payment_transactions_subscription_id ON payment_transactions(subscription_id);
```

## Tests et Validation

### Tests Unitaires
- [ ] SubscriptionPaymentService.initiateSubscriptionPayment()
- [ ] SubscriptionPaymentService.handleSubscriptionPaymentCallback()
- [ ] SubscriptionPaymentEventsService événements

### Tests d'Intégration
- [ ] Flux complet : initiation → SerdiPay → callback → customer-service
- [ ] Validation des plans avec customer-service
- [ ] Création/renouvellement de subscriptions
- [ ] Émission d'événements Kafka

### Tests E2E
- [ ] Paiement mobile money Airtel Money complet
- [ ] Paiement Orange Money complet
- [ ] Gestion des échecs de paiement
- [ ] Renouvellement de subscription existante

## Monitoring et Observabilité

### Logs Structurés
Tous les événements de paiement de subscription sont loggés avec :
- Transaction ID
- Customer ID  
- Plan ID
- Montant et devise
- Statut du paiement
- Timestamps

### Métriques Recommandées
- Nombre de paiements de subscription initiés
- Taux de succès/échec par opérateur télécom
- Temps de traitement moyen des callbacks
- Délai entre paiement et création de subscription

## Roadmap

### Phase 1 ✅
- Support des paiements de plans via SerdiPay
- Intégration avec customer-service
- Événements Kafka basiques

### Phase 2 (À venir)
- Intégration Kafka complète avec @wanzobe/shared
- Retry automatique pour les échecs
- Support d'autres providers de paiement
- Dashboard de monitoring des paiements

### Phase 3 (À venir)  
- Paiements récurrents automatiques
- Gestion des remboursements
- Support des promotions et codes de réduction

## Support et Dépannage

### Erreurs Communes

**Plan non trouvé**
```
Status: 400 Bad Request
Message: "Plan {planId} not found or not available for customer {customerId}"
```

**Montant incorrect**
```
Status: 400 Bad Request  
Message: "Amount mismatch. Expected: 50.00 CDF, Received: 45.00 CDF"
```

**Échec SerdiPay**
```
Status: 400 Bad Request
Message: "Payment initiation failed: {error details}"
```

### Logs à Vérifier
```bash
# Logs payment-service
kubectl logs -f deployment/payment-service

# Filtrer par customer
kubectl logs -f deployment/payment-service | grep "customer-uuid"

# Filtrer par transaction
kubectl logs -f deployment/payment-service | grep "transaction-uuid"
```