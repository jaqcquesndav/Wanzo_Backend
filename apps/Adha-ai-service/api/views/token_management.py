"""
Views for token quota management and administration.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.utils import timezone
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Sum
from datetime import datetime, timedelta

from api.models.token_usage import UserTokenQuota, TokenUsage  # Updated from TokenQuota to UserTokenQuota
from api.models.token_purchase import TokenQuota as CompanyTokenQuota  # Import the company token quota with an alias

class TokenQuotaView(APIView):
    """
    Endpoint for users to check their token quota.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Get current user's token quota",
        responses={
            status.HTTP_200_OK: openapi.Response(description="Token quota retrieved successfully"),
            status.HTTP_404_NOT_FOUND: openapi.Response(description="Token quota not found")
        }
    )
    def get(self, request):
        try:
            # Try to get existing quota
            user_quota, created = UserTokenQuota.objects.get_or_create(
                user=request.user,
                defaults={
                    'max_tokens': 1000000,  # Default to 1M tokens
                    'tokens_used': 0,
                    'reset_frequency': 'monthly',
                    'next_reset': self._get_next_reset_date()
                }
            )
            
            # Check if reset is needed
            if user_quota.next_reset and user_quota.next_reset < timezone.now():
                user_quota.tokens_used = 0
                user_quota.next_reset = self._get_next_reset_date()
                user_quota.save()
            
            # Get company quota if available
            company_quota = None
            if hasattr(request.user, 'companies'):
                company = request.user.companies.first()
                if company:
                    company_quota = {
                        'token_quota': company.token_quota,
                        'monthly_allowance': company.monthly_token_allowance,
                        'is_subscription_active': company.is_subscription_active,
                        'subscription_renewal_date': company.subscription_renewal_date
                    }
            
            # Calculate recent usage
            current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            recent_usage = TokenUsage.objects.filter(
                user=request.user,
                timestamp__gte=current_month
            ).aggregate(
                total_tokens=Sum('total_tokens')
            )['total_tokens'] or 0
            
            return Response({
                'max_tokens': user_quota.max_tokens,
                'tokens_used': user_quota.tokens_used,
                'tokens_available': user_quota.get_available_tokens(),
                'reset_frequency': user_quota.reset_frequency,
                'next_reset': user_quota.next_reset,
                'recently_used': recent_usage,
                'company_quota': company_quota
            })
        except Exception as e:
            return Response(
                {"error": f"Error retrieving token quota: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @swagger_auto_schema(
        operation_description="Update user's token quota (admin only)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'max_tokens': openapi.Schema(type=openapi.TYPE_INTEGER, description='Maximum tokens allowed'),
                'tokens_used': openapi.Schema(type=openapi.TYPE_INTEGER, description='Tokens already used'),
                'reset_frequency': openapi.Schema(type=openapi.TYPE_STRING, description='Reset frequency (daily/weekly/monthly/never)')
            },
        ),
        responses={
            status.HTTP_200_OK: openapi.Response(description="Token quota updated successfully"),
            status.HTTP_400_BAD_REQUEST: openapi.Response(description="Invalid data"),
            status.HTTP_403_FORBIDDEN: openapi.Response(description="Not authorized")
        }
    )
    def put(self, request):
        # Only allow admins to update token quotas
        if not request.user.is_staff and not (hasattr(request.user, 'profile') and request.user.profile.user_type == 'admin'):
            return Response(
                {"error": "You are not authorized to update token quotas"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        try:
            user_quota, created = UserTokenQuota.objects.get_or_create(
                user=request.user,
                defaults={
                    'max_tokens': 1000000,
                    'tokens_used': 0,
                    'reset_frequency': 'monthly',
                    'next_reset': self._get_next_reset_date()
                }
            )
            
            if 'max_tokens' in request.data:
                user_quota.max_tokens = request.data['max_tokens']
                
            if 'tokens_used' in request.data:
                user_quota.tokens_used = request.data['tokens_used']
                
            if 'reset_frequency' in request.data:
                if request.data['reset_frequency'] in ['daily', 'weekly', 'monthly', 'never']:
                    user_quota.reset_frequency = request.data['reset_frequency']
                    user_quota.next_reset = self._get_next_reset_date(request.data['reset_frequency'])
                else:
                    return Response(
                        {"error": "Invalid reset_frequency. Use daily, weekly, monthly, or never."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
            user_quota.save()
            
            return Response({
                'max_tokens': user_quota.max_tokens,
                'tokens_used': user_quota.tokens_used,
                'tokens_available': user_quota.get_available_tokens(),
                'reset_frequency': user_quota.reset_frequency,
                'next_reset': user_quota.next_reset
            })
        except Exception as e:
            return Response(
                {"error": f"Error updating token quota: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    def _get_next_reset_date(self, frequency='monthly'):
        """Calculate the next reset date based on frequency."""
        now = timezone.now()
        
        if frequency == 'daily':
            return (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        elif frequency == 'weekly':
            days_until_monday = 7 - now.weekday()
            return (now + timedelta(days=days_until_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
        elif frequency == 'monthly':
            if now.month == 12:
                next_month = datetime(now.year + 1, 1, 1, tzinfo=now.tzinfo)
            else:
                next_month = datetime(now.year, now.month + 1, 1, tzinfo=now.tzinfo)
            return next_month
        else:
            # 'never' - set a far future date
            return now.replace(year=now.year + 10)

class AdminTokenQuotaView(APIView):
    """
    Admin endpoint for managing users' token quotas.
    """
    permission_classes = [IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="Get token quota for a specific user or all users",
        responses={
            status.HTTP_200_OK: openapi.Response(description="Token quotas retrieved successfully")
        }
    )
    def get(self, request, user_id=None):
        try:
            if user_id:
                # Get specific user
                try:
                    user = User.objects.get(id=user_id)
                    user_quota, created = UserTokenQuota.objects.get_or_create(
                        user=user,
                        defaults={
                            'max_tokens': 1000000,
                            'tokens_used': 0,
                            'reset_frequency': 'monthly',
                            'next_reset': self._get_next_reset_date()
                        }
                    )
                    
                    # Get month-to-date usage
                    current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    recent_usage = TokenUsage.objects.filter(
                        user=user,
                        timestamp__gte=current_month
                    ).aggregate(
                        total_tokens=Sum('total_tokens')
                    )['total_tokens'] or 0
                    
                    return Response({
                        'user_id': user.id,
                        'email': user.email,
                        'name': user.get_full_name() or user.username,
                        'max_tokens': user_quota.max_tokens,
                        'tokens_used': user_quota.tokens_used,
                        'tokens_available': user_quota.get_available_tokens(),
                        'reset_frequency': user_quota.reset_frequency,
                        'next_reset': user_quota.next_reset,
                        'mtd_usage': recent_usage
                    })
                except User.DoesNotExist:
                    return Response(
                        {"error": f"User with ID {user_id} not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                # List all users with their quotas
                users = User.objects.all()
                results = []
                
                for user in users:
                    try:
                        user_quota = UserTokenQuota.objects.get(user=user)
                    except UserTokenQuota.DoesNotExist:
                        user_quota = None
                    
                    # Get month-to-date usage
                    current_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                    recent_usage = TokenUsage.objects.filter(
                        user=user,
                        timestamp__gte=current_month
                    ).aggregate(
                        total_tokens=Sum('total_tokens')
                    )['total_tokens'] or 0
                    
                    results.append({
                        'user_id': user.id,
                        'email': user.email,
                        'name': user.get_full_name() or user.username,
                        'max_tokens': user_quota.max_tokens if user_quota else 0,
                        'tokens_used': user_quota.tokens_used if user_quota else 0,
                        'tokens_available': user_quota.get_available_tokens() if user_quota else 0,
                        'reset_frequency': user_quota.reset_frequency if user_quota else 'monthly',
                        'next_reset': user_quota.next_reset if user_quota else None,
                        'mtd_usage': recent_usage
                    })
                
                return Response(results)
        except Exception as e:
            return Response(
                {"error": f"Error retrieving token quotas: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @swagger_auto_schema(
        operation_description="Update a user's token quota",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'max_tokens': openapi.Schema(type=openapi.TYPE_INTEGER, description='Maximum tokens allowed'),
                'tokens_used': openapi.Schema(type=openapi.TYPE_INTEGER, description='Tokens already used'),
                'reset_frequency': openapi.Schema(type=openapi.TYPE_STRING, description='Reset frequency (daily/weekly/monthly/never)'),
                'reset_now': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='Whether to reset token usage now')
            },
        ),
        responses={
            status.HTTP_200_OK: openapi.Response(description="Token quota updated successfully"),
            status.HTTP_400_BAD_REQUEST: openapi.Response(description="Invalid data"),
            status.HTTP_404_NOT_FOUND: openapi.Response(description="User not found")
        }
    )
    def put(self, request, user_id):
        try:
            # Get user
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                return Response(
                    {"error": f"User with ID {user_id} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Get or create quota
            user_quota, created = UserTokenQuota.objects.get_or_create(
                user=user,
                defaults={
                    'max_tokens': 1000000,
                    'tokens_used': 0,
                    'reset_frequency': 'monthly',
                    'next_reset': self._get_next_reset_date()
                }
            )
            
            # Update fields
            if 'max_tokens' in request.data:
                user_quota.max_tokens = request.data['max_tokens']
                
            if 'tokens_used' in request.data:
                user_quota.tokens_used = request.data['tokens_used']
                
            if 'reset_frequency' in request.data:
                if request.data['reset_frequency'] in ['daily', 'weekly', 'monthly', 'never']:
                    user_quota.reset_frequency = request.data['reset_frequency']
                    user_quota.next_reset = self._get_next_reset_date(request.data['reset_frequency'])
                else:
                    return Response(
                        {"error": "Invalid reset_frequency. Use daily, weekly, monthly, or never."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Reset tokens if requested
            if request.data.get('reset_now'):
                user_quota.tokens_used = 0
                user_quota.next_reset = self._get_next_reset_date(user_quota.reset_frequency)
                
            user_quota.save()
            
            return Response({
                'user_id': user.id,
                'email': user.email,
                'name': user.get_full_name() or user.username,
                'max_tokens': user_quota.max_tokens,
                'tokens_used': user_quota.tokens_used,
                'tokens_available': user_quota.get_available_tokens(),
                'reset_frequency': user_quota.reset_frequency,
                'next_reset': user_quota.next_reset,
                'message': 'Token quota updated successfully'
            })
        except Exception as e:
            return Response(
                {"error": f"Error updating token quota: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _get_next_reset_date(self, frequency='monthly'):
        """Calculate the next reset date based on frequency."""
        now = timezone.now()
        
        if frequency == 'daily':
            return (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        elif frequency == 'weekly':
            days_until_monday = 7 - now.weekday()
            return (now + timedelta(days=days_until_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
        elif frequency == 'monthly':
            if now.month == 12:
                next_month = datetime(now.year + 1, 1, 1, tzinfo=now.tzinfo)
            else:
                next_month = datetime(now.year, now.month + 1, 1, tzinfo=now.tzinfo)
            return next_month
        else:
            # 'never' - set a far future date
            return now.replace(year=now.year + 10)
