"""
Views for analytics and historical data exploration.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from ..serializers import ChatResponseSerializer, AccountingSummarySerializer, ChatRequestSerializer
from agents.logic.history_agent import HistoryAgent
from .utils import error_response
from ..models import ChatConversation, ChatMessage
import uuid
from datetime import datetime

class PromptInputView(APIView):
    """
    Endpoint pour analyser un texte en langage naturel.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Analyse d'un texte en langage naturel",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'prompt': openapi.Schema(type=openapi.TYPE_STRING, description='Texte à analyser'),
                'context': openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'entreprise': openapi.Schema(type=openapi.TYPE_STRING),
                        'date': openapi.Schema(type=openapi.TYPE_STRING),
                        'devise': openapi.Schema(type=openapi.TYPE_STRING)
                    },
                ),
                'save_to_history': openapi.Schema(type=openapi.TYPE_BOOLEAN, default=False)
            },
            required=['prompt']
        ),
        responses={
            status.HTTP_200_OK: openapi.Response(description="Analyse réussie"),
            status.HTTP_400_BAD_REQUEST: openapi.Response(description="Requête invalide"),
            status.HTTP_401_UNAUTHORIZED: openapi.Response(description="Authentification requise"),
            status.HTTP_500_INTERNAL_SERVER_ERROR: openapi.Response(description="Erreur interne"),
        }
    )
    def post(self, request):
        prompt = request.data.get('prompt')
        context = request.data.get('context', {})
        save_to_history = request.data.get('save_to_history', False)
        
        if not prompt:
            return Response({'error': 'Prompt is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Process with NLU Agent and AAAgent
        # Add implementation here
        
        # Return dummy response for now
        return Response({
            "message": "Prompt processing implemented in AAAgent"
        })

class ChatWithHistoryView(APIView):
    """
    Endpoint pour chater avec l'historique des écritures comptables.
    Maintient également l'historique de conversation pour le contexte.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Chat avec l'historique des écritures comptables",
        request_body=ChatRequestSerializer,
        responses={
            status.HTTP_200_OK: ChatResponseSerializer,
            status.HTTP_400_BAD_REQUEST: openapi.Response(description="Requête invalide"),
            status.HTTP_401_UNAUTHORIZED: openapi.Response(description="Authentification requise"),
            status.HTTP_500_INTERNAL_SERVER_ERROR: openapi.Response(description="Erreur interne"),
        }
    )
    def post(self, request):
        prompt = request.data.get('prompt')
        conversation_id = request.data.get('conversation_id')
        company_context = request.data.get('company_context')
        
        if not prompt:
            return error_response('Le prompt est requis')
            
        try:
            # Get conversation or create new one if not provided
            conversation = None
            is_new_conversation = False
            
            if conversation_id:
                try:
                    conversation = ChatConversation.objects.get(
                        conversation_id=conversation_id,
                        user=request.user
                    )
                except ChatConversation.DoesNotExist:
                    return error_response('Conversation non trouvée ou inaccessible', status.HTTP_404_NOT_FOUND)
            else:
                # Create a new conversation
                is_new_conversation = True
                
                # Generate a title from the prompt (first 50 characters)
                title = prompt[:50] + "..." if len(prompt) > 50 else prompt
                
                # Get company context from request or from user profile
                if not company_context and hasattr(request.user, 'profile'):
                    profile = request.user.profile
                    company_context = {
                        'company_name': profile.company_name,
                        'company_type': profile.company_type,
                        'sector': profile.sector
                    }
                
                conversation = ChatConversation.objects.create(
                    user=request.user,
                    title=title,
                    company_context=company_context
                )
            
            # Add the user's message to the conversation history
            user_message = ChatMessage.objects.create(
                conversation=conversation,
                is_user=True,
                content=prompt
                # Let the message_id be auto-generated
            )
            
            # Instancier l'agent d'historique avec l'ID utilisateur pour isoler les conversations
            history_agent = HistoryAgent(user_id=request.user.id)
            
            # Préparer le contexte utilisateur pour une interaction plus personnalisée
            user_context = {
                'name': request.user.get_full_name() or request.user.username,
                'company': company_context.get('company_name') if company_context else None,
                'is_new_conversation': is_new_conversation
            }
            
            # Générer une réponse en utilisant à la fois l'historique comptable et l'historique de conversation
            agent_response = history_agent.chat(
                prompt=prompt,
                conversation_id=str(conversation.conversation_id),
                user_context=user_context
            )
            
            # Vérifier si une erreur est survenue
            if "error" in agent_response:
                return error_response(agent_response["error"], status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Add the AI's response to the conversation history
            ai_message = ChatMessage.objects.create(
                conversation=conversation,
                is_user=False,
                content=agent_response['response'],
                relevant_entries=agent_response.get('relevant_entries', [])
                # Let the message_id be auto-generated
            )
            
            # Update the conversation's updated_at timestamp
            conversation.save()
            
            # Add message ID to the response
            agent_response['message_id'] = str(ai_message.message_id)
            
            # Add user info to response for personalization
            agent_response['user_info'] = {
                'name': user_context['name'],
                'company': user_context['company']
            }
                
            return Response(agent_response, status=status.HTTP_200_OK)
            
        except Exception as e:
            return error_response(
                f"Erreur lors du chat avec l'historique: {str(e)}",
                status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AccountSummaryView(APIView):
    """
    Endpoint pour obtenir un résumé des mouvements d'un compte.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Récupérer le résumé d'un compte comptable",
        manual_parameters=[
            openapi.Parameter('start_date', openapi.IN_QUERY, description="Date de début (JJ/MM/AAAA)", type=openapi.TYPE_STRING),
            openapi.Parameter('end_date', openapi.IN_QUERY, description="Date de fin (JJ/MM/AAAA)", type=openapi.TYPE_STRING),
        ],
        responses={
            status.HTTP_200_OK: AccountingSummarySerializer,
            status.HTTP_400_BAD_REQUEST: openapi.Response(description="Requête invalide"),
            status.HTTP_404_NOT_FOUND: openapi.Response(description="Compte non trouvé"),
            status.HTTP_500_INTERNAL_SERVER_ERROR: openapi.Response(description="Erreur interne"),
        }
    )
    def get(self, request, account):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # For now, return dummy data
        return Response({
            "account": account,
            "total_debit": 1500.0,
            "total_credit": 750.0,
            "balance": 750.0,
            "movements": [
                {
                    "date": "15/03/2023",
                    "description": "Achat fournitures",
                    "debit": 500.0,
                    "credit": 0.0,
                    "entry_id": "12345"
                },
                {
                    "date": "20/03/2023",
                    "description": "Paiement facture",
                    "debit": 1000.0,
                    "credit": 0.0,
                    "entry_id": "12346"
                },
                {
                    "date": "25/03/2023",
                    "description": "Virement client",
                    "debit": 0.0,
                    "credit": 750.0,
                    "entry_id": "12347"
                }
            ],
            "entry_count": 3
        })
