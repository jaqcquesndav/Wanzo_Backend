"""
Enhanced Isolation Middleware for Adha AI Service
Ensures strict data isolation between companies and financial institutions
"""
import json
import logging
import requests
from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse
from rest_framework import status

logger = logging.getLogger(__name__)

class EnhancedIsolationMiddleware:
    """
    Middleware qui assure l'isolation stricte des données entre les entreprises/institutions.
    Synchronise automatiquement avec le customer-service pour récupérer le contexte utilisateur.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.customer_service_url = getattr(settings, 'CUSTOMER_SERVICE_URL', 'http://kiota-customer-service:3011')
        
    def __call__(self, request):
        # Skip pour les requêtes non authentifiées ou les endpoints publics
        if not self._should_apply_isolation(request):
            return self.get_response(request)
            
        # Enrichir l'utilisateur avec le contexte company/institution
        if hasattr(request, 'user') and request.user.is_authenticated:
            try:
                user_context = self._get_user_context(request.user, request)
                if user_context:
                    # Enrichir l'objet user avec les métadonnées d'isolation
                    request.user.company_id = user_context.get('company_id')
                    request.user.institution_id = user_context.get('financial_institution_id')
                    request.user.customer_type = user_context.get('customer_type', 'sme')
                    request.user.isolation_context = user_context
                    
                    # Log pour audit de sécurité
                    logger.info(f"Isolation context applied - User: {request.user.id}, "
                              f"Company: {request.user.company_id}, "
                              f"Institution: {request.user.institution_id}, "
                              f"Type: {request.user.customer_type}")
                else:
                    logger.warning(f"Could not retrieve user context for user {request.user.id}")
                    
            except Exception as e:
                logger.error(f"Error applying isolation context: {str(e)}")
                return JsonResponse({
                    'error': 'Isolation context error',
                    'message': 'Unable to verify user context for data isolation'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        response = self.get_response(request)
        return response
    
    def _should_apply_isolation(self, request):
        """Détermine si l'isolation doit être appliquée pour cette requête."""
        exempt_paths = [
            '/admin/',
            '/swagger/',
            '/redoc/',
            '/health/',
            '/auth/login',
            '/auth/signup',
            '/auth/token_refresh'
        ]
        
        # Skip pour les requêtes OPTIONS (CORS)
        if request.method == 'OPTIONS':
            return False
            
        # Skip pour les chemins exempts
        for exempt_path in exempt_paths:
            if request.path.startswith(exempt_path):
                return False
                
        return True
    
    def _get_user_context(self, user, request):
        """
        Récupère le contexte utilisateur depuis le cache ou le customer-service.
        Utilise un cache avec TTL pour optimiser les performances.
        """
        cache_key = f"user_context_{user.id}"
        
        # Essayer de récupérer depuis le cache d'abord
        cached_context = cache.get(cache_key)
        if cached_context:
            logger.debug(f"User context retrieved from cache for user {user.id}")
            return cached_context
        
        # Si pas en cache, récupérer depuis le customer-service
        try:
            context = self._fetch_user_context_from_customer_service(user, request)
            if context:
                # Mettre en cache pour 5 minutes
                cache.set(cache_key, context, 300)
                logger.debug(f"User context fetched and cached for user {user.id}")
                return context
        except Exception as e:
            logger.error(f"Error fetching user context from customer service: {str(e)}")
            
        # Fallback: essayer de récupérer depuis le profil local
        return self._get_fallback_user_context(user)
    
    def _fetch_user_context_from_customer_service(self, user, request):
        """Récupère le contexte utilisateur depuis le customer-service via API."""
        try:
            # Extraire le token d'autorisation de la requête
            auth_header = request.headers.get('Authorization')
            if not auth_header:
                logger.warning(f"No authorization header found for user {user.id}")
                return None
            
            # Préparer les headers pour l'appel au customer-service
            headers = {
                'Authorization': auth_header,
                'Content-Type': 'application/json'
            }
            
            # Appeler l'endpoint du customer-service pour récupérer le contexte
            response = requests.get(
                f"{self.customer_service_url}/api/v1/users/profile",
                headers=headers,
                timeout=5  # Timeout court pour éviter la latence
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Structurer le contexte d'isolation
                context = {
                    'user_id': data.get('id'),
                    'company_id': data.get('company', {}).get('id') if data.get('company') else None,
                    'financial_institution_id': data.get('financialInstitution', {}).get('id') if data.get('financialInstitution') else None,
                    'customer_type': 'institution' if data.get('financialInstitution') else 'sme',
                    'permissions': data.get('permissions', []),
                    'last_sync': data.get('updatedAt')
                }
                
                return context
            else:
                logger.warning(f"Customer service returned {response.status_code} for user {user.id}")
                return None
                
        except requests.RequestException as e:
            logger.error(f"Network error calling customer service: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching user context: {str(e)}")
            return None
    
    def _get_fallback_user_context(self, user):
        """Contexte de fallback basé sur le profil local utilisateur."""
        try:
            if hasattr(user, 'profile'):
                profile = user.profile
                return {
                    'user_id': user.id,
                    'company_id': getattr(profile, 'company_id', None),
                    'financial_institution_id': None,  # Pas disponible en local
                    'customer_type': 'sme',  # Défaut pour le profil local
                    'permissions': [],
                    'last_sync': None,
                    'fallback': True
                }
        except Exception as e:
            logger.error(f"Error getting fallback context: {str(e)}")
            
        # Contexte minimal si tout échoue
        return {
            'user_id': user.id,
            'company_id': None,
            'financial_institution_id': None,
            'customer_type': 'sme',
            'permissions': [],
            'last_sync': None,
            'fallback': True
        }
