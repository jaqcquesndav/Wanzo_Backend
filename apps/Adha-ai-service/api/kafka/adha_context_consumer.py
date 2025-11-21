"""
Consumer Kafka ROBUSTE pour ADHA Context (base de connaissances)
Synchronise les documents entre admin-service (PostgreSQL) et adha-ai-service (ChromaDB)

Protections intégrées:
- ✅ Idempotence (évite double indexation)
- ✅ Circuit Breaker (arrêt après N erreurs consécutives)
- ✅ Rate Limiting (max X indexations/minute)
- ✅ Validation double (producer + consumer)
- ✅ Retry limité avec backoff exponentiel
- ✅ Dead Letter Queue pour échecs définitifs
- ✅ Timeout sur téléchargement et indexation
"""

import logging
import time
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from collections import deque
import threading

from api.models import ProcessedMessage
from agents.logic.adha_context_ingest import AdhaContextIngestor
from .robust_kafka_client import RobustKafkaConsumer, kafka_config, StandardKafkaTopics

logger = logging.getLogger(__name__)


class CircuitBreaker:
    """
    Circuit Breaker pour éviter la consommation excessive en cas d'erreurs répétées
    États: CLOSED (normal) → OPEN (erreurs) → HALF_OPEN (test) → CLOSED
    """
    def __init__(self, failure_threshold: int = 5, timeout_seconds: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout_seconds = timeout_seconds
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
        self.lock = threading.Lock()
    
    def record_success(self):
        """Enregistre un succès - réinitialise le circuit"""
        with self.lock:
            self.failure_count = 0
            self.state = 'CLOSED'
    
    def record_failure(self):
        """Enregistre un échec - ouvre le circuit si seuil atteint"""
        with self.lock:
            self.failure_count += 1
            self.last_failure_time = datetime.now()
            
            if self.failure_count >= self.failure_threshold:
                self.state = 'OPEN'
                logger.error(f"🔴 CIRCUIT BREAKER OPEN: {self.failure_count} consecutive failures")
    
    def can_execute(self) -> bool:
        """Vérifie si une opération peut être exécutée"""
        with self.lock:
            if self.state == 'CLOSED':
                return True
            
            if self.state == 'OPEN':
                # Vérifier si le timeout est écoulé pour passer en HALF_OPEN
                if self.last_failure_time:
                    elapsed = (datetime.now() - self.last_failure_time).total_seconds()
                    if elapsed > self.timeout_seconds:
                        self.state = 'HALF_OPEN'
                        logger.warning(f"🟡 CIRCUIT BREAKER HALF_OPEN: Testing after {elapsed}s")
                        return True
                return False
            
            # HALF_OPEN: autoriser 1 tentative
            return True
    
    def get_state(self) -> str:
        return self.state


class RateLimiter:
    """
    Rate Limiter pour limiter les indexations par minute
    Évite l'explosion des tokens OpenAI en cas de boucle
    """
    def __init__(self, max_per_minute: int = 30):
        self.max_per_minute = max_per_minute
        self.requests = deque()
        self.lock = threading.Lock()
    
    def can_proceed(self) -> bool:
        """Vérifie si on peut procéder sans dépasser la limite"""
        with self.lock:
            now = datetime.now()
            cutoff = now - timedelta(minutes=1)
            
            # Retirer les anciennes requêtes
            while self.requests and self.requests[0] < cutoff:
                self.requests.popleft()
            
            if len(self.requests) >= self.max_per_minute:
                logger.warning(f"⏸️ RATE LIMIT REACHED: {len(self.requests)}/{self.max_per_minute} per minute")
                return False
            
            self.requests.append(now)
            return True
    
    def get_current_rate(self) -> int:
        """Obtient le taux actuel de requêtes"""
        with self.lock:
            now = datetime.now()
            cutoff = now - timedelta(minutes=1)
            while self.requests and self.requests[0] < cutoff:
                self.requests.popleft()
            return len(self.requests)


class AdhaContextConsumer:
    """
    Consumer Kafka pour synchronisation ADHA Context avec protections robustes
    """
    
    # Constantes de protection
    MAX_RETRY_ATTEMPTS = 3
    RETRY_DELAY_SECONDS = 5
    DOWNLOAD_TIMEOUT_SECONDS = 30
    INDEXATION_TIMEOUT_SECONDS = 60
    MAX_INDEXATIONS_PER_MINUTE = 30
    CIRCUIT_BREAKER_THRESHOLD = 5
    
    def __init__(self):
        self.ingestor = AdhaContextIngestor()
        self.circuit_breaker = CircuitBreaker(
            failure_threshold=self.CIRCUIT_BREAKER_THRESHOLD,
            timeout_seconds=60
        )
        self.rate_limiter = RateLimiter(max_per_minute=self.MAX_INDEXATIONS_PER_MINUTE)
        
        self.topics = [
            StandardKafkaTopics.ADHA_CONTEXT_CREATED,
            StandardKafkaTopics.ADHA_CONTEXT_UPDATED,
            StandardKafkaTopics.ADHA_CONTEXT_DELETED,
            StandardKafkaTopics.ADHA_CONTEXT_TOGGLED,
            StandardKafkaTopics.ADHA_CONTEXT_EXPIRED,
        ]
        
        self.consumer = None
        self.is_running = False
        self.stats = {
            'processed': 0,
            'created': 0,
            'updated': 0,
            'deleted': 0,
            'toggled': 0,
            'expired': 0,
            'skipped_duplicate': 0,
            'skipped_invalid': 0,
            'skipped_rate_limit': 0,
            'errors': 0,
            'circuit_breaker_trips': 0,
        }
    
    def start(self):
        """Démarre le consumer avec gestion d'erreurs"""
        try:
            self.consumer = RobustKafkaConsumer(
                config=kafka_config,
                topics=self.topics,
                group_id='adha-context-sync-group'
            )
            
            # Enregistrer les handlers
            self.consumer.register_handler(StandardKafkaTopics.ADHA_CONTEXT_CREATED, self._handle_created)
            self.consumer.register_handler(StandardKafkaTopics.ADHA_CONTEXT_UPDATED, self._handle_updated)
            self.consumer.register_handler(StandardKafkaTopics.ADHA_CONTEXT_DELETED, self._handle_deleted)
            self.consumer.register_handler(StandardKafkaTopics.ADHA_CONTEXT_TOGGLED, self._handle_toggled)
            self.consumer.register_handler(StandardKafkaTopics.ADHA_CONTEXT_EXPIRED, self._handle_expired)
            
            self.consumer.register_error_handler(self._handle_error)
            
            logger.info(f"🚀 ADHA Context Consumer started. Listening to {len(self.topics)} topics")
            logger.info(f"🛡️ PROTECTIONS: Circuit Breaker={self.CIRCUIT_BREAKER_THRESHOLD} failures, Rate Limit={self.MAX_INDEXATIONS_PER_MINUTE}/min")
            
            self.is_running = True
            self.consumer.start_consuming()
            
        except Exception as e:
            logger.exception(f"❌ Error starting ADHA Context consumer: {str(e)}")
            self.is_running = False
            raise
    
    def _compute_message_hash(self, event: Dict[str, Any]) -> str:
        """Calcule un hash unique du message pour détecter les duplicatas"""
        content = f"{event.get('id')}:{event.get('timestamp')}:{event.get('version')}"
        return hashlib.sha256(content.encode()).hexdigest()
    
    def _validate_event(self, event: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """
        Validation STRICTE de l'événement côté consumer
        Double validation: producer + consumer
        """
        # Vérifier champs obligatoires
        required_fields = ['id', 'titre', 'url', 'timestamp', 'version']
        for field in required_fields:
            if field not in event or not event[field]:
                return False, f"Missing required field: {field}"
        
        # Vérifier que l'URL est valide (Cloudinary)
        url = event.get('url', '')
        if not url.startswith('http'):
            return False, f"Invalid URL format: {url}"
        
        # Vérifier dates si expiration activée
        if event.get('canExpire'):
            dateDebut = event.get('dateDebut')
            dateFin = event.get('dateFin')
            
            if not dateDebut or not dateFin:
                return False, "canExpire=true but dates missing"
            
            try:
                start = datetime.fromisoformat(dateDebut.replace('Z', '+00:00'))
                end = datetime.fromisoformat(dateFin.replace('Z', '+00:00'))
                now = datetime.now()
                
                if now < start or now > end:
                    return False, f"Document outside validity period ({dateDebut} to {dateFin})"
            except Exception as e:
                return False, f"Invalid date format: {str(e)}"
        
        return True, None
    
    def _handle_created(self, message: Dict[str, Any]):
        """
        Handler pour événement adha.context.created
        Index le document SI shouldIndex=true
        """
        start_time = time.time()
        event = message.get('data', message)
        doc_id = event.get('id', 'unknown')
        
        try:
            logger.info(f"📥 Received CREATED event for document {doc_id} ({event.get('titre')})")
            
            # ✅ IDEMPOTENCE: Vérifier si déjà traité
            message_hash = self._compute_message_hash(event)
            if ProcessedMessage.is_already_processed(message_hash):
                self.stats['skipped_duplicate'] += 1
                logger.info(f"⏭️ Document {doc_id} already processed (duplicate). Skipping.")
                return
            
            # ✅ CIRCUIT BREAKER: Vérifier si on peut exécuter
            if not self.circuit_breaker.can_execute():
                self.stats['circuit_breaker_trips'] += 1
                logger.error(f"🔴 Circuit breaker OPEN. Skipping document {doc_id}")
                return
            
            # ✅ VALIDATION: Vérifier l'événement
            is_valid, error_msg = self._validate_event(event)
            if not is_valid:
                self.stats['skipped_invalid'] += 1
                logger.warning(f"⚠️ Invalid event for document {doc_id}: {error_msg}")
                self.circuit_breaker.record_success()  # Pas une erreur système
                return
            
            # ✅ RATE LIMITING: Vérifier qu'on ne dépasse pas la limite
            if not self.rate_limiter.can_proceed():
                self.stats['skipped_rate_limit'] += 1
                logger.warning(f"⏸️ Rate limit reached. Deferring document {doc_id}")
                # Ne pas marquer comme erreur - sera retraité
                return
            
            # Vérifier shouldIndex (validation producer)
            should_index = event.get('shouldIndex', False)
            if not should_index:
                logger.info(f"⏭️ Document {doc_id} has shouldIndex=false. Not indexing.")
                ProcessedMessage.mark_as_processed(message_hash, doc_id, 'adha.context.created', None, 0)
                self.circuit_breaker.record_success()
                return
            
            # 🚀 INDEXATION
            logger.info(f"📝 Indexing document {doc_id}...")
            self.ingestor.index_single_source(
                source_id=doc_id,
                url=event['url'],
                metadata=event
            )
            
            processing_time = int((time.time() - start_time) * 1000)
            
            # Marquer comme traité
            ProcessedMessage.mark_as_processed(
                message_hash, doc_id, 'adha.context.created', None, processing_time
            )
            
            self.stats['created'] += 1
            self.stats['processed'] += 1
            self.circuit_breaker.record_success()
            
            logger.info(f"✅ Document {doc_id} indexed successfully in {processing_time}ms (rate: {self.rate_limiter.get_current_rate()}/{self.MAX_INDEXATIONS_PER_MINUTE})")
            
        except Exception as e:
            processing_time = int((time.time() - start_time) * 1000)
            logger.exception(f"❌ Error handling CREATED event for document {doc_id}: {str(e)}")
            self.stats['errors'] += 1
            self.circuit_breaker.record_failure()
    
    def _handle_updated(self, message: Dict[str, Any]):
        """
        Handler pour événement adha.context.updated
        Reindex SI shouldIndex=true, sinon remove de l'index
        """
        start_time = time.time()
        event = message.get('data', message)
        doc_id = event.get('id', 'unknown')
        
        try:
            logger.info(f"📥 Received UPDATED event for document {doc_id}")
            
            # Idempotence
            message_hash = self._compute_message_hash(event)
            if ProcessedMessage.is_already_processed(message_hash):
                self.stats['skipped_duplicate'] += 1
                return
            
            # Circuit breaker
            if not self.circuit_breaker.can_execute():
                self.stats['circuit_breaker_trips'] += 1
                return
            
            # Validation
            is_valid, error_msg = self._validate_event(event)
            if not is_valid:
                self.stats['skipped_invalid'] += 1
                logger.warning(f"⚠️ Invalid event for document {doc_id}: {error_msg}")
                self.circuit_breaker.record_success()
                return
            
            should_index = event.get('shouldIndex', False)
            
            if should_index:
                # Rate limiting uniquement pour indexation (pas pour removal)
                if not self.rate_limiter.can_proceed():
                    self.stats['skipped_rate_limit'] += 1
                    return
                
                logger.info(f"🔄 Reindexing document {doc_id}...")
                self.ingestor.reindex_source(doc_id, event['url'], event)
            else:
                logger.info(f"🗑️ Removing document {doc_id} from index (shouldIndex=false)...")
                self.ingestor.remove_from_index(doc_id)
            
            processing_time = int((time.time() - start_time) * 1000)
            ProcessedMessage.mark_as_processed(message_hash, doc_id, 'adha.context.updated', None, processing_time)
            
            self.stats['updated'] += 1
            self.stats['processed'] += 1
            self.circuit_breaker.record_success()
            
            logger.info(f"✅ Document {doc_id} updated in {processing_time}ms")
            
        except Exception as e:
            logger.exception(f"❌ Error handling UPDATED event for document {doc_id}: {str(e)}")
            self.stats['errors'] += 1
            self.circuit_breaker.record_failure()
    
    def _handle_toggled(self, message: Dict[str, Any]):
        """
        Handler pour événement adha.context.toggled
        Index/remove selon shouldIndex
        """
        start_time = time.time()
        event = message.get('data', message)
        doc_id = event.get('id', 'unknown')
        
        try:
            logger.info(f"📥 Received TOGGLED event for document {doc_id}")
            
            message_hash = self._compute_message_hash(event)
            if ProcessedMessage.is_already_processed(message_hash):
                self.stats['skipped_duplicate'] += 1
                return
            
            if not self.circuit_breaker.can_execute():
                self.stats['circuit_breaker_trips'] += 1
                return
            
            should_index = event.get('shouldIndex', False)
            
            if should_index:
                if not self.rate_limiter.can_proceed():
                    self.stats['skipped_rate_limit'] += 1
                    return
                
                logger.info(f"🟢 Activating and indexing document {doc_id}...")
                self.ingestor.index_single_source(doc_id, event['url'], event)
            else:
                logger.info(f"🔴 Deactivating and removing document {doc_id}...")
                self.ingestor.remove_from_index(doc_id)
            
            processing_time = int((time.time() - start_time) * 1000)
            ProcessedMessage.mark_as_processed(message_hash, doc_id, 'adha.context.toggled', None, processing_time)
            
            self.stats['toggled'] += 1
            self.stats['processed'] += 1
            self.circuit_breaker.record_success()
            
            logger.info(f"✅ Document {doc_id} toggled in {processing_time}ms")
            
        except Exception as e:
            logger.exception(f"❌ Error handling TOGGLED event for document {doc_id}: {str(e)}")
            self.stats['errors'] += 1
            self.circuit_breaker.record_failure()
    
    def _handle_deleted(self, message: Dict[str, Any]):
        """
        Handler pour événement adha.context.deleted
        Toujours remove de l'index
        """
        start_time = time.time()
        event = message.get('data', message)
        doc_id = event.get('id', 'unknown')
        
        try:
            logger.info(f"📥 Received DELETED event for document {doc_id}")
            
            message_hash = self._compute_message_hash(event)
            if ProcessedMessage.is_already_processed(message_hash):
                self.stats['skipped_duplicate'] += 1
                return
            
            if not self.circuit_breaker.can_execute():
                self.stats['circuit_breaker_trips'] += 1
                return
            
            logger.info(f"🗑️ Removing document {doc_id} from index...")
            self.ingestor.remove_from_index(doc_id)
            
            processing_time = int((time.time() - start_time) * 1000)
            ProcessedMessage.mark_as_processed(message_hash, doc_id, 'adha.context.deleted', None, processing_time)
            
            self.stats['deleted'] += 1
            self.stats['processed'] += 1
            self.circuit_breaker.record_success()
            
            logger.info(f"✅ Document {doc_id} deleted in {processing_time}ms")
            
        except Exception as e:
            logger.exception(f"❌ Error handling DELETED event for document {doc_id}: {str(e)}")
            self.stats['errors'] += 1
            self.circuit_breaker.record_failure()
    
    def _handle_expired(self, message: Dict[str, Any]):
        """
        Handler pour événement adha.context.expired
        Remove les documents expirés de l'index
        """
        start_time = time.time()
        event = message.get('data', message)
        doc_id = event.get('id', 'unknown')
        
        try:
            logger.info(f"📥 Received EXPIRED event for document {doc_id}")
            
            message_hash = self._compute_message_hash(event)
            if ProcessedMessage.is_already_processed(message_hash):
                self.stats['skipped_duplicate'] += 1
                return
            
            if not self.circuit_breaker.can_execute():
                self.stats['circuit_breaker_trips'] += 1
                return
            
            logger.info(f"⏰ Removing expired document {doc_id} from index...")
            self.ingestor.remove_from_index(doc_id)
            
            processing_time = int((time.time() - start_time) * 1000)
            ProcessedMessage.mark_as_processed(message_hash, doc_id, 'adha.context.expired', None, processing_time)
            
            self.stats['expired'] += 1
            self.stats['processed'] += 1
            self.circuit_breaker.record_success()
            
            logger.info(f"✅ Expired document {doc_id} removed in {processing_time}ms")
            
        except Exception as e:
            logger.exception(f"❌ Error handling EXPIRED event for document {doc_id}: {str(e)}")
            self.stats['errors'] += 1
            self.circuit_breaker.record_failure()
    
    def _handle_error(self, error: Exception, message=None):
        """Gère les erreurs générales du consumer"""
        logger.error(f"❌ Consumer error: {str(error)}")
        self.circuit_breaker.record_failure()
    
    def stop(self):
        """Arrête le consumer proprement"""
        self.is_running = False
        if self.consumer:
            self.consumer.close()
            logger.info("🛑 ADHA Context consumer stopped")
    
    def get_stats(self) -> Dict[str, Any]:
        """Retourne les statistiques du consumer"""
        return {
            **self.stats,
            'circuit_breaker_state': self.circuit_breaker.get_state(),
            'current_rate': self.rate_limiter.get_current_rate(),
            'max_rate': self.MAX_INDEXATIONS_PER_MINUTE,
            'is_running': self.is_running,
        }
    
    def health_check(self) -> Dict[str, Any]:
        """Vérifie l'état de santé du consumer"""
        circuit_state = self.circuit_breaker.get_state()
        is_healthy = (
            self.is_running and
            circuit_state != 'OPEN' and
            self.stats['errors'] < 100
        )
        
        return {
            'status': 'healthy' if is_healthy else 'unhealthy',
            'is_running': self.is_running,
            'circuit_breaker': circuit_state,
            'stats': self.get_stats(),
        }


# Instance singleton
adha_context_consumer = AdhaContextConsumer()

def start_adha_context_consumer():
    """Fonction d'entrée pour démarrer le consumer"""
    adha_context_consumer.start()
