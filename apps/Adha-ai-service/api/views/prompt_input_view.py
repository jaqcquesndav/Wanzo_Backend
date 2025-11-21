from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import uuid
import os

from agents.logic.orchestration_agent import OrchestrationAgent
from api.services.token_tracker import TokenTracker
from api.serializers import JournalEntrySerializer
from .utils import error_response, create_token_response

class PromptInputView(APIView):
    """
    Vue pour traiter les prompts en langage naturel et générer des écritures comptables.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Traite un prompt en langage naturel et génère une proposition d'écriture comptable",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'prompt': openapi.Schema(
                    type=openapi.TYPE_STRING, 
                    description='Texte décrivant l\'opération comptable à générer'
                ),
                'intention': openapi.Schema(
                    type=openapi.TYPE_STRING, 
                    description='Intention spécifique (ex: achat_fourniture, vente_service)',
                    enum=['achat_fourniture', 'vente_service', 'paie_salaire', 'encaissement', 'remboursement']
                ),
                'context': openapi.Schema(
                    type=openapi.TYPE_OBJECT, 
                    description='Contexte supplémentaire (montants, dates, etc.)',
                    properties={
                        'date': openapi.Schema(type=openapi.TYPE_STRING),
                        'montant': openapi.Schema(type=openapi.TYPE_NUMBER),
                        'devise': openapi.Schema(type=openapi.TYPE_STRING),
                        'tiers': openapi.Schema(type=openapi.TYPE_STRING)
                    }
                ),
                'save_to_history': openapi.Schema(
                    type=openapi.TYPE_BOOLEAN, 
                    description='Sauvegarder l\'écriture générée dans l\'historique'
                ),
            },
            required=['prompt']
        ),
        responses={
            status.HTTP_200_OK: JournalEntrySerializer(),
            status.HTTP_400_BAD_REQUEST: "Requête invalide",
            status.HTTP_500_INTERNAL_SERVER_ERROR: "Erreur interne"
        }
    )
    def post(self, request, format=None):
        """
        Traite un prompt en langage naturel et génère une proposition d'écriture comptable.
        """
        prompt = request.data.get('prompt')
        intention = request.data.get('intention')
        context = request.data.get('context', {})
        save_to_history = request.data.get('save_to_history', False)
        
        # Vérifier si le prompt est fourni
        if not prompt:
            return error_response("Le prompt est requis.")
        
        # Générer un ID d'opération unique
        operation_id = f"prompt_{uuid.uuid4()}"
        
        try:
            # Initialiser le tracker de tokens
            token_tracker = TokenTracker()
            
            # Initialiser l'agent d'orchestration
            orchestrator = OrchestrationAgent()
            
            # Traiter le prompt de manière asynchrone
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            result = loop.run_until_complete(
                orchestrator.process_document(prompt=prompt, intention=intention, entities=context)
            )
            loop.close()
            
            # Vérifier si une erreur s'est produite
            if "error" in result:
                return error_response(result["error"], status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Sauvegarder dans l'historique si demandé
            if save_to_history and "entries" in result:
                from agents.logic.history_agent import HistoryAgent
                history_agent = HistoryAgent(user_id=request.user.id)
                
                for entry in result["entries"]:
                    history_agent.add_entry(
                        entry,
                        source_data=prompt,  # Utiliser le prompt comme source
                        source_type="prompt"  # Indiquer qu'il s'agit d'un prompt
                    )
            
            # Suivre l'utilisation des tokens
            token_stats = token_tracker.track_operation(
                user_id=request.user.id,
                operation_type="prompt",
                model=os.environ.get("OPENAI_CHAT_MODEL", "gpt-4o-2024-08-06"),  # Modèle utilisé pour le traitement
                input_tokens=len(prompt) // 4,  # Estimation de 1 token pour ~4 caractères
                output_tokens=len(str(result)) // 4,  # Estimation grossière
                operation_id=operation_id
            )
            
            # Formater la réponse
            serializer = JournalEntrySerializer(data=result["entries"][0] if result.get("entries") else {})
            
            if serializer.is_valid():
                response_data = serializer.data
                response_data["token_usage"] = token_stats["total"]
                
                # Créer la réponse avec les en-têtes de tokens
                response = Response(response_data)
                response["X-Token-Usage"] = token_stats["total"]["total_tokens"]
                
                return response
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        except Exception as e:
            import traceback
            traceback.print_exc()
            return error_response(f"Erreur lors du traitement du prompt: {str(e)}", status.HTTP_500_INTERNAL_SERVER_ERROR)
