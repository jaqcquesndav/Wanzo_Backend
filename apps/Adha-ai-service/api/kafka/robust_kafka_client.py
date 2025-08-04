"""
Configuration Kafka robuste pour Adha AI Service (Django/Python)
Compatible avec la configuration unifiée TypeScript
"""

import json
import logging
import os
import time
from typing import Dict, Any, Optional, List, Callable
from uuid import uuid4
from datetime import datetime
from kafka import KafkaProducer, KafkaConsumer
from kafka.errors import KafkaError, KafkaTimeoutError

logger = logging.getLogger(__name__)

class KafkaConfig:
    """Configuration Kafka centralisée compatible avec NestJS"""
    
    def __init__(self):
        self.is_docker = os.environ.get('NODE_ENV') == 'docker' or os.environ.get('KAFKA_ENV') == 'docker'
        
        # Configuration robuste avec retry et timeouts
        self.brokers = self._get_brokers()
        self.client_id = 'adha-ai-service'
        self.retries = 5
        self.connection_timeout = 45000
        self.request_timeout = 30000
        
        # Configuration retry
        self.retry_config = {
            'initial_retry_time': 100,
            'retries': 8,
            'max_retry_time': 30000,
        }
        
    def _get_brokers(self) -> List[str]:
        """Obtient la liste des brokers selon l'environnement"""
        if self.is_docker:
            return [os.environ.get('KAFKA_BROKER_INTERNAL', 'kafka:29092')]
        else:
            return [os.environ.get('KAFKA_BROKER_EXTERNAL', 'localhost:9092')]

class StandardKafkaTopics:
    """Topics Kafka standardisés"""
    
    # Commerce Operations
    COMMERCE_OPERATION_CREATED = 'commerce.operation.created'
    COMMERCE_OPERATION_UPDATED = 'commerce.operation.updated'
    COMMERCE_OPERATION_DELETED = 'commerce.operation.deleted'
    
    # Accounting
    ACCOUNTING_JOURNAL_ENTRY = 'accounting.journal.entry'
    ACCOUNTING_JOURNAL_STATUS = 'accounting.journal.status'
    
    # Portfolio
    PORTFOLIO_ANALYSIS_REQUEST = 'portfolio.analysis.request'
    PORTFOLIO_ANALYSIS_RESPONSE = 'portfolio.analysis.response'
    PORTFOLIO_CHAT_MESSAGE = 'portfolio.chat.message'
    PORTFOLIO_CHAT_RESPONSE = 'portfolio.chat.response'
    
    # Adha AI General
    ADHA_AI_EVENTS = 'adha-ai-events'
    
    # Dead Letter Queue
    DLQ_FAILED_MESSAGES = 'dlq.failed.messages'

class MessageStandardizer:
    """Standardise les messages entre TypeScript et Python"""
    
    @staticmethod
    def create_standard_message(data: Any, source: str, correlation_id: Optional[str] = None) -> Dict[str, Any]:
        """Crée un message standardisé"""
        return {
            'id': str(uuid4()),
            'data': data,
            'metadata': {
                'correlationId': correlation_id or str(uuid4()),
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'source': source,
                'version': '1.0.0',
                'retryCount': 0,
            }
        }
    
    @staticmethod
    def convert_from_typescript(data: Any) -> Any:
        """Convertit les données TypeScript (camelCase) en Python (snake_case)"""
        if isinstance(data, dict):
            converted = {}
            for key, value in data.items():
                # Convertir camelCase en snake_case
                python_key = MessageStandardizer._camel_to_snake(key)
                converted[python_key] = MessageStandardizer.convert_from_typescript(value)
            return converted
        elif isinstance(data, list):
            return [MessageStandardizer.convert_from_typescript(item) for item in data]
        else:
            return data
    
    @staticmethod
    def convert_to_typescript(data: Any) -> Any:
        """Convertit les données Python (snake_case) en TypeScript (camelCase)"""
        if isinstance(data, dict):
            converted = {}
            for key, value in data.items():
                # Convertir snake_case en camelCase
                ts_key = MessageStandardizer._snake_to_camel(key)
                converted[ts_key] = MessageStandardizer.convert_to_typescript(value)
            return converted
        elif isinstance(data, list):
            return [MessageStandardizer.convert_to_typescript(item) for item in data]
        else:
            return data
    
    @staticmethod
    def _camel_to_snake(name: str) -> str:
        """Convertit camelCase en snake_case"""
        import re
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()
    
    @staticmethod
    def _snake_to_camel(name: str) -> str:
        """Convertit snake_case en camelCase"""
        components = name.split('_')
        return components[0] + ''.join(x.capitalize() for x in components[1:])

class RobustKafkaProducer:
    """Producer Kafka robuste avec retry et circuit breaker"""
    
    def __init__(self, config: KafkaConfig):
        self.config = config
        self.producer = None
        self.circuit_breaker = CircuitBreaker()
        self._initialize_producer()
    
    def _initialize_producer(self):
        """Initialise le producer avec configuration robuste"""
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=self.config.brokers,
                client_id=self.config.client_id,
                value_serializer=lambda v: json.dumps(v, ensure_ascii=False).encode('utf-8'),
                key_serializer=lambda k: k.encode('utf-8') if k else None,
                retries=self.config.retries,
                request_timeout_ms=self.config.request_timeout,
                retry_backoff_ms=self.config.retry_config['initial_retry_time'],
                max_in_flight_requests_per_connection=1,
                enable_idempotence=True,
                acks='all',
            )
            logger.info(f"Kafka producer initialized with brokers: {self.config.brokers}")
        except Exception as e:
            logger.error(f"Failed to initialize Kafka producer: {str(e)}")
            raise
    
    async def send_message(self, topic: str, message: Dict[str, Any], key: Optional[str] = None) -> bool:
        """Envoie un message avec retry automatique"""
        return await self.circuit_breaker.execute(
            lambda: self._send_message_internal(topic, message, key)
        )
    
    def _send_message_internal(self, topic: str, message: Dict[str, Any], key: Optional[str] = None) -> bool:
        """Envoie un message (méthode interne)"""
        try:
            if not self.producer:
                self._initialize_producer()
            
            # Standardiser le message
            if 'metadata' not in message:
                message = MessageStandardizer.create_standard_message(
                    message, 'adha_ai', message.get('correlationId')
                )
            
            future = self.producer.send(topic, value=message, key=key)
            record_metadata = future.get(timeout=30)
            
            logger.info(f"Message sent to {topic}: {message.get('id', 'unknown')} "
                       f"(partition: {record_metadata.partition}, offset: {record_metadata.offset})")
            return True
            
        except KafkaTimeoutError:
            logger.error(f"Timeout sending message to {topic}")
            raise
        except KafkaError as e:
            logger.error(f"Kafka error sending message to {topic}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error sending message to {topic}: {str(e)}")
            raise
    
    def close(self):
        """Ferme le producer"""
        if self.producer:
            self.producer.close()

class RobustKafkaConsumer:
    """Consumer Kafka robuste avec gestion d'erreurs"""
    
    def __init__(self, config: KafkaConfig, topics: List[str], group_id: str):
        self.config = config
        self.topics = topics
        self.group_id = group_id
        self.consumer = None
        self.message_handlers: Dict[str, Callable] = {}
        self.error_handler = None
        
    def _initialize_consumer(self):
        """Initialise le consumer"""
        try:
            self.consumer = KafkaConsumer(
                *self.topics,
                bootstrap_servers=self.config.brokers,
                client_id=f"{self.config.client_id}-consumer",
                group_id=self.group_id,
                value_deserializer=lambda m: json.loads(m.decode('utf-8')),
                auto_offset_reset='earliest',
                enable_auto_commit=True,
                session_timeout_ms=30000,
                heartbeat_interval_ms=3000,
                max_poll_records=100,
                max_poll_interval_ms=300000,
            )
            logger.info(f"Kafka consumer initialized for topics: {self.topics}")
        except Exception as e:
            logger.error(f"Failed to initialize Kafka consumer: {str(e)}")
            raise
    
    def register_handler(self, topic: str, handler: Callable):
        """Enregistre un handler pour un topic"""
        self.message_handlers[topic] = handler
    
    def register_error_handler(self, handler: Callable):
        """Enregistre un handler d'erreur"""
        self.error_handler = handler
    
    def start_consuming(self):
        """Démarre la consommation des messages"""
        if not self.consumer:
            self._initialize_consumer()
        
        logger.info(f"Starting to consume messages from topics: {self.topics}")
        
        try:
            for message in self.consumer:
                self._process_message(message)
        except KeyboardInterrupt:
            logger.info("Consumer interrupted by user")
        except Exception as e:
            logger.error(f"Consumer error: {str(e)}")
            if self.error_handler:
                self.error_handler(e)
        finally:
            self.close()
    
    def _process_message(self, message):
        """Traite un message reçu"""
        try:
            topic = message.topic
            data = message.value
            
            # Convertir les données TypeScript en format Python
            converted_data = MessageStandardizer.convert_from_typescript(data)
            
            # Validation de base
            if not self._validate_message(converted_data):
                logger.warning(f"Invalid message format from {topic}")
                return
            
            # Appeler le handler approprié
            handler = self.message_handlers.get(topic)
            if handler:
                handler(converted_data)
            else:
                logger.warning(f"No handler registered for topic: {topic}")
                
        except Exception as e:
            logger.error(f"Error processing message from {message.topic}: {str(e)}")
            if self.error_handler:
                self.error_handler(e, message)
    
    def _validate_message(self, message: Dict[str, Any]) -> bool:
        """Valide la structure du message"""
        return (
            isinstance(message, dict) and
            'id' in message and
            'data' in message and
            'metadata' in message and
            isinstance(message['metadata'], dict) and
            'correlation_id' in message['metadata']
        )
    
    def close(self):
        """Ferme le consumer"""
        if self.consumer:
            self.consumer.close()

class CircuitBreaker:
    """Circuit Breaker pour protéger contre les pannes"""
    
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failures = 0
        self.next_attempt = 0
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
    
    async def execute(self, operation: Callable):
        """Exécute une opération avec circuit breaker"""
        if self.state == 'OPEN':
            if time.time() < self.next_attempt:
                raise Exception('Circuit breaker is OPEN')
            self.state = 'HALF_OPEN'
        
        try:
            result = await operation() if hasattr(operation, '__await__') else operation()
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise e
    
    def _on_success(self):
        """Appelé en cas de succès"""
        self.failures = 0
        self.state = 'CLOSED'
    
    def _on_failure(self):
        """Appelé en cas d'échec"""
        self.failures += 1
        if self.failures >= self.failure_threshold:
            self.state = 'OPEN'
            self.next_attempt = time.time() + self.timeout

# Instance globale de configuration
kafka_config = KafkaConfig()
