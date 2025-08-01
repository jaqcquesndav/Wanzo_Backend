"""
Module de consommation Kafka unifié pour Adha AI Service.
Ce consommateur écoute tous les événements pertinents et les route
vers le service approprié via le TaskRouter.
"""

import json
import logging
import os
from kafka import KafkaConsumer
from typing import List, Dict, Any

from api.services.task_router import task_router

logger = logging.getLogger(__name__)

KAFKA_BROKER_URL = os.environ.get('KAFKA_BROKER_URL', 'localhost:9092')

class UnifiedConsumer:
    """
    Consommateur Kafka unifié qui écoute plusieurs topics et route
    les messages vers le service approprié.
    """
    
    def __init__(self):
        self.topics = [
            'adha-ai-events',           # Événements généraux pour Adha AI
            'commerce.operation.created', # Opérations commerciales
            'portfolio.analysis.request', # Demandes d'analyse de portefeuille
            'accounting.journal.status'  # Statuts de traitement des écritures comptables
        ]
        self.consumer = None
    
    def start(self):
        """
        Démarre le consommateur Kafka et commence à traiter les messages.
        """
        try:
            self.consumer = KafkaConsumer(
                *self.topics,
                bootstrap_servers=KAFKA_BROKER_URL,
                auto_offset_reset='earliest',
                enable_auto_commit=True,
                group_id='adha-ai-unified-group',
                value_deserializer=lambda x: json.loads(x.decode('utf-8'))
            )
            
            logger.info(f"Unified consumer started. Listening to topics: {', '.join(self.topics)}")
            self._process_messages()
            
        except Exception as e:
            logger.exception(f"Error starting unified consumer: {str(e)}")
            raise
    
    def _process_messages(self):
        """
        Traite les messages en continu et les route vers le service approprié.
        """
        for message in self.consumer:
            try:
                topic = message.topic
                data = message.value
                
                logger.info(f"Received message from topic {topic}: {data.get('id', 'unknown')}")
                
                # Enrichir le message avec des métadonnées sur la source
                if 'metadata' not in data:
                    data['metadata'] = {}
                
                data['metadata']['kafka_topic'] = topic
                
                # Router le message vers le service approprié
                response = task_router.route_task(data)
                
                if 'error' in response:
                    logger.error(f"Error processing message: {response.get('error')}")
                else:
                    logger.info(f"Successfully processed message of type: {response.get('type', 'unknown')}")
                    
            except Exception as e:
                logger.exception(f"Error processing Kafka message: {str(e)}")
    
    def stop(self):
        """
        Arrête le consommateur Kafka.
        """
        if self.consumer:
            self.consumer.close()
            logger.info("Unified consumer stopped")


unified_consumer = UnifiedConsumer()

def start_unified_consumer():
    """
    Fonction d'entrée pour démarrer le consommateur unifié.
    """
    unified_consumer.start()
