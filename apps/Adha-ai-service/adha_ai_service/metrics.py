from prometheus_client import multiprocess, CollectorRegistry, generate_latest, CONTENT_TYPE_LATEST
from django.http import HttpResponse

def metrics_view(request):
    registry = CollectorRegistry()
    try:
        multiprocess.MultiProcessCollector(registry)
    except Exception:
        pass  # Single process fallback
    data = generate_latest(registry)
    return HttpResponse(data, content_type=CONTENT_TYPE_LATEST)
