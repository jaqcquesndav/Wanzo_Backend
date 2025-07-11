"""
API Views for ComptableIA API.

This file has been refactored into a modular structure.
All views are now defined in separate files in the 'views/' directory.
"""

# Import all views from the views package
# from .auth_views import SignupView, AdminSignupView, LoginView, TokenRefreshView, UserProfileView
from .document_views import (
    FileInputView, JournalEntryView, ModifyEntryView,
    BatchProcessingView, BatchStatusView
)
from .prompt_views import PromptInputView
from .chat_views import ChatView, ChatHistoryView, ChatConversationDetailView
from .journaling_views import JournalEntryView as JournalEntry
from .system_views import TokenUsageView, DiagnosticParsingView
from .token_management import TokenQuotaView, AdminTokenQuotaView
from .conversation_views import (
    ConversationListCreateView, ConversationDetailView,
    MessageListView, MessageCreateView, MessageDetailView
)
from .usage_views import TokenUsageView as UsageStatsView

# These are the publicly available views 
__all__ = [
    'FileInputView',
    'JournalEntryView',
    'ModifyEntryView',
    'SignupView',
    'AdminSignupView',  # Add the missing AdminSignupView here
    'PromptInputView',
    'ChatView',
    'ChatHistoryView',
    'ChatConversationDetailView',
    'JournalEntry',
    'BatchProcessingView',
    'BatchStatusView',
    'TokenUsageView',
    'UsageStatsView',
    'LoginView',
    'TokenRefreshView',
    'UserProfileView',
    'DiagnosticParsingView',
    'TokenQuotaView',
    'AdminTokenQuotaView',
    'ConversationListCreateView',
    'ConversationDetailView',
    'MessageListView',
    'MessageCreateView',
    'MessageDetailView'
]
