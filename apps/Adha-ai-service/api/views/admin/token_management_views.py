from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.utils import timezone

from api.models import Company, TokenPurchaseRequest, TokenPrice, TokenUsage
from ..utils import error_response

class TokenPriceManagementView(APIView):
    """
    Admin endpoint for managing token pricing.
    """
    permission_classes = [IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="Create or update token price",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'price_per_million': openapi.Schema(type=openapi.TYPE_NUMBER, description='Price per million tokens'),
                'currency': openapi.Schema(type=openapi.TYPE_STRING, description='Currency code (e.g., EUR, USD)')
            },
            required=['price_per_million']
        ),
        responses={
            status.HTTP_201_CREATED: openapi.Response(description="Price updated successfully"),
            status.HTTP_400_BAD_REQUEST: openapi.Response(description="Invalid data")
        }
    )
    def post(self, request):
        """Create a new token price."""
        try:
            price = request.data.get('price_per_million')
            currency = request.data.get('currency', 'EUR')
            
            if not price or price <= 0:
                return Response(
                    {"error": "Price must be a positive number"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Deactivate all current prices
            TokenPrice.objects.filter(is_active=True).update(is_active=False)
            
            # Create new active price
            new_price = TokenPrice.objects.create(
                price_per_million=price,
                currency=currency,
                effective_from=timezone.now(),
                is_active=True
            )
            
            return Response({
                'id': new_price.id,
                'price_per_million': float(new_price.price_per_million),
                'currency': new_price.currency,
                'effective_from': new_price.effective_from,
                'message': 'Token price updated successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return error_response(f"Error updating token price: {str(e)}")
    
    @swagger_auto_schema(
        operation_description="Get current token price",
        responses={
            status.HTTP_200_OK: openapi.Response(description="Current price retrieved"),
            status.HTTP_404_NOT_FOUND: openapi.Response(description="No price set")
        }
    )
    def get(self, request):
        """Get the current token price."""
        try:
            current_price = TokenPrice.get_current_price()
            if not current_price:
                return Response(
                    {"error": "No token price has been set"}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Get price history
            price_history = TokenPrice.objects.all().order_by('-effective_from')[:10]
            history_data = [{
                'id': price.id,
                'price_per_million': float(price.price_per_million),
                'currency': price.currency,
                'effective_from': price.effective_from,
                'is_active': price.is_active
            } for price in price_history]
            
            return Response({
                'current_price': {
                    'id': current_price.id,
                    'price_per_million': float(current_price.price_per_million),
                    'currency': current_price.currency,
                    'effective_from': current_price.effective_from
                },
                'price_history': history_data
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return error_response(f"Error retrieving token price: {str(e)}")

class TokenPurchaseApprovalView(APIView):
    """
    Admin endpoint for approving token purchase requests.
    """
    permission_classes = [IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="List all token purchase requests",
        responses={
            status.HTTP_200_OK: openapi.Response(description="Purchase requests retrieved")
        }
    )
    def get(self, request):
        """List all token purchase requests."""
        try:
            # Get request status filter if provided
            status_filter = request.query_params.get('status', None)
            
            # Base query
            requests_query = TokenPurchaseRequest.objects.all().order_by('-request_date')
            
            # Apply status filter if provided
            if status_filter:
                requests_query = requests_query.filter(status=status_filter)
            
            # Format the response
            requests = []
            for req in requests_query:
                request_data = {
                    'id': req.id,
                    'company': {
                        'id': req.company.id,
                        'name': req.company.name
                    },
                    'requested_by': {
                        'id': req.requested_by.id if req.requested_by else None,
                        'email': req.requested_by.email if req.requested_by else None,
                        'name': req.requested_by.get_full_name() if req.requested_by else None
                    },
                    'tokens_requested': req.tokens_requested,
                    'price_per_million': float(req.price_per_million),
                    'total_price': float(req.total_price),
                    'currency': req.currency,
                    'payment_method': req.payment_method,
                    'payment_reference': req.payment_reference,
                    'status': req.status,
                    'request_date': req.request_date,
                }
                
                # Add admin details if request has been processed
                if req.processed_date:
                    request_data['processed'] = {
                        'date': req.processed_date,
                        'by': {
                            'id': req.processed_by.id if req.processed_by else None,
                            'name': req.processed_by.get_full_name() if req.processed_by else None
                        },
                        'notes': req.admin_notes
                    }
                
                requests.append(request_data)
            
            return Response(requests, status=status.HTTP_200_OK)
            
        except Exception as e:
            return error_response(f"Error retrieving token purchase requests: {str(e)}")
    
    @swagger_auto_schema(
        operation_description="Process a token purchase request (approve/reject/complete)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'action': openapi.Schema(type=openapi.TYPE_STRING, description='Action to take (approve/reject/complete)'),
                'notes': openapi.Schema(type=openapi.TYPE_STRING, description='Admin notes')
            },
            required=['action']
        ),
        responses={
            status.HTTP_200_OK: openapi.Response(description="Request processed successfully"),
            status.HTTP_400_BAD_REQUEST: openapi.Response(description="Invalid action or request"),
            status.HTTP_404_NOT_FOUND: openapi.Response(description="Request not found")
        }
    )
    def post(self, request, request_id):
        """Process a token purchase request."""
        try:
            # Get the purchase request
            purchase_request = TokenPurchaseRequest.objects.get(id=request_id)
            
            # Get action to take
            action = request.data.get('action')
            notes = request.data.get('notes', '')
            
            if action == 'approve':
                # Approve the request
                purchase_request.approve(request.user, notes)
                message = 'Purchase request approved'
                
            elif action == 'complete':
                # Complete the request and add tokens to company
                purchase_request.complete(request.user, notes)
                message = f'Purchase completed. {purchase_request.tokens_requested} tokens added to {purchase_request.company.name}.'
                
            elif action == 'reject':
                # Reject the request
                purchase_request.reject(request.user, notes)
                message = 'Purchase request rejected'
                
            else:
                return Response(
                    {"error": "Invalid action. Use 'approve', 'complete', or 'reject'."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                'message': message,
                'request_id': purchase_request.id,
                'status': purchase_request.status,
                'processed_by': request.user.get_full_name(),
                'processed_date': purchase_request.processed_date
            }, status=status.HTTP_200_OK)
            
        except TokenPurchaseRequest.DoesNotExist:
            return Response(
                {"error": f"Purchase request with ID {request_id} not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return error_response(f"Error processing purchase request: {str(e)}")

class CompanySubscriptionManagementView(APIView):
    """
    Admin endpoint for managing company subscriptions.
    """
    permission_classes = [IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="Update a company's subscription status",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'is_active': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='Activate/deactivate subscription'),
                'renew': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='Renew subscription with token reset'),
                'token_adjustment': openapi.Schema(type=openapi.TYPE_INTEGER, description='Tokens to add/remove (can be negative)')
            }
        ),
        responses={
            status.HTTP_200_OK: openapi.Response(description="Subscription updated"),
            status.HTTP_404_NOT_FOUND: openapi.Response(description="Company not found")
        }
    )
    def post(self, request, company_id):
        """Update a company's subscription status."""
        try:
            # Get the company
            company = Company.objects.get(id=company_id)
            
            # Process activation/deactivation
            if 'is_active' in request.data:
                company.is_subscription_active = request.data.get('is_active')
            
            # Process renewal if requested
            if request.data.get('renew', False):
                new_renewal_date = company.renew_subscription()
                renewal_message = f"Subscription renewed until {new_renewal_date}"
            else:
                renewal_message = "No renewal performed"
            
            # Process token adjustment if provided
            token_adjustment = request.data.get('token_adjustment', 0)
            if token_adjustment != 0:
                company.token_quota += token_adjustment
                # Ensure token quota doesn't go negative
                company.token_quota = max(0, company.token_quota)
            
            # Save changes
            company.save()
            
            return Response({
                'company_id': company.id,
                'company_name': company.name,
                'subscription': {
                    'is_active': company.is_subscription_active,
                    'renewal_date': company.subscription_renewal_date,
                    'renewal_message': renewal_message
                },
                'tokens': {
                    'quota': company.token_quota,
                    'monthly_allowance': company.monthly_token_allowance,
                    'adjustment': token_adjustment
                },
                'message': 'Company subscription updated successfully'
            }, status=status.HTTP_200_OK)
            
        except Company.DoesNotExist:
            return Response(
                {"error": f"Company with ID {company_id} not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return error_response(f"Error updating company subscription: {str(e)}")
