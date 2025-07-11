from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from .company import Company

class TokenPrice(models.Model):
    """Model for storing the price per million tokens"""
    price_per_million = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="EUR")
    effective_from = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.price_per_million} {self.currency} per million (from {self.effective_from.strftime('%Y-%m-%d')})"
    
    @classmethod
    def get_current_price(cls):
        """Get the current active token price"""
        try:
            return cls.objects.filter(is_active=True).latest('effective_from')
        except cls.DoesNotExist:
            return None

class TokenPurchaseRequest(models.Model):
    """Model for token purchase requests from companies"""
    STATUS_CHOICES = [
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ]
    
    PAYMENT_METHOD_CHOICES = [
        ('bank_transfer', 'Bank Transfer'),
        ('credit_card', 'Credit Card'),
        ('paypal', 'PayPal'),
        ('other', 'Other')
    ]
    
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='token_requests')
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='token_requests')
    tokens_requested = models.BigIntegerField()  # Number of tokens requested
    price_per_million = models.DecimalField(max_digits=10, decimal_places=2)  # Price at time of request
    total_price = models.DecimalField(max_digits=10, decimal_places=2)  # Total price for the request
    currency = models.CharField(max_length=3, default="EUR")
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES, default='bank_transfer')
    payment_reference = models.CharField(max_length=255, blank=True, null=True)  # For tracking payments
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    request_date = models.DateTimeField(auto_now_add=True)
    processed_date = models.DateTimeField(null=True, blank=True)
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='processed_token_requests')
    admin_notes = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.company.name} - {self.tokens_requested} tokens - {self.status}"
    
    def approve(self, admin_user, notes=""):
        """Approve the token purchase request"""
        self.status = 'approved'
        self.processed_date = timezone.now()
        self.processed_by = admin_user
        self.admin_notes = notes
        self.save()
    
    def complete(self, admin_user, notes=""):
        """Mark the token purchase as completed and add tokens to company"""
        self.status = 'completed'
        self.processed_date = timezone.now()
        self.processed_by = admin_user
        self.admin_notes = notes
        self.save()
        
        # Add tokens to company quota
        self.company.token_quota += self.tokens_requested
        self.company.save()
    
    def reject(self, admin_user, notes=""):
        """Reject the token purchase request"""
        self.status = 'rejected'
        self.processed_date = timezone.now()
        self.processed_by = admin_user
        self.admin_notes = notes
        self.save()

class TokenQuota(models.Model):
    """Model for tracking token quota for users or companies"""
    next_reset = models.DateTimeField(default=timezone.now)  # Use timezone.now() instead of naive datetime
