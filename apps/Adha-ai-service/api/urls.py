from django.urls import path, include
from rest_framework import routers
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework.permissions import AllowAny, IsAdminUser
from django.urls import re_path

# Import admin views
from .views.admin.token_management_views import TokenPriceManagementView, TokenPurchaseApprovalView, CompanySubscriptionManagementView

# Import company views
from .views.company.management_views import (
    CompanyListCreateView, 
    CompanyDetailView,
    CompanyUsersView,
    RemoveCompanyUserView,
    TransferCompanyOwnershipView,
    CompanyTokenUsageView,
    CompanySettingsView
)
from .views.company.subscription_views import SubscriptionStatusView, TokenPurchaseRequestView

# Import other existing views as needed
from .views import (
    FileInputView, 
    JournalEntryView,
    ModifyEntryView,
    PromptInputView,
    ChatView,
    ChatHistoryView,
    ChatConversationDetailView,
    BatchProcessingView,
    BatchStatusView,
    TokenUsageView,
    DiagnosticParsingView,
    TokenQuotaView,
    AdminTokenQuotaView
)

from .views.conversation_views import (
    ConversationListCreateView, 
    ConversationDetailView,
    MessageListView, 
    MessageCreateView, 
    MessageDetailView
)

# Create schema view for Admin API
admin_schema_view = get_schema_view(
    openapi.Info(
        title="Kiota Admin API",
        default_version='v1',
        description="API administrative pour gérer les utilisateurs, entreprises et tokens",
        terms_of_service="https://www.kiota.ai/terms/",
        contact=openapi.Contact(email="contact@kiota.ai"),
        license=openapi.License(name="Proprietary"),
    ),
    public=True,
    permission_classes=[IsAdminUser],
    patterns=[path('api/admin/', include([]))],
)

# Create schema view for Company API
company_schema_view = get_schema_view(
    openapi.Info(
        title="Kiota Company API",
        default_version='v1',
        description="API entreprise pour la gestion comptable et financière",
        terms_of_service="https://www.kiota.ai/terms/",
        contact=openapi.Contact(email="contact@kiota.ai"),
        license=openapi.License(name="Proprietary"),
    ),
    public=True,
    permission_classes=[AllowAny],
    patterns=[path('api/company/', include([]))],
)

# Admin API URLs (auth endpoints supprimés)
admin_urls = [
    # Admin token management
    path('tokens/price/', TokenPriceManagementView.as_view(), name='admin-token-price'),
    path('tokens/requests/', TokenPurchaseApprovalView.as_view(), name='admin-token-requests'),
    path('tokens/requests/<int:request_id>/', TokenPurchaseApprovalView.as_view(), name='admin-token-request-process'),
    path('companies/<int:company_id>/subscription/', CompanySubscriptionManagementView.as_view(), name='admin-company-subscription'),
    # Admin token quota management
    path('tokens/', AdminTokenQuotaView.as_view(), name='admin_token_quota'),
    path('tokens/<int:user_id>/', AdminTokenQuotaView.as_view(), name='admin_token_quota_user'),
    # Admin diagnostics
    path('diagnostics/parsing/', DiagnosticParsingView.as_view(), name='admin_diagnostic_parsing'),
]

# Company API URLs (auth endpoints supprimés)
company_urls = [
    # Company management
    path('management/', CompanyListCreateView.as_view(), name='company-list'),
    path('management/<int:pk>/', CompanyDetailView.as_view(), name='company-detail'),
    path('management/<int:pk>/users/', CompanyUsersView.as_view(), name='company-users'),
    path('management/<int:pk>/users/<int:user_id>/', RemoveCompanyUserView.as_view(), name='company-remove-user'),
    path('management/<int:pk>/transfer-ownership/', TransferCompanyOwnershipView.as_view(), name='company-transfer-ownership'),
    path('management/<int:pk>/settings/', CompanySettingsView.as_view(), name='company-settings'),
    # Company subscription and token management
    path('subscription/', SubscriptionStatusView.as_view(), name='company-subscription'),
    path('subscription/<int:pk>/token-usage/', CompanyTokenUsageView.as_view(), name='company-token-usage'),
    path('tokens/purchase/', TokenPurchaseRequestView.as_view(), name='token-purchase-request'),
    path('tokens/', TokenQuotaView.as_view(), name='token_quota'),
    # Document and accounting features
    path('document/upload/', FileInputView.as_view(), name='document_upload'),
    path('document/batch/', BatchProcessingView.as_view(), name='batch_process'),
    path('document/batch/<uuid:batch_id>/status/', BatchStatusView.as_view(), name='batch_status'),
    path('journal/', JournalEntryView.as_view(), name='journal_entries'),
    path('journal/<int:pk>/', ModifyEntryView.as_view(), name='modify_entry'),
    path('prompt/', PromptInputView.as_view(), name='prompt_input'),
    # Chat and conversation features
    path('chat/', ChatView.as_view(), name='chat'),
    path('chat/history/', ChatHistoryView.as_view(), name='chat_history'),
    path('chat/conversation/<str:conversation_id>/', ChatConversationDetailView.as_view(), name='chat_conversation'),
    path('chat/conversations/', ConversationListCreateView.as_view(), name='company-chat-conversations'),
    path('chat/conversations/<str:conversation_id>/', ConversationDetailView.as_view(), name='company-chat-conversation-detail'),
    path('chat/conversations/<str:conversation_id>/messages/', MessageListView.as_view(), name='company-chat-messages'),
    path('chat/conversations/<str:conversation_id>/messages/create/', MessageCreateView.as_view(), name='company-chat-message-create'),
    path('chat/conversations/<str:conversation_id>/messages/<str:message_id>/', MessageDetailView.as_view(), name='company-chat-message-detail'),
    # Usage statistics
    path('usage/tokens/', TokenUsageView.as_view(), name='token_usage_stats'),
]

# Main URL patterns (auth endpoints supprimés)
urlpatterns = [
    path('admin/swagger/', admin_schema_view.with_ui('swagger', cache_timeout=0), name='admin_schema_swagger_ui'),
    path('admin/redoc/', admin_schema_view.with_ui('redoc', cache_timeout=0), name='admin_schema_redoc'),
    path('admin/', include((admin_urls, 'kiota_admin'), namespace='kiota_admin')),
    path('company/swagger/', company_schema_view.with_ui('swagger', cache_timeout=0), name='company_schema_swagger_ui'),
    path('company/redoc/', company_schema_view.with_ui('redoc', cache_timeout=0), name='company_schema_redoc'),
    path('company/', include((company_urls, 'company'), namespace='company')),
]