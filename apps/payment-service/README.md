# Payment Service (Wanzo)

Service centralisé de paiements. Première intégration: SerdiPay (Mobile Money AM/OM/MP/AF). Extensible (Stripe, PayPal, cartes) via un pattern de Provider.

- Langage/Framework: NestJS 10
- Observabilité: Prometheus (intercepteur HTTP)
- Persistance: Postgres via TypeORM (table `payment_transactions`)
- Événements: Kafka (topic `finance.payment.received`)

## Endpoints clés (via API Gateway)
- POST /payments/serdipay/mobile (sécurisé JWT)
- POST /payments/serdipay/callback (public – sans JWT, utilisé par SerdiPay)

Consultez la documentation détaillée dans `docs/payment-service-api.md`.

## Swagger / OpenAPI
- Service (Nest réel): http://localhost:3007/api/docs (UI) et http://localhost:3007/api/docs-json (JSON)
- Via API Gateway (proxy): le proxy n’agrège pas Swagger. Utilisez les exemples fournis et l’OpenAPI fourni dans `docs/payment-service.openapi.yaml`.

## Variables d’environnement (extrait)
- SERDIPAY_BASE_URL, SERDIPAY_EMAIL, SERDIPAY_PASSWORD, SERDIPAY_API_ID, SERDIPAY_API_PASSWORD, SERDIPAY_MERCHANT_CODE, SERDIPAY_MERCHANT_PIN
- DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
- KAFKA_BROKERS, KAFKA_CLIENT_ID, KAFKA_GROUP_ID

## Démarrage (local rapide via Docker Compose)
- Le Dockerfile exécute un mock Express minimal par défaut pour accélérer l’orchestration. Les routes mock reflètent les chemins exposés par le service réel après proxy.

## Points d’intégration inter-services
- Publication d’événements: `finance.payment.received` (voir docs)
- Lecture transactionnelle: table `payment_transactions` (statuts: pending | success | failed)

