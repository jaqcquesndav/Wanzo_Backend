from django.db import models
from django.utils import timezone
from datetime import timedelta

class ProcessedMessage(models.Model):
    """
    Tracking des messages Kafka déjà traités pour assurer l'idempotence.
    TTL: 7 jours pour éviter la croissance infinie de la table.
    """
    message_id = models.CharField(
        primary_key=True, 
        max_length=100,
        help_text="ID unique du message Kafka"
    )
    correlation_id = models.CharField(
        max_length=100, 
        db_index=True,
        help_text="ID de corrélation pour tracer les requêtes liées"
    )
    topic = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Topic Kafka d'origine"
    )
    processed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Date/heure de traitement"
    )
    company_id = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        db_index=True,
        help_text="ID de la company/institution pour analytics"
    )
    processing_time_ms = models.IntegerField(
        default=0,
        help_text="Temps de traitement en millisecondes"
    )
    
    class Meta:
        verbose_name = "Processed Message"
        verbose_name_plural = "Processed Messages"
        indexes = [
            models.Index(fields=['correlation_id', 'processed_at']),
            models.Index(fields=['topic', 'processed_at']),
            models.Index(fields=['company_id', 'processed_at']),
        ]
        ordering = ['-processed_at']
    
    def __str__(self):
        return f"{self.message_id} - {self.topic} - {self.processed_at}"
    
    @classmethod
    def is_already_processed(cls, message_id: str) -> bool:
        """
        Vérifie si un message a déjà été traité.
        
        Args:
            message_id: ID du message à vérifier
            
        Returns:
            bool: True si déjà traité, False sinon
        """
        return cls.objects.filter(message_id=message_id).exists()
    
    @classmethod
    def mark_as_processed(cls, message_id: str, correlation_id: str, topic: str, 
                         company_id: str = None, processing_time_ms: int = 0):
        """
        Marque un message comme traité.
        
        Args:
            message_id: ID du message
            correlation_id: ID de corrélation
            topic: Topic Kafka
            company_id: ID de la company (optionnel)
            processing_time_ms: Temps de traitement en ms
        """
        return cls.objects.create(
            message_id=message_id,
            correlation_id=correlation_id,
            topic=topic,
            company_id=company_id,
            processing_time_ms=processing_time_ms
        )
    
    @classmethod
    def cleanup_old_records(cls, days: int = 7):
        """
        Nettoie les enregistrements plus vieux que X jours.
        À appeler via un cron job quotidien.
        
        Args:
            days: Nombre de jours à conserver (défaut: 7)
            
        Returns:
            int: Nombre d'enregistrements supprimés
        """
        cutoff_date = timezone.now() - timedelta(days=days)
        deleted_count, _ = cls.objects.filter(processed_at__lt=cutoff_date).delete()
        return deleted_count
