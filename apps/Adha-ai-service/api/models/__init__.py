"""
Models initialization file for the API app.
"""

# Import models to ensure they're available when importing from api.models
from .company import Company
from .token_purchase import TokenPrice, TokenPurchaseRequest, TokenQuota
from .user_profile import UserProfile
from .admin_key import AdminAccessKey
from .journal_entry import JournalEntry
from .token_usage import TokenUsage, UserTokenQuota
from .chat import ChatConversation, ChatMessage

# AdminAccessKey is specifically for admin users, not companies
__all__ = [
    'Company',
    'UserProfile',
    'AdminAccessKey', 
    'JournalEntry',
    'TokenUsage',
    'UserTokenQuota',
    'ChatConversation',
    'ChatMessage',
    'TokenPrice',
    'TokenPurchaseRequest',
    'TokenQuota'
]
