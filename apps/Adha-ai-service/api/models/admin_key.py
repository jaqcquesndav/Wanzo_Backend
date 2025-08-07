from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
import uuid

class AdminAccessKey(models.Model):
    """
    API keys for admin access to the Adha AI service.
    These keys are used for administrative operations.
    """
    key_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, help_text="A descriptive name for this API key")
    api_key = models.CharField(max_length=100, unique=True, help_text="The secret API key")
    is_active = models.BooleanField(default=True)
    date_created = models.DateTimeField(auto_now_add=True)
    last_used = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.name} ({self.key_id})"
    
    def record_usage(self):
        """Record that this key was used"""
        self.last_used = timezone.now()
        self.save(update_fields=['last_used'])
        
    class Meta:
        verbose_name = _("Admin Access Key")
        verbose_name_plural = _("Admin Access Keys")
