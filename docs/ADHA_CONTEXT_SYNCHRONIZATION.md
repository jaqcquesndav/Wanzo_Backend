# ADHA Context Synchronisation - Architecture Robuste

## 📋 Vue d'ensemble

Synchronisation temps réel de la base de connaissances entre **admin-service** (PostgreSQL) et **adha-ai-service** (ChromaDB) via Kafka.

## 🔄 Workflow Complet

```
Frontend → Admin Service → PostgreSQL → Kafka → Adha AI Service → ChromaDB
```

### Étapes du cycle de vie

1. **UPLOAD**: `POST /api/adha-context/upload` → Cloudinary URL (pas encore en BDD)
2. **CREATE**: `POST /api/adha-context/sources` → Sauvegarde PostgreSQL + Kafka event (si indexable)
3. **TOGGLE**: `PATCH /api/adha-context/sources/:id/toggle-active` → Kafka event (si éligibilité change)
4. **UPDATE**: `PUT /api/adha-context/sources/:id` → Kafka event (si champs indexation changent)
5. **DELETE**: `DELETE /api/adha-context/sources/:id` → Kafka event (toujours émis)

## 🎯 Règles d'Indexation

Un document est **indexable** SI ET SEULEMENT SI :
- ✅ `active === true`
- ✅ `url !== null` (Cloudinary)
- ✅ `(canExpire === false) OU (dateDebut <= NOW <= dateFin)`

## 📡 Topics Kafka

| Topic | Émis quand | Payload clé |
|-------|-----------|-------------|
| `adha.context.created` | Document créé ET indexable | `shouldIndex: true` |
| `adha.context.updated` | Champs indexation changent | `shouldIndex: bool, changes: []` |
| `adha.context.toggled` | Éligibilité indexation change | `shouldIndex: bool, previousState` |
| `adha.context.deleted` | Document supprimé | `id, titre, url` |
| `adha.context.expired` | Job CRON détecte expiration | `dateFin, expiredAt` |

## 🛡️ Protections Anti-Boucles Infinies

### 1. **Idempotence (Consumer)**
```python
message_hash = sha256(f"{event.id}:{event.timestamp}:{event.version}")
if ProcessedMessage.is_already_processed(message_hash):
    return  # Skip duplicate
```
**Protection**: Même message traité 1 seule fois, même si reçu multiple fois.

### 2. **Circuit Breaker**
```python
CircuitBreaker(failure_threshold=5, timeout_seconds=60)
States: CLOSED → OPEN (après 5 erreurs) → HALF_OPEN (test) → CLOSED
```
**Protection**: Arrêt automatique après 5 échecs consécutifs, reprise après 60s.

### 3. **Rate Limiting**
```python
RateLimiter(max_per_minute=30)
# Max 30 indexations/minute
```
**Protection**: Limite tokens OpenAI consommés, évite explosion des coûts.

### 4. **Validation Double (Producer + Consumer)**

**Producer (admin-service)** :
```typescript
if (!isIndexable(source)) {
  logger.debug("Document not indexable, no Kafka event");
  return;
}
```

**Consumer (adha-ai-service)** :
```python
is_valid, error = _validate_event(event)
if not is_valid:
  logger.warning(f"Invalid event: {error}")
  return
```

**Protection**: 2 niveaux de validation = impossible d'indexer document invalide.

### 5. **Émission Conditionnelle**

**CREATE** : Émettre SI `isIndexable() === true`
**UPDATE** : Émettre SI `indexationFieldsChanged AND (wasIndexable OR isNowIndexable)`
**TOGGLE** : Émettre SI `wasIndexable !== isNowIndexable`
**DELETE** : **TOUJOURS** émettre

**Protection**: Événements émis UNIQUEMENT si impact sur l'indexation = pas de bruit Kafka.

### 6. **Timeout sur Opérations**
```python
DOWNLOAD_TIMEOUT_SECONDS = 30
INDEXATION_TIMEOUT_SECONDS = 60
```
**Protection**: Évite blocage infini sur téléchargement/indexation.

### 7. **Déconnexion Kafka/Opérations**
```typescript
try {
  await eventsService.publishAdhaContextCreated(event);
} catch (error) {
  logger.error("Kafka failed but document saved");
  // NE PAS BLOQUER la sauvegarde PostgreSQL
}
```
**Protection**: Échec Kafka n'empêche pas les opérations CRUD.

## 📊 Métriques et Monitoring

### Statistiques Consumer
```python
stats = {
  'processed': 0,
  'created': 0,
  'updated': 0,
  'deleted': 0,
  'skipped_duplicate': 0,    # Idempotence
  'skipped_invalid': 0,       # Validation
  'skipped_rate_limit': 0,    # Rate limiting
  'errors': 0,
  'circuit_breaker_trips': 0,
}
```

### Health Check
```python
GET /api/health/adha-context-consumer
{
  "status": "healthy",
  "circuit_breaker": "CLOSED",
  "current_rate": "15/30",
  "stats": {...}
}
```

## 🚨 Scénarios d'Erreur

### Scénario 1: Cloudinary Injoignable
**Symptôme**: Téléchargement PDF échoue  
**Protection**: Timeout 30s + Circuit Breaker + Retry DLQ  
**Impact**: Document non indexé, metadata conservée, retry automatique

### Scénario 2: OpenAI API Limite Atteinte
**Symptôme**: Embeddings échouent  
**Protection**: Rate Limiter bloque à 30/min  
**Impact**: Messages mis en attente, traitement différé

### Scénario 3: ChromaDB Corruption
**Symptôme**: Collection inaccessible  
**Protection**: Circuit Breaker ouvre après 5 échecs  
**Impact**: Consumer s'arrête, alerte émise, admin intervient

### Scénario 4: Kafka Consumer Lag
**Symptôme**: 1000+ messages en attente  
**Protection**: Rate Limiter + Processing Time monitoring  
**Impact**: Traitement ralenti mais stable, pas d'explosion

### Scénario 5: Document Énorme (500 pages)
**Symptôme**: Indexation très longue  
**Protection**: Timeout 60s + chunking 1000 chars  
**Impact**: Timeout → DLQ → traitement manuel

## 🔧 Configuration Recommandée

### Environment Variables
```bash
# Admin Service
USE_KAFKA=true
KAFKA_BROKERS=kafka:9092
ADHA_CONTEXT_EVENT_VERSION=1.0.0

# Adha AI Service
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
ADHA_CONTEXT_MAX_RATE=30
CIRCUIT_BREAKER_THRESHOLD=5
DOWNLOAD_TIMEOUT=30
INDEXATION_TIMEOUT=60
```

### Kafka Topics Configuration
```yaml
topics:
  adha.context.created:
    partitions: 3
    replication: 2
    retention.ms: 604800000  # 7 days
  
  adha.context.updated:
    partitions: 3
    replication: 2
    retention.ms: 604800000
  
  adha.context.deleted:
    partitions: 1
    replication: 2
    retention.ms: 2592000000  # 30 days (audit)
```

## 📝 Exemples de Payloads

### Created Event
```json
{
  "id": "uuid-123",
  "titre": "Guide Fiscal RDC 2025",
  "description": "...",
  "type": "guide",
  "url": "https://cloudinary.com/...",
  "active": true,
  "canExpire": true,
  "dateDebut": "2025-01-01T00:00:00Z",
  "dateFin": "2025-12-31T23:59:59Z",
  "shouldIndex": true,
  "timestamp": "2025-11-21T10:30:00Z",
  "version": "1.0.0",
  "metadata": {
    "createdAt": "2025-11-21T10:30:00Z",
    "sourceService": "admin-service"
  }
}
```

### Updated Event
```json
{
  "id": "uuid-123",
  "titre": "Guide Fiscal RDC 2025 (Mis à jour)",
  "shouldIndex": false,
  "previouslyIndexable": true,
  "changes": ["titre", "active", "dateFin"],
  "timestamp": "2025-11-21T11:00:00Z",
  "version": "1.0.0"
}
```

### Toggled Event
```json
{
  "id": "uuid-123",
  "titre": "Guide Fiscal RDC 2025",
  "active": false,
  "shouldIndex": false,
  "previousState": {
    "active": true,
    "wasIndexable": true
  },
  "timestamp": "2025-11-21T11:30:00Z",
  "version": "1.0.0"
}
```

## 🎓 Best Practices

### 1. **Toujours utiliser `isIndexable()`**
Ne jamais indexer sans vérifier l'éligibilité.

### 2. **Logger avec contexte**
```typescript
logger.log(`✅ Kafka event emitted: adha.context.created for ${id} (${titre})`);
logger.debug(`⏭️ Document ${id} not indexable (active=${active}). No event.`);
```

### 3. **Gérer les échecs Kafka gracieusement**
Ne jamais bloquer les opérations CRUD si Kafka échoue.

### 4. **Monitorer les métriques**
- `circuit_breaker_state`: doit être `CLOSED`
- `skipped_rate_limit`: si >100, augmenter le rate limit
- `errors`: si >10%, investiguer

### 5. **Tester les scénarios d'erreur**
- Document sans URL → ne doit pas indexer
- Document expiré → doit retirer de l'index
- Toggle active=false → doit retirer immédiatement
- Cloudinary down → doit retry puis DLQ

## 🚀 Déploiement

### 1. Déployer shared package
```bash
cd packages/shared
yarn build
```

### 2. Redémarrer admin-service
```bash
docker-compose restart admin-service
```

### 3. Redémarrer adha-ai-service consumers
```bash
docker-compose restart adha-ai-service
# Ou manuellement:
python start_consumers.py
```

### 4. Vérifier les logs
```bash
# Admin service
docker-compose logs -f admin-service | grep "adha.context"

# Adha AI service
docker-compose logs -f adha-ai-service | grep "ADHA Context"
```

### 5. Health check
```bash
curl http://localhost:8000/api/health/adha-context-consumer
```

## 📚 Ressources

- **Code TypeScript**: `packages/shared/src/events/adha-context-events.ts`
- **Producer**: `apps/admin-service/src/modules/adha-context/services/adha-context.service.ts`
- **Consumer**: `apps/Adha-ai-service/api/kafka/adha_context_consumer.py`
- **Ingestor**: `apps/Adha-ai-service/agents/logic/adha_context_ingest.py`
- **Start Script**: `apps/Adha-ai-service/start_consumers.py`

---

**Version**: 1.0.0  
**Date**: 2025-11-21  
**Auteur**: GitHub Copilot  
**Status**: ✅ Production Ready
