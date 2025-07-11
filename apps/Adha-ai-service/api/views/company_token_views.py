"""
Views for company token quota management and purchasing
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from decimal import Decimal
from django.utils import timezone

from api.models.token_price import TokenPrice
from api.models.token_purchase import TokenPurchaseRequest
from api.models.company import Company
from .utils import error_response

class CompanyTokenStatusView(APIView):
    """Endpoint for viewing company token status"""
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Get token usage for your company",
        responses={
            status.HTTP_200_OK: "Company token usage details",
            status.HTTP_404_NOT_FOUND: "Company not found"
        }
    )
    def get(self, request):
        """Get token usage for the current user's company"""
        # Get the user's company
        companies = request.user.companies.filter(is_active=True)
        if not companies:
            return error_response('No active company found for this user', status.HTTP_404_NOT_FOUND)
        
        company = companies.first()
        # Reset monthly tokens if needed
        company.reset_monthly_tokens()
        
        # Get token prices for reference
        token_prices = [{
            'model_name': price.model_name,
            'price_per_million': price.price_per_million
        } for price in TokenPrice.objects.filter(is_active=True)]
        
        return Response({
            'company_name': company.name,
            'has_subscription': company.has_subscription,
            'subscription_active': company.subscription_active,
            'subscription_end_date': company.subscription_end_date,
            'total_tokens_purchased': company.total_tokens_purchased,
            'tokens_consumed': company.tokens_consumed,
            'tokens_remaining': company.tokens_remaining,
            'last_token_reset': company.last_token_reset,
            'token_prices': token_prices
        })


class CompanyTokenPurchaseView(APIView):
    """Endpoint for requesting token purchases"""
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Request a token purchase for your company",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'tokens_requested': openapi.Schema(type=openapi.TYPE_INTEGER, description="Number of tokens to purchase"),
                'model_name': openapi.Schema(type=openapi.TYPE_STRING, description="Model for which to purchase tokens"),
                'notes': openapi.Schema(type=openapi.TYPE_STRING, description="Optional notes for the request")
            },
            required=['tokens_requested', 'model_name']
        ),
        responses={
            status.HTTP_201_CREATED: "Purchase request submitted",
            status.HTTP_400_BAD_REQUEST: "Invalid request",
            status.HTTP_403_FORBIDDEN: "Not allowed to purchase tokens",
            status.HTTP_404_NOT_FOUND: "Company or price not found"
        }
    )
    def post(self, request):
        """Submit a token purchase request"""
        # Get the user's company
        companies = request.user.companies.filter(is_active=True)
        if not companies:
            return error_response('No active company found for this user', status.HTTP_404_NOT_FOUND)
        
        company = companies.first()
        
        # Verify the company has an active subscription
        if not company.subscription_active:
            return error_response(
                'Your company needs an active subscription to purchase tokens', 
                status.HTTP_403_FORBIDDEN
            )
        
        # Get request parameters
        tokens_requested = request.data.get('tokens_requested')
        model_name = request.data.get('model_name')
        notes = request.data.get('notes', '')
        
        # Validate parameters
        try:
            tokens_requested = int(tokens_requested)
            if tokens_requested <= 0:
                return error_response('Token amount must be positive', status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError):
            return error_response('Invalid token amount', status.HTTP_400_BAD_REQUEST)
        
        # Get the price for the model
        try:
            price = TokenPrice.objects.get(model_name=model_name, is_active=True)
        except TokenPrice.DoesNotExist:
            return error_response(f'No active price found for model {model_name}', status.HTTP_404_NOT_FOUND)
        
        # Calculate price
        millions = Decimal(tokens_requested) / Decimal(1000000)
        total_price = millions * price.price_per_million
        
        # Create purchase request
        purchase_request = TokenPurchaseRequest.objects.create(
            company=company,
            requested_by=request.user,
            tokens_requested=tokens_requested,
            price_per_million=price.price_per_million,
            total_price=total_price,
            notes=notes
        )
        
        return Response({
            'request_id': purchase_request.id,
            'company_name': company.name,
            'tokens_requested': tokens_requested,
            'price_per_million': price.price_per_million,
            'total_price': total_price,
            'status': 'pending',
            'request_date': purchase_request.request_date
        }, status=status.HTTP_201_CREATED)


class CompanyPurchaseHistoryView(APIView):
    """Endpoint for viewing company token purchase history"""
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Get token purchase history for your company",
        responses={
            status.HTTP_200_OK: "Company purchase history",
            status.HTTP_404_NOT_FOUND: "Company not found"
        }
    )
    def get(self, request):
        """Get token purchase history for the current user's company"""
        # Get the user's company
        companies = request.user.companies.filter(is_active=True)
        if not companies:
            return error_response('No active company found for this user', status.HTTP_404_NOT_FOUND)
        
        company = companies.first()
        
        # Get purchase history
        purchases = TokenPurchaseRequest.objects.filter(company=company).order_by('-request_date')
        
        purchase_data = [{
            'request_id': purchase.id,
            'tokens_requested': purchase.tokens_requested,
            'price_per_million': purchase.price_per_million,
            'total_price': purchase.total_price,
            'status': purchase.status,
            'request_date': purchase.request_date,
            'approval_date': purchase.approval_date,
            'notes': purchase.notes
        } for purchase in purchases]
        
        return Response({
            'company_name': company.name,
            'purchase_history': purchase_data
        })
