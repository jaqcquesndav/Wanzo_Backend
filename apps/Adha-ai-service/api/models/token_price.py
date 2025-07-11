from django.db import models

class TokenPrice(models.Model):
    """
    Model for storing token pricing per LLM model
    """
    model_name = models.CharField(max_length=100, unique=True)
    price_per_million = models.DecimalField(max_digits=10, decimal_places=2, default=10.00)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.model_name}: {self.price_per_million} par million"
    
    class Meta:
        verbose_name = "Token Price"
        verbose_name_plural = "Token Prices"
