import json
import logging
from kafka import KafkaConsumer
import os
from api.services.accounting_processor import process_business_operation
from api.kafka.producer_accounting import send_journal_entry_to_accounting

logger = logging.getLogger(__name__)

KAFKA_BROKER_URL = os.environ.get('KAFKA_BROKER_URL', 'localhost:9092')

def start_commerce_consumer():
    """
    Démarre un consumer Kafka pour écouter les événements d'opérations commerciales
    et les transformer en écritures comptables.
    """
    consumer = KafkaConsumer(
        'commerce.operation.created',
        bootstrap_servers=KAFKA_BROKER_URL,
        auto_offset_reset='earliest',
        enable_auto_commit=True,
        group_id='adha-ai-commerce-group',
        value_deserializer=lambda x: json.loads(x.decode('utf-8'))
    )

    logger.info("Commerce operations consumer started. Waiting for messages...")

    for message in consumer:
        operation_data = message.value
        logger.info(f"Received commercial operation: {operation_data.get('id', 'unknown')}")
        
        # Vérifier le client pour éviter de mélanger les données
        client_id = operation_data.get('clientId')
        if not client_id:
            logger.error(f"Missing clientId in operation {operation_data.get('id', 'unknown')}, skipping")
            continue
            
        # Transformer en écriture comptable
        try:
            journal_entry = process_business_operation(operation_data)
            
            # Envoyer au service comptable si la transformation a réussi
            if journal_entry:
                send_journal_entry_to_accounting(journal_entry)
                logger.info(f"Sent journal entry to accounting for operation {operation_data.get('id', 'unknown')}")
            else:
                logger.warning(f"No journal entry generated for operation {operation_data.get('id', 'unknown')}")
        except Exception as e:
            logger.error(f"Error processing operation {operation_data.get('id', 'unknown')}: {str(e)}")

if __name__ == "__main__":
    # Pour les tests locaux
    logging.basicConfig(level=logging.INFO)
    start_commerce_consumer()
