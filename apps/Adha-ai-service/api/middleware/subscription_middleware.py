from django.http import JsonResponse
from django.urls import resolve
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

class SubscriptionMiddleware:
    """
    Middleware that checks if a user's company has an active subscription
    before allowing access to protected endpoints.
    """
    def __init__(self, get_response):
        self.get_response = get_response
        
        # Define which URL patterns should be exempt from subscription checks
        self.exempt_urls = [
            'admin-',  # Admin URLs
            'kiota_admin',  # Admin namespace
            'company-subscription',  # Subscription status endpoint
            'token-purchase-request',  # Token purchase endpoint
            'auth',  # Auth endpoints
            'login',
            'signup',
            'token_refresh',
            'swagger',  # Swagger docs
            'redoc',    # ReDoc docs
            'schema'    # Schema views
        ]

    def __call__(self, request):
        # Skip OPTIONS requests for CORS
        if request.method == 'OPTIONS':
            return self.get_response(request)
            
        # Skip non-authenticated requests
        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return self.get_response(request)
        
        # Skip admin users
        if request.user.is_staff or (hasattr(request.user, 'profile') and 
                                    request.user.profile.user_type == 'admin'):
            return self.get_response(request)
        
        # Get current URL name
        resolved = resolve(request.path_info)
        url_name = resolved.url_name
        if not url_name:
            return self.get_response(request)
            
        # Get current namespace
        namespace = resolved.namespace
        
        # Skip exempt URLs and namespaces
        if any(exempt_pattern in url_name for exempt_pattern in self.exempt_urls) or \
           any(exempt_pattern in namespace for exempt_pattern in self.exempt_urls):
            return self.get_response(request)
        
        # Check if user belongs to a company
        user_company = None
        if hasattr(request.user, 'companies'):
            # Get the user's company
            try:
                user_company = request.user.companies.first()
            except Exception as e:
                logger.error(f"Error getting company for user {request.user.id}: {e}")
        
        if not user_company:
            # No company to check subscription for
            logger.warning(f"User {request.user.id} has no associated company")
            return self.get_response(request)
        
        # Check subscription status
        if not user_company.is_subscription_active:
            logger.warning(f"Company {user_company.id} has inactive subscription")
            return JsonResponse({
                'error': 'Your company subscription is inactive',
                'subscription_status': 'inactive',
                'company_id': user_company.id,
                'company_name': user_company.name
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Check token quota for operations that consume tokens
        if request.method in ['POST', 'PUT', 'PATCH']:
            # Get token cost based on endpoint or use default
            token_cost = getattr(request, 'token_cost', 100)  # Default token cost per operation
            
            if user_company.token_quota < token_cost:
                logger.warning(f"Company {user_company.id} has insufficient token quota: {user_company.token_quota} < {token_cost}")
                return JsonResponse({
                    'error': 'Your company has insufficient token quota for this operation',
                    'current_quota': user_company.token_quota,
                    'required_tokens': token_cost,
                    'company_id': user_company.id,
                    'company_name': user_company.name
                }, status=status.HTTP_402_PAYMENT_REQUIRED)
            
            # Log available tokens before operation
            logger.info(f"Company {user_company.id} has {user_company.token_quota} tokens before operation (cost: {token_cost})")
            
        return self.get_response(request)
