from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

# Renamed from TokenQuota to UserTokenQuota to prevent conflict
class UserTokenQuota(models.Model):
    """Tracks token quotas and usage for users"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='token_quota')
    max_tokens = models.BigIntegerField(default=1000000)  # Default to 1M tokens
    tokens_used = models.BigIntegerField(default=0)
    reset_frequency = models.CharField(
        max_length=20,
        choices=[
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
            ('monthly', 'Monthly'),
            ('never', 'Never'),
        ],
        default='monthly'
    )
    next_reset = models.DateTimeField(default=timezone.now)
    last_updated = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Token quota for {self.user.username}"
    
    def get_available_tokens(self):
        """Calculate available tokens"""
        return max(0, self.max_tokens - self.tokens_used)

class TokenUsage(models.Model):
    """Records individual token usage events"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='token_usages')
    model = models.CharField(max_length=100)
    prompt_tokens = models.IntegerField(default=0)
    completion_tokens = models.IntegerField(default=0)
    total_tokens = models.IntegerField(default=0)
    request_type = models.CharField(max_length=50, default='chat')
    operation_id = models.CharField(max_length=100, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.total_tokens} tokens - {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
    
    class Meta:
        verbose_name = "Token Usage"
        verbose_name_plural = "Token Usage"
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['model']),
            models.Index(fields=['operation_id']),
        ]
