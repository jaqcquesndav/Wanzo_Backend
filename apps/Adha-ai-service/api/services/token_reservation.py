"""
Service de réservation et gestion des tokens AVANT traitement.
Prévient les dépassements de quota et permet rollback en cas d'échec.
"""

import logging
from typing import Optional, Tuple
from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist

from api.models import Company

logger = logging.getLogger(__name__)

class InsufficientTokensError(Exception):
    """Exception levée quand le quota de tokens est insuffisant"""
    pass

class TokenReservationService:
    """
    Service pour réserver des tokens AVANT le traitement et ajuster APRÈS.
    Assure qu'aucun traitement ne démarre si quota insuffisant.
    """
    
    @staticmethod
    def estimate_tokens(request_type: str, content_length: int = 0) -> int:
        """
        Estime le nombre de tokens nécessaires pour une requête.
        
        Args:
            request_type: Type de requête (chat, analysis, accounting)
            content_length: Longueur du contenu en caractères
            
        Returns:
            int: Estimation du nombre de tokens (marge de sécurité incluse)
        """
        # Estimation basique: 1 token ≈ 4 caractères
        base_tokens = content_length // 4 if content_length > 0 else 100
        
        # Facteurs de multiplication selon le type
        multipliers = {
            'chat': 2.0,        # Question + réponse + contexte
            'analysis': 5.0,    # Analyse complexe multi-agents
            'accounting': 1.5,  # Génération d'écriture
            'credit_score': 3.0 # Calcul score + explications
        }
        
        multiplier = multipliers.get(request_type, 2.0)
        estimated = int(base_tokens * multiplier)
        
        # Ajouter marge de sécurité de 20%
        estimated_with_margin = int(estimated * 1.2)
        
        # Minimum 100 tokens, maximum 50k tokens par requête
        return max(100, min(estimated_with_margin, 50000))
    
    @staticmethod
    @transaction.atomic
    def check_and_reserve_tokens(company_id: str, estimated_tokens: int) -> bool:
        """
        Vérifie et réserve des tokens AVANT le traitement.
        Utilise select_for_update pour éviter race conditions.
        
        Args:
            company_id: ID de la company
            estimated_tokens: Nombre de tokens à réserver
            
        Returns:
            bool: True si réservation réussie
            
        Raises:
            InsufficientTokensError: Si quota insuffisant
            ObjectDoesNotExist: Si company n'existe pas
        """
        try:
            # Lock la row pour éviter concurrent updates
            company = Company.objects.select_for_update().get(id=company_id)
            
            # Vérifier quota disponible
            if company.token_quota < estimated_tokens:
                available = company.token_quota
                raise InsufficientTokensError(
                    f"Quota insuffisant pour company {company.name}. "
                    f"Disponible: {available}, Requis: {estimated_tokens}"
                )
            
            # Réserver les tokens (déduction temporaire)
            company.token_quota -= estimated_tokens
            company.save(update_fields=['token_quota'])
            
            logger.info(
                f"Reserved {estimated_tokens} tokens for company {company_id}. "
                f"New quota: {company.token_quota}"
            )
            
            return True
            
        except ObjectDoesNotExist:
            logger.error(f"Company {company_id} not found for token reservation")
            raise
        except InsufficientTokensError:
            logger.warning(
                f"Insufficient tokens for company {company_id}: "
                f"need {estimated_tokens}"
            )
            raise
        except Exception as e:
            logger.error(f"Error reserving tokens for company {company_id}: {str(e)}")
            raise
    
    @staticmethod
    @transaction.atomic
    def release_reserved_tokens(company_id: str, reserved_tokens: int) -> bool:
        """
        Recrédite les tokens réservés en cas d'échec du traitement.
        
        Args:
            company_id: ID de la company
            reserved_tokens: Nombre de tokens à recréditer
            
        Returns:
            bool: True si succès
        """
        try:
            company = Company.objects.select_for_update().get(id=company_id)
            company.token_quota += reserved_tokens
            company.save(update_fields=['token_quota'])
            
            logger.info(
                f"Released {reserved_tokens} tokens back to company {company_id}. "
                f"New quota: {company.token_quota}"
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error releasing tokens for company {company_id}: {str(e)}")
            return False
    
    @staticmethod
    @transaction.atomic
    def adjust_tokens_after_processing(
        company_id: str, 
        reserved_tokens: int, 
        actual_tokens_used: int
    ) -> bool:
        """
        Ajuste les tokens après traitement: recrédite la différence entre réservation et usage réel.
        
        Args:
            company_id: ID de la company
            reserved_tokens: Nombre de tokens réservés
            actual_tokens_used: Nombre de tokens réellement utilisés
            
        Returns:
            bool: True si succès
        """
        try:
            difference = reserved_tokens - actual_tokens_used
            
            if difference == 0:
                logger.debug(f"No token adjustment needed for company {company_id}")
                return True
            
            company = Company.objects.select_for_update().get(id=company_id)
            
            if difference > 0:
                # On a surestimé, recréditer la différence
                company.token_quota += difference
                action = "recredited"
            else:
                # On a sous-estimé (rare), débiter la différence
                company.token_quota -= abs(difference)
                action = "debited"
            
            company.save(update_fields=['token_quota'])
            
            logger.info(
                f"{action.capitalize()} {abs(difference)} tokens for company {company_id}. "
                f"Reserved: {reserved_tokens}, Used: {actual_tokens_used}, "
                f"New quota: {company.token_quota}"
            )
            
            return True
            
        except Exception as e:
            logger.error(
                f"Error adjusting tokens for company {company_id}: {str(e)}"
            )
            return False
    
    @staticmethod
    def get_company_quota(company_id: str) -> Optional[Tuple[int, int]]:
        """
        Récupère le quota actuel et l'allowance mensuelle d'une company.
        
        Args:
            company_id: ID de la company
            
        Returns:
            Tuple[int, int]: (quota_actuel, allowance_mensuelle) ou None si erreur
        """
        try:
            company = Company.objects.get(id=company_id)
            return (company.token_quota, company.monthly_token_allowance)
        except Exception as e:
            logger.error(f"Error getting quota for company {company_id}: {str(e)}")
            return None

# Instance singleton
token_reservation_service = TokenReservationService()
