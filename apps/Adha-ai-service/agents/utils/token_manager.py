import os
import time
import tiktoken
from openai import OpenAI
from django.utils import timezone
from django.db import transaction
from api.models import TokenUsage, Company, UserProfile

class TokenCounter:
    """
    Class for managing and tracking token usage.
    """
    def __init__(self, token_limit=None):
        self.token_limit = token_limit
        self.tokens_used = 0
        self.client = OpenAI()
        self.usage_data = {
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
            "operations": 0
        }
        
    def num_tokens_from_string(self, string, model="gpt-4"):
        """Returns the number of tokens in a text string."""
        try:
            encoding = tiktoken.encoding_for_model(model)
            num_tokens = len(encoding.encode(string))
            return num_tokens
        except Exception:
            # Fallback to rough estimation if tiktoken fails
            return len(string) // 4  # Rough approximation
            
    def log_operation(self, agent_name, model, input_text, output_text, operation_id=None, request_type=None):
        """
        Log token usage for an LLM operation.
        
        Args:
            agent_name (str): Name of the agent that made the request
            model (str): Model used for the request
            input_text (str): Input prompt text
            output_text (str): Output completion text
            operation_id (str, optional): ID to group related operations
            request_type (str, optional): Type of request (e.g., "chat", "completion")
        """
        # Calculate token usage
        input_tokens = self.num_tokens_from_string(input_text, model)
        output_tokens = self.num_tokens_from_string(output_text, model)
        total_tokens = input_tokens + output_tokens
        
        # Update local counter and usage data
        self.tokens_used += total_tokens
        self.usage_data["prompt_tokens"] += input_tokens
        self.usage_data["completion_tokens"] += output_tokens
        self.usage_data["total_tokens"] += total_tokens
        self.usage_data["operations"] += 1
        
        # Get the current user if in a Django view context
        try:
            from django.contrib.auth.models import AnonymousUser
            from rest_framework.request import Request
            
            # Check if we're in a Django request context
            from django.core.handlers.wsgi import WSGIRequest
            from django.conf import settings
            
            # Get current request if it's in thread local storage
            try:
                from threading import local
                _thread_locals = local()
                current_request = getattr(_thread_locals, 'request', None)
                
                # If we have a request and user is authenticated
                if current_request and hasattr(current_request, 'user') and current_request.user.is_authenticated:
                    user = current_request.user
                    
                    # Save token usage to database
                    with transaction.atomic():
                        # Create a TokenUsage record
                        token_usage = TokenUsage.objects.create(
                            user=user,
                            model=model,
                            prompt_tokens=input_tokens,
                            completion_tokens=output_tokens,
                            total_tokens=total_tokens,
                            request_type=request_type or "unknown",
                            operation_id=operation_id
                        )
                        
                        # Deduct from company quota
                        if hasattr(user, 'companies'):
                            company = user.companies.first()
                            if company:
                                company.token_quota = max(0, company.token_quota - total_tokens)
                                company.save(update_fields=['token_quota'])
                                print(f"Deducted {total_tokens} tokens from company {company.name}. New quota: {company.token_quota}")
            except Exception as e:
                print(f"Error while saving token usage: {e}")
                
        except (ImportError, Exception) as e:
            # Not in Django context or error occurred
            print(f"Token usage tracking: {input_tokens} input, {output_tokens} output, {total_tokens} total")
        
        # Check if we're over the limit
        if self.token_limit and self.tokens_used > self.token_limit:
            print(f"Token limit exceeded: {self.tokens_used} > {self.token_limit}")
            return False
            
        return True

    def get_token_usage_header(self):
        """
        Returns token usage as HTTP headers to be included in response.
        This method is used for tracking token usage in API responses.
        """
        return {
            'X-Token-Usage-Prompt': str(self.usage_data["prompt_tokens"]),
            'X-Token-Usage-Completion': str(self.usage_data["completion_tokens"]),
            'X-Token-Usage-Total': str(self.usage_data["total_tokens"]),
            'X-Token-Usage-Operations': str(self.usage_data["operations"])
        }
        
    def get_stats(self):
        """
        Returns statistics about token usage for the current session/request.
        """
        return {
            'usage': {
                'prompt_tokens': self.usage_data["prompt_tokens"],
                'completion_tokens': self.usage_data["completion_tokens"],
                'total_tokens': self.usage_data["total_tokens"],
                'operations_count': self.usage_data["operations"]
            },
            'limit': self.token_limit,
            'remaining': (self.token_limit - self.tokens_used) if self.token_limit else None,
            'limit_exceeded': bool(self.token_limit and self.tokens_used > self.token_limit)
        }

def get_token_counter(token_limit=None):
    """Factory function to create a TokenCounter instance."""
    return TokenCounter(token_limit)
