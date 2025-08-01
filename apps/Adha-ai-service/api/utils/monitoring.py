"""
Module de monitoring et diagnostics pour Adha AI Service.
Ce module fournit des outils pour suivre les performances, la santé et l'utilisation
des différents composants du service Adha AI.
"""

import logging
import time
from typing import Dict, Any, List, Optional
from collections import defaultdict, deque
import threading
import os
import json
import datetime

logger = logging.getLogger(__name__)

class PerformanceMetric:
    """Métrique de performance avec statistiques en temps réel"""
    
    def __init__(self, name: str, window_size: int = 100):
        self.name = name
        self.window_size = window_size
        self.values = deque(maxlen=window_size)
        self.total = 0
        self.count = 0
        self.min_value = float('inf')
        self.max_value = float('-inf')
    
    def add(self, value: float):
        """Ajoute une valeur à la métrique"""
        self.values.append(value)
        self.total += value
        self.count += 1
        self.min_value = min(self.min_value, value)
        self.max_value = max(self.max_value, value)
    
    def get_stats(self) -> Dict[str, float]:
        """Retourne les statistiques de la métrique"""
        if not self.count:
            return {
                'avg': 0,
                'min': 0,
                'max': 0,
                'count': 0
            }
        
        # Calculer la moyenne sur la fenêtre récente
        window_avg = sum(self.values) / len(self.values) if self.values else 0
        
        return {
            'avg': window_avg,
            'min': self.min_value,
            'max': self.max_value,
            'count': self.count
        }


class ServiceMonitor:
    """
    Système de monitoring pour les services Adha AI.
    Suit les performances, la santé et l'utilisation des ressources.
    """
    
    def __init__(self):
        """Initialise le moniteur de service"""
        self.metrics = defaultdict(lambda: defaultdict(PerformanceMetric))
        self.lock = threading.RLock()
        self.is_collecting = False
        self.stats_dir = os.path.join('logs', 'stats')
        
        # S'assurer que le répertoire de statistiques existe
        os.makedirs(self.stats_dir, exist_ok=True)
    
    def start_task(self, component: str, task_id: str) -> Dict[str, Any]:
        """
        Commence à suivre une tâche pour un composant.
        
        Args:
            component: Nom du composant (chat, accounting, portfolio)
            task_id: ID unique de la tâche
        
        Returns:
            Dict: Contexte de la tâche pour le suivi
        """
        with self.lock:
            context = {
                'component': component,
                'task_id': task_id,
                'start_time': time.time(),
                'stages': []
            }
            return context
    
    def end_task(self, context: Dict[str, Any], success: bool = True):
        """
        Termine le suivi d'une tâche et enregistre les métriques.
        
        Args:
            context: Contexte de la tâche retourné par start_task
            success: Indique si la tâche s'est terminée avec succès
        """
        if not context or 'start_time' not in context:
            return
        
        end_time = time.time()
        duration = end_time - context['start_time']
        component = context['component']
        
        with self.lock:
            # Enregistrer la durée totale
            self._record_metric(component, 'duration', duration)
            
            # Enregistrer le taux de succès
            self._record_metric(component, 'success_rate', 1.0 if success else 0.0)
            
            # Enregistrer les durées des étapes
            for stage in context.get('stages', []):
                stage_name = stage['name']
                stage_duration = stage['duration']
                self._record_metric(component, f"stage.{stage_name}", stage_duration)
    
    def start_stage(self, context: Dict[str, Any], stage_name: str) -> Dict[str, Any]:
        """
        Commence à suivre une étape d'une tâche.
        
        Args:
            context: Contexte de la tâche
            stage_name: Nom de l'étape
        
        Returns:
            Dict: Contexte de l'étape
        """
        stage_context = {
            'name': stage_name,
            'start_time': time.time()
        }
        return stage_context
    
    def end_stage(self, context: Dict[str, Any], stage_context: Dict[str, Any]):
        """
        Termine le suivi d'une étape et l'ajoute au contexte de la tâche.
        
        Args:
            context: Contexte de la tâche
            stage_context: Contexte de l'étape
        """
        if not stage_context or 'start_time' not in stage_context:
            return
        
        end_time = time.time()
        duration = end_time - stage_context['start_time']
        stage_context['duration'] = duration
        stage_context['end_time'] = end_time
        
        if 'stages' not in context:
            context['stages'] = []
        
        context['stages'].append(stage_context)
    
    def _record_metric(self, component: str, metric_name: str, value: float):
        """
        Enregistre une valeur métrique pour un composant.
        
        Args:
            component: Nom du composant
            metric_name: Nom de la métrique
            value: Valeur à enregistrer
        """
        self.metrics[component][metric_name].add(value)
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Obtient les statistiques actuelles pour tous les composants.
        
        Returns:
            Dict: Statistiques par composant et métrique
        """
        with self.lock:
            stats = {}
            for component, metrics in self.metrics.items():
                stats[component] = {}
                for metric_name, metric in metrics.items():
                    stats[component][metric_name] = metric.get_stats()
            return stats
    
    def export_stats(self):
        """
        Exporte les statistiques actuelles dans un fichier JSON.
        """
        stats = self.get_stats()
        timestamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
        filename = os.path.join(self.stats_dir, f"adha_ai_stats_{timestamp}.json")
        
        try:
            with open(filename, 'w') as f:
                json.dump(stats, f, indent=2)
            logger.info(f"Statistiques exportées vers {filename}")
        except Exception as e:
            logger.error(f"Erreur lors de l'exportation des statistiques: {e}")
    
    def start_collection_thread(self, interval: int = 3600):
        """
        Démarre un thread pour collecter et exporter les statistiques périodiquement.
        
        Args:
            interval: Intervalle en secondes entre les exportations
        """
        if self.is_collecting:
            return
        
        self.is_collecting = True
        
        def collection_loop():
            while self.is_collecting:
                time.sleep(interval)
                self.export_stats()
        
        thread = threading.Thread(target=collection_loop, daemon=True)
        thread.start()
        logger.info(f"Thread de collecte de statistiques démarré (intervalle: {interval}s)")
    
    def stop_collection_thread(self):
        """Arrête le thread de collecte de statistiques"""
        self.is_collecting = False


# Instance singleton du moniteur de service
service_monitor = ServiceMonitor()

def get_service_monitor() -> ServiceMonitor:
    """
    Obtient l'instance du moniteur de service.
    
    Returns:
        ServiceMonitor: L'instance singleton du moniteur
    """
    return service_monitor

# Démarre automatiquement la collecte de statistiques
service_monitor.start_collection_thread(interval=3600)  # 1 heure
