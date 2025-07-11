"""
Common utilities for API views.
"""
import tempfile
import os
import json
from rest_framework.response import Response
from rest_framework import status
from ..utils import DecimalEncoder

def create_temp_file(file):
    """Create a temporary file from uploaded file."""
    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{file.name.split('.')[-1]}") as temp_file:
        for chunk in file.chunks():
            temp_file.write(chunk)
        return temp_file.name

def cleanup_temp_file(temp_file_path):
    """Safely clean up a temporary file."""
    if os.path.exists(temp_file_path):
        try:
            os.unlink(temp_file_path)
        except Exception as e:
            print(f"Error deleting temporary file: {e}")

def create_token_response(response_data, token_counter, status_code=status.HTTP_200_OK):
    """Create a response with token usage headers."""
    # Create a standard response
    response = Response(response_data, status=status_code)
    
    # Add token usage headers
    for header, value in token_counter.get_token_usage_header().items():
        response[header] = value
        
    return response

def error_response(message, status_code=status.HTTP_400_BAD_REQUEST):
    """Create a standardized error response."""
    return Response({'error': message}, status=status_code)
