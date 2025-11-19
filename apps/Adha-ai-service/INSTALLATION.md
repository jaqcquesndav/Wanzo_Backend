# README: Installation et Configuration
# =====================================

## 🚀 Modifications Apportées

### ✅ Problèmes Résolus

1. **Idempotence (CRITIQUE)** ✅
   - Créé `ProcessedMessage` model pour tracking
   - Vérification automatique avant traitement
   - TTL de 7 jours avec cleanup automatique

2. **Vérification Quota AVANT Traitement (CRITIQUE)** ✅
   - Service `TokenReservationService` avec réservation/rollback
   - Estimation intelligente basée sur type et contenu
   - Ajustement après traitement (recrédite différence)
   - Protection contre race conditions avec `select_for_update()`

3. **Réinitialisation Mensuelle (CRITIQUE)** ✅
   - Management command `reset_monthly_tokens`
   - Cron job configuré pour le 1er du mois
   - Support dry-run et force mode

4. **State Management Asynchrone (MODÉRÉ)** ✅
   - Model `ProcessingRequest` pour tracking d'état
   - Stati: pending, processing, completed, failed, timeout
   - Cleanup automatique des requêtes abandonnées

5. **Retry Fonctionnel (MODÉRÉ)** ✅
   - Celery tasks pour retry asynchrone
   - Exponential backoff: 5s, 10s, 20s
   - Task périodique pour process pending retries

6. **Prévention Boucles (MODÉRÉ)** ✅
   - Limite retry à 3 dans `process_accounting_status_task()`
   - Envoi automatique en DLQ après max retries

## 📦 Installation

### 1. Migrations Django

```bash
cd apps/Adha-ai-service

# Créer les migrations
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Vérifier
python manage.py showmigrations
```

### 2. Configuration Celery

```bash
# Installer Celery si pas déjà fait
pip install celery redis

# Ajouter à requirements.txt
echo "celery>=5.3.0" >> requirements.txt
echo "redis>=4.5.0" >> requirements.txt
```

Ajouter à `adha_ai_service/settings.py`:

```python
# Celery Configuration
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes
```

Ajouter à `adha_ai_service/__init__.py`:

```python
from .celery_app import app as celery_app

__all__ = ('celery_app',)
```

### 3. Démarrer Celery Workers

```bash
# Terminal 1: Worker
celery -A celery_app worker -l info

# Terminal 2: Beat (scheduler)
celery -A celery_app beat -l info

# Ou en production avec supervisor/systemd
```

### 4. Configuration Cron Jobs

```bash
# Éditer crontab
crontab -e

# Ajouter ces lignes (ajuster les chemins):
# Reset tokens le 1er du mois à minuit
0 0 1 * * cd /path/to/Wanzo_Backend/apps/Adha-ai-service && /path/to/python manage.py reset_monthly_tokens >> /var/log/adha-ai/reset_tokens.log 2>&1

# Cleanup quotidien à 2h du matin
0 2 * * * cd /path/to/Wanzo_Backend/apps/Adha-ai-service && /path/to/python manage.py cleanup_old_data >> /var/log/adha-ai/cleanup.log 2>&1
```

### 5. Variables d'Environnement

Ajouter à `.env`:

```bash
# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Monitoring (optionnel)
ENABLE_METRICS=true
PROMETHEUS_PORT=9090
```

## 🧪 Tests

### Test Idempotence

```bash
python manage.py shell

from api.models import ProcessedMessage
from api.kafka.unified_consumer import UnifiedConsumer

# Simuler un message
message = {
    'id': 'test-123',
    'metadata': {'correlation_id': 'corr-456', 'kafka_topic': 'test'},
    'data': {'test': 'data'}
}

# Premier traitement
consumer = UnifiedConsumer()
consumer._process_message(message)  # ✅ Traité

# Deuxième traitement (devrait être skippé)
consumer._process_message(message)  # ⏭️ Skipped (duplicate)

# Vérifier
assert ProcessedMessage.is_already_processed('test-123')
```

### Test Quota Reservation

```bash
python manage.py shell

from api.services.token_reservation import token_reservation_service, InsufficientTokensError
from api.models import Company

# Créer une company de test
company = Company.objects.create(name='Test Co', token_quota=1000)

# Test réservation OK
try:
    token_reservation_service.check_and_reserve_tokens(company.id, 500)
    print("✅ Reserved 500 tokens")
except InsufficientTokensError:
    print("❌ Failed")

# Test quota insuffisant
try:
    token_reservation_service.check_and_reserve_tokens(company.id, 10000)
    print("❌ Should have failed")
except InsufficientTokensError as e:
    print(f"✅ Correctly rejected: {e}")

# Test ajustement
token_reservation_service.adjust_tokens_after_processing(company.id, 500, 300)
# Devrait recréditer 200 tokens

company.refresh_from_db()
print(f"Final quota: {company.token_quota}")  # Devrait être ~700
```

### Test Reset Monthly

```bash
# Dry run (sans modifications)
python manage.py reset_monthly_tokens --dry-run

# Exécution réelle
python manage.py reset_monthly_tokens

# Force (même si déjà fait ce mois)
python manage.py reset_monthly_tokens --force
```

### Test Cleanup

```bash
# Dry run
python manage.py cleanup_old_data --dry-run

# Exécution réelle avec paramètres custom
python manage.py cleanup_old_data \
    --processed-messages-days=3 \
    --completed-requests-days=14 \
    --abandoned-requests-hours=12
```

## 📊 Monitoring

### Vérifier État du Système

```bash
python manage.py shell

from api.models import ProcessedMessage, ProcessingRequest, Company

# Stats ProcessedMessage
print(f"Processed messages: {ProcessedMessage.objects.count()}")
print(f"Last 24h: {ProcessedMessage.objects.filter(processed_at__gte=timezone.now() - timedelta(hours=24)).count()}")

# Stats ProcessingRequest
from django.db.models import Count
status_counts = ProcessingRequest.objects.values('status').annotate(count=Count('id'))
print("Request statuses:", dict((s['status'], s['count']) for s in status_counts))

# Companies avec quota faible
low_quota = Company.objects.filter(token_quota__lt=10000, is_subscription_active=True)
print(f"Companies with low quota (<10k): {low_quota.count()}")
```

### Logs à Surveiller

```bash
# Logs Celery
tail -f /var/log/celery/worker.log

# Logs Django
tail -f logs/django.log

# Logs Kafka consumers
tail -f logs/kafka_consumers.log
```

## 🔧 Troubleshooting

### Problème: Migrations ne s'appliquent pas

```bash
# Voir l'état des migrations
python manage.py showmigrations api

# Forcer la création
python manage.py makemigrations api --empty --name add_tracking_models
# Puis éditer et relancer migrate
```

### Problème: Celery ne démarre pas

```bash
# Vérifier Redis
redis-cli ping  # Devrait répondre PONG

# Tester connexion
python -c "from celery import Celery; app = Celery(broker='redis://localhost:6379'); print(app.broker_connection().as_uri())"

# Voir les workers actifs
celery -A celery_app inspect active
```

### Problème: Cron jobs ne s'exécutent pas

```bash
# Vérifier crontab
crontab -l

# Tester manuellement
cd apps/Adha-ai-service
python manage.py reset_monthly_tokens --dry-run

# Voir logs cron
grep CRON /var/log/syslog
```

## 📈 Performance

### Indexes Créés

- `ProcessedMessage`: message_id (PK), correlation_id, topic, company_id, processed_at
- `ProcessingRequest`: request_id (PK), status+created_at, company_id+status, correlation_id

### Optimisations

- `select_for_update()` pour éviter race conditions
- Cleanup automatique pour limiter croissance des tables
- Indexes composés pour queries fréquentes

## 🎉 Résultat Final

Tous les problèmes critiques et modérés sont résolus:

✅ Idempotence complète
✅ Quota check AVANT traitement  
✅ Reset mensuel automatique
✅ State management asynchrone
✅ Retry fonctionnel avec Celery
✅ Prévention boucles infinies
✅ Cleanup automatique
✅ Monitoring et observability

Le système est maintenant **production-ready**! 🚀
