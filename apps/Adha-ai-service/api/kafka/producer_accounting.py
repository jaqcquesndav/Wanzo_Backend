"""
Producer Kafka robuste pour le service accounting avec gestion d'erreurs,
retry automatique et standardisation des messages.
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

from .robust_kafka_client import (
    RobustKafkaProducer, 
    StandardKafkaTopics, 
    kafka_config,
    MessageStandardizer
)

logger = logging.getLogger(__name__)

class AccountingProducer:
    """
    Producer spécialisé pour les événements comptables avec gestion robuste
    """
    
    def __init__(self):
        self.producer = RobustKafkaProducer(kafka_config)
    
    async def publish_journal_entry(
        self,
        journal_entry: Dict[str, Any],
        correlation_id: Optional[str] = None
    ) -> bool:
        """
        Publie une écriture comptable vers le service accounting
        
        Args:
            journal_entry: Données de l'écriture comptable
            correlation_id: ID de corrélation pour traçabilité
            
        Returns:
            bool: True si envoi réussi, False sinon
        """
        try:
            # Validation des données obligatoires
            if not self._validate_journal_entry(journal_entry):
                logger.error("Invalid journal entry data")
                return False
            
            # Standardiser le message
            event_data = {
                'eventType': 'accounting.journal.entry',
                'data': self._format_journal_entry(journal_entry),
                'metadata': {
                    'source': 'adha_ai',
                    'correlationId': correlation_id,
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                    'version': '1.0.0'
                }
            }
            
            # Convertir au format TypeScript pour compatibilité
            formatted_data = MessageStandardizer.convert_to_typescript(event_data)
            
            # Envoyer le message
            success = await self.producer.send_message(
                StandardKafkaTopics.ACCOUNTING_JOURNAL_ENTRY,
                formatted_data,
                key=journal_entry.get('companyId')
            )
            
            if success:
                logger.info(f"Journal entry sent successfully: {journal_entry.get('id', 'unknown')}")
            else:
                logger.error(f"Failed to send journal entry: {journal_entry.get('id', 'unknown')}")
                
            return success
            
        except Exception as e:
            logger.exception(f"Error publishing journal entry: {str(e)}")
            return False
    
    def _validate_journal_entry(self, journal_entry: Dict[str, Any]) -> bool:
        """
        Valide les données d'une écriture comptable
        """
        required_fields = ['companyId', 'journalType', 'lines', 'totalDebit', 'totalCredit']
        
        # Vérifier les champs obligatoires
        for field in required_fields:
            if field not in journal_entry:
                logger.error(f"Missing required field: {field}")
                return False
        
        # Vérifier que lines est une liste non vide
        lines = journal_entry.get('lines', [])
        if not isinstance(lines, list) or len(lines) == 0:
            logger.error("Lines must be a non-empty list")
            return False
        
        return True
    
    def _format_journal_entry(self, journal_entry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Formate l'écriture comptable selon le schéma standardisé
        """
        return {
            'id': journal_entry.get('id'),
            'companyId': journal_entry['companyId'],
            'journalType': journal_entry['journalType'],
            'date': journal_entry.get('date', datetime.utcnow().isoformat()),
            'reference': journal_entry.get('reference', ''),
            'description': journal_entry.get('description', ''),
            'lines': journal_entry['lines'],
            'totalDebit': journal_entry['totalDebit'],
            'totalCredit': journal_entry['totalCredit'],
            'sourceId': journal_entry.get('sourceId', ''),
            'sourceType': journal_entry.get('sourceType', 'commerce_operation'),
            'metadata': journal_entry.get('metadata', {})
        }

# Instance globale du producer
accounting_producer = AccountingProducer()

# Fonction helper pour compatibilité avec l'ancien code
def send_journal_entry_to_accounting(journal_entry):
    """
    Fonction legacy pour compatibilité - utilise le nouveau producer
    """
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        result = loop.run_until_complete(
            accounting_producer.publish_journal_entry(journal_entry)
        )
        return result
    finally:
        loop.close()
