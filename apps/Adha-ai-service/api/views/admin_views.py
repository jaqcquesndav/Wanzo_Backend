"""
Views for administrator-only operations like user management.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAdminUser
from django.contrib.auth.models import User
from django.db.models import Q
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.utils import timezone

from api.serializers import UserSerializer, UserProfileSerializer
from api.models import Company, AdminAccessKey
from .utils import error_response

class AdminUserListView(generics.ListCreateAPIView):
    """Admin endpoint for listing all users and creating new ones."""
    permission_classes = [IsAdminUser]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by('-date_joined')
    
    @swagger_auto_schema(
        operation_description="List all users (admin only)",
        manual_parameters=[
            openapi.Parameter(
                name="search", 
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                description="Search by username, email, or name"
            ),
        ],
        responses={
            status.HTTP_200_OK: UserSerializer(many=True),
        }
    )
    def get(self, request, *args, **kwargs):
        search_query = request.query_params.get('search', '')
        if search_query:
            users = self.queryset.filter(
                Q(username__icontains=search_query) | 
                Q(email__icontains=search_query) |
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query)
            )
        else:
            users = self.queryset
            
        serializer = self.get_serializer(users, many=True)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Create a new user (admin only)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'email': openapi.Schema(type=openapi.TYPE_STRING),
                'password': openapi.Schema(type=openapi.TYPE_STRING),
                'first_name': openapi.Schema(type=openapi.TYPE_STRING),
                'last_name': openapi.Schema(type=openapi.TYPE_STRING),
                'is_staff': openapi.Schema(type=openapi.TYPE_BOOLEAN),
                'profile': openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'company_name': openapi.Schema(type=openapi.TYPE_STRING),
                        'company_type': openapi.Schema(type=openapi.TYPE_STRING),
                        'sector': openapi.Schema(type=openapi.TYPE_STRING)
                    }
                ),
                'company_id': openapi.Schema(type=openapi.TYPE_INTEGER, description="ID of existing company to associate")
            },
            required=['email', 'password']
        ),
        responses={
            status.HTTP_201_CREATED: UserSerializer(),
            status.HTTP_400_BAD_REQUEST: "Invalid data"
        }
    )
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')
        is_staff = request.data.get('is_staff', False)
        
        # Check for existing user
        if User.objects.filter(email=email).exists():
            return error_response('Email already exists', status.HTTP_400_BAD_REQUEST)
            
        # Create the user
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_staff=is_staff
        )
        
        # Process profile data
        profile_data = request.data.get('profile', {})
        if profile_data and hasattr(user, 'profile'):
            # Get the profile that was auto-created by the signal
            profile_serializer = UserProfileSerializer(user.profile, data=profile_data, partial=True)
            if profile_serializer.is_valid():
                profile_serializer.save()
            else:
                # If profile data is invalid, still create the user but return warnings
                return Response({
                    'user': UserSerializer(user).data,
                    'profile_warnings': profile_serializer.errors
                }, status=status.HTTP_201_CREATED)
        
        # Associate with company if specified
        company_id = request.data.get('company_id')
        if company_id:
            try:
                company = Company.objects.get(id=company_id)
                company.employees.add(user)
                
                # Also update the user profile
                if hasattr(user, 'profile'):
                    user.profile.company_name = company.name
                    user.profile.save()
            except Company.DoesNotExist:
                return Response({
                    'user': UserSerializer(user).data,
                    'warning': f'Company with ID {company_id} not found. User created without company association.'
                }, status=status.HTTP_201_CREATED)
        elif is_staff:
            # For admin users, associate with Kiota company by default
            try:
                kiota_company, created = Company.objects.get_or_create(
                    name="Kiota",
                    defaults={
                        'owner': user,
                        'registration_number': 'KIOTA-ADMIN',
                        'email': 'admin@kiota.ai'
                    }
                )
                kiota_company.employees.add(user)
                
                # Update the user profile
                if hasattr(user, 'profile'):
                    user.profile.company_name = "Kiota"
                    user.profile.save()
            except Exception as e:
                return Response({
                    'user': UserSerializer(user).data,
                    'warning': f'Error associating admin with Kiota company: {str(e)}'
                }, status=status.HTTP_201_CREATED)

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class AdminUserDetailView(APIView):
    """Admin endpoint for retrieving, updating or deleting a specific user."""
    permission_classes = [IsAdminUser]
    
    def get_object(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
    
    @swagger_auto_schema(
        operation_description="Get user details (admin only)",
        responses={
            status.HTTP_200_OK: UserSerializer(),
            status.HTTP_404_NOT_FOUND: "User not found"
        }
    )
    def get(self, request, user_id):
        user = self.get_object(user_id)
        if not user:
            return error_response('User not found', status.HTTP_404_NOT_FOUND)
        
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Update user details (admin only)",
        request_body=UserSerializer,
        responses={
            status.HTTP_200_OK: UserSerializer(),
            status.HTTP_400_BAD_REQUEST: "Invalid data",
            status.HTTP_404_NOT_FOUND: "User not found"
        }
    )
    def put(self, request, user_id):
        user = self.get_object(user_id)
        if not user:
            return error_response('User not found', status.HTTP_404_NOT_FOUND)
        
        # Update user fields
        user_data = {}
        if 'first_name' in request.data:
            user_data['first_name'] = request.data['first_name']
        if 'last_name' in request.data:
            user_data['last_name'] = request.data['last_name']
        if 'email' in request.data:
            user_data['email'] = request.data['email']
            user_data['username'] = request.data['email']  # Keep username in sync with email
        if 'is_staff' in request.data:
            user_data['is_staff'] = request.data['is_staff']
        
        if user_data:
            user_serializer = UserSerializer(user, data=user_data, partial=True)
            if user_serializer.is_valid():
                user_serializer.save()
            else:
                return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Update profile if included
        profile_data = request.data.get('profile')
        if profile_data and hasattr(user, 'profile'):
            profile_serializer = UserProfileSerializer(user.profile, data=profile_data, partial=True)
            if profile_serializer.is_valid():
                profile_serializer.save()
            else:
                return Response({
                    'user': UserSerializer(user).data,
                    'profile_errors': profile_serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        # Handle company association updates
        company_id = request.data.get('company_id')
        if company_id:
            try:
                # Remove from all current companies first
                user.companies.clear()
                
                # Add to the specified company
                company = Company.objects.get(id=company_id)
                company.employees.add(user)
                
                # Update the profile
                if hasattr(user, 'profile'):
                    user.profile.company_name = company.name
                    user.profile.save()
            except Company.DoesNotExist:
                return Response({
                    'user': UserSerializer(user).data,
                    'warning': f'Company with ID {company_id} not found. User company association not updated.'
                }, status=status.HTTP_200_OK)
        
        return Response(UserSerializer(user).data)
    
    @swagger_auto_schema(
        operation_description="Delete user (admin only)",
        responses={
            status.HTTP_204_NO_CONTENT: "User deleted successfully",
            status.HTTP_404_NOT_FOUND: "User not found"
        }
    )
    def delete(self, request, user_id):
        user = self.get_object(user_id)
        if not user:
            return error_response('User not found', status.HTTP_404_NOT_FOUND)
        
        # Don't allow admin to delete themselves
        if user == request.user:
            return error_response('Cannot delete your own admin account', status.HTTP_400_BAD_REQUEST)
        
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminCompanyListView(generics.ListCreateAPIView):
    """Admin endpoint for listing all companies and creating new ones."""
    permission_classes = [IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="List all companies (admin only)",
        responses={
            status.HTTP_200_OK: "List of companies",
        }
    )
    def get(self, request):
        from api.models import Company
        from api.serializers import CompanySerializer
        
        companies = Company.objects.all().order_by('name')
        serializer = CompanySerializer(companies, many=True)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Create a new company (admin only)",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'name': openapi.Schema(type=openapi.TYPE_STRING),
                'registration_number': openapi.Schema(type=openapi.TYPE_STRING),
                'vat_number': openapi.Schema(type=openapi.TYPE_STRING),
                'address': openapi.Schema(type=openapi.TYPE_STRING),
                'owner_id': openapi.Schema(type=openapi.TYPE_INTEGER),
            },
            required=['name', 'owner_id']
        ),
        responses={
            status.HTTP_201_CREATED: "Company created",
            status.HTTP_400_BAD_REQUEST: "Invalid data"
        }
    )
    def post(self, request):
        from api.models import Company
        from api.serializers import CompanySerializer
        
        # Check for owner existence
        owner_id = request.data.get('owner_id')
        try:
            owner = User.objects.get(id=owner_id)
        except User.DoesNotExist:
            return error_response(f'User with ID {owner_id} not found', status.HTTP_400_BAD_REQUEST)
            
        # Create company
        serializer = CompanySerializer(data=request.data)
        if serializer.is_valid():
            company = serializer.save(owner=owner)
            
            # Add owner to employees
            company.employees.add(owner)
            
            # Update owner's profile
            if hasattr(owner, 'profile'):
                owner.profile.company_name = company.name
                owner.profile.save()
                
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminAccessKeyView(APIView):
    """Admin endpoint for managing admin access keys."""
    permission_classes = [IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="List all admin access keys (admin only)",
        responses={
            status.HTTP_200_OK: "List of admin access keys",
        }
    )
    def get(self, request):
        """List all admin access keys."""
        access_keys = AdminAccessKey.objects.all().order_by('-created_at')
        
        response_data = [{
            'id': key.id,
            'key': key.key,
            'description': key.description,
            'is_active': key.is_active,
            'created_at': key.created_at,
            'used_by': key.used_by.email if key.used_by else None,
            'used_at': key.used_at
        } for key in access_keys]
        
        return Response(response_data)
    
    @swagger_auto_schema(
        operation_description="Create a new admin access key",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'description': openapi.Schema(type=openapi.TYPE_STRING, description='Description of what this key is for'),
            },
            required=['description']
        ),
        responses={
            status.HTTP_201_CREATED: "New admin access key created",
            status.HTTP_400_BAD_REQUEST: "Invalid data",
        }
    )
    def post(self, request):
        """Create a new admin access key."""
        description = request.data.get('description', '')
        if not description:
            return error_response('Description is required', status.HTTP_400_BAD_REQUEST)
            
        # Create new access key
        access_key = AdminAccessKey.objects.create(
            description=description,
            created_by=request.user
        )
        
        return Response({
            'id': access_key.id,
            'key': access_key.key,
            'description': access_key.description,
            'is_active': access_key.is_active,
            'created_at': access_key.created_at
        }, status=status.HTTP_201_CREATED)


class AdminAccessKeyRetrieveView(APIView):
    """Admin endpoint for retrieving own access key."""
    permission_classes = [IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="Retrieve your admin access key (admin only)",
        responses={
            status.HTTP_200_OK: "Admin access key",
            status.HTTP_404_NOT_FOUND: "No access key found",
        }
    )
    def get(self, request):
        """Get the admin access key for the current user."""
        if hasattr(request.user, 'profile') and request.user.profile.admin_access_key:
            return Response({
                'admin_access_key': request.user.profile.admin_access_key,
                'email': request.user.email
            })
        else:
            return error_response('No admin access key found for your account', status.HTTP_404_NOT_FOUND)
