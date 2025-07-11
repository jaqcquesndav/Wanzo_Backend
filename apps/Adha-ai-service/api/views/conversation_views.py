"""
Views for managing chat conversations and message history.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from ..models import ChatConversation, ChatMessage
from ..serializers import ChatConversationSerializer, ChatMessageSerializer
import uuid
from datetime import datetime

class ConversationListCreateView(generics.ListCreateAPIView):
    """API endpoint for listing and creating chat conversations."""
    permission_classes = [IsAuthenticated]
    serializer_class = ChatConversationSerializer

    @swagger_auto_schema(
        operation_description="List all conversations for the current user",
        responses={
            status.HTTP_200_OK: ChatConversationSerializer(many=True),
            status.HTTP_401_UNAUTHORIZED: "Authentication required"
        }
    )
    def get(self, request, *args, **kwargs):
        """Return only conversations belonging to the authenticated user."""
        return super().get(request, *args, **kwargs)

    @swagger_auto_schema(
        operation_description="Create a new conversation and get its ID",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'title': openapi.Schema(type=openapi.TYPE_STRING, description='Conversation title (optional)'),
                'company_context': openapi.Schema(
                    type=openapi.TYPE_OBJECT, 
                    description='Company context information (optional)'
                )
            },
        ),
        responses={
            status.HTTP_201_CREATED: ChatConversationSerializer,
            status.HTTP_400_BAD_REQUEST: "Invalid data",
            status.HTTP_401_UNAUTHORIZED: "Authentication required"
        }
    )
    def post(self, request, *args, **kwargs):
        """Create a new conversation and return its ID."""
        # Extract title from request or generate a default
        title = request.data.get('title', f"Conversation du {datetime.now().strftime('%d-%m-%Y')}")
        
        # Get company context from request or from user profile
        company_context = request.data.get('company_context', {})
        if not company_context and hasattr(request.user, 'profile'):
            profile = request.user.profile
            company_context = {
                'company_name': profile.company_name,
                'company_type': profile.company_type,
                'sector': profile.sector
            }
        
        # Generate a unique conversation ID
        conversation_id = f"conv_{uuid.uuid4().hex}"
        
        # Create the conversation directly instead of using serializer
        try:
            conversation = ChatConversation.objects.create(
                user=request.user,
                title=title,
                company_context=company_context,
                conversation_id=conversation_id
            )
            
            # Return the serialized conversation
            serializer = self.get_serializer(conversation)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {"error": f"Error creating conversation: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def get_queryset(self):
        """Return only conversations belonging to the authenticated user."""
        return ChatConversation.objects.filter(user=self.request.user)
    
    # We're now directly creating the conversation in the post method, 
    # so we don't need this method anymore
    # def perform_create(self, serializer):
    #     """Associate the conversation with the authenticated user."""
    #     # ...existing code...

class ConversationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """API endpoint for retrieving, updating or deleting a conversation."""
    permission_classes = [IsAuthenticated]
    serializer_class = ChatConversationSerializer
    lookup_field = 'conversation_id'
    
    def get_queryset(self):
        """Return only conversations belonging to the authenticated user."""
        return ChatConversation.objects.filter(user=self.request.user)

class MessageListView(generics.ListAPIView):
    """API endpoint for listing messages in a conversation."""
    permission_classes = [IsAuthenticated]
    serializer_class = ChatMessageSerializer
    
    def get_queryset(self):
        """Return only messages from the specified conversation belonging to the user."""
        conversation_id = self.kwargs.get('conversation_id')
        return ChatMessage.objects.filter(
            conversation__conversation_id=conversation_id,
            conversation__user=self.request.user
        ).order_by('timestamp')

class MessageCreateView(generics.CreateAPIView):
    """API endpoint for adding a new message to a conversation."""
    permission_classes = [IsAuthenticated]
    serializer_class = ChatMessageSerializer
    
    def perform_create(self, serializer):
        """Associate the message with the specified conversation."""
        conversation_id = self.kwargs.get('conversation_id')
        try:
            conversation = ChatConversation.objects.get(
                conversation_id=conversation_id, 
                user=self.request.user
            )
            
            # Don't set message_id explicitly - let the model default handle it
            serializer.save(conversation=conversation)
            
            # Update the conversation's updated_at timestamp
            conversation.save()  # This triggers the auto_now field
        except ChatConversation.DoesNotExist:
            raise ValidationError(f"Conversation with ID {conversation_id} not found or not accessible")

class MessageDetailView(generics.RetrieveDestroyAPIView):
    """API endpoint for retrieving or deleting a message."""
    permission_classes = [IsAuthenticated]
    serializer_class = ChatMessageSerializer
    lookup_field = 'message_id'
    
    def get_queryset(self):
        """Return only messages from conversations belonging to the user."""
        return ChatMessage.objects.filter(conversation__user=self.request.user)
