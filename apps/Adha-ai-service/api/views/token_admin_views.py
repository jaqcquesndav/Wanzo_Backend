"""
Views for admin token management including price configuration and purchase approval
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAdminUser
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.utils import timezone

from api.models.token_price import TokenPrice
from api.models.token_purchase import TokenPurchaseRequest
from api.models.company import Company
from .utils import error_response

class TokenPriceView(generics.ListCreateAPIView):
    """Admin endpoint for managing token prices per model"""
    permission_classes = [IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="List all token prices by model",
        responses={
            status.HTTP_200_OK: "List of token prices",
        }
    )
    def get(self, request):
        """Get all token prices"""
        prices = TokenPrice.objects.all().order_by('model_name')
        data = [{
            'id': price.id,
            'model_name': price.model_name,
            'price_per_million': price.price_per_million,
            'is_active': price.is_active,
            'updated_at': price.updated_at
        } for price in prices]
        return Response(data)
    
    @swagger_auto_schema(
        operation_description="Create or update token price for a model",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'model_name': openapi.Schema(type=openapi.TYPE_STRING),
                'price_per_million': openapi.Schema(type=openapi.TYPE_NUMBER),
                'is_active': openapi.Schema(type=openapi.TYPE_BOOLEAN)
            },
            required=['model_name', 'price_per_million']
        ),
        responses={
            status.HTTP_201_CREATED: "Token price created or updated",
            status.HTTP_400_BAD_REQUEST: "Invalid data"
        }
    )
    def post(self, request):
        """Create or update token price"""
        model_name = request.data.get('model_name')
        price = request.data.get('price_per_million')
        is_active = request.data.get('is_active', True)
        
        if not model_name or not price:
            return error_response('Model name and price are required', status.HTTP_400_BAD_REQUEST)
        
        # Update or create the price
        token_price, created = TokenPrice.objects.update_or_create(
            model_name=model_name,
            defaults={'price_per_million': price, 'is_active': is_active}
        )
        
        return Response({
            'id': token_price.id,
            'model_name': token_price.model_name,
            'price_per_million': token_price.price_per_million,
            'is_active': token_price.is_active,
            'updated_at': token_price.updated_at,
            'created': created
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class TokenPurchaseRequestListView(generics.ListAPIView):
    """Admin endpoint for listing token purchase requests"""
    permission_classes = [IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="List all token purchase requests",
        manual_parameters=[
            openapi.Parameter(
                name="status", 
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Filter by status (pending, approved, rejected, cancelled)"
            ),
        ],
        responses={
            status.HTTP_200_OK: "List of token purchase requests",
        }
    )
    def get(self, request):
        """Get all token purchase requests with optional status filter"""
        status_filter = request.query_params.get('status')
        
        requests = TokenPurchaseRequest.objects.all()
        if status_filter:
            requests = requests.filter(status=status_filter)
            
        requests = requests.order_by('-request_date')
        
        data = [{
            'id': req.id,
            'company': {
                'id': req.company.id,
                'name': req.company.name
            },
            'requested_by': {
                'id': req.requested_by.id,
                'name': f"{req.requested_by.first_name} {req.requested_by.last_name}",
                'email': req.requested_by.email
            } if req.requested_by else None,
            'tokens_requested': req.tokens_requested,
            'price_per_million': req.price_per_million,
            'total_price': req.total_price,
            'status': req.status,
            'request_date': req.request_date,
            'approval_date': req.approval_date,
            'notes': req.notes
        } for req in requests]
        
        return Response(data)


class TokenPurchaseApprovalView(APIView):
    """Admin endpoint for approving or rejecting token purchase requests"""
    permission_classes = [IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="Approve or reject a token purchase request",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'status': openapi.Schema(type=openapi.TYPE_STRING, enum=['approved', 'rejected']),
                'notes': openapi.Schema(type=openapi.TYPE_STRING)
            },
            required=['status']
        ),
        responses={
            status.HTTP_200_OK: "Request updated",
            status.HTTP_400_BAD_REQUEST: "Invalid data",
            status.HTTP_404_NOT_FOUND: "Request not found"
        }
    )
    def post(self, request, request_id):
        """Approve or reject a purchase request"""
        try:
            purchase_request = TokenPurchaseRequest.objects.get(id=request_id, status='pending')
        except TokenPurchaseRequest.DoesNotExist:
            return error_response('Token purchase request not found or not pending', status.HTTP_404_NOT_FOUND)
        
        new_status = request.data.get('status')
        notes = request.data.get('notes', '')
        
        if new_status not in ['approved', 'rejected']:
            return error_response('Status must be either "approved" or "rejected"', status.HTTP_400_BAD_REQUEST)
        
        # Update the request
        purchase_request.status = new_status
        purchase_request.notes = notes
        purchase_request.approved_by = request.user
        purchase_request.approval_date = timezone.now()
        
        # If approved, add tokens to the company's quota
        if new_status == 'approved':
            company = purchase_request.company
            company.total_tokens_purchased += purchase_request.tokens_requested
            company.save(update_fields=['total_tokens_purchased'])
        
        purchase_request.save()
        
        return Response({
            'id': purchase_request.id,
            'status': purchase_request.status,
            'approval_date': purchase_request.approval_date,
            'approved_by': f"{request.user.first_name} {request.user.last_name}",
            'notes': purchase_request.notes
        })


class CompanyTokenQuotaView(APIView):
    """Admin endpoint for managing company token quotas"""
    permission_classes = [IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="Get token quota for a company",
        responses={
            status.HTTP_200_OK: "Company token quota",
            status.HTTP_404_NOT_FOUND: "Company not found"
        }
    )
    def get(self, request, company_id):
        """Get token quota for a specific company"""
        try:
            company = Company.objects.get(id=company_id)
        except Company.DoesNotExist:
            return error_response('Company not found', status.HTTP_404_NOT_FOUND)
        
        # Reset monthly tokens if needed
        company.reset_monthly_tokens()
        
        return Response({
            'company_id': company.id,
            'company_name': company.name,
            'has_subscription': company.has_subscription,
            'subscription_active': company.subscription_active,
            'subscription_end_date': company.subscription_end_date,
            'total_tokens_purchased': company.total_tokens_purchased,
            'tokens_consumed': company.tokens_consumed,
            'tokens_remaining': company.tokens_remaining,
            'last_token_reset': company.last_token_reset
        })
    
    @swagger_auto_schema(
        operation_description="Update token quota for a company",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'add_tokens': openapi.Schema(type=openapi.TYPE_INTEGER, description="Number of tokens to add"),
                'set_tokens_consumed': openapi.Schema(type=openapi.TYPE_INTEGER, description="Set total consumed tokens"),
                'has_subscription': openapi.Schema(type=openapi.TYPE_BOOLEAN, description="Update subscription status"),
                'subscription_end_date': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATE, description="Update subscription end date")
            }
        ),
        responses={
            status.HTTP_200_OK: "Company token quota updated",
            status.HTTP_400_BAD_REQUEST: "Invalid data",
            status.HTTP_404_NOT_FOUND: "Company not found"
        }
    )
    def post(self, request, company_id):
        """Update token quota for a company"""
        try:
            company = Company.objects.get(id=company_id)
        except Company.DoesNotExist:
            return error_response('Company not found', status.HTTP_404_NOT_FOUND)
        
        # Process token updates
        if 'add_tokens' in request.data:
            try:
                add_tokens = int(request.data.get('add_tokens', 0))
                if add_tokens > 0:
                    company.total_tokens_purchased += add_tokens
            except (ValueError, TypeError):
                return error_response('add_tokens must be a positive integer', status.HTTP_400_BAD_REQUEST)
        
        if 'set_tokens_consumed' in request.data:
            try:
                tokens_consumed = int(request.data.get('set_tokens_consumed', 0))
                if tokens_consumed >= 0:
                    company.tokens_consumed = tokens_consumed
            except (ValueError, TypeError):
                return error_response('set_tokens_consumed must be a non-negative integer', status.HTTP_400_BAD_REQUEST)
        
        # Process subscription updates
        if 'has_subscription' in request.data:
            company.has_subscription = bool(request.data.get('has_subscription'))
        
        if 'subscription_end_date' in request.data:
            try:
                company.subscription_end_date = request.data.get('subscription_end_date')
            except Exception:
                return error_response('subscription_end_date must be a valid date (YYYY-MM-DD)', status.HTTP_400_BAD_REQUEST)
        
        company.save()
        
        return Response({
            'company_id': company.id,
            'company_name': company.name,
            'has_subscription': company.has_subscription,
            'subscription_active': company.subscription_active,
            'subscription_end_date': company.subscription_end_date,
            'total_tokens_purchased': company.total_tokens_purchased,
            'tokens_consumed': company.tokens_consumed,
            'tokens_remaining': company.tokens_remaining,
            'last_token_reset': company.last_token_reset
        })
