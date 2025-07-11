from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid

# Add UserProfile model
class UserProfile(models.Model):
    """
    Extension du modèle utilisateur standard de Django pour ajouter des champs spécifiques à l'application.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    company_name = models.CharField(max_length=100, blank=True, null=True)
    company_type = models.CharField(max_length=50, blank=True, null=True, 
        choices=[
            ('individual', 'Entreprise individuelle'),
            ('sarl', 'SARL'),
            ('sa', 'Société Anonyme'),
            ('sas', 'SAS'),
            ('snc', 'SNC'),
            ('other', 'Autre')
        ])
    sector = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Profile de {self.user.username}"

# Add signals to automatically create/update UserProfile when User is created/updated
@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
    else:
        instance.profile.save()

class JournalEntry(models.Model):
    """
    Modèle pour les écritures comptables dans le journal.
    """
    date = models.DateField(default=timezone.now)
    piece_reference = models.CharField(max_length=100, blank=True)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_entries')
    
    # Ces champs stockent les données JSON complètes des écritures
    debit_data = models.JSONField(default=list)   # Stocke la liste des comptes au débit
    credit_data = models.JSONField(default=list)  # Stocke la liste des comptes au crédit
    
    # Nouveau champ pour stocker la source de l'écriture (extrait OCR ou prompt)
    source_data = models.JSONField(default=dict, blank=True)
    # Champ pour stocker le type de source (document ou prompt)
    source_type = models.CharField(max_length=20, blank=True, default="manual")
    
    class Meta:
        verbose_name = "Écriture comptable"
        verbose_name_plural = "Écritures comptables"
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"{self.date} - {self.description} ({self.piece_reference})"
    
    @property
    def debit(self):
        return self.debit_data
    
    @property
    def credit(self):
        return self.credit_data
    
    @property
    def total_debit(self):
        """Calcule le total des montants au débit"""
        return sum(item.get('montant', 0) for item in self.debit_data)
    
    @property
    def total_credit(self):
        """Calcule le total des montants au crédit"""
        return sum(item.get('montant', 0) for item in self.credit_data)
    
    @property
    def is_balanced(self):
        """Vérifie si l'écriture est équilibrée (débit = crédit)"""
        return abs(self.total_debit - self.total_credit) < 0.01

class ChatConversation(models.Model):
    """
    Modèle pour stocker les conversations de chat avec l'historique comptable.
    """
    # Replace the existing field with UUID field
    conversation_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='chat_conversations')
    title = models.CharField(max_length=255, blank=True)  # Title to identify conversation
    company_context = models.JSONField(blank=True, null=True)  # Store company-specific context
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)  # Track if conversation is active
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.title or 'Conversation'} ({self.user.username})"
    
    @property
    def message_count(self):
        return self.messages.count()
    
    @property
    def last_message(self):
        return self.messages.order_by('-timestamp').first()
    
    def add_message(self, content, is_user=True):
        """Helper to add a new message to the conversation"""
        return ChatMessage.objects.create(
            conversation=self,
            is_user=is_user,
            content=content
        )

class ChatMessage(models.Model):
    """
    Modèle pour stocker les messages individuels d'une conversation.
    """
    # Change the UUID field to force unique values with db_index
    message_id = models.UUIDField(
        primary_key=True, 
        default=uuid.uuid4, 
        editable=False, 
        db_index=True,
        unique=True,
        help_text="Unique identifier for the message"
    )
    conversation = models.ForeignKey(ChatConversation, on_delete=models.CASCADE, related_name='messages')
    is_user = models.BooleanField(default=True)  # True pour messages utilisateur, False pour réponses AI
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    relevant_entries = models.JSONField(default=list, blank=True)  # Pour stocker les références aux écritures pertinentes
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        sender = "Utilisateur" if self.is_user else "IA"
        return f"{sender}: {self.content[:30]}..."
        
    def save(self, *args, **kwargs):
        """Override save to ensure unique UUID"""
        if not self.message_id or self.message_id == uuid.UUID(int=0):
            self.message_id = uuid.uuid4()
        super().save(*args, **kwargs)