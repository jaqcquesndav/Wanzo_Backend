"""
WSGI config for adha_ai_service project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""

import os
import threading
import logging

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'adha_ai_service.settings')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# Initialiser l'application Django
application = get_wsgi_application()

# Démarrer les consommateurs Kafka dans un thread séparé
def start_kafka_consumers():
    try:
        from api.kafka.start_consumers import start_consumers
        logger.info("Starting Kafka consumers...")
        start_consumers()
    except Exception as e:
        logger.error(f"Failed to start Kafka consumers: {str(e)}")

# Démarrer les consommateurs seulement si ENABLE_KAFKA_CONSUMERS est True
# Cette variable peut être définie dans les paramètres d'environnement
if os.environ.get('ENABLE_KAFKA_CONSUMERS', 'True').lower() == 'true':
    consumer_thread = threading.Thread(target=start_kafka_consumers, daemon=True)
    consumer_thread.start()
    logger.info("Kafka consumer thread started")
else:
    logger.info("Kafka consumers are disabled by configuration")
