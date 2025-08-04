"""
Service de monitoring et métriques pour Adha AI Service avec tracing distribué
"""

import logging
import time
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from prometheus_client import Counter as PrometheusCounter, Histogram, Gauge, generate_latest
import threading

logger = logging.getLogger(__name__)

# Métriques Prometheus
KAFKA_MESSAGES_TOTAL = PrometheusCounter(
    'adha_ai_kafka_messages_total',
    'Total number of Kafka messages processed',
    ['topic', 'status', 'message_type']
)

KAFKA_MESSAGE_PROCESSING_TIME = Histogram(
    'adha_ai_kafka_message_processing_seconds',
    'Time spent processing Kafka messages',
    ['topic', 'message_type']
)

JOURNAL_ENTRIES_GENERATED = PrometheusCounter(
    'adha_ai_journal_entries_generated_total',
    'Total number of journal entries generated',
    ['operation_type', 'company_id', 'status']
)

PORTFOLIO_ANALYSES_COMPLETED = PrometheusCounter(
    'adha_ai_portfolio_analyses_completed_total',
    'Total number of portfolio analyses completed',
    ['analysis_type', 'institution_id', 'status']
)

AI_PROCESSING_TIME = Histogram(
    'adha_ai_processing_seconds',
    'Time spent on AI processing',
    ['service_type', 'operation_type']
)

ERROR_COUNTER = PrometheusCounter(
    'adha_ai_errors_total',
    'Total number of errors',
    ['error_type', 'service', 'severity']
)

ACTIVE_CONNECTIONS = Gauge(
    'adha_ai_active_connections',
    'Number of active connections',
    ['connection_type']
)

class CorrelationTracker:
    """
    Tracker pour suivre les requêtes à travers les microservices
    """
    
    def __init__(self):
        self.active_requests: Dict[str, Dict[str, Any]] = {}
        self.completed_requests: Dict[str, Dict[str, Any]] = {}
        self.lock = threading.Lock()
        self.max_completed_history = 1000
    
    def start_request(self, correlation_id: str, request_data: Dict[str, Any]):
        """
        Démarre le suivi d'une requête
        """
        with self.lock:
            self.active_requests[correlation_id] = {
                'start_time': time.time(),
                'request_data': request_data,
                'events': [],
                'status': 'active'
            }
    
    def add_event(self, correlation_id: str, event: str, data: Optional[Dict[str, Any]] = None):
        """
        Ajoute un événement à une requête
        """
        with self.lock:
            if correlation_id in self.active_requests:
                self.active_requests[correlation_id]['events'].append({
                    'timestamp': time.time(),
                    'event': event,
                    'data': data or {}
                })
    
    def complete_request(self, correlation_id: str, status: str = 'completed', result: Optional[Dict[str, Any]] = None):
        """
        Marque une requête comme terminée
        """
        with self.lock:
            if correlation_id in self.active_requests:
                request = self.active_requests.pop(correlation_id)
                request['end_time'] = time.time()
                request['total_time'] = request['end_time'] - request['start_time']
                request['status'] = status
                request['result'] = result
                
                # Garder un historique limité
                self.completed_requests[correlation_id] = request
                if len(self.completed_requests) > self.max_completed_history:
                    # Supprimer les plus anciens
                    oldest_keys = sorted(self.completed_requests.keys(), 
                                       key=lambda k: self.completed_requests[k]['end_time'])[:100]
                    for key in oldest_keys:
                        del self.completed_requests[key]
    
    def get_request_info(self, correlation_id: str) -> Optional[Dict[str, Any]]:
        """
        Récupère les informations d'une requête
        """
        with self.lock:
            if correlation_id in self.active_requests:
                return self.active_requests[correlation_id].copy()
            elif correlation_id in self.completed_requests:
                return self.completed_requests[correlation_id].copy()
            return None
    
    def get_active_requests_count(self) -> int:
        """
        Retourne le nombre de requêtes actives
        """
        with self.lock:
            return len(self.active_requests)
    
    def get_avg_processing_time(self, minutes: int = 60) -> float:
        """
        Calcule le temps de traitement moyen sur une période
        """
        cutoff_time = time.time() - (minutes * 60)
        
        with self.lock:
            recent_requests = [
                req for req in self.completed_requests.values()
                if req.get('end_time', 0) > cutoff_time and 'total_time' in req
            ]
            
            if not recent_requests:
                return 0.0
            
            total_time = sum(req['total_time'] for req in recent_requests)
            return total_time / len(recent_requests)

class PerformanceMonitor:
    """
    Moniteur de performance avec collecte de métriques
    """
    
    def __init__(self):
        self.correlation_tracker = CorrelationTracker()
        self.error_history = defaultdict(list)
        self.performance_metrics = defaultdict(list)
        self.alert_thresholds = {
            'error_rate': 0.05,  # 5% d'erreurs
            'avg_processing_time': 10.0,  # 10 secondes
            'queue_size': 100,  # 100 messages en attente
        }
    
    def record_kafka_message(self, topic: str, message_type: str, processing_time: float, status: str = 'success'):
        """
        Enregistre une métrique de message Kafka
        """
        KAFKA_MESSAGES_TOTAL.labels(topic=topic, status=status, message_type=message_type).inc()
        KAFKA_MESSAGE_PROCESSING_TIME.labels(topic=topic, message_type=message_type).observe(processing_time)
        
        # Stocker pour analyse
        self.performance_metrics[f'kafka_{topic}'].append({
            'timestamp': time.time(),
            'processing_time': processing_time,
            'status': status
        })
    
    def record_journal_entry(self, operation_type: str, company_id: str, status: str = 'success'):
        """
        Enregistre une génération d'écriture comptable
        """
        JOURNAL_ENTRIES_GENERATED.labels(
            operation_type=operation_type,
            company_id=company_id,
            status=status
        ).inc()
    
    def record_portfolio_analysis(self, analysis_type: str, institution_id: str, processing_time: float, status: str = 'success'):
        """
        Enregistre une analyse de portefeuille
        """
        PORTFOLIO_ANALYSES_COMPLETED.labels(
            analysis_type=analysis_type,
            institution_id=institution_id,
            status=status
        ).inc()
        
        AI_PROCESSING_TIME.labels(
            service_type='portfolio_analysis',
            operation_type=analysis_type
        ).observe(processing_time)
    
    def record_error(self, error_type: str, service: str, severity: str = 'error'):
        """
        Enregistre une erreur
        """
        ERROR_COUNTER.labels(error_type=error_type, service=service, severity=severity).inc()
        
        # Stocker pour analyse de tendances
        self.error_history[f'{service}_{error_type}'].append({
            'timestamp': time.time(),
            'severity': severity
        })
    
    def update_connection_count(self, connection_type: str, count: int):
        """
        Met à jour le nombre de connexions actives
        """
        ACTIVE_CONNECTIONS.labels(connection_type=connection_type).set(count)
    
    def get_health_status(self) -> Dict[str, Any]:
        """
        Évalue l'état de santé du système
        """
        current_time = time.time()
        one_hour_ago = current_time - 3600
        
        # Calcul du taux d'erreur sur la dernière heure
        recent_errors = []
        total_operations = 0
        
        for error_list in self.error_history.values():
            recent_errors.extend([e for e in error_list if e['timestamp'] > one_hour_ago])
        
        for metric_list in self.performance_metrics.values():
            total_operations += len([m for m in metric_list if m['timestamp'] > one_hour_ago])
        
        error_rate = len(recent_errors) / max(total_operations, 1)
        avg_processing_time = self.correlation_tracker.get_avg_processing_time(60)
        active_requests = self.correlation_tracker.get_active_requests_count()
        
        # Déterminer l'état de santé
        health_status = 'healthy'
        alerts = []
        
        if error_rate > self.alert_thresholds['error_rate']:
            health_status = 'degraded'
            alerts.append(f"High error rate: {error_rate:.2%}")
        
        if avg_processing_time > self.alert_thresholds['avg_processing_time']:
            health_status = 'degraded'
            alerts.append(f"High processing time: {avg_processing_time:.2f}s")
        
        if active_requests > self.alert_thresholds['queue_size']:
            health_status = 'degraded'
            alerts.append(f"High queue size: {active_requests}")
        
        return {
            'status': health_status,
            'timestamp': datetime.now().isoformat(),
            'metrics': {
                'error_rate': error_rate,
                'avg_processing_time': avg_processing_time,
                'active_requests': active_requests,
                'total_operations_last_hour': total_operations,
                'errors_last_hour': len(recent_errors)
            },
            'alerts': alerts
        }
    
    def get_prometheus_metrics(self) -> str:
        """
        Génère les métriques au format Prometheus
        """
        return generate_latest().decode('utf-8')
    
    def cleanup_old_metrics(self, hours: int = 24):
        """
        Nettoie les anciennes métriques
        """
        cutoff_time = time.time() - (hours * 3600)
        
        # Nettoyer l'historique des erreurs
        for key in list(self.error_history.keys()):
            self.error_history[key] = [
                e for e in self.error_history[key] 
                if e['timestamp'] > cutoff_time
            ]
            if not self.error_history[key]:
                del self.error_history[key]
        
        # Nettoyer les métriques de performance
        for key in list(self.performance_metrics.keys()):
            self.performance_metrics[key] = [
                m for m in self.performance_metrics[key]
                if m['timestamp'] > cutoff_time
            ]
            if not self.performance_metrics[key]:
                del self.performance_metrics[key]

# Instance globale du moniteur
performance_monitor = PerformanceMonitor()

# Décorateur pour monitorer automatiquement les fonctions
def monitor_performance(operation_type: str, service: str = 'adha_ai'):
    """
    Décorateur pour monitorer automatiquement les performances d'une fonction
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            start_time = time.time()
            correlation_id = kwargs.get('correlation_id') or getattr(args[0] if args else None, 'correlation_id', None)
            
            if correlation_id:
                performance_monitor.correlation_tracker.add_event(
                    correlation_id, f'start_{operation_type}', {'function': func.__name__}
                )
            
            try:
                result = func(*args, **kwargs)
                processing_time = time.time() - start_time
                
                # Enregistrer le succès
                AI_PROCESSING_TIME.labels(
                    service_type=service,
                    operation_type=operation_type
                ).observe(processing_time)
                
                if correlation_id:
                    performance_monitor.correlation_tracker.add_event(
                        correlation_id, f'complete_{operation_type}', 
                        {'function': func.__name__, 'processing_time': processing_time}
                    )
                
                return result
                
            except Exception as e:
                processing_time = time.time() - start_time
                
                # Enregistrer l'erreur
                performance_monitor.record_error(
                    error_type=type(e).__name__,
                    service=service,
                    severity='error'
                )
                
                if correlation_id:
                    performance_monitor.correlation_tracker.add_event(
                        correlation_id, f'error_{operation_type}',
                        {'function': func.__name__, 'error': str(e), 'processing_time': processing_time}
                    )
                
                raise
        
        return wrapper
    return decorator
