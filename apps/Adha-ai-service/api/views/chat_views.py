"""
Views for chat functionality with accounting assistant.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.shortcuts import get_object_or_404
from django.http import StreamingHttpResponse
import uuid

from api.models.chat import ChatConversation, ChatMessage
from agents.logic.history_agent import HistoryAgent
from .utils import error_response
from api.kafka.producer import send_event
from api.kafka.producer_accounting import send_journal_entry_to_accounting
from agents.utils.token_manager import get_token_counter

def publish_token_usage(user, company_id, institution_id, tokens_used, conversation_id, mode):
    usage_event = {
        'type': 'token_usage',
        'user_id': str(user.id),
        'company_id': company_id,
        'institution_id': institution_id,
        'tokens_used': tokens_used,
        'conversation_id': conversation_id,
        'mode': mode,
        'timestamp': str(uuid.uuid1())
    }
    send_event('token.usage', usage_event)

class ChatView(APIView):
    """
    Endpoint pour interagir avec l'assistant comptable via chat.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Envoyer un message à l'assistant comptable",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'message': openapi.Schema(type=openapi.TYPE_STRING, description='Message à envoyer à l\'assistant'),
                'conversation_id': openapi.Schema(type=openapi.TYPE_STRING, description='ID de conversation existante (optionnel)'),
                'context': openapi.Schema(type=openapi.TYPE_OBJECT, description='Contexte supplémentaire (optionnel)')
            },
            required=['message']
        ),
        responses={
            status.HTTP_200_OK: openapi.Response(
                description="Réponse de l'assistant",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'response': openapi.Schema(type=openapi.TYPE_STRING),
                        'conversation_id': openapi.Schema(type=openapi.TYPE_STRING),
                        'message_id': openapi.Schema(type=openapi.TYPE_STRING),
                        'relevant_entries': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_OBJECT))
                    }
                )
            ),
            status.HTTP_400_BAD_REQUEST: "Requête invalide",
        }
    )
    def post(self, request):
        """
        Envoie un message à l'assistant comptable et reçoit une réponse.
        """
        try:
            message = request.data.get('message')
            conversation_id = request.data.get('conversation_id')
            context = request.data.get('context', {})
            mode = request.data.get('mode', 'chat')  # Ajout du mode
            
            if not message:
                return error_response("Le message est requis")
                
            # Get conversation if ID provided, otherwise create new one
            conversation = None
            if conversation_id:
                try:
                    # Ensure the conversation belongs to this user (data isolation)
                    conversation = ChatConversation.objects.get(
                        conversation_id=conversation_id, 
                        user=request.user
                    )
                except ChatConversation.DoesNotExist:
                    return error_response("Conversation non trouvée ou accès refusé", status.HTTP_404_NOT_FOUND)
            else:
                # Create a new conversation
                title = "Nouvelle conversation"
                
                # Get company context from user profile
                company_context = {}
                if hasattr(request.user, 'profile'):
                    profile = request.user.profile
                    company_context = {
                        'company_name': profile.company_name,
                        'company_type': profile.company_type,
                        'sector': profile.sector
                    }
                    
                # Create the conversation
                conversation = ChatConversation.objects.create(
                    user=request.user,
                    title=title,
                    company_context=company_context
                )
                
            # Merge company context with operations for global context
            company_context = conversation.get_company_context_with_operations()
            
            # Merge with user supplied context, user's context takes precedence
            merged_context = {**company_context, **context}
                
            # Initialisation de l'agent d'historique avec l'ID de l'utilisateur actuel
            history_agent = HistoryAgent(user_id=request.user.id)
            
            # Ajouter des informations utilisateur au contexte
            user_context = {
                'name': request.user.get_full_name() or request.user.username,
                'company': merged_context.get('company_name', None),
                'is_new_conversation': conversation_id is None
            }
            
            # Ajout du support du mode écriture comptable
            if mode == 'ecriture':
                # Générer une écriture comptable mockée (à remplacer par IA réelle)
                ecriture = {
                    'date': '2025-06-29',
                    'journalType': 'general',
                    'description': f"Écriture générée depuis le message: {message[:30]}...",
                    'reference': f"AUTO-{uuid.uuid4().hex[:6].upper()}",
                    'totalDebit': 120.0,
                    'totalCredit': 120.0,
                    'status': 'pending',
                    'source': 'agent',
                    'lines': [
                        {'accountCode': '626100', 'accountName': 'Frais de télécommunication', 'debit': 100.0, 'credit': 0, 'description': 'Télécom'},
                        {'accountCode': '445660', 'accountName': 'TVA déductible', 'debit': 20.0, 'credit': 0, 'description': 'TVA'},
                        {'accountCode': '401100', 'accountName': 'Fournisseurs', 'debit': 0, 'credit': 120.0, 'description': 'Fournisseur'}
                    ],
                    'attachments': [],
                    'userId': str(request.user.id),
                    'companyId': getattr(request.user, 'company_id', None)
                }
                chat_response = history_agent.chat(
                    prompt=message,
                    conversation_id=conversation.conversation_id,
                    user_context=user_context
                )
                if 'erreur' in chat_response:
                    return error_response(chat_response['erreur'])

                chat_response['ecriture_comptable'] = ecriture
                chat_response['mode'] = 'ecriture'
                # Publier l'événement sur Kafka (mobile/app)
                send_event('adha-ai-events', {
                    'type': 'ecriture_comptable',
                    'user_id': str(request.user.id),
                    'conversation_id': conversation.conversation_id,
                    'payload': ecriture
                })
                # Publier l'écriture vers accounting-service (format journal)
                send_journal_entry_to_accounting(ecriture)
                # Publier la consommation de tokens (PME/institution)
                publish_token_usage(request.user, getattr(request.user, 'company_id', None), getattr(request.user, 'institution_id', None), token_counter.usage_data['total_tokens'], conversation.conversation_id, mode)
                return Response(chat_response)
            else:
                # Mode chat normal : streaming LLM
                def stream_llm():
                    for chunk in history_agent.chat_stream(
                        prompt=message,
                        conversation_id=conversation.conversation_id,
                        user_context=user_context
                    ):
                        yield chunk
                # Publier l'événement sur Kafka (début de chat)
                send_event('adha-ai-events', {
                    'type': 'chat_message',
                    'user_id': str(request.user.id),
                    'conversation_id': conversation.conversation_id,
                    'payload': {'message': message, 'context': user_context}
                })
                # Publier la consommation de tokens (PME/institution)
                publish_token_usage(request.user, getattr(request.user, 'company_id', None), getattr(request.user, 'institution_id', None), token_counter.usage_data['total_tokens'], conversation.conversation_id, mode)
                return StreamingHttpResponse(stream_llm(), content_type='text/plain; charset=utf-8')
        except Exception as e:
            return error_response(f"Erreur lors du traitement du message: {str(e)}")

class ChatHistoryView(APIView):
    """
    Endpoint pour gérer l'historique des conversations.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Récupérer la liste des conversations",
        manual_parameters=[
            openapi.Parameter(
                name="active_only",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_BOOLEAN,
                required=False,
                description="N'afficher que les conversations actives (non archivées)",
                default=True
            )
        ],
        responses={
            status.HTTP_200_OK: "Liste des conversations",
        }
    )
    def get(self, request):
        """
        Récupère la liste des conversations de l'utilisateur.
        """
        try:
            active_only = request.query_params.get('active_only', 'true').lower() == 'true'
            
            # Filtrer les conversations de l'utilisateur
            conversations = ChatConversation.objects.filter(user=request.user)
            
            if active_only:
                conversations = conversations.filter(is_archived=False)
                
            # Organiser par date de dernière mise à jour
            conversations = conversations.order_by('-updated_at')
            
            result = []
            for conv in conversations:
                # Récupérer le dernier message pour chaque conversation
                last_message = ChatMessage.objects.filter(conversation=conv).order_by('-timestamp').first()
                
                result.append({
                    'conversation_id': conv.conversation_id,
                    'title': conv.title,
                    'created_at': conv.created_at,
                    'updated_at': conv.updated_at,
                    'is_archived': conv.is_archived,
                    'last_message': last_message.content[:100] + '...' if last_message else None,
                    'last_message_timestamp': last_message.timestamp if last_message else None
                })
            
            return Response(result)
            
        except Exception as e:
            return error_response(f"Erreur lors de la récupération des conversations: {str(e)}")
            
    @swagger_auto_schema(
        operation_description="Créer une nouvelle conversation",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'title': openapi.Schema(type=openapi.TYPE_STRING, description='Titre de la conversation'),
                'company_context': openapi.Schema(type=openapi.TYPE_OBJECT, description='Contexte de l\'entreprise (optionnel)')
            }
        ),
        responses={
            status.HTTP_201_CREATED: "Conversation créée",
            status.HTTP_400_BAD_REQUEST: "Requête invalide"
        }
    )
    def post(self, request):
        """
        Crée une nouvelle conversation.
        """
        try:
            title = request.data.get('title') or f"Nouvelle conversation"
            company_context = request.data.get('company_context', {})
            
            # Créer un nouvel ID de conversation
            conversation_id = f"conv_{uuid.uuid4().hex}"
            
            # Créer la conversation
            conversation = ChatConversation.objects.create(
                conversation_id=conversation_id,
                user=request.user,
                title=title,
                company_context=company_context
            )
            
            return Response({
                'conversation_id': conversation.conversation_id,
                'title': conversation.title,
                'created_at': conversation.created_at
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return error_response(f"Erreur lors de la création de la conversation: {str(e)}")

class ChatConversationDetailView(APIView):
    """
    Endpoint pour gérer une conversation spécifique.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Récupérer les détails d'une conversation",
        responses={
            status.HTTP_200_OK: "Détails de la conversation",
            status.HTTP_404_NOT_FOUND: "Conversation non trouvée"
        }
    )
    def get(self, request, conversation_id):
        """
        Récupère les détails d'une conversation et ses messages.
        """
        try:
            # Vérifier que la conversation appartient à l'utilisateur
            conversation = get_object_or_404(
                ChatConversation, 
                conversation_id=conversation_id,
                user=request.user
            )
            
            # Récupérer les messages de la conversation
            messages = ChatMessage.objects.filter(conversation=conversation).order_by('timestamp')
            
            messages_data = []
            for msg in messages:
                messages_data.append({
                    'message_id': msg.message_id,
                    'content': msg.content,
                    'is_user': msg.is_user,
                    'timestamp': msg.timestamp,
                    'relevant_entries': msg.relevant_entries
                })
            
            return Response({
                'conversation_id': conversation.conversation_id,
                'title': conversation.title,
                'created_at': conversation.created_at,
                'updated_at': conversation.updated_at,
                'is_archived': conversation.is_archived,
                'company_context': conversation.company_context,
                'messages': messages_data
            })
            
        except Exception as e:
            return error_response(f"Erreur lors de la récupération de la conversation: {str(e)}")
    
    @swagger_auto_schema(
        operation_description="Mettre à jour une conversation",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'title': openapi.Schema(type=openapi.TYPE_STRING, description='Nouveau titre'),
                'is_archived': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='Archiver/désarchiver la conversation'),
                'company_context': openapi.Schema(type=openapi.TYPE_OBJECT, description='Nouveau contexte d\'entreprise')
            }
        ),
        responses={
            status.HTTP_200_OK: "Conversation mise à jour",
            status.HTTP_404_NOT_FOUND: "Conversation non trouvée",
            status.HTTP_400_BAD_REQUEST: "Requête invalide"
        }
    )
    def put(self, request, conversation_id):
        """
        Met à jour les détails d'une conversation.
        """
        try:
            # Vérifier que la conversation appartient à l'utilisateur
            conversation = get_object_or_404(
                ChatConversation, 
                conversation_id=conversation_id,
                user=request.user
            )
            
            # Mettre à jour les champs fournis
            if 'title' in request.data:
                conversation.title = request.data['title']
                
            if 'is_archived' in request.data:
                conversation.is_archived = request.data['is_archived']
                
            if 'company_context' in request.data:
                conversation.company_context = request.data['company_context']
                
            conversation.save()
            
            return Response({
                'conversation_id': conversation.conversation_id,
                'title': conversation.title,
                'updated_at': conversation.updated_at,
                'is_archived': conversation.is_archived,
                'company_context': conversation.company_context
            })
            
        except Exception as e:
            return error_response(f"Erreur lors de la mise à jour de la conversation: {str(e)}")
    
    @swagger_auto_schema(
        operation_description="Supprimer une conversation",
        responses={
            status.HTTP_204_NO_CONTENT: "Conversation supprimée",
            status.HTTP_404_NOT_FOUND: "Conversation non trouvée"
        }
    )
    def delete(self, request, conversation_id):
        """
        Supprime une conversation et tous ses messages.
        """
        try:
            # Vérifier que la conversation appartient à l'utilisateur
            conversation = get_object_or_404(
                ChatConversation, 
                conversation_id=conversation_id,
                user=request.user
            )
            
            # Supprimer la conversation (les messages seront supprimés en cascade)
            conversation.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            return error_response(f"Erreur lors de la suppression de la conversation: {str(e)}")
