"""
Configuration de l'app API avec initialisation safe de Kafka
"""
from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'
    verbose_name = 'Adha AI API'

    def ready(self):
        """
        Appelé quand Django a terminé l'initialisation.
        Vérifie Kafka mais ne bloque pas le démarrage.
        """
        logger.info("Initializing Adha AI Service...")
        
        # Import local pour éviter les imports circulaires
        try:
            from api.kafka.health_check import log_kafka_status
            
            # Vérifie Kafka mais continue même si indisponible
            kafka_available = log_kafka_status()
            
            if not kafka_available:
                logger.warning(
                    "⚠️  Service démarré en MODE DÉGRADÉ - Kafka indisponible\n"
                    "   Les événements ne seront pas publiés jusqu'à ce que Kafka soit disponible.\n"
                    "   Le service reste opérationnel pour les autres fonctionnalités."
                )
            else:
                logger.info("✓ Service démarré avec Kafka opérationnel")
                
        except Exception as e:
            logger.warning(f"Could not check Kafka status during startup: {e}")
        
        logger.info("Adha AI Service ready")
