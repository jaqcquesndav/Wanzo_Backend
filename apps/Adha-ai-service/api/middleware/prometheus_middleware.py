from prometheus_client import Counter, Histogram
from django.utils.deprecation import MiddlewareMixin
import time

REQUEST_COUNT = Counter(
    'django_http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)
REQUEST_LATENCY = Histogram(
    'django_http_request_latency_seconds',
    'Latency of HTTP requests in seconds',
    ['method', 'endpoint']
)

class PrometheusBeforeAfterMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request._prometheus_start_time = time.time()

    def process_response(self, request, response):
        endpoint = request.path
        method = request.method
        status_code = response.status_code
        REQUEST_COUNT.labels(method, endpoint, status_code).inc()
        if hasattr(request, '_prometheus_start_time'):
            elapsed = time.time() - request._prometheus_start_time
            REQUEST_LATENCY.labels(method, endpoint).observe(elapsed)
        return response
