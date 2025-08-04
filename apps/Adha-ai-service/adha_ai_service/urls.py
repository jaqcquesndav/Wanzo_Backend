from django.contrib import admin
from django.urls import path, include
from api.views import chat_views, conversation_views, auth_views, prompt_views, journaling_views
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
from .metrics import metrics_view, health_check

# Create Schema View for Swagger documentation
schema_view = get_schema_view(
    openapi.Info(
        title="Adha AI Service API",
        default_version='v1',
        description="API pour l'assistant Adha AI",
        contact=openapi.Contact(email="contact@example.com"),
        license=openapi.License(name="Proprietary"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('auth/', include('rest_framework.urls')),
    # Swagger docs
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    # Monitoring endpoints
    path('metrics/', metrics_view, name='prometheus-metrics'),
    path('health/', health_check, name='health-check'),
]
