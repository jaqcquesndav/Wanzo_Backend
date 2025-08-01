import json
from kafka import KafkaProducer
import os

KAFKA_BROKER_URL = os.environ.get('KAFKA_BROKER_URL', 'localhost:9092')

producer = KafkaProducer(
    bootstrap_servers=KAFKA_BROKER_URL,
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

def send_journal_entry_to_accounting(journal_entry):
    # Le topic doit correspondre à celui consommé par accounting-service pour les écritures
    producer.send('accounting.journal.entry', journal_entry)
    producer.flush()
