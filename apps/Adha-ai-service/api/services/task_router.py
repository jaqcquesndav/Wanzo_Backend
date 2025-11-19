"""
Module de routage des tâches pour Adha AI Service.
Ce service est responsable d'analyser les demandes entrantes et de les router
vers le processeur approprié en fonction de leur type et contexte.
"""

import logging
import time
from enum import Enum
from typing import Dict, Any, Optional

from .accounting_processor import process_business_operation, handle_accounting_status
from .portfolio_analyzer import analyze_portfolio
from .chat_processor import process_chat_message
from ..kafka.producer_accounting import publish_journal_entry

logger = logging.getLogger(__name__)

class TaskType(Enum):
    CHAT = "chat"
    ACCOUNTING = "accounting"
    ACCOUNTING_STATUS = "accounting_status"
    PORTFOLIO_ANALYSIS = "portfolio_analysis"


class TaskRouter:
    """
    Routeur de tâches qui analyse les demandes et les dirige vers le service approprié.
    """
    
    def __init__(self):
        self.processors = {
            TaskType.CHAT: self.process_chat_task,
            TaskType.ACCOUNTING: self.process_accounting_task,
            TaskType.ACCOUNTING_STATUS: self.process_accounting_status_task,
            TaskType.PORTFOLIO_ANALYSIS: self.process_portfolio_analysis_task,
        }
    
    def determine_task_type(self, message: Dict[str, Any]) -> TaskType:
        """
        Détermine le type de tâche en fonction du contenu du message.
        
        Args:
            message: Le message à analyser
            
        Returns:
            TaskType: Le type de tâche identifié
        """
        # Vérifier le type d'événement si présent
        event_type = message.get('eventType', '')
        
        # Vérifier les métadonnées et le contexte
        metadata = message.get('metadata', {})
        context_info = message.get('contextInfo', {})
        kafka_topic = metadata.get('kafka_topic', '')
        
        # Sources possibles
        source = metadata.get('source') or context_info.get('source', '')
        mode = context_info.get('mode', '')
        
        # Vérifier d'abord si c'est un message de statut de traitement comptable
        if kafka_topic == 'accounting.journal.status' or 'journalEntryId' in message:
            return TaskType.ACCOUNTING_STATUS
        
        # Déterminer le type de tâche
        if source == 'portfolio_institution':
            if 'portfolio' in context_info or mode == 'analysis':
                return TaskType.PORTFOLIO_ANALYSIS
                
        elif source == 'gestion_commerciale' or source == 'commerce_operations':
            if mode == 'accounting' or event_type.startswith('commerce.operation.'):
                return TaskType.ACCOUNTING
        
        # Par défaut, traiter comme une tâche de chat
        return TaskType.CHAT
    
    def route_task(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Route la tâche vers le processeur approprié.
        
        Args:
            message: Le message à traiter
            
        Returns:
            Dict: La réponse du processeur
        """
        task_id = message.get('id', 'unknown')
        start_time = time.time()
        
        try:
            task_type = self.determine_task_type(message)
            logger.info(f"Routing task of type: {task_type.value}, id: {task_id}")
            
            processor = self.processors.get(task_type)
            if processor:
                result = processor(message)
                
                # Loguer le temps de traitement
                end_time = time.time()
                processing_time = end_time - start_time
                logger.info(
                    f"Task {task_id} of type {task_type.value} processed in {processing_time:.3f}s"
                )
                
                return result
            else:
                logger.error(f"No processor found for task type: {task_type.value}")
                return {"error": f"No processor found for task type: {task_type.value}"}
        except Exception as e:
            logger.exception(f"Error routing task: {str(e)}")
            return {"error": f"Error routing task: {str(e)}"}
    
    def process_chat_task(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Traite une tâche de chat.
        
        Args:
            message: Le message à traiter
            
        Returns:
            Dict: La réponse générée
        """
        logger.info(f"Routing to chat processor: {message.get('id', 'unknown')}")
        return process_chat_message(message)
    
    def process_accounting_task(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Traite une tâche de comptabilité.
        
        Args:
            message: Le message à traiter
            
        Returns:
            Dict: L'écriture comptable générée
        """
        journal_entry = process_business_operation(message)
        if journal_entry:
            # Publier l'écriture comptable
            publish_journal_entry(journal_entry)
            return {"type": "accounting_response", "journal_entry": journal_entry}
        return {"error": "Failed to process accounting task"}
    
    def process_portfolio_analysis_task(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Traite une tâche d'analyse de portefeuille pour les institutions.
        
        Args:
            message: Le message à traiter
            
        Returns:
            Dict: Le résultat de l'analyse
        """
        logger.info(f"Routing to portfolio analyzer: {message.get('id', 'unknown')}")
        analysis_result = analyze_portfolio(message)
        
        # Ajouter le type de réponse pour le traitement uniforme
        if "error" not in analysis_result:
            analysis_result["type"] = "portfolio_analysis_response"
            
        return analysis_result
    
    def process_accounting_status_task(self, message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Traite un message de statut de traitement d'écriture comptable.
        ✅ PRÉVENTION BOUCLE: Limite les retry à 3 tentatives maximum.
        
        Args:
            message: Le message de statut à traiter
            
        Returns:
            Dict: Le résultat du traitement du statut
        """
        journal_entry_id = message.get('journalEntryId', 'unknown')
        logger.info(f"Processing accounting status message: {journal_entry_id}")
        
        # ✅ Extraire retry_count pour éviter boucle infinie
        retry_count = message.get('metadata', {}).get('retry_count', 0)
        max_retries = 3
        
        if message.get('status') == 'failed':
            if retry_count >= max_retries:
                logger.error(
                    f"Max retries ({max_retries}) exceeded for journal entry {journal_entry_id}. "
                    f"Sending to DLQ."
                )
                # Ne pas réessayer, envoyer en DLQ
                return {
                    "type": "accounting_status_response",
                    "action": "sent_to_dlq",
                    "reason": "max_retries_exceeded",
                    "journal_entry_id": journal_entry_id
                }
            else:
                logger.warning(
                    f"Accounting entry failed, retry {retry_count + 1}/{max_retries}: "
                    f"{journal_entry_id}"
                )
                # Programmer un retry avec delay
                return {
                    "type": "accounting_status_response",
                    "action": "scheduled_retry",
                    "retry_count": retry_count + 1,
                    "journal_entry_id": journal_entry_id
                }
        
        status_result = handle_accounting_status(message)
        
        if status_result:
            return {"type": "accounting_status_response", **status_result}
        return {"error": "Failed to process accounting status message"}

# Instance singleton du routeur
task_router = TaskRouter()
