"""
Module de production Kafka pour les réponses aux analyses de portefeuille.
Ce module est responsable d'envoyer les réponses d'analyse de portefeuille
au service portfolio-institution.
"""

import json
import logging
from typing import Dict, Any
import os
from kafka import KafkaProducer
from kafka.errors import KafkaError

logger = logging.getLogger(__name__)

KAFKA_BROKER_URL = os.environ.get('KAFKA_BROKER_URL', 'localhost:9092')

class PortfolioProducer:
    """
    Producteur Kafka pour les réponses d'analyse de portefeuille
    """
    
    def __init__(self):
        """
        Initialise le producteur Kafka.
        """
        self.producer = KafkaProducer(
            bootstrap_servers=KAFKA_BROKER_URL,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            acks='all'
        )
        logger.info("Portfolio analysis producer initialized")
        
    def send_analysis_response(self, analysis_result: Dict[str, Any]) -> bool:
        """
        Envoie une réponse d'analyse de portefeuille au service portfolio-institution.
        
        Args:
            analysis_result: Le résultat de l'analyse à envoyer
            
        Returns:
            bool: True si l'envoi a réussi, False sinon
        """
        try:
            # Préparer les données à envoyer
            if "requestId" not in analysis_result:
                logger.error("Missing requestId in analysis result, cannot send response")
                return False
                
            request_id = analysis_result["requestId"]
            topic = 'portfolio.analysis.response'
            
            # Envoyer le message
            future = self.producer.send(
                topic,
                key=request_id.encode('utf-8') if request_id else None,
                value=analysis_result
            )
            
            # Attendre la confirmation d'envoi (bloquant)
            record_metadata = future.get(timeout=10)
            
            logger.info(
                f"Analysis response for request {request_id} sent to topic {topic} "
                f"[partition: {record_metadata.partition}, offset: {record_metadata.offset}]"
            )
            
            return True
        except KafkaError as e:
            logger.error(f"Error sending analysis response: {str(e)}")
            return False
        except Exception as e:
            logger.exception(f"Unexpected error sending analysis response: {str(e)}")
            return False
            
    def send_chat_response(self, chat_response: Dict[str, Any]) -> bool:
        """
        Envoie une réponse de chat au service portfolio-institution.
        
        Args:
            chat_response: La réponse de chat à envoyer
            
        Returns:
            bool: True si l'envoi a réussi, False sinon
        """
        try:
            # Préparer les données à envoyer
            if "requestId" not in chat_response:
                logger.error("Missing requestId in chat response, cannot send response")
                return False
                
            request_id = chat_response["requestId"]
            topic = 'portfolio.chat.response'
            
            # Envoyer le message
            future = self.producer.send(
                topic,
                key=request_id.encode('utf-8') if request_id else None,
                value=chat_response
            )
            
            # Attendre la confirmation d'envoi (bloquant)
            record_metadata = future.get(timeout=10)
            
            logger.info(
                f"Chat response for request {request_id} sent to topic {topic} "
                f"[partition: {record_metadata.partition}, offset: {record_metadata.offset}]"
            )
            
            return True
        except KafkaError as e:
            logger.error(f"Error sending chat response: {str(e)}")
            return False
        except Exception as e:
            logger.exception(f"Unexpected error sending chat response: {str(e)}")
            return False
    
    def close(self):
        """Ferme le producteur Kafka"""
        if self.producer:
            self.producer.close()
            logger.info("Portfolio producer closed")

# Instance singleton du producteur
portfolio_producer = PortfolioProducer()

def send_analysis_response(analysis_result: Dict[str, Any]) -> bool:
    """
    Envoie une réponse d'analyse au service portfolio-institution.
    
    Args:
        analysis_result: Le résultat de l'analyse à envoyer
        
    Returns:
        bool: True si l'envoi a réussi, False sinon
    """
    return portfolio_producer.send_analysis_response(analysis_result)

def send_chat_response(chat_response: Dict[str, Any]) -> bool:
    """
    Envoie une réponse de chat au service portfolio-institution.
    
    Args:
        chat_response: La réponse de chat à envoyer
        
    Returns:
        bool: True si l'envoi a réussi, False sinon
    """
    return portfolio_producer.send_chat_response(chat_response)
