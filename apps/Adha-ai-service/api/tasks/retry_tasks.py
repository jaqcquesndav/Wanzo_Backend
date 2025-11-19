"""
Celery tasks pour retry asynchrone des messages Kafka échoués.
"""
from celery import shared_task
from celery.utils.log import get_task_logger
import time
from typing import Dict, Any

logger = get_task_logger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def retry_message_processing(self, message_data: Dict[str, Any]):
    """
    Retry asynchrone d'un message échoué avec exponential backoff.
    
    Args:
        message_data: Les données du message à retraiter
        
    Retry policy:
        - Max 3 retries
        - Exponential backoff: 5s, 10s, 20s
    """
    try:
        from api.services.task_router import task_router
        
        message_id = message_data.get('id', 'unknown')
        retry_count = self.request.retries
        
        logger.info(
            f"Retrying message {message_id}, attempt {retry_count + 1}/3"
        )
        
        # Ajouter retry_count dans metadata
        if 'metadata' not in message_data:
            message_data['metadata'] = {}
        message_data['metadata']['retry_count'] = retry_count + 1
        
        # Retraiter le message
        result = task_router.route_task(message_data)
        
        if result and 'error' in result:
            raise Exception(f"Processing failed: {result['error']}")
        
        logger.info(f"Successfully retried message {message_id}")
        return {'status': 'success', 'message_id': message_id}
        
    except Exception as exc:
        logger.error(f"Retry failed: {str(exc)}")
        
        # Exponential backoff: 5s, 10s, 20s
        countdown = 5 * (2 ** self.request.retries)
        
        # Lever l'exception pour retry
        raise self.retry(exc=exc, countdown=countdown)

@shared_task
def process_pending_retries():
    """
    Task périodique (toutes les 5 minutes) pour traiter les retry programmés.
    Vérifie ProcessingRequest.get_pending_retries() et relance le traitement.
    """
    from api.models import ProcessingRequest
    
    pending = ProcessingRequest.get_pending_retries()
    count = pending.count()
    
    if count == 0:
        logger.debug("No pending retries found")
        return {'processed': 0}
    
    logger.info(f"Found {count} pending retries to process")
    
    processed = 0
    failed = 0
    
    for request in pending:
        try:
            logger.info(f"Processing retry for request {request.request_id}")
            
            # Relancer via Celery
            retry_message_processing.delay(request.request_data)
            processed += 1
            
        except Exception as e:
            logger.error(f"Failed to schedule retry for {request.request_id}: {str(e)}")
            failed += 1
    
    logger.info(f"Processed {processed} retries, {failed} failed")
    return {'processed': processed, 'failed': failed}

@shared_task
def cleanup_old_data_task():
    """
    Task quotidien pour nettoyer les anciennes données.
    Appelle la logique de cleanup des models.
    """
    from api.models import ProcessedMessage, ProcessingRequest
    
    logger.info("Starting cleanup task...")
    
    # Cleanup ProcessedMessage (> 7 jours)
    deleted_messages = ProcessedMessage.cleanup_old_records(days=7)
    logger.info(f"Deleted {deleted_messages} old ProcessedMessage records")
    
    # Cleanup ProcessingRequest complétées (> 30 jours)
    deleted_requests = ProcessingRequest.cleanup_old_requests(days=30)
    logger.info(f"Deleted {deleted_requests} old ProcessingRequest records")
    
    # Marquer requêtes abandonnées (> 24h)
    abandoned = ProcessingRequest.cleanup_abandoned_requests(hours=24)
    logger.info(f"Marked {abandoned} abandoned requests as timeout")
    
    return {
        'deleted_messages': deleted_messages,
        'deleted_requests': deleted_requests,
        'abandoned_requests': abandoned
    }
