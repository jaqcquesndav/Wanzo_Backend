import json
from kafka import KafkaProducer
import os
import logging
import time

logger = logging.getLogger(__name__)

KAFKA_BROKER_URL = os.environ.get('KAFKA_BROKER_URL', 'localhost:9092')

_producer = None
_producer_failed = False
_last_attempt_time = 0
RETRY_COOLDOWN = 60  # Retry après 60 secondes en cas d'échec

def get_producer():
    """Lazy initialization of Kafka producer with retry logic and graceful degradation"""
    global _producer, _producer_failed, _last_attempt_time
    
    # Si déjà créé et opérationnel
    if _producer is not None:
        return _producer
    
    # Si échec récent, attendre le cooldown
    current_time = time.time()
    if _producer_failed and (current_time - _last_attempt_time) < RETRY_COOLDOWN:
        logger.debug(f"Kafka producer in cooldown. Retry in {RETRY_COOLDOWN - (current_time - _last_attempt_time):.0f}s")
        return None
    
    # Tentative de connexion
    try:
        _last_attempt_time = current_time
        _producer = KafkaProducer(
            bootstrap_servers=KAFKA_BROKER_URL,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            request_timeout_ms=10000,  # Timeout rapide pour ne pas bloquer
            max_block_ms=5000,  # Ne pas bloquer plus de 5s
            retries=3,
            retry_backoff_ms=500,
        )
        _producer_failed = False
        logger.info(f"Kafka producer initialized successfully: {KAFKA_BROKER_URL}")
        return _producer
    except Exception as e:
        _producer_failed = True
        logger.warning(f"Kafka producer unavailable (will retry in {RETRY_COOLDOWN}s): {e}")
        return None

def send_event(topic, event):
    """Send event to Kafka topic with graceful degradation"""
    try:
        producer = get_producer()
        if producer is None:
            # Graceful degradation: log l'événement mais ne crash pas
            logger.warning(f"Kafka unavailable - Event not sent to {topic}: {event.get('type', 'unknown')}")
            return False
        
        producer.send(topic, event)
        producer.flush(timeout=5)
        return True
    except Exception as e:
        logger.error(f"Failed to send event to topic {topic}: {e}")
        global _producer, _producer_failed
        _producer = None  # Force reconnexion au prochain appel
        _producer_failed = True
        return False
