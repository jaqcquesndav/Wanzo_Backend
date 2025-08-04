from prometheus_client import multiprocess, CollectorRegistry, generate_latest, CONTENT_TYPE_LATEST
from django.http import HttpResponse, JsonResponse
import time

def metrics_view(request):
    """
    Endpoint Prometheus pour exposer les métriques du service Adha AI
    Accessible via /metrics/
    """
    registry = CollectorRegistry()
    try:
        multiprocess.MultiProcessCollector(registry)
    except Exception:
        pass  # Single process fallback
    data = generate_latest(registry)
    return HttpResponse(data, content_type=CONTENT_TYPE_LATEST)

def health_check(request):
    """
    Endpoint de santé pour le monitoring et les health checks
    Accessible via /health/
    """
    return JsonResponse({
        'status': 'healthy',
        'service': 'adha-ai-service',
        'timestamp': int(time.time()),
        'version': '1.0.0'
    })
