"""
Module pour transformer les opérations commerciales en écritures comptables et
gérer les retours de statut des écritures traitées par le service comptable.
"""

import logging
from datetime import datetime
import uuid
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

def process_business_operation(operation):
    """
    Traite une opération commerciale et la convertit en écriture comptable
    
    Args:
        operation (dict): Les données de l'opération commerciale
        
    Returns:
        dict: L'écriture comptable générée ou None en cas d'erreur
    """
    try:
        operation_type = operation.get('type')
        client_id = operation.get('clientId')
        company_id = operation.get('companyId')
        
        # Vérification des données obligatoires
        required_fields = ['id', 'type', 'date', 'description', 'amountCdf', 'clientId', 'companyId']
        missing_fields = [field for field in required_fields if field not in operation or not operation[field]]
        
        if missing_fields:
            logger.error(f"Missing required fields in operation: {', '.join(missing_fields)}")
            return None
            
        # Conversion des types d'opérations en écritures comptables
        journal_entry = {
            'id': str(uuid.uuid4()),
            'sourceId': operation.get('id'),
            'sourceType': 'commerce_operation',
            'clientId': client_id,
            'companyId': company_id,
            'date': operation.get('date'),
            'description': operation.get('description'),
            'amount': float(operation.get('amountCdf')),
            'currency': 'CDF',
            'createdAt': datetime.now().isoformat(),
            'createdBy': 'adha-ai-service',
            'status': 'pending',
            'lines': []
        }
        
        # Créer les lignes d'écriture selon le type d'opération
        if operation_type == 'SALE' or operation_type == 'sale':
            # Vente: Débit Clients, Crédit Ventes
            journal_entry['lines'] = [
                {
                    'accountCode': '411000', # Clients
                    'label': f"Client - {operation.get('description')}",
                    'debit': float(operation.get('amountCdf')),
                    'credit': 0
                },
                {
                    'accountCode': '707000', # Ventes de marchandises
                    'label': f"Vente - {operation.get('description')}",
                    'debit': 0,
                    'credit': float(operation.get('amountCdf'))
                }
            ]
            journal_entry['journalType'] = 'SALES'
            
        elif operation_type == 'EXPENSE' or operation_type == 'expense':
            # Dépense: Débit Achats, Crédit Fournisseurs
            journal_entry['lines'] = [
                {
                    'accountCode': '607000', # Achats de marchandises
                    'label': f"Achat - {operation.get('description')}",
                    'debit': float(operation.get('amountCdf')),
                    'credit': 0
                },
                {
                    'accountCode': '401000', # Fournisseurs
                    'label': f"Fournisseur - {operation.get('description')}",
                    'debit': 0,
                    'credit': float(operation.get('amountCdf'))
                }
            ]
            journal_entry['journalType'] = 'PURCHASES'
            
        elif operation_type == 'FINANCING' or operation_type == 'financing':
            # Financement: Débit Banque, Crédit Emprunts
            journal_entry['lines'] = [
                {
                    'accountCode': '512000', # Banque
                    'label': f"Financement - {operation.get('description')}",
                    'debit': float(operation.get('amountCdf')),
                    'credit': 0
                },
                {
                    'accountCode': '164000', # Emprunts
                    'label': f"Emprunt - {operation.get('description')}",
                    'debit': 0,
                    'credit': float(operation.get('amountCdf'))
                }
            ]
            journal_entry['journalType'] = 'FINANCIAL'
            
        elif operation_type == 'INVENTORY' or operation_type == 'inventory':
            # Inventaire: Débit Stocks, Crédit Variation des stocks
            journal_entry['lines'] = [
                {
                    'accountCode': '310000', # Stocks
                    'label': f"Inventaire - {operation.get('description')}",
                    'debit': float(operation.get('amountCdf')),
                    'credit': 0
                },
                {
                    'accountCode': '603000', # Variation des stocks
                    'label': f"Ajustement stock - {operation.get('description')}",
                    'debit': 0,
                    'credit': float(operation.get('amountCdf'))
                }
            ]
            journal_entry['journalType'] = 'INVENTORY'
            
        else:
            # Transaction générique
            journal_entry['lines'] = [
                {
                    'accountCode': '471000', # Compte d'attente
                    'label': f"À classifier - {operation.get('description')}",
                    'debit': float(operation.get('amountCdf')),
                    'credit': 0
                },
                {
                    'accountCode': '471100', # Compte d'attente contrepartie
                    'label': f"Contrepartie à classifier - {operation.get('description')}",
                    'debit': 0,
                    'credit': float(operation.get('amountCdf'))
                }
            ]
            journal_entry['journalType'] = 'MISCELLANEOUS'
        
        # Ajouter des métadonnées supplémentaires
        journal_entry['metadata'] = {
            'sourceSystem': 'commerce_operations',
            'originalType': operation_type,
            'generatedBy': 'adha-ai-automatic-processing',
            'relatedPartyId': operation.get('relatedPartyId'),
            'relatedPartyName': operation.get('relatedPartyName', ''),
            'needsReview': True,  # Indiquer que l'entrée doit être revue
        }
        
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
