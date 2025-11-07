"""
Processeur comptable robuste et standardisé v2
Utilise la base de connaissances SYSCOHADA pour les mappings comptables
Compatible avec les interfaces partagées et validation complète
"""

import logging
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
import os
import sys

# Ajout du chemin pour la base de connaissances
sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))

from ..kafka.producer_accounting import accounting_producer
from financial_engine.knowledge_bases.accounting_rdc import AccountingKnowledgeRDC

logger = logging.getLogger(__name__)

# Initialisation de la base de connaissances SYSCOHADA
knowledge_base = AccountingKnowledgeRDC()


def validate_operation(operation: Dict[str, Any]) -> bool:
    """
    Valide une opération commerciale avant traitement
    """
    # Champs obligatoires standardisés
    required_fields = ['id', 'type', 'amountCdf', 'companyId']
    
    for field in required_fields:
        if field not in operation or not operation[field]:
            logger.error(f"Missing or empty required field: {field}")
            return False
    
    # Validation du type d'opération
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
    Valide une écriture comptable générée avec la base de connaissances SYSCOHADA
    """
    return knowledge_base.validate_journal_entry(entry)


class AccountingProcessor:
    """
    Processeur comptable robuste avec validation et standardisation
    """
    
    def __init__(self):
        self.producer = accounting_producer
        self.knowledge_base = AccountingKnowledgeRDC()
    
    async def process_business_operation(self, operation: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Traite une opération commerciale et génère une écriture comptable standardisée
        
        Args:
            operation: Données de l'opération commerciale
            
        Returns:
            Dict contenant l'écriture comptable ou None en cas d'erreur
        """
        try:
            # Validation des données d'entrée
            if not validate_operation(operation):
                return None
            
            # Extraction et standardisation des données
            operation_data = self._extract_operation_data(operation)
            
            # Génération de l'écriture comptable
            journal_entry = self._generate_journal_entry(operation_data)
            
            if not journal_entry:
                logger.error(f"Failed to generate journal entry for operation {operation_data['id']}")
                return None
            
            # Validation de l'écriture générée
            validation_result = validate_journal_entry(journal_entry)
            if not validation_result['is_valid']:
                logger.error(f"Generated journal entry is invalid for operation {operation_data['id']}: {validation_result['errors']}")
                return None
            
            if validation_result['warnings']:
                logger.warning(f"Journal entry warnings for operation {operation_data['id']}: {validation_result['warnings']}")
            
            # Envoi vers le service comptable
            correlation_id = operation.get('metadata', {}).get('correlationId') or str(uuid.uuid4())
            success = await self.producer.publish_journal_entry(journal_entry, correlation_id)
            
            if success:
                logger.info(f"Journal entry sent successfully for operation {operation_data['id']}")
                return {
                    'status': 'success',
                    'journalEntryId': journal_entry['id'],
                    'operationId': operation_data['id'],
                    'message': 'Journal entry generated and sent successfully',
                    'validation': validation_result
                }
            else:
                logger.error(f"Failed to send journal entry for operation {operation_data['id']}")
                return {
                    'status': 'error',
                    'operationId': operation_data['id'],
                    'message': 'Failed to send journal entry to accounting service'
                }
                
        except Exception as e:
            logger.exception(f"Error processing business operation: {str(e)}")
            return {
                'status': 'error',
                'operationId': operation.get('id', 'unknown'),
                'message': f'Processing error: {str(e)}'
            }
    
    def _extract_operation_data(self, operation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extrait et standardise les données d'une opération
        """
        return {
            'id': operation.get('id'),
            'type': operation.get('type', '').upper(),
            'amount': float(operation.get('amountCdf')),
            'company_id': operation.get('companyId'),
            'client_id': operation.get('clientId', 'unknown'),
            'description': operation.get('description', ''),
            'date': operation.get('date'),
            'metadata': operation.get('metadata', {}),
            'related_party_id': operation.get('relatedPartyId'),
            'related_party_name': operation.get('relatedPartyName', ''),
        }
    
    def _generate_journal_entry(self, operation_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Génère une écriture comptable standardisée en utilisant la base de connaissances SYSCOHADA
        """
        try:
            operation_type = operation_data['type']
            amount = operation_data['amount']
            description = operation_data['description']
            
            # Utiliser la génération automatique de la base de connaissances
            from decimal import Decimal
            
            additional_info = {
                'date': self._format_date(operation_data['date']),
                'reference': operation_data.get('id', ''),
                'client_name': operation_data.get('related_party_name', ''),
                'supplier_name': operation_data.get('related_party_name', '')
            }
            
            # Générer l'écriture équilibrée avec validation automatique
            journal_entry = self.knowledge_base.generate_balanced_entry(
                operation_type=operation_type,
                amount=Decimal(str(amount)),
                description=description,
                additional_info=additional_info
            )
            
            if 'error' in journal_entry:
                logger.error(f"Error generating journal entry: {journal_entry['error']}")
                return None
            
            # Enrichir avec les métadonnées du système
            journal_entry.update({
                'id': str(uuid.uuid4()),
                'sourceId': operation_data['id'],
                'sourceType': 'commerce_operation',
                'clientId': operation_data['client_id'],
                'companyId': operation_data['company_id'],
                'currency': 'CDF',
                'createdAt': datetime.now().isoformat(),
                'createdBy': 'adha-ai-service',
                'status': 'pending',
                'metadata': {
                    'sourceSystem': 'commerce_operations',
                    'originalType': operation_type,
                    'generatedBy': 'adha-ai-automatic-processing-v2-knowledge-base',
                    'relatedPartyId': operation_data['related_party_id'],
                    'relatedPartyName': operation_data['related_party_name'],
                    'needsReview': True,
                    'generatedAt': datetime.now().isoformat(),
                    'operationMetadata': operation_data['metadata'],
                    'syscohadaCompliant': True,
                    'knowledgeBaseValidated': journal_entry.get('validation', {}).get('is_valid', False)
                }
            })
            
            return journal_entry
            
        except Exception as e:
            logger.exception(f"Error generating journal entry: {str(e)}")
            return None
    
    def _format_date(self, date_value) -> str:
        """
        Formate la date en ISO 8601
        """
        if isinstance(date_value, str):
            return date_value
        elif hasattr(date_value, 'isoformat'):
            return date_value.isoformat()
        else:
            return datetime.now().isoformat()


# Instance globale pour compatibilité
accounting_processor = AccountingProcessor()


# Fonction globale pour compatibilité avec l'API existante
async def process_business_operation(operation: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Point d'entrée global pour le traitement des opérations commerciales
    """
    return await accounting_processor.process_business_operation(operation)