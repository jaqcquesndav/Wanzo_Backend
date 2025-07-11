import json
from kafka import KafkaProducer
import os

KAFKA_BROKER_URL = os.environ.get('KAFKA_BROKER_URL', 'localhost:9092')

producer = KafkaProducer(
    bootstrap_servers=KAFKA_BROKER_URL,
    value_serializer=lambda v: json.dumps(v).encode('utf-8')
)

def send_event(topic, event):
    producer.send(topic, event)
    producer.flush()
