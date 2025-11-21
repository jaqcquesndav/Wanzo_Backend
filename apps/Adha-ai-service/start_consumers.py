"""
Script de démarrage des consumers Kafka pour Adha AI Service
Lance tous les consumers nécessaires pour la synchronisation et l'isolation des données
"""
import os
import sys
import threading
import time
import logging
from pathlib import Path

# Ajouter le répertoire du projet au path Python
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'adha_ai_service.settings')

import django
django.setup()

from api.kafka.customer_data_consumer import CustomerDataConsumer
from api.kafka.unified_consumer import UnifiedConsumer
from api.kafka.adha_context_consumer import AdhaContextConsumer

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/kafka_consumers.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class ConsumerManager:
    """
    Gestionnaire des consumers Kafka pour le service Adha AI.
    Lance et surveille tous les consumers nécessaires.
    """
    
    def __init__(self):
        self.consumers = {}
        self.running = False
        self.threads = []
        
    def start_all_consumers(self):
        """Démarre tous les consumers en parallèle."""
        logger.info("🚀 Starting Adha AI Kafka Consumers...")
        
        try:
            # 1. Consumer de synchronisation des données customer (CRITIQUE pour l'isolation)
            logger.info("Starting Customer Data Consumer...")
            customer_consumer = CustomerDataConsumer()
            customer_thread = threading.Thread(
                target=customer_consumer.start_consuming,
                name="CustomerDataConsumer",
                daemon=True
            )
            customer_thread.start()
            self.threads.append(customer_thread)
            self.consumers['customer_data'] = customer_consumer
            
            # 2. Consumer unifié pour les autres événements
            logger.info("Starting Unified Consumer...")
            unified_consumer = UnifiedConsumer()
            unified_thread = threading.Thread(
                target=unified_consumer.start,
                name="UnifiedConsumer", 
                daemon=True
            )
            unified_thread.start()
            self.threads.append(unified_thread)
            self.consumers['unified'] = unified_consumer
            
            # 3. Consumer ADHA Context pour synchronisation base de connaissances
            logger.info("Starting ADHA Context Consumer...")
            adha_context_consumer = AdhaContextConsumer()
            adha_context_thread = threading.Thread(
                target=adha_context_consumer.start,
                name="AdhaContextConsumer",
                daemon=True
            )
            adha_context_thread.start()
            self.threads.append(adha_context_thread)
            self.consumers['adha_context'] = adha_context_consumer
            
            self.running = True
            logger.info("✅ All Kafka consumers started successfully!")
            
            # Afficher le statut
            self.display_status()
            
        except Exception as e:
            logger.error(f"❌ Error starting consumers: {str(e)}")
            self.stop_all_consumers()
            raise
    
    def display_status(self):
        """Affiche le statut des consumers."""
        print("\n" + "="*60)
        print("🔄 ADHA AI KAFKA CONSUMERS STATUS")
        print("="*60)
        print(f"📡 Customer Data Consumer: {'✅ RUNNING' if 'customer_data' in self.consumers else '❌ STOPPED'}")
        print(f"📡 Unified Consumer: {'✅ RUNNING' if 'unified' in self.consumers else '❌ STOPPED'}")
        print(f"📡 ADHA Context Consumer: {'✅ RUNNING' if 'adha_context' in self.consumers else '❌ STOPPED'}")
        print(f"🧵 Active Threads: {len(self.threads)}")
        print("="*60)
        
        print("\n📋 TOPICS MONITORED:")
        print("• customer.user.updated - Sync des données utilisateur")
        print("• customer.user.created - Création d'utilisateurs")
        print("• customer.institution.updated - Sync des institutions")
        print("• customer.company.updated - Sync des sociétés")
        print("• user.login - Événements de connexion")
        print("• adha-ai-events - Événements Adha AI")
        print("• commerce.operation.created - Opérations commerciales")
        print("• portfolio.analysis.request - Demandes d'analyse")
        print("• accounting.journal.status - Statuts des écritures")
        print("• adha.context.created - Sources ADHA Context créées")
        print("• adha.context.updated - Sources ADHA Context modifiées")
        print("• adha.context.deleted - Sources ADHA Context supprimées")
        print("• adha.context.toggled - Sources ADHA Context activées/désactivées")
        print("• adha.context.expired - Sources ADHA Context expirées")
        
        print(f"\n🔒 ISOLATION: Middleware activé")
        print(f"⚡ PERFORMANCE: Cache Redis activé")
        print(f"🧮 CALCULATIONS: Détection automatique activée")
        print(f"📚 KNOWLEDGE BASE: Synchronisation temps réel activée")
        print(f"🛡️ PROTECTIONS: Circuit Breaker + Rate Limiting actifs")
        print("="*60)
    
    def monitor_consumers(self):
        """Surveille l'état des consumers et les redémarre si nécessaire."""
        logger.info("🔍 Starting consumer monitoring...")
        
        while self.running:
            try:
                # Vérifier que tous les threads sont encore vivants
                dead_threads = [t for t in self.threads if not t.is_alive()]
                
                if dead_threads:
                    logger.warning(f"⚠️ Found {len(dead_threads)} dead consumer threads")
                    
                    for dead_thread in dead_threads:
                        logger.error(f"❌ Consumer thread {dead_thread.name} died")
                        self.threads.remove(dead_thread)
                    
                    # Essayer de redémarrer les consumers morts
                    if len(self.threads) < 3:  # Nous avons 3 consumers principaux
                        logger.info("🔄 Attempting to restart consumers...")
                        self.restart_failed_consumers()
                
                # Attendre avant la prochaine vérification
                time.sleep(30)  # Vérification toutes les 30 secondes
                
            except KeyboardInterrupt:
                logger.info("🛑 Monitoring interrupted by user")
                break
            except Exception as e:
                logger.error(f"❌ Error in consumer monitoring: {str(e)}")
                time.sleep(10)  # Attendre avant de réessayer
    
    def restart_failed_consumers(self):
        """Redémarre les consumers qui ont échoué."""
        try:
            # Nettoyer les anciens consumers
            self.consumers.clear()
            
            # Redémarrer
            self.start_all_consumers()
            
        except Exception as e:
            logger.error(f"❌ Error restarting consumers: {str(e)}")
    
    def stop_all_consumers(self):
        """Arrête tous les consumers proprement."""
        logger.info("🛑 Stopping all Kafka consumers...")
        
        self.running = False
        
        # Arrêter les consumers
        for name, consumer in self.consumers.items():
            try:
                if hasattr(consumer, 'stop'):
                    consumer.stop()
                logger.info(f"✅ Stopped {name} consumer")
            except Exception as e:
                logger.error(f"❌ Error stopping {name} consumer: {str(e)}")
        
        # Attendre que les threads se terminent
        for thread in self.threads:
            try:
                thread.join(timeout=5)
                if thread.is_alive():
                    logger.warning(f"⚠️ Thread {thread.name} did not stop gracefully")
            except Exception as e:
                logger.error(f"❌ Error joining thread {thread.name}: {str(e)}")
        
        logger.info("✅ All consumers stopped")

def main():
    """Point d'entrée principal."""
    consumer_manager = ConsumerManager()
    
    try:
        # Démarrer tous les consumers
        consumer_manager.start_all_consumers()
        
        # Lancer la surveillance
        consumer_manager.monitor_consumers()
        
    except KeyboardInterrupt:
        logger.info("\n🛑 Shutdown requested by user")
    except Exception as e:
        logger.error(f"❌ Critical error: {str(e)}")
    finally:
        consumer_manager.stop_all_consumers()

if __name__ == "__main__":
    main()
