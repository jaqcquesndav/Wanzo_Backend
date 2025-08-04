"""
Processeur comptable robuste pour Adha AI Service.
Traite les opérations commerciales et génère des écritures comptables standardisées.
"""

import logging
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from decimal import Decimal, ROUND_HALF_UP

from ..kafka.producer_accounting import accounting_producer

logger = logging.getLogger(__name__)

# Mapping des types d'opérations vers les comptes comptables
ACCOUNT_MAPPING = {
    'SALE': {
        'debit_account': '411000',  # Clients
        'credit_account': '701000',  # Ventes de marchandises
        'journal_type': 'SALES'
    },
    'PURCHASE': {
        'debit_account': '601000',  # Achats de marchandises
        'credit_account': '401000',  # Fournisseurs
        'journal_type': 'PURCHASES'
    },
    'EXPENSE': {
        'debit_account': '622000',  # Frais généraux
        'credit_account': '531000',  # Caisse
        'journal_type': 'MISCELLANEOUS'
    },
    'PAYMENT': {
        'debit_account': '401000',  # Fournisseurs (paiement)
        'credit_account': '512000',  # Banque
        'journal_type': 'FINANCIAL'
    },
    'RECEIPT': {
        'debit_account': '512000',  # Banque
        'credit_account': '411000',  # Clients (encaissement)
        'journal_type': 'FINANCIAL'
    },
    'TRANSFER': {
        'debit_account': '512000',  # Banque destination
        'credit_account': '531000',  # Caisse source
        'journal_type': 'FINANCIAL'
    },
    'LOAN': {
        'debit_account': '512000',  # Banque
        'credit_account': '164000',  # Emprunts
        'journal_type': 'FINANCIAL'
    },
    'INVENTORY': {
        'debit_account': '310000',  # Stocks
        'credit_account': '603000',  # Variation des stocks
        'journal_type': 'INVENTORY'
    }
}

class AccountingProcessor:
    """
    Processeur comptable robuste avec validation et standardisation
    """
    
    def __init__(self):
        self.producer = accounting_producer
    
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
            if not self._validate_operation(operation):
                return None
            
            # Extraction et standardisation des données
            operation_data = self._extract_operation_data(operation)
            
            # Génération de l'écriture comptable
            journal_entry = self._generate_journal_entry(operation_data)
            
            if not journal_entry:
                logger.error(f"Failed to generate journal entry for operation {operation_data['id']}")
                return None
            
            # Validation de l'écriture générée
            if not self._validate_journal_entry(journal_entry):
                logger.error(f"Generated journal entry is invalid for operation {operation_data['id']}")
                return None
            
            # Envoi vers le service comptable
            correlation_id = operation.get('metadata', {}).get('correlationId') or str(uuid.uuid4())
            success = await self.producer.publish_journal_entry(journal_entry, correlation_id)
            
            if success:
                logger.info(f"Journal entry sent successfully for operation {operation_data['id']}")
                return {
                    'status': 'success',
                    'journalEntryId': journal_entry['id'],
                    'operationId': operation_data['id'],
                    'message': 'Journal entry generated and sent successfully'
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
    
    def _validate_operation(self, operation: Dict[str, Any]) -> bool:
        """
        Valide les données d'une opération commerciale
        """
        # Champs obligatoires
        required_fields = ['id', 'type', 'amountCdf', 'companyId']
        
        for field in required_fields:
            if field not in operation or not operation[field]:
                logger.error(f"Missing or empty required field: {field}")
                return False
        
        # Validation du type d'opération
        operation_type = operation.get('type', '').upper()
        if operation_type not in ACCOUNT_MAPPING:
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
    
    def _extract_operation_data(self, operation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extrait et standardise les données d'une opération
        """
        # Extraction avec conversion automatique des formats
        data = operation.get('data', operation)  # Support des messages standardisés
        
        return {
            'id': str(data.get('id')),
            'type': str(data.get('type', '')).upper(),
            'amount': self._parse_amount(data.get('amountCdf', data.get('amount_cdf', 0))),
            'description': str(data.get('description', 'Transaction automatique')),
            'date': self._parse_date(data.get('date')),
            'companyId': str(data.get('companyId', data.get('company_id', data.get('createdBy')))),
            'relatedPartyId': data.get('relatedPartyId', data.get('related_party_id')),
            'relatedPartyName': data.get('relatedPartyName', data.get('related_party_name', '')),
            'reference': data.get('reference', ''),
            'notes': data.get('notes', ''),
        }
    
    def _parse_amount(self, amount_value: Any) -> Decimal:
        """
        Parse et valide un montant avec précision décimale
        """
        try:
            if isinstance(amount_value, (int, float)):
                return Decimal(str(amount_value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            elif isinstance(amount_value, str):
                return Decimal(amount_value).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            else:
                return Decimal('0.00')
        except Exception:
            logger.warning(f"Failed to parse amount: {amount_value}")
            return Decimal('0.00')
    
    def _parse_date(self, date_value: Any) -> str:
        """
        Parse et standardise une date au format ISO
        """
        if isinstance(date_value, str):
            return date_value
        elif hasattr(date_value, 'isoformat'):
            return date_value.isoformat()
        else:
            return datetime.now().isoformat()
    
    def _generate_journal_entry(self, operation_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Génère une écriture comptable standardisée à partir d'une opération
        """
        try:
            operation_type = operation_data['type']
            amount = operation_data['amount']
            
            # Récupération du mapping comptable
            account_config = ACCOUNT_MAPPING.get(operation_type)
            if not account_config:
                logger.error(f"No account mapping for operation type: {operation_type}")
                return None
            
            # Génération de l'ID unique pour l'écriture
            journal_id = str(uuid.uuid4())
            
            # Création des lignes d'écriture
            lines = self._create_journal_lines(operation_data, account_config)
            
            # Calcul des totaux
            total_debit = sum(line['debit'] for line in lines)
            total_credit = sum(line['credit'] for line in lines)
            
            # Génération de l'écriture complète
            journal_entry = {
                'id': journal_id,
                'companyId': operation_data['companyId'],
                'journalType': account_config['journal_type'],
                'date': operation_data['date'],
                'reference': self._generate_reference(operation_data),
                'description': operation_data['description'],
                'lines': lines,
                'totalDebit': float(total_debit),
                'totalCredit': float(total_credit),
                'sourceId': operation_data['id'],
                'sourceType': 'commerce_operation',
                'metadata': {
                    'sourceSystem': 'adha_ai',
                    'originalType': operation_data['type'],
                    'generatedBy': 'adha-ai-automatic-processing',
                    'relatedPartyId': operation_data.get('relatedPartyId'),
                    'relatedPartyName': operation_data.get('relatedPartyName', ''),
                    'needsReview': self._needs_review(operation_data),
                    'generatedAt': datetime.now().isoformat(),
                }
            }
            
            return journal_entry
            
        except Exception as e:
            logger.exception(f"Error generating journal entry: {str(e)}")
            return None
    
    def _create_journal_lines(self, operation_data: Dict[str, Any], account_config: Dict[str, Any]) -> list:
        """
        Crée les lignes d'écriture comptable
        """
        amount = float(operation_data['amount'])
        description = operation_data['description']
        
        lines = [
            {
                'accountCode': account_config['debit_account'],
                'label': f"{description} - Débit",
                'debit': amount,
                'credit': 0,
                'description': f"Écriture automatique - {operation_data['type']}"
            },
            {
                'accountCode': account_config['credit_account'],
                'label': f"{description} - Crédit",
                'debit': 0,
                'credit': amount,
                'description': f"Écriture automatique - {operation_data['type']}"
            }
        ]
        
        return lines
    
    def _generate_reference(self, operation_data: Dict[str, Any]) -> str:
        """
        Génère une référence unique pour l'écriture
        """
        if operation_data.get('reference'):
            return operation_data['reference']
        
        operation_id = operation_data['id'][:8]
        operation_type = operation_data['type'][:3]
        date_str = datetime.now().strftime('%y%m%d')
        
        return f"{operation_type}-{date_str}-{operation_id}"
    
    def _needs_review(self, operation_data: Dict[str, Any]) -> bool:
        """
        Détermine si l'écriture nécessite une révision manuelle
        """
        # Critères pour révision manuelle
        amount = float(operation_data['amount'])
        
        # Montants élevés nécessitent une révision
        if amount > 1000000:  # Plus de 1 million CDF
            return True
        
        # Types d'opérations sensibles
        sensitive_types = ['LOAN', 'TRANSFER']
        if operation_data['type'] in sensitive_types:
            return True
        
        # Absence de partie liée
        if not operation_data.get('relatedPartyId'):
            return True
        
        return False
    
    def _validate_journal_entry(self, journal_entry: Dict[str, Any]) -> bool:
        """
        Valide une écriture comptable générée
        """
        try:
            # Vérification de l'équilibrage
            total_debit = journal_entry.get('totalDebit', 0)
            total_credit = journal_entry.get('totalCredit', 0)
            
            if abs(total_debit - total_credit) > 0.01:
                logger.error(f"Journal entry not balanced: debit={total_debit}, credit={total_credit}")
                return False
            
            # Vérification des lignes
            lines = journal_entry.get('lines', [])
            if not lines or len(lines) < 2:
                logger.error("Journal entry must have at least 2 lines")
                return False
            
            # Vérification que chaque ligne a les champs requis
            for i, line in enumerate(lines):
                if not all(field in line for field in ['accountCode', 'label', 'debit', 'credit']):
                    logger.error(f"Line {i} missing required fields")
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating journal entry: {str(e)}")
            return False

# Instance globale du processeur
accounting_processor = AccountingProcessor()

# Fonction helper pour compatibilité avec l'ancien code
async def process_business_operation(operation: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Fonction helper pour traiter une opération commerciale
    """
    return await accounting_processor.process_business_operation(operation)

def handle_accounting_status(status_message: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Traite les messages de statut de traitement des écritures comptables
    """
    try:
        journal_entry_id = status_message.get('journalEntryId', status_message.get('journal_entry_id'))
        source_id = status_message.get('sourceId', status_message.get('source_id'))
        success = status_message.get('success')
        message = status_message.get('message', '')
        timestamp = status_message.get('timestamp')
        
        # Vérification des données obligatoires
        if not journal_entry_id or not source_id or success is None:
            logger.error("Missing required fields in accounting status message")
            return None
        
        # Journaliser le statut reçu
        log_level = logging.INFO if success else logging.WARNING
        logger.log(log_level, f"Accounting entry {journal_entry_id} for source {source_id} processed: "
                             f"{'successfully' if success else 'failed'} - {message}")
        
        # TODO: Mettre à jour la base de données locale si nécessaire
        # TODO: Implémenter la logique de retry en cas d'échec
        
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
