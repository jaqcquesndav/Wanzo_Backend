from django.db import models
import uuid
from .chat_conversation import ChatConversation

class ChatMessage(models.Model):
    """
    Model for storing individual messages in a conversation.
    """
    message_id = models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)
    conversation = models.ForeignKey(ChatConversation, on_delete=models.CASCADE, related_name='messages')
    is_user = models.BooleanField(default=True)  # True if message from user, False if from AI
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    relevant_entries = models.JSONField(default=list, blank=True)
    
    def __str__(self):
        sender = "User" if self.is_user else "AI"
        return f"{sender} message in {self.conversation.conversation_id}"
    
    class Meta:
        verbose_name = "Chat Message"
        verbose_name_plural = "Chat Messages"
        ordering = ['timestamp']
        app_label = 'api'  # Explicitly set the app label
