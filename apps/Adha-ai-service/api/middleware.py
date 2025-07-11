import json
from django.http import HttpResponse
from .utils import DecimalEncoder

class JSONResponseMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # If it's a JSON response, we can ensure it uses our DecimalEncoder
        if hasattr(response, 'accepted_media_type') and response.accepted_media_type == 'application/json':
            if hasattr(response, 'data'):
                try:
                    # Override the content with properly serialized JSON
                    response.content = json.dumps(response.data, cls=DecimalEncoder).encode('utf-8')
                except Exception as e:
                    print(f"Error serializing JSON with DecimalEncoder: {e}")
        
        return response
