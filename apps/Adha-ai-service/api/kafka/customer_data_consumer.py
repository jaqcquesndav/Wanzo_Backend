"""
Customer Data Consumer pour Adha AI Service
Synchronise en temps réel les données utilisateur/institution depuis le customer-service
"""
import json
import logging
from datetime import datetime
from typing import Dict, Any
from django.core.cache import cache
from django.conf import settings

from api.kafka.robust_kafka_client import RobustKafkaConsumer, StandardKafkaTopics, kafka_config

logger = logging.getLogger(__name__)

class CustomerDataConsumer:
    """
    Consumer Kafka dédié à la synchronisation des données utilisateur/institution
    depuis le customer-service pour maintenir l'isolation des données à jour.
    """
    
    def __init__(self):
        self.topics = [
            'customer.user.updated',
            'customer.user.created', 
            'customer.institution.updated',
            'customer.company.updated',
            'user.login'  # Événement de connexion pour sync immédiate
        ]
        self.consumer = None
        self.cache_ttl = 3600  # 1 heure de cache
        
    def start_consuming(self):
        """Démarre la consommation des événements de synchronisation."""
        try:
            self.consumer = RobustKafkaConsumer(
                config=kafka_config,
                topics=self.topics,
                group_id='adha-ai-customer-sync'
            )
            
            # Enregistrer les handlers spécifiques
            for topic in self.topics:
                self.consumer.register_handler(topic, self._handle_customer_event)
            
            self.consumer.register_error_handler(self._handle_error)
            
            logger.info(f"Customer data consumer started for topics: {self.topics}")
            self.consumer.start_consuming()
            
        except Exception as e:
            logger.exception(f"Error starting customer data consumer: {str(e)}")
            raise
    
    def _handle_customer_event(self, message: Dict[str, Any]):
        """Route les événements vers les handlers appropriés."""
        try:
            event_type = message.get('type', '')
            data = message.get('data', message)
            
            logger.info(f"Processing customer event: {event_type}")
            
            if 'user' in event_type:
                self._handle_user_event(event_type, data)
            elif 'institution' in event_type:
                self._handle_institution_event(event_type, data)
            elif 'company' in event_type:
                self._handle_company_event(event_type, data)
            elif event_type == 'user.login':
                self._handle_user_login_event(data)
                
        except Exception as e:
            logger.error(f"Error handling customer event: {str(e)}")
            
    def _handle_user_event(self, event_type: str, data: Dict[str, Any]):
        """Traite les événements utilisateur."""
        try:
            user_id = data.get('id') or data.get('user_id')
            if not user_id:
                logger.warning("User event without user_id")
                return
            
            # Construire le contexte d'isolation mis à jour
            isolation_context = {
                'user_id': user_id,
                'company_id': data.get('company', {}).get('id') if data.get('company') else None,
                'financial_institution_id': data.get('financialInstitution', {}).get('id') if data.get('financialInstitution') else None,
                'customer_type': 'institution' if data.get('financialInstitution') else 'sme',
                'permissions': data.get('permissions', []),
                'last_sync': datetime.utcnow().isoformat(),
                'sync_source': 'kafka_user_event'
            }
            
            # Mettre à jour le cache d'isolation
            cache_key = f"user_context_{user_id}"
            cache.set(cache_key, isolation_context, self.cache_ttl)
            
            # Cache additionnel pour les recherches par company/institution
            if isolation_context['company_id']:
                company_cache_key = f"company_users_{isolation_context['company_id']}"
                company_users = cache.get(company_cache_key, set())
                company_users.add(str(user_id))
                cache.set(company_cache_key, company_users, self.cache_ttl)
            
            if isolation_context['financial_institution_id']:
                institution_cache_key = f"institution_users_{isolation_context['financial_institution_id']}"
                institution_users = cache.get(institution_cache_key, set())
                institution_users.add(str(user_id))
                cache.set(institution_cache_key, institution_users, self.cache_ttl)
            
            logger.info(f"Updated isolation context for user {user_id}: {isolation_context['customer_type']}")
            
        except Exception as e:
            logger.error(f"Error handling user event: {str(e)}")
    
    def _handle_institution_event(self, event_type: str, data: Dict[str, Any]):
        """Traite les événements d'institution financière."""
        try:
            institution_id = data.get('id')
            if not institution_id:
                logger.warning("Institution event without institution_id")
                return
            
            # Mettre à jour le cache des données d'institution
            institution_data = {
                'id': institution_id,
                'name': data.get('name'),
                'type': data.get('type'),
                'status': data.get('status'),
                'last_sync': datetime.utcnow().isoformat(),
                'sync_source': 'kafka_institution_event'
            }
            
            cache_key = f"institution_data_{institution_id}"
            cache.set(cache_key, institution_data, self.cache_ttl)
            
            # Invalider le cache des utilisateurs de cette institution pour forcer la resync
            institution_users_key = f"institution_users_{institution_id}"
            institution_users = cache.get(institution_users_key, set())
            
            for user_id in institution_users:
                user_cache_key = f"user_context_{user_id}"
                cache.delete(user_cache_key)  # Forcer la resync au prochain accès
            
            logger.info(f"Updated institution data for {institution_id}")
            
        except Exception as e:
            logger.error(f"Error handling institution event: {str(e)}")
    
    def _handle_company_event(self, event_type: str, data: Dict[str, Any]):
        """Traite les événements de société/PME."""
        try:
            company_id = data.get('id')
            if not company_id:
                logger.warning("Company event without company_id")
                return
            
            # Mettre à jour le cache des données de société
            company_data = {
                'id': company_id,
                'name': data.get('name'),
                'type': data.get('type'),
                'status': data.get('status'),
                'last_sync': datetime.utcnow().isoformat(),
                'sync_source': 'kafka_company_event'
            }
            
            cache_key = f"company_data_{company_id}"
            cache.set(cache_key, company_data, self.cache_ttl)
            
            # Invalider le cache des utilisateurs de cette société pour forcer la resync
            company_users_key = f"company_users_{company_id}"
            company_users = cache.get(company_users_key, set())
            
            for user_id in company_users:
                user_cache_key = f"user_context_{user_id}"
                cache.delete(user_cache_key)  # Forcer la resync au prochain accès
            
            logger.info(f"Updated company data for {company_id}")
            
        except Exception as e:
            logger.error(f"Error handling company event: {str(e)}")
    
    def _handle_user_login_event(self, data: Dict[str, Any]):
        """
        Traite les événements de connexion utilisateur pour sync immédiate.
        Priorité maximale pour avoir le contexte à jour dès la connexion.
        """
        try:
            user_id = data.get('userId') or data.get('user_id')
            if not user_id:
                logger.warning("User login event without user_id")
                return
            
            # Pour les connexions, faire une sync immédiate et complète
            full_context = {
                'user_id': user_id,
                'company_id': data.get('companyId'),
                'financial_institution_id': data.get('financialInstitutionId'),
                'customer_type': data.get('customerType', 'sme'),
                'permissions': data.get('permissions', []),
                'last_login': data.get('timestamp', datetime.utcnow().isoformat()),
                'last_sync': datetime.utcnow().isoformat(),
                'sync_source': 'kafka_login_event',
                'priority_sync': True  # Marquer comme sync prioritaire
            }
            
            # Cache avec TTL plus long pour les utilisateurs connectés
            cache_key = f"user_context_{user_id}"
            cache.set(cache_key, full_context, self.cache_ttl * 2)  # 2 heures pour les connectés
            
            # Aussi mettre en cache la session active
            session_key = f"active_session_{user_id}"
            session_data = {
                'login_time': full_context['last_login'],
                'isolation_context': full_context
            }
            cache.set(session_key, session_data, self.cache_ttl * 4)  # 4 heures de session
            
            logger.info(f"Priority sync completed for user login {user_id} - {full_context['customer_type']}")
            
        except Exception as e:
            logger.error(f"Error handling user login event: {str(e)}")
    
    def _handle_error(self, error: Exception, message: Dict[str, Any] = None):
        """Gère les erreurs de consommation."""
        logger.error(f"Customer data consumer error: {str(error)}")
        if message:
            logger.error(f"Error processing message: {message}")
    
    def get_user_isolation_context(self, user_id: str) -> Dict[str, Any]:
        """
        Méthode utilitaire pour récupérer le contexte d'isolation depuis le cache.
        Utilisée par le middleware d'isolation.
        """
        cache_key = f"user_context_{user_id}"
        context = cache.get(cache_key)
        
        if context:
            logger.debug(f"Retrieved cached isolation context for user {user_id}")
            return context
        
        logger.debug(f"No cached isolation context found for user {user_id}")
        return None
