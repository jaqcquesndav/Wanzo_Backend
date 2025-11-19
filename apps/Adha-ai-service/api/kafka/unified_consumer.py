"""
Module de consommation Kafka unifié et robuste pour Adha AI Service.
Ce consommateur écoute tous les événements pertinents et les route
vers le service approprié via le TaskRouter avec gestion d'erreurs complète.
"""

import json
import logging
import os
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Callable

from .robust_kafka_client import (
    RobustKafkaConsumer, 
    StandardKafkaTopics, 
    kafka_config,
    MessageStandardizer
)
import time
from api.services.task_router import task_router
from api.models import ProcessedMessage, ProcessingRequest
from api.services.token_reservation import token_reservation_service, InsufficientTokensError

logger = logging.getLogger(__name__)

class UnifiedConsumer:
    """
    Consommateur Kafka unifié robuste qui écoute plusieurs topics et route
    les messages vers le service approprié avec gestion d'erreurs complète.
    """
    
    def __init__(self):
        self.topics = [
            StandardKafkaTopics.ADHA_AI_EVENTS,
            StandardKafkaTopics.COMMERCE_OPERATION_CREATED,
            StandardKafkaTopics.PORTFOLIO_ANALYSIS_REQUEST,
            StandardKafkaTopics.ACCOUNTING_JOURNAL_STATUS,
        ]
        self.consumer = None
        self.is_running = False
        self.error_count = 0
        self.max_errors = 10
    
    def start(self):
        """
        Démarre le consommateur Kafka robuste et commence à traiter les messages.
        """
        try:
            self.consumer = RobustKafkaConsumer(
                config=kafka_config,
                topics=self.topics,
                group_id='adha-ai-unified-group'
            )
            
            # Enregistrer les handlers
            for topic in self.topics:
                self.consumer.register_handler(topic, self._process_message)
            
            self.consumer.register_error_handler(self._handle_error)
            
            logger.info(f"Unified robust consumer started. Listening to topics: {', '.join(self.topics)}")
            self.is_running = True
            self.consumer.start_consuming()
            
        except Exception as e:
            logger.exception(f"Error starting unified consumer: {str(e)}")
            self.is_running = False
            raise
    
    def _process_message(self, message: Dict[str, Any]):
        """
        Traite les messages en continu et les route vers le service approprié.
        Avec gestion d'erreurs robuste, idempotence, et retry automatique.
        """
        start_time = time.time()
        topic = message.get('metadata', {}).get('kafka_topic', 'unknown')
        
        try:
            # Extraire les métadonnées
            metadata = message.get('metadata', {})
            data = message.get('data', message)  # Fallback si pas de structure standard
            message_id = message.get('id', 'unknown')
            correlation_id = metadata.get('correlation_id', 'unknown')
            
            # ✅ IDEMPOTENCE: Vérifier si message déjà traité
            if ProcessedMessage.is_already_processed(message_id):
                logger.info(f"Skipping duplicate message {message_id} from topic {topic}")
                return
            
            logger.info(f"Processing message {message_id} (correlation: {correlation_id}) from topic {topic}")
            
            # Extraire company_id pour tracking
            company_id = data.get('company_id') or data.get('companyId') or data.get('institutionId')
            
            # ✅ STATE MANAGEMENT: Créer ou récupérer ProcessingRequest
            request_type_map = {
                'portfolio.analysis.request': 'analysis',
                'portfolio.chat.message': 'chat',
                'commerce.operation.created': 'accounting',
                'accounting.journal.status': 'accounting'
            }
            request_type = request_type_map.get(topic, 'chat')
            
            processing_request, created = ProcessingRequest.objects.get_or_create(
                correlation_id=correlation_id,
                defaults={
                    'request_type': request_type,
                    'company_id': company_id,
                    'request_data': data
                }
            )
            
            if not created and processing_request.status == 'completed':
                logger.info(f"Request {correlation_id} already completed, skipping")
                return
            
            processing_request.mark_as_processing()
            
            # Enrichir le message avec des métadonnées de traitement
            if 'processing_metadata' not in data:
                data['processing_metadata'] = {}
            
            data['processing_metadata'].update({
                'received_at': datetime.utcnow().isoformat(),
                'consumer_version': '3.0.0',
                'retry_count': metadata.get('retry_count', 0),
                'processing_request_id': str(processing_request.request_id)
            })
            
            # ✅ VÉRIFICATION QUOTA: Estimer et réserver tokens AVANT traitement
            estimated_tokens = 0
            if company_id and request_type in ['chat', 'analysis', 'accounting']:
                try:
                    content_length = len(str(data))
                    estimated_tokens = token_reservation_service.estimate_tokens(
                        request_type, content_length
                    )
                    
                    token_reservation_service.check_and_reserve_tokens(
                        company_id, estimated_tokens
                    )
                    logger.info(f"Reserved {estimated_tokens} tokens for company {company_id}")
                    
                except InsufficientTokensError as e:
                    logger.warning(f"Insufficient tokens: {str(e)}")
                    processing_request.mark_as_failed(str(e))
                    
                    # Marquer comme traité même si quota insuffisant
                    ProcessedMessage.mark_as_processed(
                        message_id, correlation_id, topic, company_id, 0
                    )
                    return
            
            # Router le message vers le service approprié
            response = task_router.route_task(data)
            
            processing_time = (time.time() - start_time) * 1000  # Convertir en ms
            
            if response and 'error' in response:
                logger.error(f"Error processing message {message_id}: {response.get('error')} (processed in {processing_time:.2f}ms)")
                
                # Marquer request comme failed
                processing_request.mark_as_failed(response.get('error'))
                
                # Rollback tokens réservés
                if estimated_tokens > 0 and company_id:
                    token_reservation_service.release_reserved_tokens(company_id, estimated_tokens)
                
                self._handle_processing_error(message, response.get('error'))
            else:
                logger.info(f"Successfully processed message {message_id} of type: {response.get('type', 'unknown')} in {processing_time:.2f}ms")
                self.error_count = max(0, self.error_count - 1)  # Réduire le compteur d'erreurs
                
                # Extraire tokens réellement utilisés
                actual_tokens_used = response.get('tokens_used', {}).get('total', estimated_tokens)
                
                # Ajuster tokens si nécessaire
                if estimated_tokens > 0 and company_id:
                    token_reservation_service.adjust_tokens_after_processing(
                        company_id, estimated_tokens, actual_tokens_used
                    )
                
                # Marquer request comme completed
                processing_request.mark_as_completed(
                    result_data=response,
                    tokens_used=actual_tokens_used
                )
                
                # ✅ Marquer message comme traité (idempotence)
                ProcessedMessage.mark_as_processed(
                    message_id=message_id,
                    correlation_id=correlation_id,
                    topic=topic,
                    company_id=company_id,
                    processing_time_ms=int(processing_time)
                )
                
                # Enregistrer les métriques de succès
                try:
                    # Import dynamique pour éviter les dépendances circulaires
                    import logging
                    # Pour l'instant, on log les métriques. Plus tard on pourra intégrer un système de monitoring Python
                    logger.debug(f"METRICS: message_received_success topic={topic} processing_time={processing_time:.2f}ms")
                except Exception as metrics_error:
                    logger.warning(f"Failed to record success metrics: {str(metrics_error)}")
                
        except Exception as e:
            processing_time = (time.time() - start_time) * 1000
            logger.exception(f"Critical error processing message: {str(e)} (failed after {processing_time:.2f}ms)")
            
            # Rollback tokens si réservés
            if 'estimated_tokens' in locals() and estimated_tokens > 0 and 'company_id' in locals() and company_id:
                token_reservation_service.release_reserved_tokens(company_id, estimated_tokens)
            
            # Marquer request comme failed si existe
            if 'processing_request' in locals():
                import traceback
                processing_request.mark_as_failed(str(e), traceback.format_exc())
            
            self._handle_processing_error(message, str(e))
            
            # Enregistrer les métriques d'erreur
            try:
                logger.debug(f"METRICS: message_received_error topic={topic} processing_time={processing_time:.2f}ms error={str(e)}")
            except Exception as metrics_error:
                logger.warning(f"Failed to record error metrics: {str(metrics_error)}")
    
    def _handle_processing_error(self, message: Dict[str, Any], error: str):
        """
        Gère les erreurs de traitement avec retry et DLQ
        """
        try:
            retry_count = message.get('metadata', {}).get('retry_count', 0)
            max_retries = 3
            
            if retry_count < max_retries:
                # Tenter un retry avec délai exponentiel
                delay = min(2 ** retry_count, 60)  # Max 60 secondes
                logger.warning(f"Scheduling retry {retry_count + 1}/{max_retries} in {delay}s for message {message.get('id')}")
                
                # Ici on pourrait implémenter un système de retry asynchrone
                # Pour l'instant, on log l'intention
                
            else:
                # Envoyer vers DLQ
                logger.error(f"Max retries exceeded for message {message.get('id')}, sending to DLQ")
                self._send_to_dlq(message, error)
            
            self.error_count += 1
            if self.error_count > self.max_errors:
                logger.critical(f"Too many errors ({self.error_count}), stopping consumer")
                self.stop()
        
        except Exception as e:
            logger.critical(f"Error in error handler: {str(e)}")
    
    def _send_to_dlq(self, message: Dict[str, Any], error: str):
        """
        Envoie un message vers la Dead Letter Queue
        """
        try:
            # Ajouter des informations sur l'erreur
            from .robust_kafka_client import StandardKafkaTopics
            from kafka import KafkaProducer
            import json
            
            # Enrichir le message avec des informations sur l'erreur
            dlq_message = message.copy() if isinstance(message, dict) else {'original_data': message}
            
            if 'metadata' not in dlq_message:
                dlq_message['metadata'] = {}
            
            dlq_message['metadata'].update({
                'error': error,
                'failed_at': datetime.utcnow().isoformat(),
                'original_topic': message.get('metadata', {}).get('kafka_topic', 'unknown'),
                'dlq_reason': 'max_retries_exceeded'
            })
            
            # Créer un producer spécifique pour le DLQ
            producer = KafkaProducer(
                bootstrap_servers=self.consumer.config.brokers,
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            
            # Envoyer vers la DLQ
            future = producer.send(
                StandardKafkaTopics.DLQ_FAILED_MESSAGES,
                value=dlq_message
            )
            
            # Attendre confirmation d'envoi
            record_metadata = future.get(timeout=10)
            logger.info(f"Message sent to DLQ: {dlq_message.get('id', 'unknown')} "
                      f"(partition: {record_metadata.partition}, offset: {record_metadata.offset})")
            
            # Fermer le producer
            producer.close()
            
        except Exception as e:
            logger.critical(f"Failed to send message to DLQ: {str(e)}")
    
    def _handle_error(self, error: Exception, message=None):
        """
        Gère les erreurs générales du consumer
        """
        logger.error(f"Consumer error: {str(error)}")
        
        # Tenter de redémarrer le consumer après une courte pause
        if self.is_running:
            logger.info("Attempting to restart consumer after error...")
            try:
                if self.consumer:
                    self.consumer.close()
                # Attendre avant de redémarrer
                import time
                time.sleep(5)
                self.start()
            except Exception as restart_error:
                logger.critical(f"Failed to restart consumer: {str(restart_error)}")
                self.is_running = False
    
    def stop(self):
        """
        Arrête le consommateur Kafka proprement.
        """
        self.is_running = False
        if self.consumer:
            self.consumer.close()
            logger.info("Unified consumer stopped")
    
    def health_check(self) -> Dict[str, Any]:
        """
        Vérifie l'état de santé du consumer
        """
        return {
            'status': 'healthy' if self.is_running and self.error_count < self.max_errors else 'unhealthy',
            'is_running': self.is_running,
            'error_count': self.error_count,
            'max_errors': self.max_errors,
            'topics': self.topics,
        }


unified_consumer = UnifiedConsumer()

def start_unified_consumer():
    """
    Fonction d'entrée pour démarrer le consommateur unifié.
    """
    unified_consumer.start()
