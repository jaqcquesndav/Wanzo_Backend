import json
from kafka import KafkaConsumer
import os

KAFKA_BROKER_URL = os.environ.get('KAFKA_BROKER_URL', 'localhost:9092')

consumer = KafkaConsumer(
    'adha-ai-events',
    bootstrap_servers=KAFKA_BROKER_URL,
    value_deserializer=lambda m: json.loads(m.decode('utf-8')),
    auto_offset_reset='earliest',
    enable_auto_commit=True,
    group_id='adha-ai-service',
)

def consume_events(callback):
    for message in consumer:
        callback(message.value)
