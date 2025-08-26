"""
Enhanced Event Producer for Adha AI Service
Produit des événements optimisés avec métriques de performance
"""
import json
import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from django.conf import settings

from api.kafka.robust_kafka_client import RobustKafkaProducer, kafka_config

class AdhaEventsProducer:
    """
    Producer Kafka optimisé pour les événements Adha AI avec métriques de performance
    et gestion d'erreurs avancée.
    """
    
    def __init__(self):
        self.producer = RobustKafkaProducer(config=kafka_config)
        self.base_topic = 'adha-ai-events'
        
    def publish_ai_response_event(
        self, 
        user_id: str, 
        conversation_id: str, 
        response_data: Dict[str, Any], 
        performance_metrics: Dict[str, Any],
        isolation_context: Optional[Dict[str, Any]] = None
    ):
        """
        Publie un événement de réponse IA avec métriques de performance.
        """
        try:
            event = {
                'id': str(uuid.uuid4()),
                'type': 'ai_response_generated',
                'timestamp': datetime.utcnow().isoformat(),
                'data': {
                    'user_id': user_id,
                    'conversation_id': conversation_id,
                    'response_length': len(response_data.get('response', '')),
                    'response_time_ms': performance_metrics.get('response_time', 0),
                    'tokens_used': performance_metrics.get('tokens', 0),
                    'calculation_detected': performance_metrics.get('calculation_used', False),
                    'streaming_enabled': performance_metrics.get('streaming', False),
                    'relevant_entries_count': len(response_data.get('relevant_entries', [])),
                    
                    # Contexte d'isolation pour analytics
                    'company_id': isolation_context.get('company_id') if isolation_context else None,
                    'institution_id': isolation_context.get('financial_institution_id') if isolation_context else None,
                    'customer_type': isolation_context.get('customer_type', 'sme') if isolation_context else 'sme'
                },
                'metadata': {
                    'source': 'adha-ai-service',
                    'version': '1.0',
                    'correlation_id': conversation_id
                }
            }
            
            self.producer.send(self.base_topic, event)
            
        except Exception as e:
            print(f"Error publishing AI response event: {str(e)}")
    
    def publish_calculation_event(
        self,
        user_id: str,
        calculation_type: str,
        calculation_result: Dict[str, Any],
        processing_time_ms: float,
        isolation_context: Optional[Dict[str, Any]] = None
    ):
        """
        Publie un événement de calcul optimisé.
        """
        try:
            event = {
                'id': str(uuid.uuid4()),
                'type': 'calculation_processed',
                'timestamp': datetime.utcnow().isoformat(),
                'data': {
                    'user_id': user_id,
                    'calculation_type': calculation_type,
                    'result': calculation_result.get('result'),
                    'success': calculation_result.get('success', False),
                    'processing_time_ms': processing_time_ms,
                    'bypassed_llm': True,  # Optimisation importante
                    
                    # Contexte d'isolation
                    'company_id': isolation_context.get('company_id') if isolation_context else None,
                    'institution_id': isolation_context.get('financial_institution_id') if isolation_context else None,
                    'customer_type': isolation_context.get('customer_type', 'sme') if isolation_context else 'sme'
                },
                'metadata': {
                    'source': 'adha-ai-service',
                    'optimization': 'direct_calculation',
                    'version': '1.0'
                }
            }
            
            self.producer.send(self.base_topic, event)
            
        except Exception as e:
            print(f"Error publishing calculation event: {str(e)}")
    
    def publish_isolation_audit_event(
        self,
        user_id: str,
        access_type: str,
        isolation_context: Dict[str, Any],
        access_granted: bool,
        resource_accessed: str
    ):
        """
        Publie un événement d'audit pour l'isolation des données.
        """
        try:
            event = {
                'id': str(uuid.uuid4()),
                'type': 'data_isolation_audit',
                'timestamp': datetime.utcnow().isoformat(),
                'data': {
                    'user_id': user_id,
                    'access_type': access_type,  # 'conversation', 'entries', 'calculation'
                    'resource_accessed': resource_accessed,
                    'access_granted': access_granted,
                    'isolation_context': isolation_context,
                    'security_level': 'high'
                },
                'metadata': {
                    'source': 'adha-ai-service',
                    'category': 'security_audit',
                    'version': '1.0'
                }
            }
            
            self.producer.send('security-audit-events', event)
            
        except Exception as e:
            print(f"Error publishing isolation audit event: {str(e)}")
    
    def publish_performance_metrics(
        self,
        operation_type: str,
        metrics: Dict[str, Any],
        isolation_context: Optional[Dict[str, Any]] = None
    ):
        """
        Publie des métriques de performance pour monitoring.
        """
        try:
            event = {
                'id': str(uuid.uuid4()),
                'type': 'performance_metrics',
                'timestamp': datetime.utcnow().isoformat(),
                'data': {
                    'operation_type': operation_type,
                    'metrics': metrics,
                    
                    # Contexte pour analytics par type d'organisation
                    'customer_type': isolation_context.get('customer_type') if isolation_context else 'unknown',
                    'organization_size': self._estimate_organization_size(isolation_context)
                },
                'metadata': {
                    'source': 'adha-ai-service',
                    'category': 'performance',
                    'version': '1.0'
                }
            }
            
            self.producer.send('performance-metrics', event)
            
        except Exception as e:
            print(f"Error publishing performance metrics: {str(e)}")
    
    def _estimate_organization_size(self, isolation_context: Optional[Dict[str, Any]]) -> str:
        """Estime la taille de l'organisation pour les analytics."""
        if not isolation_context:
            return 'unknown'
        
        if isolation_context.get('customer_type') == 'institution':
            return 'large'  # Institutions financières = grandes organisations
        
        # Pour les PME, on pourrait ajouter une logique basée sur d'autres critères
        return 'medium'

# Instance globale du producer
adha_events_producer = AdhaEventsProducer()
