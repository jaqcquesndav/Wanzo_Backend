"""
API Views for ComptableIA API.

This file has been refactored into a modular structure.
All views are now defined in separate files in the 'views/' directory.
"""

# Import all views from the views package
from .views.auth_views import SignupView, LoginView, TokenRefreshView, UserProfileView
from .views.document_views import (
    FileInputView, JournalEntryView, ModifyEntryView,
    BatchProcessingView, BatchStatusView
)
from .views.prompt_views import PromptInputView
from .views.chat_views import ChatView, ChatHistoryView, ChatConversationDetailView
from .views.journaling_views import JournalEntryView as JournalEntry
from .views.system_views import TokenUsageView, DiagnosticParsingView
from .views.token_management import TokenQuotaView, AdminTokenQuotaView
from .views.conversation_views import (
    ConversationListCreateView, ConversationDetailView,
    MessageListView, MessageCreateView, MessageDetailView
)
from .views.usage_views import TokenUsageView as UsageStatsView

# These are the publicly available views 
__all__ = [
    'FileInputView',
    'JournalEntryView',
    'ModifyEntryView',
    'SignupView',
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