"""
This file has been deprecated. Please use token_usage.py instead which contains 
both TokenQuota and TokenUsage models to avoid conflicts.
"""

from django.db import models
# Import the models from token_usage.py for backwards compatibility
from .token_usage import TokenQuota, TokenUsage

# No model definitions in this file to avoid conflicts
