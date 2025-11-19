from django.db import models
from django.utils import timezone
from datetime import timedelta
import uuid

class ProcessingRequest(models.Model):
    """
    State management pour les requêtes asynchrones.
    Permet de tracker l'état des analyses, chats, et traitements comptables.
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('timeout', 'Timeout'),
    ]
    
    REQUEST_TYPE_CHOICES = [
        ('analysis', 'Portfolio Analysis'),
        ('chat', 'Chat Message'),
        ('accounting', 'Accounting Processing'),
        ('credit_score', 'Credit Score Calculation'),
    ]
    
    request_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="ID unique de la requête"
    )
    correlation_id = models.CharField(
        max_length=100,
        db_index=True,
        help_text="ID de corrélation Kafka"
    )
    request_type = models.CharField(
        max_length=50,
        choices=REQUEST_TYPE_CHOICES,
        db_index=True,
        help_text="Type de requête"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True,
        help_text="Statut actuel"
    )
    company_id = models.CharField(
        max_length=100,
        db_index=True,
        null=True,
        blank=True,
        help_text="ID de la company/institution"
    )
    user_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="ID de l'utilisateur"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Retry management
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    next_retry_at = models.DateTimeField(null=True, blank=True)
    
    # Error tracking
    error_message = models.TextField(null=True, blank=True)
    error_traceback = models.TextField(null=True, blank=True)
    
    # Metadata
    request_data = models.JSONField(
        default=dict,
        help_text="Données de la requête (pour retry)"
    )
    result_data = models.JSONField(
        null=True,
        blank=True,
        help_text="Résultat du traitement"
    )
    
    # Métriques
    processing_time_ms = models.IntegerField(null=True, blank=True)
    tokens_used = models.IntegerField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Processing Request"
        verbose_name_plural = "Processing Requests"
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['company_id', 'status']),
            models.Index(fields=['request_type', 'status']),
            models.Index(fields=['correlation_id']),
            models.Index(fields=['next_retry_at']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.request_type} - {self.status} - {self.request_id}"
    
    def mark_as_processing(self):
        """Marque la requête comme en cours de traitement"""
        self.status = 'processing'
        self.started_at = timezone.now()
        self.save(update_fields=['status', 'started_at'])
    
    def mark_as_completed(self, result_data: dict = None, tokens_used: int = None):
        """Marque la requête comme complétée avec succès"""
        self.status = 'completed'
        self.completed_at = timezone.now()
        self.result_data = result_data
        self.tokens_used = tokens_used
        
        if self.started_at:
            delta = self.completed_at - self.started_at
            self.processing_time_ms = int(delta.total_seconds() * 1000)
        
        self.save(update_fields=[
            'status', 'completed_at', 'result_data', 
            'tokens_used', 'processing_time_ms'
        ])
    
    def mark_as_failed(self, error_message: str, error_traceback: str = None):
        """Marque la requête comme échouée"""
        self.status = 'failed'
        self.completed_at = timezone.now()
        self.error_message = error_message
        self.error_traceback = error_traceback
        
        if self.started_at:
            delta = self.completed_at - self.started_at
            self.processing_time_ms = int(delta.total_seconds() * 1000)
        
        self.save(update_fields=[
            'status', 'completed_at', 'error_message', 
            'error_traceback', 'processing_time_ms'
        ])
    
    def mark_as_timeout(self):
        """Marque la requête comme timeout"""
        self.status = 'timeout'
        self.completed_at = timezone.now()
        self.error_message = 'Request timeout exceeded'
        
        if self.started_at:
            delta = self.completed_at - self.started_at
            self.processing_time_ms = int(delta.total_seconds() * 1000)
        
        self.save(update_fields=[
            'status', 'completed_at', 'error_message', 'processing_time_ms'
        ])
    
    def can_retry(self) -> bool:
        """Vérifie si la requête peut être retentée"""
        return self.retry_count < self.max_retries and self.status in ['failed', 'timeout']
    
    def schedule_retry(self, delay_seconds: int = None):
        """Programme un retry avec délai exponentiel"""
        if not self.can_retry():
            return False
        
        self.retry_count += 1
        self.status = 'pending'
        
        # Exponential backoff: 1s, 2s, 4s, 8s...
        if delay_seconds is None:
            delay_seconds = min(2 ** (self.retry_count - 1), 60)
        
        self.next_retry_at = timezone.now() + timedelta(seconds=delay_seconds)
        self.save(update_fields=['retry_count', 'status', 'next_retry_at'])
        return True
    
    @classmethod
    def get_pending_retries(cls):
        """Récupère les requêtes en attente de retry"""
        now = timezone.now()
        return cls.objects.filter(
            status='pending',
            next_retry_at__lte=now,
            retry_count__gt=0
        )
    
    @classmethod
    def cleanup_old_requests(cls, days: int = 30):
        """
        Nettoie les requêtes complétées/échouées plus vieilles que X jours.
        
        Args:
            days: Nombre de jours à conserver (défaut: 30)
            
        Returns:
            int: Nombre d'enregistrements supprimés
        """
        cutoff_date = timezone.now() - timedelta(days=days)
        deleted_count, _ = cls.objects.filter(
            completed_at__lt=cutoff_date,
            status__in=['completed', 'failed', 'timeout']
        ).delete()
        return deleted_count
    
    @classmethod
    def cleanup_abandoned_requests(cls, hours: int = 24):
        """
        Marque comme timeout les requêtes abandonnées (en processing depuis trop longtemps).
        
        Args:
            hours: Nombre d'heures avant de considérer comme abandonné (défaut: 24)
            
        Returns:
            int: Nombre de requêtes marquées comme timeout
        """
        cutoff_date = timezone.now() - timedelta(hours=hours)
        abandoned = cls.objects.filter(
            status='processing',
            started_at__lt=cutoff_date
        )
        
        count = 0
        for request in abandoned:
            request.mark_as_timeout()
            count += 1
        
        return count
