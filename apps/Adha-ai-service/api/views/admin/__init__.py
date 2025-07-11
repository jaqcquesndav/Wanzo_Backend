"""
Admin views module
"""
from .auth_views import AdminSignupView, AdminLoginView, AdminAccessKeyRetrieveView

__all__ = [
    'AdminSignupView',
    'AdminLoginView',
    'AdminAccessKeyRetrieveView'
]
