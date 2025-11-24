"""
Health check pour Kafka avec diagnostic détaillé
Utilisé pour monitorer l'état de Kafka et faciliter le debugging
"""
import logging
import os
from kafka import KafkaAdminClient
from kafka.errors import KafkaError, NoBrokersAvailable

logger = logging.getLogger(__name__)

def check_kafka_availability(timeout_ms=5000):
    """
    Vérifie si Kafka est disponible et opérationnel
    
    Returns:
        tuple: (is_available: bool, message: str, details: dict)
    """
    kafka_broker = os.environ.get('KAFKA_BROKER_INTERNAL', 'kafka:29092')
    
    try:
        admin_client = KafkaAdminClient(
            bootstrap_servers=kafka_broker,
            request_timeout_ms=timeout_ms,
            api_version_auto_timeout_ms=timeout_ms
        )
        
        # Récupérer les métadonnées pour vérifier la connexion
        cluster_metadata = admin_client._client.cluster
        
        controller = cluster_metadata.controller()
        controller_id = controller.id if controller else None
        
        details = {
            'broker': kafka_broker,
            'controller_id': controller_id,
            'broker_count': len(cluster_metadata.brokers()),
            'topics_count': len(cluster_metadata.topics()),
        }
        
        admin_client.close()
        
        return True, "Kafka is healthy", details
        
    except NoBrokersAvailable:
        return False, f"No Kafka brokers available at {kafka_broker}", {'broker': kafka_broker}
    except KafkaError as e:
        return False, f"Kafka error: {str(e)}", {'broker': kafka_broker, 'error': str(e)}
    except Exception as e:
        return False, f"Unexpected error: {str(e)}", {'broker': kafka_broker, 'error': str(e)}

def log_kafka_status():
    """Log l'état de Kafka avec détails"""
    is_available, message, details = check_kafka_availability()
    
    if is_available:
        logger.info(f"✓ Kafka Health Check: {message}")
        logger.info(f"  Broker: {details.get('broker')}")
        logger.info(f"  Brokers: {details.get('broker_count')}")
        logger.info(f"  Topics: {details.get('topics_count')}")
    else:
        logger.warning(f"✗ Kafka Health Check: {message}")
        logger.warning(f"  Details: {details}")
    
    return is_available
