"""
Script pour démarrer les consommateurs Kafka en arrière-plan
"""

import threading
import logging
import time
import os
import sys
from django.conf import settings

# Configurer le logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(os.path.join('logs', 'kafka_consumers.log'))
    ]
)
logger = logging.getLogger(__name__)

def start_consumers():
    """
    Démarre tous les consommateurs Kafka dans des threads séparés
    """
    # S'assurer que le répertoire de logs existe
    if not os.path.exists('logs'):
        os.makedirs('logs')
    
    # Importer les consommateurs Kafka
    from api.kafka.consumer_commerce import start_commerce_consumer
    from api.kafka.unified_consumer import start_unified_consumer
    
    # Liste des fonctions de démarrage des consommateurs avec leurs noms
    consumers = [
        ('unified_consumer', start_unified_consumer),
        # Le consommateur unifié remplace les anciens consommateurs individuels
        # Conserver temporairement l'ancien consommateur pour assurer la rétrocompatibilité
        # TODO: Supprimer cette ligne après avoir migré complètement vers le consommateur unifié
        ('commerce_operations', start_commerce_consumer),
    ]
    
    threads = []
    
    # Créer et démarrer un thread pour chaque consommateur
    for name, consumer_func in consumers:
        logger.info(f"Starting consumer: {name}")
        thread = threading.Thread(target=consumer_func, name=f"{name}_consumer_thread")
        thread.daemon = True  # Le thread s'arrêtera quand le thread principal s'arrête
        thread.start()
        threads.append((name, thread))
        logger.info(f"Consumer {name} started in thread {thread.name}")
    
    # Surveiller les threads
    while True:
        for name, thread in threads:
            if not thread.is_alive():
                logger.error(f"Consumer {name} thread died. Restarting...")
                # Redémarrer le thread
                for n, func in consumers:
                    if n == name:
                        new_thread = threading.Thread(target=func, name=f"{name}_consumer_thread")
                        new_thread.daemon = True
                        new_thread.start()
                        # Remplacer le thread mort par le nouveau
                        idx = threads.index((name, thread))
                        threads[idx] = (name, new_thread)
                        logger.info(f"Consumer {name} restarted in thread {new_thread.name}")
                        break
        
        # Attendre un peu avant de vérifier à nouveau
        time.sleep(10)

if __name__ == "__main__":
    logger.info("Starting Kafka consumers as standalone script...")
    start_consumers()
