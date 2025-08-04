"""
Service de validation pour les données d'entrée et de sortie.
Garantit la cohérence et la qualité des données dans le système Adha AI.
"""

import logging
from typing import Dict, Any, Optional, List, Union
from datetime import datetime
import re
from decimal import Decimal, InvalidOperation

logger = logging.getLogger(__name__)

class ValidationResult:
    """Résultat d'une validation avec détails des erreurs"""
    
    def __init__(self, is_valid: bool, errors: List[str] = None, warnings: List[str] = None):
        self.is_valid = is_valid
        self.errors = errors or []
        self.warnings = warnings or []
    
    def add_error(self, error: str):
        """Ajoute une erreur"""
        self.errors.append(error)
        self.is_valid = False
    
    def add_warning(self, warning: str):
        """Ajoute un avertissement"""
        self.warnings.append(warning)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convertit en dictionnaire"""
        return {
            'is_valid': self.is_valid,
            'errors': self.errors,
            'warnings': self.warnings
        }

class DataValidator:
    """
    Validateur de données pour les services Adha AI
    """
    
    # Patterns de validation
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    PHONE_PATTERN = re.compile(r'^\+?[1-9]\d{1,14}$')
    UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$', re.IGNORECASE)
    
    # Types d'analyse supportés
    SUPPORTED_ANALYSIS_TYPES = {
        'FINANCIAL', 'MARKET', 'OPERATIONAL', 'RISK', 'PERFORMANCE',
        'CREDIT', 'LIQUIDITY', 'COMPLIANCE', 'ESG', 'TECHNICAL'
    }
    
    # Rôles utilisateur valides
    VALID_USER_ROLES = {'USER', 'ADMIN', 'ANALYST', 'MANAGER', 'SYSTEM'}
    
    def validate_kafka_message(self, message: Dict[str, Any]) -> ValidationResult:
        """
        Valide un message Kafka entrant
        """
        result = ValidationResult(True)
        
        # Validation de la structure de base
        if not isinstance(message, dict):
            result.add_error("Message must be a dictionary")
            return result
        
        # Vérification des champs obligatoires
        required_fields = ['eventType', 'timestamp', 'data']
        for field in required_fields:
            if field not in message:
                result.add_error(f"Missing required field: {field}")
        
        # Validation du timestamp
        if 'timestamp' in message:
            if not self._validate_timestamp(message['timestamp']):
                result.add_error("Invalid timestamp format")
        
        # Validation des métadonnées
        if 'metadata' in message:
            metadata_result = self._validate_metadata(message['metadata'])
            result.errors.extend(metadata_result.errors)
            result.warnings.extend(metadata_result.warnings)
        
        # Validation spécifique selon le type d'événement
        event_type = message.get('eventType')
        if event_type:
            type_result = self._validate_by_event_type(event_type, message.get('data', {}))
            result.errors.extend(type_result.errors)
            result.warnings.extend(type_result.warnings)
        
        return result
    
    def validate_portfolio_request(self, request: Dict[str, Any]) -> ValidationResult:
        """
        Valide une demande d'analyse de portefeuille
        """
        result = ValidationResult(True)
        
        # Champs obligatoires
        required_fields = ['id', 'portfolioId', 'institutionId', 'analysisTypes']
        for field in required_fields:
            if field not in request or not request[field]:
                result.add_error(f"Missing or empty required field: {field}")
        
        # Validation de l'ID du portefeuille
        if 'portfolioId' in request:
            if not self._validate_id(request['portfolioId']):
                result.add_error("Invalid portfolioId format")
        
        # Validation de l'ID de l'institution
        if 'institutionId' in request:
            if not self._validate_id(request['institutionId']):
                result.add_error("Invalid institutionId format")
        
        # Validation des types d'analyse
        if 'analysisTypes' in request:
            analysis_result = self._validate_analysis_types(request['analysisTypes'])
            result.errors.extend(analysis_result.errors)
            result.warnings.extend(analysis_result.warnings)
        
        # Validation du rôle utilisateur
        if 'userRole' in request:
            if request['userRole'] not in self.VALID_USER_ROLES:
                result.add_error(f"Invalid user role: {request['userRole']}")
        
        return result
    
    def validate_accounting_entry(self, entry: Dict[str, Any]) -> ValidationResult:
        """
        Valide une écriture comptable
        """
        result = ValidationResult(True)
        
        # Champs obligatoires
        required_fields = ['accountCode', 'description', 'amount', 'currency']
        for field in required_fields:
            if field not in entry or entry[field] is None:
                result.add_error(f"Missing required field: {field}")
        
        # Validation du montant
        if 'amount' in entry:
            amount_result = self._validate_amount(entry['amount'])
            result.errors.extend(amount_result.errors)
        
        # Validation du code de compte
        if 'accountCode' in entry:
            if not self._validate_account_code(entry['accountCode']):
                result.add_error("Invalid account code format")
        
        # Validation de la devise
        if 'currency' in entry:
            if not self._validate_currency(entry['currency']):
                result.add_error("Invalid currency code")
        
        return result
    
    def validate_response_data(self, data: Dict[str, Any]) -> ValidationResult:
        """
        Valide les données de réponse avant envoi
        """
        result = ValidationResult(True)
        
        # Vérification de la structure de base
        if 'status' not in data:
            result.add_error("Missing status field in response")
        
        if 'status' in data and data['status'] not in {'success', 'error', 'warning'}:
            result.add_error("Invalid status value")
        
        # Pour les réponses d'erreur
        if data.get('status') == 'error' and 'message' not in data:
            result.add_error("Error responses must include a message field")
        
        # Pour les réponses de succès
        if data.get('status') == 'success':
            if 'results' not in data and 'data' not in data:
                result.add_warning("Success responses should include results or data")
        
        return result
    
    def _validate_metadata(self, metadata: Dict[str, Any]) -> ValidationResult:
        """Valide les métadonnées d'un message"""
        result = ValidationResult(True)
        
        # Validation de l'ID de corrélation
        if 'correlationId' in metadata:
            if not self._validate_uuid(metadata['correlationId']):
                result.add_error("Invalid correlationId format")
        
        # Validation de la source
        if 'source' in metadata:
            if not isinstance(metadata['source'], str) or not metadata['source'].strip():
                result.add_error("Source must be a non-empty string")
        
        return result
    
    def _validate_by_event_type(self, event_type: str, data: Dict[str, Any]) -> ValidationResult:
        """Validation spécifique selon le type d'événement"""
        result = ValidationResult(True)
        
        if event_type == 'PORTFOLIO_ANALYSIS_REQUEST':
            return self.validate_portfolio_request(data)
        
        elif event_type == 'ACCOUNTING_JOURNAL_ENTRY':
            return self.validate_accounting_entry(data)
        
        elif event_type in ['BUSINESS_OPERATION_CREATED', 'BUSINESS_OPERATION_UPDATED']:
            # Validation des opérations commerciales
            if 'operationId' not in data:
                result.add_error("Missing operationId for business operation")
            if 'operationType' not in data:
                result.add_error("Missing operationType for business operation")
        
        return result
    
    def _validate_analysis_types(self, analysis_types: List[str]) -> ValidationResult:
        """Valide les types d'analyse demandés"""
        result = ValidationResult(True)
        
        if not isinstance(analysis_types, list):
            result.add_error("Analysis types must be a list")
            return result
        
        if len(analysis_types) == 0:
            result.add_error("At least one analysis type is required")
            return result
        
        for analysis_type in analysis_types:
            if analysis_type not in self.SUPPORTED_ANALYSIS_TYPES:
                result.add_error(f"Unsupported analysis type: {analysis_type}")
        
        return result
    
    def _validate_timestamp(self, timestamp: str) -> bool:
        """Valide un timestamp ISO 8601"""
        try:
            datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
            return True
        except (ValueError, AttributeError):
            return False
    
    def _validate_uuid(self, uuid_str: str) -> bool:
        """Valide un UUID"""
        if not isinstance(uuid_str, str):
            return False
        return bool(self.UUID_PATTERN.match(uuid_str))
    
    def _validate_id(self, id_value: Any) -> bool:
        """Valide un ID (UUID ou entier)"""
        if isinstance(id_value, int):
            return id_value > 0
        elif isinstance(id_value, str):
            # Tentative UUID
            if self._validate_uuid(id_value):
                return True
            # Tentative entier en string
            try:
                return int(id_value) > 0
            except ValueError:
                return False
        return False
    
    def _validate_amount(self, amount: Any) -> ValidationResult:
        """Valide un montant monétaire"""
        result = ValidationResult(True)
        
        try:
            # Conversion en Decimal pour précision
            decimal_amount = Decimal(str(amount))
            
            # Vérification des limites raisonnables
            if decimal_amount < Decimal('-999999999.99'):
                result.add_error("Amount is too small (minimum: -999,999,999.99)")
            elif decimal_amount > Decimal('999999999.99'):
                result.add_error("Amount is too large (maximum: 999,999,999.99)")
            
            # Vérification du nombre de décimales
            if decimal_amount.as_tuple().exponent < -2:
                result.add_warning("Amount has more than 2 decimal places")
        
        except (InvalidOperation, TypeError, ValueError):
            result.add_error("Invalid amount format")
        
        return result
    
    def _validate_account_code(self, account_code: str) -> bool:
        """Valide un code de compte comptable"""
        if not isinstance(account_code, str):
            return False
        
        # Format standard : chiffres avec possibles points ou tirets
        pattern = re.compile(r'^[0-9]+([.-][0-9]+)*$')
        return bool(pattern.match(account_code.strip()))
    
    def _validate_currency(self, currency: str) -> bool:
        """Valide un code de devise (ISO 4217)"""
        if not isinstance(currency, str):
            return False
        
        # Liste des devises courantes (extensible)
        valid_currencies = {
            'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD',
            'XOF', 'XAF', 'MAD', 'TND', 'EGP', 'NGN', 'ZAR', 'KES'
        }
        
        return currency.upper() in valid_currencies
    
    def _validate_email(self, email: str) -> bool:
        """Valide une adresse email"""
        if not isinstance(email, str):
            return False
        return bool(self.EMAIL_PATTERN.match(email.strip()))
    
    def _validate_phone(self, phone: str) -> bool:
        """Valide un numéro de téléphone"""
        if not isinstance(phone, str):
            return False
        return bool(self.PHONE_PATTERN.match(phone.strip()))

# Instance globale du validateur
data_validator = DataValidator()

# Fonctions helper pour compatibilité
def validate_message(message: Dict[str, Any]) -> ValidationResult:
    """Valide un message Kafka"""
    return data_validator.validate_kafka_message(message)

def validate_portfolio_analysis_request(request: Dict[str, Any]) -> ValidationResult:
    """Valide une demande d'analyse de portefeuille"""
    return data_validator.validate_portfolio_request(request)

def validate_accounting_data(entry: Dict[str, Any]) -> ValidationResult:
    """Valide des données comptables"""
    return data_validator.validate_accounting_entry(entry)

def validate_response(data: Dict[str, Any]) -> ValidationResult:
    """Valide des données de réponse"""
    return data_validator.validate_response_data(data)
