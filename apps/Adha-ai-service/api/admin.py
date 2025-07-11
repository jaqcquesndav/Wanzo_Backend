from django.contrib import admin
from .models import JournalEntry, ChatConversation, ChatMessage, UserProfile

@admin.register(ChatConversation)
class ChatConversationAdmin(admin.ModelAdmin):
    list_display = ('conversation_id', 'user', 'title', 'created_at', 'updated_at')
    search_fields = ('title', 'user__username', 'conversation_id')
    readonly_fields = ('conversation_id', 'created_at', 'updated_at')

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('message_id', 'get_conversation_title', 'is_user', 'timestamp')
    list_filter = ('is_user', 'timestamp')
    search_fields = ('content', 'conversation__title')
    readonly_fields = ('message_id', 'timestamp')
    
    def get_conversation_title(self, obj):
        return obj.conversation.title
    get_conversation_title.short_description = 'Conversation'

# Register other models
admin.site.register(JournalEntry)
admin.site.register(UserProfile)
