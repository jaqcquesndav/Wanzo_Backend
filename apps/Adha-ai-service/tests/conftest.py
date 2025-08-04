"""
Configuration pytest pour le projet Adha AI Service
Définit les fixtures et configuration globale pour les tests
"""

import os
import sys
import pytest
from unittest.mock import MagicMock

# Ajouter le répertoire racine du projet au Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

@pytest.fixture(autouse=True)
def setup_test_environment():
    """Configuration automatique de l'environnement de test"""
    # Variables d'environnement pour les tests
    os.environ.setdefault('KAFKA_BROKERS', 'localhost:9092')
    os.environ.setdefault('DATABASE_URL', 'postgresql://test:test@localhost/test_db')
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'adha_ai_service.settings.test')
    os.environ.setdefault('ENVIRONMENT', 'test')

@pytest.fixture
def mock_kafka_producer():
    """Mock producer Kafka pour les tests"""
    producer = MagicMock()
    producer.send = MagicMock(return_value=asyncio.Future())
    producer.send.return_value.set_result(True)
    return producer

@pytest.fixture
def mock_kafka_consumer():
    """Mock consumer Kafka pour les tests"""
    consumer = MagicMock()
    consumer.consume = MagicMock(return_value=[])
    return consumer

@pytest.fixture
def sample_kafka_message():
    """Message Kafka exemple pour les tests"""
    return {
        'eventType': 'BUSINESS_OPERATION_CREATED',
        'timestamp': '2025-08-04T10:00:00Z',
        'data': {
            'id': '12345',
            'type': 'SALE',
            'amountCdf': 50000.0,
            'description': 'Test operation'
        },
        'metadata': {
            'correlationId': 'test-correlation-123',
            'source': 'gestion-commerciale-service'
        }
    }

# Import asyncio pour les fixtures async
import asyncio

@pytest.fixture
def event_loop():
    """Fixture pour créer une boucle d'événements pour les tests async"""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()
