import json
from django.utils.deprecation import MiddlewareMixin
import threading
from api.services.token_tracker import TokenTracker
from django.http import JsonResponse

# Thread local storage to track token usage per request
local = threading.local()

class TokenHeaderMiddleware(MiddlewareMixin):
    """
    Middleware qui vérifie les quotas de tokens et ajoute des informations
    sur la consommation de tokens aux en-têtes HTTP des réponses.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.tracker = TokenTracker()
        
    def process_request(self, request):
        """
        Vérifie si l'utilisateur a suffisamment de tokens avant de traiter la requête.
        Bloque les nouvelles opérations si le quota est dépassé, mais permet de finir 
        les opérations en cours.
        """
        # Reset token usage for this request
        local.tokens = {
            'prompt_tokens': 0,
            'completion_tokens': 0,
            'total_tokens': 0,
            'operations': 0
        }

        # Ne rien faire pour les requêtes statiques, options, ou non-authentifiées
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return None
            
        # Ne pas bloquer les requêtes qui ne consomment pas de tokens
        exempt_paths = [
            '/api/token-quota/',
            '/api/token/',
            '/api/token/refresh/',
            '/admin/',
            '/static/'
        ]
        
        if any(request.path.startswith(path) for path in exempt_paths):
            return None
            
        # Vérifier uniquement pour les nouvelles opérations
        if request.method in ['POST', 'PUT'] and 'operation_id' not in request.GET:
            token_tracker = TokenTracker()
            user_stats = token_tracker.get_token_statistics(request.user.id)
            
            # Vérifier si l'utilisateur a dépassé son quota
            if user_stats.get('remaining_tokens', 0) <= 0:
                return JsonResponse({
                    "error": "Quota de tokens dépassé",
                    "message": "Votre quota de tokens est épuisé. Veuillez acheter plus de tokens pour continuer à utiliser le service.",
                    "token_quota": user_stats.get('quota', 0),
                    "tokens_used": user_stats.get('used_tokens', 0),
                    "reset_date": user_stats.get('next_reset')
                }, status=429)  # 429 Too Many Requests
                
        return None
    
    def process_response(self, request, response):
        """
        Ajoute des informations sur la consommation de tokens aux en-têtes HTTP
        des réponses pour les utilisateurs authentifiés.
        """
        # Check if we have token usage for this request
        if hasattr(local, 'tokens'):
            # Add headers
            response['X-Token-Usage-Prompt'] = local.tokens['prompt_tokens']
            response['X-Token-Usage-Completion'] = local.tokens['completion_tokens']
            response['X-Token-Usage-Total'] = local.tokens['total_tokens']
            response['X-Token-Usage-Operations'] = local.tokens['operations']
            
            # Check if user is authenticated for company quota info
            if hasattr(request, 'user') and request.user.is_authenticated:
                # Get company quota if applicable
                try:
                    if hasattr(request.user, 'companies'):
                        company = request.user.companies.first()
                        if company:
                            response['X-Company-Token-Quota'] = company.token_quota
                except Exception as e:
                    print(f"Error adding company quota header: {e}")

        # Ne rien faire pour les demandes non-authentifiées
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return response
        
        # Obtenir les informations sur les tokens pour l'utilisateur actuel
        token_tracker = TokenTracker()
        token_stats = token_tracker.get_token_statistics(request.user.id)
        
        # Ajouter les informations aux en-têtes HTTP
        response['X-Token-Quota'] = str(token_stats.get('quota', 0))
        response['X-Token-Used'] = str(token_stats.get('used_tokens', 0))
        response['X-Token-Remaining'] = str(token_stats.get('remaining_tokens', 0))
        
        # Vérifier si les tokens sont épuisés après cette opération
        if token_stats.get('remaining_tokens', 0) <= 0:
            # Ajouter un en-tête spécifique pour indiquer l'épuisement des tokens
            response['X-Token-Status'] = 'exhausted'
            
            # Si c'est une réponse JSON, on peut ajouter un message dans le corps
            if 'application/json' in response.get('Content-Type', ''):
                try:
                    data = json.loads(response.content.decode('utf-8'))
                    
                    # N'ajouter le message que si la réponse est un dictionnaire
                    if isinstance(data, dict):
                        data['token_warning'] = "Votre quota de tokens est épuisé. Cette opération a été traitée, mais vous ne pourrez pas en effectuer d'autres avant d'acheter plus de tokens ou d'attendre la réinitialisation de votre quota."
                        response.content = json.dumps(data).encode('utf-8')
                except Exception:
                    # Si la manipulation JSON échoue, ne pas modifier la réponse
                    pass
        
        # Si l'opération courante est disponible dans le contexte de la requête, l'ajouter aussi
        if hasattr(request, 'current_operation'):
            current_op = request.current_operation
            response['X-Token-Operation-Input'] = str(current_op.get('input_tokens', 0))
            response['X-Token-Operation-Output'] = str(current_op.get('output_tokens', 0))
            response['X-Token-Operation-Total'] = str(current_op.get('total_tokens', 0))
            response['X-Token-Operation-Cost-USD'] = str(current_op.get('cost', 0))
        
        return response
    
    @staticmethod
    def add_token_usage(prompt_tokens, completion_tokens):
        """
        Add token usage for the current request.
        This should be called by views that use LLM services.
        """
        if not hasattr(local, 'tokens'):
            local.tokens = {
                'prompt_tokens': 0,
                'completion_tokens': 0,
                'total_tokens': 0,
                'operations': 0
            }
            
        local.tokens['prompt_tokens'] += prompt_tokens
        local.tokens['completion_tokens'] += completion_tokens
        local.tokens['total_tokens'] += prompt_tokens + completion_tokens
        local.tokens['operations'] += 1
