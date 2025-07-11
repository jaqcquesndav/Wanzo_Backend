from django.db import models
from django.contrib.auth.models import User
import uuid

# Create named functions instead of lambdas
def generate_conversation_id():
    """Generate a unique conversation ID."""
    return f"conv_{uuid.uuid4().hex}"

def generate_message_id():
    """Generate a unique message ID."""
    return f"msg_{uuid.uuid4().hex}"

class ChatConversation(models.Model):
    """
    Modèle pour stocker les conversations entre utilisateurs et l'assistant.
    """
    conversation_id = models.CharField(max_length=64, unique=True, default=generate_conversation_id)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="conversations")
    title = models.CharField(max_length=255, default="Nouvelle conversation")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    company_context = models.JSONField(default=dict, blank=True)
    is_archived = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-updated_at']
        
    def __str__(self):
        return f"{self.title} ({self.user.username})"
    
    def get_company(self):
        """
        Returns the company associated with this conversation's user.
        Used for data isolation.
        """
        if hasattr(self.user, 'companies'):
            return self.user.companies.first()
        return None
    
    def get_company_context_with_operations(self):
        """
        Returns the conversation context enriched with company's recent operations.
        This provides global context for the conversation.
        """
        from api.models import JournalEntry
        
        # Get base context
        context = self.company_context.copy() if self.company_context else {}
        
        # Get user's company
        company = self.get_company()
        if not company:
            return context
            
        # Add company name if not already in context
        if 'company_name' not in context and company:
            context['company_name'] = company.name
            
        # Get company's recent operations (limited to 10)
        company_users = company.employees.all()
        recent_entries = JournalEntry.objects.filter(
            created_by__in=company_users
        ).order_by('-created_at')[:10]
        
        # Add operations to context
        operations = []
        for entry in recent_entries:
            operations.append({
                'date': entry.date.strftime('%d/%m/%Y') if entry.date else '',
                'description': entry.description,
                'reference': entry.piece_reference,
                'amount': sum(item.get('montant', 0) for item in entry.debit_data) if entry.debit_data else 0
            })
            
        if operations:
            context['recent_operations'] = operations
            
        return context


class ChatMessage(models.Model):
    """
    Modèle pour stocker les messages individuels dans une conversation.
    """
    message_id = models.CharField(max_length=64, unique=True, default=generate_message_id)
    conversation = models.ForeignKey(ChatConversation, on_delete=models.CASCADE, related_name="messages")
    is_user = models.BooleanField(default=True)  # True si message de l'utilisateur, False si message de l'IA
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    relevant_entries = models.JSONField(default=list, blank=True)
    
    class Meta:
        ordering = ['timestamp']
        
    def __str__(self):
        sender = "Utilisateur" if self.is_user else "Assistant"
        return f"{sender}: {self.content[:50]}..."
