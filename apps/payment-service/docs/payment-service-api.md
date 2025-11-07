# Payment Service – Documentation API

Cette documentation s’adresse aux équipes qui construisent, consomment ou opèrent les autres services (abonnements, tokens, facturation, etc.) et doivent communiquer avec le service de paiements.

Sommaire:
- Aperçu
- Design d’intégration
- Endpoints (via API Gateway)
- Modèles de données (requêtes/réponses)
- Gestion des erreurs
- Événements Kafka émis
- Sécurité & Authentification
- Bonnes pratiques & Idempotence

---

## 1) Aperçu
Le service orchestre les paiements et normalise les réponses. La première intégration est SerdiPay pour les canaux Mobile Money:
- AM, OM, MP, AF.

Le service expose:
- Un endpoint sécurisé (JWT) pour initier un paiement.
- Un endpoint public (sans JWT) utilisé par SerdiPay pour notifier l’issue (callback).

## 2) Design d’intégration
- Les appels clients passent par l’API Gateway sur le préfixe `/payments/*`.
- Le Gateway relaie vers le service Paiements et applique:
  - Auth obligatoire pour initiation;
  - Bypass d’auth pour `POST /payments/serdipay/callback` (webhook SerdiPay).
- Persistance: chaque initiation enregistre une ligne dans `payment_transactions`.
- Événements: en cas de succès, émission sur Kafka `finance.payment.received`.

Schéma simplifié:
Client -> API Gateway (/payments/...) -> Payment Service -> SerdiPay API
SerdiPay -> API Gateway (/payments/serdipay/callback) -> Payment Service

## 3) Endpoints via API Gateway
Base du Gateway (local): http://localhost:8000

1) Initier un paiement SerdiPay (sécurisé JWT)
- Méthode: POST
- URL: /payments/serdipay/mobile
- Auth: Authorization: Bearer <JWT>
- Corps: Voir "Modèles de données"
- Réponses:
  - 200: succès immédiat (rare)
  - 202: pending (cas courant: SerdiPay finalise via callback)
  - 4xx/5xx: erreur

2) Callback SerdiPay (public)
- Méthode: POST
- URL: /payments/serdipay/callback
- Auth: aucune (protégé par allowlist côté Gateway)
- Corps: payload callback SerdiPay
- Réponse: 200 { ok: true }

Exemples cURL:

Initier (JWT requis)
```
curl -X POST http://localhost:8000/payments/serdipay/mobile \
 -H "Authorization: Bearer <JWT>" \
 -H "Content-Type: application/json" \
 -d '{
   "clientPhone":"243994972450",
   "amount":400,
   "currency":"CDF",
   "telecom":"AM",
   "channel":"merchant",
   "clientReference":"order-12345"
 }'
```

Callback (public)
```
curl -X POST http://localhost:8000/payments/serdipay/callback \
 -H "Content-Type: application/json" \
 -d '{
   "status":200,
   "payment":{
     "status":"success",
     "transactionId":"tx-abc",
     "sessionId":"sess-1",
     "amount":400,
     "currency":"CDF"
   }
 }'
```

## 4) Modèles de données

Requête – InitiateSerdiPay
```
{
  "clientPhone": "string",   // ex: "243994972450"
  "amount": 400,              // nombre > 0
  "currency": "CDF",         // string (ex: CDF, USD)
  "telecom": "AM",           // enum: AM | OM | MP | AF
  "channel": "merchant",     // optional: "merchant" | "client" (default merchant)
  "clientReference": "..."   // optional: idempotence/traçage
}
```

Réponse – Initiate
```
{
  "status": "pending|success|failed",
  "httpStatus": 202|200|4xx|5xx,
  "message": "string",
  "transactionId": "string|null",  // id côté provider
  "sessionId": "string|null",
  "provider": "SerdiPay"
}
```

Payload – Callback SerdiPay
```
{
  "status": 200,
  "message": "...",      // optionnel
  "payment": {
    "status": "success|failed|...",
    "sessionId": "...", // optionnel
    "sessionStatus": 102, // optionnel
    "transactionId": "...",
    "amount": 400,        // optionnel
    "currency": "CDF"    // optionnel
  }
}
```

## 5) Gestion des erreurs
- 200: succès (rare en synchronisé)
- 202: pending (SerdiPay finalise asynchrone via callback)
- 4xx: erreur côté input/permissions (ex: 400, 401, 403, 409)
- 429: rate limit upstream
- 502: erreur amont (SerdiPay indisponible, etc.)

La colonne `status` de `payment_transactions` prendra `pending`, `success` ou `failed`.

## 6) Événements Kafka émis
Topic: `finance.payment.received`

Payload (exemple):
```
{
  "paymentId": "<uuid local ou transactionId>",
  "invoiceId": null,
  "customerId": null,
  "amount": 400,
  "currency": "CDF",
  "paymentDate": "2025-08-20T12:00:00.000Z",
  "timestamp": "2025-08-20T12:00:00.000Z"
}
```

Note: `invoiceId`/`customerId` sont laissés à null pour l’instant. Les services consommateurs (abonnements, tokens, compta) peuvent corréler via `clientReference` sauvegardé côté DB si besoin.

## 7) Sécurité & Authentification
- `POST /payments/serdipay/mobile`: JWT obligatoire via l’API Gateway.
- `POST /payments/serdipay/callback`: public (bypass JWT contrôlé par le Gateway) pour permettre le webhook SerdiPay.

## 8) Bonnes pratiques & Idempotence
- Utilisez `clientReference` pour:
  - éviter les doubles paiements en cas de retry;
  - tracer les opérations côté services appelants.
- Attendez l’événement ou un GET statut (à implémenter) pour valider l’issue finale si vous recevez `pending`.
- Logguez le `transactionId` (provider) et `sessionId` pour support.

## 9) Swagger / OpenAPI
- UI (service réel): http://localhost:3007/api/docs
- JSON: http://localhost:3007/api/docs-json
- Spécification portable: `docs/payment-service.openapi.yaml` (inclut serveurs Gateway et Service)

---

Contacts: Equipe Backend Wanzo
