from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.utils import timezone
from decimal import Decimal
from django.db.models import Sum

from api.models import Company, TokenPurchaseRequest, TokenPrice, TokenUsage
from api.permissions import IsCompanyOwner
from ..utils import error_response

class SubscriptionStatusView(APIView):
    """
    Endpoint to check the subscription status of a company.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Get the subscription status of your company",
        responses={
            status.HTTP_200_OK: openapi.Response(description="Subscription status retrieved successfully"),
            status.HTTP_404_NOT_FOUND: openapi.Response(description="Company not found"),
            status.HTTP_403_FORBIDDEN: openapi.Response(description="Not authorized")
        }
    )
    def get(self, request):
        """Get subscription status of the user's company."""
        try:
            # Get the user's company (assuming user belongs to only one company)
            company = request.user.companies.first()
            if not company:
                return Response(
                    {"error": "You are not associated with any company"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get subscription status
            is_active = company.is_subscription_active
            is_valid = company.has_valid_subscription()
            
            # Get token information
            current_tokens = company.token_quota
            monthly_allowance = company.monthly_token_allowance
            
            # Calculate token usage for this month
            first_day_of_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            token_usage_this_month = TokenUsage.objects.filter(
                user__in=company.employees.all(),
                timestamp__gte=first_day_of_month
            ).aggregate(
                total_tokens=Sum('total_tokens')
            )['total_tokens'] or 0
            
            # Calculate days until renewal
            days_until_renewal = company.days_until_renewal()
            
            return Response({
                'subscription': {
                    'is_active': is_active,
                    'is_valid': is_valid,
                    'renewal_date': company.subscription_renewal_date,
                    'days_until_renewal': days_until_renewal
                },
                'tokens': {
                    'current_quota': current_tokens,
                    'monthly_allowance': monthly_allowance,
                    'usage_this_month': token_usage_this_month,
                    'remaining_percentage': (current_tokens / monthly_allowance * 100) if monthly_allowance > 0 else 0
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return error_response(f"Error retrieving subscription status: {str(e)}")

class TokenPurchaseRequestView(APIView):
    """
    Endpoint for creating and managing token purchase requests.
    """
    permission_classes = [IsAuthenticated, IsCompanyOwner]
    
    @swagger_auto_schema(
        operation_description="Create a new token purchase request",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'tokens_requested': openapi.Schema(type=openapi.TYPE_INTEGER, description='Number of tokens to purchase (in millions)'),
                'payment_method': openapi.Schema(type=openapi.TYPE_STRING, description='Payment method')
            },
            required=['tokens_requested']
        ),
        responses={
            status.HTTP_201_CREATED: openapi.Response(description="Purchase request created"),
            status.HTTP_400_BAD_REQUEST: openapi.Response(description="Invalid data"),
            status.HTTP_404_NOT_FOUND: openapi.Response(description="Company not found or token price not set")
        }
    )
    def post(self, request):
        """Create a new token purchase request."""
        try:
            # Get the user's company (must be company owner)
            company = request.user.companies.first()
            if not company or company.owner != request.user:
                return Response(
                    {"error": "You are not authorized to make token purchase requests"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get current token price
            current_price = TokenPrice.get_current_price()
            if not current_price:
                return Response(
                    {"error": "Token price not set. Please contact administrator."}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get the requested token amount (in millions)
            tokens_millions = request.data.get('tokens_requested')
            if not tokens_millions or tokens_millions <= 0:
                return Response(
                    {"error": "Token amount must be a positive number"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Convert to actual token count
            tokens_requested = tokens_millions * 1000000
            
            # Calculate total price
            price_per_million = current_price.price_per_million
            total_price = Decimal(tokens_millions) * price_per_million
            
            # Get payment method
            payment_method = request.data.get('payment_method', 'bank_transfer')
            
            # Create purchase request
            purchase_request = TokenPurchaseRequest.objects.create(
                company=company,
                requested_by=request.user,
                tokens_requested=tokens_requested,
                price_per_million=price_per_million,
                total_price=total_price,
                currency=current_price.currency,
                payment_method=payment_method
            )
            
            return Response({
                'id': purchase_request.id,
                'tokens_requested': tokens_requested,
                'price_per_million': float(price_per_million),
                'total_price': float(total_price),
                'currency': current_price.currency,
                'status': purchase_request.status,
                'request_date': purchase_request.request_date,
                'message': 'Token purchase request created successfully and is pending approval'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return error_response(f"Error creating token purchase request: {str(e)}")
    
    @swagger_auto_schema(
        operation_description="List token purchase requests for your company",
        responses={
            status.HTTP_200_OK: openapi.Response(description="Purchase requests retrieved"),
            status.HTTP_403_FORBIDDEN: openapi.Response(description="Not authorized"),
        }
    )
    def get(self, request):
        """List token purchase requests for the user's company."""
        try:
            # Get the user's company
            company = request.user.companies.first()
            if not company:
                return Response(
                    {"error": "You are not associated with any company"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if user is company owner (for detailed view)
            is_owner = company.owner == request.user
            
            # Get purchase requests
            if is_owner:
                # Company owners see all requests
                requests = TokenPurchaseRequest.objects.filter(company=company).order_by('-request_date')
            else:
                # Regular employees only see completed/approved requests
                requests = TokenPurchaseRequest.objects.filter(
                    company=company,
                    status__in=['completed', 'approved']
                ).order_by('-request_date')
            
            # Format the response
            request_list = []
            for req in requests:
                request_data = {
                    'id': req.id,
                    'tokens_requested': req.tokens_requested,
                    'total_price': float(req.total_price),
                    'currency': req.currency,
                    'status': req.status,
                    'request_date': req.request_date,
                }
                
                # Add admin details if request has been processed
                if req.processed_date:
                    request_data['processed_date'] = req.processed_date
                
                request_list.append(request_data)
            
            return Response(request_list, status=status.HTTP_200_OK)
            
        except Exception as e:
            return error_response(f"Error retrieving token purchase requests: {str(e)}")
