"""
Company views module
"""
from .auth_views import CompanyUserSignupView, CompanyUserLoginView, CompanyUserProfileView

__all__ = [
    'CompanyUserSignupView',
    'CompanyUserLoginView',
    'CompanyUserProfileView'
]
