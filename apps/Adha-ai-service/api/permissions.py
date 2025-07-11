from rest_framework import permissions

class IsCompanyMember(permissions.BasePermission):
    """
    Permission to check if user is a member of the company.
    """
    def has_object_permission(self, request, view, obj):
        # Check if obj is Company model
        if hasattr(obj, 'employees'):
            return request.user in obj.employees.all()
        return False

class IsCompanyOwner(permissions.BasePermission):
    """
    Permission to check if user is the owner of the company.
    """
    def has_object_permission(self, request, view, obj):
        # Check if obj is Company model
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        return False

class IsAdminUser(permissions.BasePermission):
    """
    Permission to check if user is an admin.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            hasattr(request.user, 'profile') and 
            request.user.profile.user_type == 'admin'
        )
