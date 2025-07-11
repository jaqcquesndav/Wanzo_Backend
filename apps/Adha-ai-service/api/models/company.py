from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import calendar
from datetime import datetime, timedelta

class Company(models.Model):
    """
    Company model for storing business information.
    """
    name = models.CharField(max_length=255)
    registration_number = models.CharField(max_length=100, blank=True)
    vat_number = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=50, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    country = models.CharField(max_length=50, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='owned_companies')
    employees = models.ManyToManyField(User, related_name='companies', blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    fiscal_year_start = models.DateField(null=True, blank=True)
    fiscal_year_end = models.DateField(null=True, blank=True)
    chart_of_accounts = models.JSONField(default=dict, blank=True)
    industry = models.CharField(max_length=100, blank=True)
    isolation_remaining = models.IntegerField(default=0, help_text='Nombre de jours restants d\'isolation des données')
    
    # New fields for subscription and token management
    has_subscription = models.BooleanField(default=False, help_text="Si l'entreprise a un abonnement actif")
    subscription_end_date = models.DateField(null=True, blank=True)
    total_tokens_purchased = models.BigIntegerField(default=0, help_text="Nombre total de tokens achetés")
    tokens_consumed = models.BigIntegerField(default=0, help_text="Nombre de tokens consommés")
    last_token_reset = models.DateField(default=timezone.now, help_text="Date de la dernière réinitialisation mensuelle")
    
    # Subscription fields - set default to True so companies can use tokens immediately
    is_subscription_active = models.BooleanField(default=True)
    subscription_renewal_date = models.DateField(null=True, blank=True)
    
    # Token management - initialize with the monthly allowance
    token_quota = models.BigIntegerField(default=1000000)  # Start with 1 million tokens
    monthly_token_allowance = models.BigIntegerField(default=1000000)  # Monthly free token allowance
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "Company"
        verbose_name_plural = "Companies"
        
    @property
    def tokens_remaining(self):
        """Calculate remaining tokens"""
        return max(0, self.total_tokens_purchased - self.tokens_consumed)
    
    @property
    def subscription_active(self):
        """Check if subscription is active"""
        if not self.has_subscription:
            return False
        if not self.subscription_end_date:
            return True
        return self.subscription_end_date >= timezone.now().date()
    
    def reset_monthly_tokens(self):
        """Add monthly free tokens if subscription is active"""
        today = timezone.now().date()
        # Check if it's a new month since the last reset
        if (today.year > self.last_token_reset.year or 
            (today.year == self.last_token_reset.year and today.month > self.last_token_reset.month)):
            if self.subscription_active:
                # Add 1 million free tokens
                self.total_tokens_purchased += 1000000
                self.last_token_reset = today
                self.save(update_fields=['total_tokens_purchased', 'last_token_reset'])
                return True
        return False
    
    def save(self, *args, **kwargs):
        # Set initial subscription renewal date if not set
        if not self.subscription_renewal_date and self.is_subscription_active:
            # Set to last day of next month
            today = timezone.now().date()
            next_month = today.month + 1
            next_year = today.year
            
            if next_month > 12:
                next_month = 1
                next_year += 1
                
            # Handle days exceeding month length (e.g., Jan 31 -> Feb 28/29)
            last_day_of_next_month = calendar.monthrange(next_year, next_month)[1]
            next_day = min(today.day, last_day_of_next_month)
            
            self.subscription_renewal_date = datetime(next_year, next_month, next_day).date()
        
        super().save(*args, **kwargs)
    
    def has_sufficient_tokens(self, tokens_needed):
        """Check if company has enough tokens for an operation."""
        return self.token_quota >= tokens_needed
    
    def use_tokens(self, token_count):
        """Deduct tokens from the company's quota if sufficient."""
        if self.token_quota >= token_count:
            self.token_quota -= token_count
            self.save()
            return True
        return False
    
    def days_until_renewal(self):
        """Return the number of days until subscription renewal."""
        if not self.subscription_renewal_date:
            return None
        
        delta = self.subscription_renewal_date - timezone.now().date()
        return max(0, delta.days)
