from datetime import datetime, timedelta
from django.utils import timezone
from api.models.token_usage import TokenUsage, UserTokenQuota  # Updated from TokenQuota
from api.models.company import Company
from django.db.models import Sum
from django.contrib.auth.models import User
import uuid

class TokenTracker:
    """
    Service pour suivre et gérer l'utilisation des tokens.
    """
    def __init__(self, user_id=None):
        """
        Initialise le tracker de tokens pour un utilisateur spécifique.
        
        Args:
            user_id: L'ID de l'utilisateur pour lequel suivre l'utilisation.
        """
        self.user_id = user_id
        self.user = User.objects.get(id=user_id) if user_id else None
    
    def track_operation(self, user_id, operation_type, model, input_tokens, output_tokens, operation_id=None, endpoint=None):
        """
        Enregistre l'utilisation de tokens pour une opération spécifique.
        
        Args:
            user_id: ID de l'utilisateur
            operation_type: Type d'opération (prompt, document, chat, etc.)
            model: Modèle LLM utilisé
            input_tokens: Nombre de tokens d'entrée
            output_tokens: Nombre de tokens de sortie
            operation_id: ID unique de l'opération (généré si non fourni)
            endpoint: Endpoint API appelé
            
        Returns:
            dict: Statistiques d'utilisation des tokens
        """
        if not operation_id:
            operation_id = f"op_{uuid.uuid4().hex}"
            
        # Créer l'entrée d'utilisation
        usage = TokenUsage.objects.create(
            user_id=user_id,
            operation_id=operation_id,
            operation_type=operation_type,
            model_name=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            endpoint=endpoint
        )
        
        # Mettre à jour le quota de l'utilisateur
        try:
            quota, created = UserTokenQuota.objects.get_or_create(user_id=user_id)
            quota.tokens_used += (input_tokens + output_tokens)
            quota.save()
            
            # Vérifier si le quota doit être réinitialisé
            if quota.reset_period != 'none':
                self._check_and_reset_quota(quota)
                
            # Mettre à jour l'utilisation au niveau de l'entreprise
            self._update_company_usage(user_id, input_tokens + output_tokens)
            
        except Exception as e:
            print(f"Erreur lors de la mise à jour du quota: {e}")
        
        # Retourner les statistiques
        return self._get_usage_stats(user_id)
    
    def _update_company_usage(self, user_id, total_tokens):
        """
        Met à jour le compteur d'utilisation des tokens au niveau de l'entreprise
        """
        try:
            # Trouver les entreprises de l'utilisateur
            user = User.objects.get(id=user_id)
            companies = user.companies.filter(is_active=True)
            
            if not companies:
                return False
                
            # Mettre à jour le compteur de tokens pour chaque entreprise
            for company in companies:
                # Vérifier si les tokens mensuels gratuits devraient être ajoutés
                company.reset_monthly_tokens()
                
                # Augmenter le compteur de tokens consommés
                company.tokens_consumed += total_tokens
                company.save(update_fields=['tokens_consumed'])
                
            return True
            
        except Exception as e:
            print(f"Erreur lors de la mise à jour de l'utilisation des tokens par l'entreprise: {e}")
            return False
    
    def _check_and_reset_quota(self, quota):
        """
        Vérifie si le quota doit être réinitialisé et le réinitialise si nécessaire.
        """
        now = timezone.now()
        
        # Déterminer la prochaine date de réinitialisation si elle n'est pas définie
        if not quota.next_reset:
            if quota.reset_period == 'daily':
                quota.next_reset = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0)
            elif quota.reset_period == 'weekly':
                days_ahead = 7 - now.weekday()  # Jours jusqu'au prochain lundi
                quota.next_reset = (now + timedelta(days=days_ahead)).replace(hour=0, minute=0, second=0)
            elif quota.reset_period == 'monthly':
                if now.month == 12:
                    next_month = now.replace(year=now.year+1, month=1, day=1)
                else:
                    next_month = now.replace(month=now.month+1, day=1)
                quota.next_reset = next_month
        
        # Réinitialiser si nécessaire
        if now >= quota.next_reset:
            quota.tokens_used = 0
            quota.last_reset = now
            
            # Définir la prochaine date de réinitialisation
            if quota.reset_period == 'daily':
                quota.next_reset = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0)
            elif quota.reset_period == 'weekly':
                days_ahead = 7 - now.weekday()  # Jours jusqu'au prochain lundi
                quota.next_reset = (now + timedelta(days=days_ahead)).replace(hour=0, minute=0, second=0)
            elif quota.reset_period == 'monthly':
                if now.month == 12:
                    next_month = now.replace(year=now.year+1, month=1, day=1)
                else:
                    next_month = now.replace(month=now.month+1, day=1)
                quota.next_reset = next_month
                
            quota.save()
    
    def _get_usage_stats(self, user_id):
        """
        Obtient les statistiques d'utilisation des tokens pour un utilisateur.
        """
        # Statistiques quotidiennes
        today = timezone.now().date()
        daily_stats = TokenUsage.objects.filter(
            user_id=user_id, 
            timestamp__date=today
        ).aggregate(
            input_tokens=Sum('input_tokens'),
            output_tokens=Sum('output_tokens')
        )
        
        # Statistiques mensuelles
        month_start = today.replace(day=1)
        monthly_stats = TokenUsage.objects.filter(
            user_id=user_id,
            timestamp__date__gte=month_start
        ).aggregate(
            input_tokens=Sum('input_tokens'),
            output_tokens=Sum('output_tokens')
        )
        
        # Statistiques totales
        total_stats = TokenUsage.objects.filter(
            user_id=user_id
        ).aggregate(
            input_tokens=Sum('input_tokens'),
            output_tokens=Sum('output_tokens')
        )
        
        # Remplacer les valeurs None par zéro
        for stats in [daily_stats, monthly_stats, total_stats]:
            for key in stats:
                if stats[key] is None:
                    stats[key] = 0
        
        # Ajouter les totaux calculés
        daily_stats['total_tokens'] = daily_stats['input_tokens'] + daily_stats['output_tokens']
        monthly_stats['total_tokens'] = monthly_stats['input_tokens'] + monthly_stats['output_tokens']
        total_stats['total_tokens'] = total_stats['input_tokens'] + total_stats['output_tokens']
        
        # Obtenir des informations sur le quota
        try:
            quota = UserTokenQuota.objects.get(user_id=user_id)
            quota_info = {
                'max_tokens': quota.max_tokens,
                'tokens_used': quota.tokens_used,
                'tokens_remaining': quota.tokens_remaining,
                'reset_period': quota.reset_period,
                'next_reset': quota.next_reset
            }
        except UserTokenQuota.DoesNotExist:
            quota_info = {
                'max_tokens': 0,
                'tokens_used': 0,
                'tokens_remaining': 0,
                'reset_period': 'none',
                'next_reset': None
            }
        
        return {
            'daily': daily_stats,
            'monthly': monthly_stats,
            'total': total_stats,
            'quota': quota_info
        }
