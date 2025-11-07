"""
Module pour transformer les opérations commerciales en écritures comptables et
gérer les retours de statut des écritures traitées par le service comptable.
Version standardisée avec base de connaissances SYSCOHADA.
"""

import logging
from datetime import datetime
import uuid
import os
import sys
from typing import Dict, Any, Optional

# Ajout du chemin pour la base de connaissances
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from financial_engine.knowledge_bases.accounting_rdc import AccountingKnowledgeRDC

logger = logging.getLogger(__name__)

# Initialisation de la base de connaissances SYSCOHADA
knowledge_base = AccountingKnowledgeRDC()

def validate_operation(operation: Dict[str, Any]) -> bool:
    """
    Valide une opération commerciale avant traitement
    """
    required_fields = ['id', 'type', 'date', 'description', 'amountCdf', 'clientId', 'companyId']
    missing_fields = [field for field in required_fields if field not in operation or not operation[field]]
    
    if missing_fields:
        logger.error(f"Missing required fields in operation: {', '.join(missing_fields)}")
        return False
    
    # Validation du type d'opération avec la base de connaissances
    operation_type = operation.get('type', '').upper()
    mapping = knowledge_base.get_account_mapping_for_operation(operation_type)
    if not mapping:
        logger.error(f"Unsupported operation type: {operation_type}")
        return False
    
    # Validation du montant
    try:
        amount = float(operation.get('amountCdf', 0))
        if amount <= 0:
            logger.error(f"Invalid amount: {amount}")
            return False
    except (ValueError, TypeError):
        logger.error(f"Invalid amount format: {operation.get('amountCdf')}")
        return False
    
    return True


def validate_journal_entry(entry: Dict[str, Any]) -> Dict[str, Any]:
    """
    Valide une écriture comptable avec la base de connaissances SYSCOHADA
    """
    return knowledge_base.validate_journal_entry(entry)
    
    return {
        'is_valid': len(errors) == 0,
        'is_balanced': is_balanced,
        'errors': errors,
        'warnings': warnings,
        'total_debit': total_debit,
        'total_credit': total_credit,
        'difference': difference
    }


def process_business_operation(operation):
    """
    Traite une opération commerciale et la convertit en écriture comptable standardisée
    
    Args:
        operation (dict): Les données de l'opération commerciale
        
    Returns:
        dict: L'écriture comptable générée ou None en cas d'erreur
    """
    try:
        # Validation préalable
        if not validate_operation(operation):
            return None
            
        operation_type = operation.get('type', '').upper()
        client_id = operation.get('clientId')
        company_id = operation.get('companyId')
        amount = float(operation.get('amountCdf'))
        
        # Obtenir le mapping pour ce type d'opération depuis la base de connaissances
        mapping = knowledge_base.get_account_mapping_for_operation(operation_type)
        if not mapping:
            logger.error(f"No account mapping found for operation type: {operation_type}")
            return None
        
        # Créer l'écriture comptable standardisée
        journal_entry = {
            'id': str(uuid.uuid4()),
            'sourceId': operation.get('id'),
            'sourceType': 'commerce_operation',
            'clientId': client_id,
            'companyId': company_id,
            'date': operation.get('date') if isinstance(operation.get('date'), str) else operation.get('date').isoformat(),
            'description': operation.get('description'),
            'amount': amount,
            'currency': 'CDF',
            'createdAt': datetime.now().isoformat(),
            'createdBy': 'adha-ai-service',
            'status': 'pending',
            'journalType': mapping['journal_type'],
            'lines': [
                {
                    'accountCode': mapping['debit_account'],
                    'description': f"{operation.get('description')} - Débit",  # Standardisé sur 'description'
                    'debit': amount,
                    'credit': 0
                },
                {
                    'accountCode': mapping['credit_account'],
                    'description': f"{operation.get('description')} - Crédit",  # Standardisé sur 'description'
                    'debit': 0,
                    'credit': amount
                }
            ]
        }
        
        # Ajouter des métadonnées standardisées
        journal_entry['metadata'] = {
            'sourceSystem': 'commerce_operations',
            'originalType': operation_type,
            'generatedBy': 'adha-ai-automatic-processing',
            'relatedPartyId': operation.get('relatedPartyId'),
            'relatedPartyName': operation.get('relatedPartyName', ''),
            'needsReview': True,
            'generatedAt': datetime.now().isoformat(),
            'operationMetadata': operation.get('metadata', {}),
        }
        
        # Validation finale de l'écriture générée
        validation_result = validate_journal_entry(journal_entry)
        if not validation_result['is_valid']:
            logger.error(f"Generated journal entry is invalid: {validation_result['errors']}")
            return None
        
        if validation_result['warnings']:
            logger.warning(f"Journal entry warnings: {validation_result['warnings']}")
        
        logger.info(f"Successfully generated balanced journal entry for operation {operation.get('id')}")
        return journal_entry
        
    except Exception as e:
        logger.error(f"Error processing business operation: {str(e)}")
        return None


def handle_accounting_status(status_message: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Traite les messages de statut de traitement des écritures comptables
    envoyés par le service accounting-service.
    
    Args:
        status_message (dict): Les données du message de statut
        
    Returns:
        dict: Réponse confirmant le traitement du statut ou None en cas d'erreur
    """
    try:
        journal_entry_id = status_message.get('journalEntryId')
        source_id = status_message.get('sourceId')
        success = status_message.get('success')
        message = status_message.get('message', '')
        timestamp = status_message.get('timestamp')
        
        # Vérification des données obligatoires
        if not journal_entry_id or not source_id or success is None:
            logger.error(f"Missing required fields in accounting status message")
            return None
            
        # Journaliser le statut reçu
        log_level = logging.INFO if success else logging.WARNING
        logger.log(log_level, f"Accounting entry {journal_entry_id} for source {source_id} processed: "
                             f"{'successfully' if success else 'failed'} - {message}")
        
        # TODO: Mettre à jour la base de données locale si nécessaire
        # TODO: Implémenter la logique de retry en cas d'échec

        # Si l'écriture a échoué, on pourrait mettre en place un mécanisme de retry
        if not success:
            logger.warning(f"Accounting entry processing failed for {journal_entry_id}. "
                          f"Reason: {message}")
            # TODO: Implémenter la logique de retry ou de notification
        
        return {
            'status': 'processed',
            'journalEntryId': journal_entry_id,
            'handled': True,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error handling accounting status message: {str(e)}")
        return None
