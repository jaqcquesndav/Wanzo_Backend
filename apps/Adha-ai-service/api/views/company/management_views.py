"""
Company management views for managing companies, their users, and token usage.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.contrib.auth.models import User
from django.db.models import Sum, Count, Q
from django.db import transaction
from django.utils import timezone
from datetime import timedelta

from api.models import Company, UserProfile, TokenUsage
from api.serializers import CompanySerializer, UserSerializer, TokenUsageSerializer
from api.permissions import IsCompanyOwner, IsCompanyMember, IsAdminUser
from ..utils import error_response

class CompanyListCreateView(APIView):
    """
    Endpoint for listing and creating companies.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Get list of companies the user has access to",
        responses={
            status.HTTP_200_OK: CompanySerializer(many=True),
            status.HTTP_403_FORBIDDEN: "Permission denied"
        }
    )
    def get(self, request):
        """Get companies the authenticated user has access to."""
        # Different handling for admins vs. regular users
        is_admin = hasattr(request.user, 'profile') and request.user.profile.user_type == 'admin'
        
        if is_admin:
            # Admins can see all companies
            companies = Company.objects.all().order_by('name')
        else:
            # Regular users can only see companies they are members of
            companies = request.user.companies.all().order_by('name')
            
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Create a new company",
        request_body=CompanySerializer,
        responses={
            status.HTTP_201_CREATED: CompanySerializer,
            status.HTTP_400_BAD_REQUEST: "Invalid data"
        }
    )
    def post(self, request):
        """Create a new company with the authenticated user as owner."""
        serializer = CompanySerializer(data=request.data)
        if serializer.is_valid():
            # Create company with current user as owner
            company = serializer.save(owner=request.user)
            
            # Add current user as employee
            company.employees.add(request.user)
            
            # Update user profile
            if hasattr(request.user, 'profile'):
                profile = request.user.profile
                profile.company_name = company.name
                profile.save()
            
            return Response(CompanySerializer(company).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CompanyDetailView(APIView):
    """
    Endpoint for retrieving, updating, and deleting a specific company.
    """
    permission_classes = [IsAuthenticated, IsCompanyMember]
    
    def get_company(self, pk):
        try:
            company = Company.objects.get(pk=pk)
            self.check_object_permissions(self.request, company)
            return company
        except Company.DoesNotExist:
            return None
    
    @swagger_auto_schema(
        operation_description="Get company details",
        responses={
            status.HTTP_200_OK: CompanySerializer,
            status.HTTP_404_NOT_FOUND: "Company not found",
            status.HTTP_403_FORBIDDEN: "Permission denied"
        }
    )
    def get(self, request, pk):
        """Get details of a specific company."""
        company = self.get_company(pk)
        if not company:
            return Response(
                {"error": "Company not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = CompanySerializer(company)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Update company details",
        request_body=CompanySerializer,
        responses={
            status.HTTP_200_OK: CompanySerializer,
            status.HTTP_400_BAD_REQUEST: "Invalid data",
            status.HTTP_404_NOT_FOUND: "Company not found",
            status.HTTP_403_FORBIDDEN: "Permission denied"
        }
    )
    def put(self, request, pk):
        """Update company details (owner or admin only)."""
        company = self.get_company(pk)
        if not company:
            return Response(
                {"error": "Company not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is owner or admin
        is_owner = company.owner == request.user
        is_admin = hasattr(request.user, 'profile') and request.user.profile.user_type == 'admin'
        
        if not (is_owner or is_admin):
            return Response(
                {"error": "Only company owners or administrators can update company details"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = CompanySerializer(company, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @swagger_auto_schema(
        operation_description="Delete company",
        responses={
            status.HTTP_204_NO_CONTENT: "Company deleted",
            status.HTTP_404_NOT_FOUND: "Company not found",
            status.HTTP_403_FORBIDDEN: "Permission denied"
        }
    )
    def delete(self, request, pk):
        """Delete a company (owner or admin only)."""
        company = self.get_company(pk)
        if not company:
            return Response(
                {"error": "Company not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is owner or admin
        is_owner = company.owner == request.user
        is_admin = hasattr(request.user, 'profile') and request.user.profile.user_type == 'admin'
        
        if not (is_owner or is_admin):
            return Response(
                {"error": "Only company owners or administrators can delete companies"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        company.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class CompanyUsersView(APIView):
    """
    Endpoint for managing users in a company.
    """
    permission_classes = [IsAuthenticated, IsCompanyMember]
    
    def get_company(self, pk):
        try:
            company = Company.objects.get(pk=pk)
            self.check_object_permissions(self.request, company)
            return company
        except Company.DoesNotExist:
            return None
    
    @swagger_auto_schema(
        operation_description="List users in a company",
        responses={
            status.HTTP_200_OK: UserSerializer(many=True),
            status.HTTP_404_NOT_FOUND: "Company not found",
            status.HTTP_403_FORBIDDEN: "Permission denied"
        }
    )
    def get(self, request, pk):
        """Get all users in a specific company."""
        company = self.get_company(pk)
        if not company:
            return Response(
                {"error": "Company not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        users = company.employees.all()
        serializer = UserSerializer(users, many=True, context={'request': request})
        
        # Enhance with ownership information
        enhanced_data = []
        for user_data in serializer.data:
            is_owner = company.owner_id == user_data['id']
            enhanced_data.append({**user_data, 'is_owner': is_owner})
        
        return Response(enhanced_data)
    
    @swagger_auto_schema(
        operation_description="Add a user to company",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING, description='User email'),
            },
            required=['email']
        ),
        responses={
            status.HTTP_200_OK: "User added successfully",
            status.HTTP_400_BAD_REQUEST: "Invalid data",
            status.HTTP_404_NOT_FOUND: "Company or user not found",
            status.HTTP_403_FORBIDDEN: "Permission denied"
        }
    )
    def post(self, request, pk):
        """Add a user to a company (owner only)."""
        company = self.get_company(pk)
        if not company:
            return Response(
                {"error": "Company not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is owner or admin
        is_owner = company.owner == request.user
        is_admin = hasattr(request.user, 'profile') and request.user.profile.user_type == 'admin'
        
        if not (is_owner or is_admin):
            return Response(
                {"error": "Only company owners or administrators can add users"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        email = request.data.get('email')
        if not email:
            return Response(
                {"error": "Email is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Find user by email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": f"No user with email {email} found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Check if user is already in company
        if company.employees.filter(id=user.id).exists():
            return Response(
                {"error": "User already belongs to this company"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Add user to company
        company.employees.add(user)
        
        # Update user profile
        if hasattr(user, 'profile'):
            profile = user.profile
            profile.company_name = company.name
            profile.save()
            
        return Response(
            {"message": f"User {email} added to company successfully"}, 
            status=status.HTTP_200_OK
        )

class RemoveCompanyUserView(APIView):
    """
    Endpoint for removing a user from a company.
    """
    permission_classes = [IsAuthenticated, IsCompanyMember]
    
    def get_company(self, pk):
        try:
            company = Company.objects.get(pk=pk)
            self.check_object_permissions(self.request, company)
            return company
        except Company.DoesNotExist:
            return None
    
    @swagger_auto_schema(
        operation_description="Remove a user from company",
        responses={
            status.HTTP_200_OK: "User removed successfully",
            status.HTTP_400_BAD_REQUEST: "Cannot remove company owner",
            status.HTTP_404_NOT_FOUND: "Company or user not found",
            status.HTTP_403_FORBIDDEN: "Permission denied"
        }
    )
    def delete(self, request, pk, user_id):
        """Remove a user from a company (owner or admin only)."""
        company = self.get_company(pk)
        if not company:
            return Response(
                {"error": "Company not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is owner or admin
        is_owner = company.owner == request.user
        is_admin = hasattr(request.user, 'profile') and request.user.profile.user_type == 'admin'
        
        if not (is_owner or is_admin):
            return Response(
                {"error": "Only company owners or administrators can remove users"}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Find user
        try:
            user_to_remove = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Can't remove the company owner
        if company.owner == user_to_remove:
            return Response(
                {"error": "Cannot remove the company owner. Transfer ownership first."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Check if user is in company
        if not company.employees.filter(id=user_to_remove.id).exists():
            return Response(
                {"error": "User is not a member of this company"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Remove user from company
        company.employees.remove(user_to_remove)
            
        return Response(
            {"message": f"User removed from company successfully"}, 
            status=status.HTTP_200_OK
        )

class TransferCompanyOwnershipView(APIView):
    """
    Endpoint for transferring company ownership to another user.
    """
    permission_classes = [IsAuthenticated, IsCompanyOwner]
    
    def get_company(self, pk):
        try:
            company = Company.objects.get(pk=pk)
            self.check_object_permissions(self.request, company)
            return company
        except Company.DoesNotExist:
            return None
    
    @swagger_auto_schema(
        operation_description="Transfer company ownership to another user",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'new_owner_id': openapi.Schema(type=openapi.TYPE_INTEGER, description='New owner user ID'),
            },
            required=['new_owner_id']
        ),
        responses={
            status.HTTP_200_OK: "Ownership transferred successfully",
            status.HTTP_400_BAD_REQUEST: "Invalid data",
            status.HTTP_404_NOT_FOUND: "Company or user not found",
            status.HTTP_403_FORBIDDEN: "Permission denied"
        }
    )
    def post(self, request, pk):
        """Transfer company ownership to another user (current owner only)."""
        company = self.get_company(pk)
        if not company:
            return Response(
                {"error": "Company not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        new_owner_id = request.data.get('new_owner_id')
        if not new_owner_id:
            return Response(
                {"error": "New owner ID is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Find new owner
        try:
            new_owner = User.objects.get(id=new_owner_id)
        except User.DoesNotExist:
            return Response(
                {"error": "New owner not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
        # Check if new owner is in company
        if not company.employees.filter(id=new_owner.id).exists():
            return Response(
                {"error": "New owner must be a member of the company"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # Transfer ownership
        company.owner = new_owner
        company.save()
            
        return Response(
            {
                "message": "Company ownership transferred successfully", 
                "new_owner": {
                    "id": new_owner.id,
                    "email": new_owner.email,
                    "name": new_owner.get_full_name()
                }
            }, 
            status=status.HTTP_200_OK
        )

class CompanyTokenUsageView(APIView):
    """
    Endpoint for viewing company token usage.
    """
    permission_classes = [IsAuthenticated, IsCompanyMember]
    
    def get_company(self, pk):
        try:
            company = Company.objects.get(pk=pk)
            self.check_object_permissions(self.request, company)
            return company
        except Company.DoesNotExist:
            return None
    
    @swagger_auto_schema(
        operation_description="Get token usage for a company",
        manual_parameters=[
            openapi.Parameter(
                name="period",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                required=False,
                description="Time period for stats: 'today', 'week', 'month', 'all'",
                default='month'
            )
        ],
        responses={
            status.HTTP_200_OK: "Token usage statistics",
            status.HTTP_404_NOT_FOUND: "Company not found",
            status.HTTP_403_FORBIDDEN: "Permission denied"
        }
    )
    def get(self, request, pk):
        """Get token usage statistics for a company."""
        company = self.get_company(pk)
        if not company:
            return Response(
                {"error": "Company not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get time period from query params
        period = request.query_params.get('period', 'month')
        
        # Calculate date range based on period
        now = timezone.now()
        if period == 'today':
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == 'week':
            start_date = now - timedelta(days=now.weekday(), weeks=0)
            start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == 'month':
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        else:  # 'all' or any other value
            start_date = None
        
        # Get users belonging to this company
        company_user_ids = company.employees.values_list('id', flat=True)
        
        # Base query for token usage
        usage_query = TokenUsage.objects.filter(user_id__in=company_user_ids)
        
        # Apply date filter if applicable
        if start_date:
            usage_query = usage_query.filter(timestamp__gte=start_date)
        
        # Aggregate statistics
        total_tokens = usage_query.aggregate(
            total_prompt_tokens=Sum('prompt_tokens'),
            total_completion_tokens=Sum('completion_tokens'),
            total_tokens=Sum('total_tokens')
        )
        
        # Get usage by model
        usage_by_model = usage_query.values('model').annotate(
            prompt_tokens=Sum('prompt_tokens'),
            completion_tokens=Sum('completion_tokens'),
            total_tokens=Sum('total_tokens'),
            count=Count('id')
        ).order_by('-total_tokens')
        
        # Get usage by user
        usage_by_user = usage_query.values('user_id').annotate(
            prompt_tokens=Sum('prompt_tokens'),
            completion_tokens=Sum('completion_tokens'),
            total_tokens=Sum('total_tokens'),
            count=Count('id')
        ).order_by('-total_tokens')
        
        # Enhance user data with names
        enhanced_user_usage = []
        for usage in usage_by_user:
            try:
                user = User.objects.get(id=usage['user_id'])
                enhanced_user_usage.append({
                    'user_id': usage['user_id'],
                    'email': user.email,
                    'name': user.get_full_name(),
                    'prompt_tokens': usage['prompt_tokens'],
                    'completion_tokens': usage['completion_tokens'],
                    'total_tokens': usage['total_tokens'],
                    'count': usage['count']
                })
            except User.DoesNotExist:
                # Skip if user doesn't exist
                pass
                
        # Prepare response
        response_data = {
            'period': period,
            'company': {
                'id': company.id,
                'name': company.name,
                'token_quota': getattr(company, 'token_quota', None)
            },
            'total_stats': {
                'prompt_tokens': total_tokens['total_prompt_tokens'] or 0,
                'completion_tokens': total_tokens['total_completion_tokens'] or 0,
                'total_tokens': total_tokens['total_tokens'] or 0
            },
            'usage_by_model': list(usage_by_model),
            'usage_by_user': enhanced_user_usage
        }
        
        return Response(response_data)

class CompanySettingsView(APIView):
    """
    Endpoint for managing company settings.
    """
    permission_classes = [IsAuthenticated, IsCompanyMember]
    
    def get_company(self, pk):
        try:
            company = Company.objects.get(pk=pk)
            self.check_object_permissions(self.request, company)
            return company
        except Company.DoesNotExist:
            return None
    
    @swagger_auto_schema(
        operation_description="Get company settings",
        responses={
            status.HTTP_200_OK: "Company settings",
            status.HTTP_404_NOT_FOUND: "Company not found",
            status.HTTP_403_FORBIDDEN: "Permission denied"
        }
    )
    def get(self, request, pk):
        """Get settings for a specific company."""
        company = self.get_company(pk)
        if not company:
            return Response(
                {"error": "Company not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Collect settings from the company model and any other sources
        settings = {
            'company_id': company.id,
            'company_name': company.name,
            'token_quota': getattr(company, 'token_quota', 0),
            'default_language': getattr(company, 'default_language', 'fr'),
            'allowed_features': getattr(company, 'allowed_features', {})
        }
        
        return Response(settings)
    
    @swagger_auto_schema(
        operation_description="Update company settings",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'default_language': openapi.Schema(type=openapi.TYPE_STRING, description='Default language'),
                'allowed_features': openapi.Schema(type=openapi.TYPE_OBJECT, description='Allowed features'),
                # Add other settings as needed
            }
        ),
        responses={
            status.HTTP_200_OK: "Settings updated",
            status.HTTP_400_BAD_REQUEST: "Invalid data",
            status.HTTP_404_NOT_FOUND: "Company not found",
            status.HTTP_403_FORBIDDEN: "Permission denied"
        }
    )
    def put(self, request, pk):
        """Update settings for a specific company (owner or admin only)."""
        company = self.get_company(pk)
        if not company:
            return Response(
                {"error": "Company not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user is owner or admin
        is_owner = company.owner == request.user
        is_admin = hasattr(request.user, 'profile') and request.user.profile.user_type == 'admin'
        
        if not (is_owner or is_admin):
            return Response(
                {"error": "Only company owners or administrators can update settings"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update settings
        if 'default_language' in request.data:
            company.default_language = request.data['default_language']
        
        if 'allowed_features' in request.data:
            company.allowed_features = request.data['allowed_features']
        
        # Add logic for other settings as needed
        
        company.save()
        
        return Response({
            'message': 'Company settings updated successfully',
            'company_id': company.id
        })
