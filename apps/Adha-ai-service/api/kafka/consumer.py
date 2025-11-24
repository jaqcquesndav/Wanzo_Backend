import json
from kafka import KafkaConsumer
import os
import logging
import time

logger = logging.getLogger(__name__)

KAFKA_BROKER_URL = os.environ.get('KAFKA_BROKER_URL', 'localhost:9092')

_consumer = None
_consumer_failed = False
_last_attempt_time = 0
RETRY_COOLDOWN = 60  # Retry après 60 secondes en cas d'échec

def get_consumer():
    """Lazy initialization of Kafka consumer with retry logic"""
    global _consumer, _consumer_failed, _last_attempt_time
    
    # Si déjà créé et opérationnel
    if _consumer is not None:
        return _consumer
    
    # Si échec récent, attendre le cooldown
    current_time = time.time()
    if _consumer_failed and (current_time - _last_attempt_time) < RETRY_COOLDOWN:
        logger.debug(f"Kafka consumer in cooldown. Retry in {RETRY_COOLDOWN - (current_time - _last_attempt_time):.0f}s")
        return None
    
    # Tentative de connexion
    try:
        _last_attempt_time = current_time
        _consumer = KafkaConsumer(
            'adha-ai-events',
            bootstrap_servers=KAFKA_BROKER_URL,
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            auto_offset_reset='earliest',
            enable_auto_commit=True,
            group_id='adha-ai-service',
            session_timeout_ms=30000,
            request_timeout_ms=40000,
            consumer_timeout_ms=1000,  # Timeout pour éviter de bloquer indéfiniment
        )
        _consumer_failed = False
        logger.info(f"Kafka consumer initialized successfully: {KAFKA_BROKER_URL}")
        return _consumer
    except Exception as e:
        _consumer_failed = True
        logger.warning(f"Kafka consumer unavailable (will retry in {RETRY_COOLDOWN}s): {e}")
        return None

def consume_events(callback):
    """Consume events from Kafka with graceful degradation"""
    consumer = get_consumer()
    if consumer is None:
        logger.warning("Kafka consumer not available - cannot consume events")
        return
    
    try:
        for message in consumer:
            callback(message.value)
    except Exception as e:
        logger.error(f"Error consuming events: {e}")
        global _consumer, _consumer_failed
        _consumer = None  # Force reconnexion
        _consumer_failed = True
