"""
Views for document processing and journal entry management.
"""
import os
import asyncio
import uuid
import tempfile
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from agents.logic.dde_agent import DDEAgent
from agents.logic.aa_agent import AAgent
from agents.logic.ccc_agent import CCCAgent
from agents.logic.history_agent import HistoryAgent
from agents.logic.orchestration_agent import OrchestrationAgent
from agents.utils.token_manager import get_token_counter
from ..models import JournalEntry
from ..serializers import DocumentAnalysisResponseSerializer, BatchDocumentRequestSerializer, JournalEntrySerializer
from .utils import create_temp_file, cleanup_temp_file, create_token_response, error_response

class JournalEntryView(APIView):
    """
    Endpoint pour gérer les écritures comptables.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Liste toutes les écritures comptables",
        responses={
            status.HTTP_200_OK: JournalEntrySerializer(many=True),
            status.HTTP_401_UNAUTHORIZED: "Authentification requise"
        }
    )
    def get(self, request):
        """Liste toutes les écritures comptables."""
        entries = JournalEntry.objects.all()
        serializer = JournalEntrySerializer(entries, many=True)
        return Response(serializer.data)
    
    @swagger_auto_schema(
        operation_description="Crée une nouvelle écriture comptable",
        request_body=JournalEntrySerializer,
        responses={
            status.HTTP_201_CREATED: JournalEntrySerializer,
            status.HTTP_400_BAD_REQUEST: "Données invalides",
            status.HTTP_401_UNAUTHORIZED: "Authentification requise"
        }
    )
    def post(self, request):
        """Crée une nouvelle écriture comptable."""
        serializer = JournalEntrySerializer(data=request.data)
        if serializer.is_valid():
            # Associer l'écriture à l'utilisateur courant
            entry = serializer.save(created_by=request.user)
            return Response(JournalEntrySerializer(entry).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ModifyEntryView(APIView):
    """
    Endpoint pour modifier ou supprimer une écriture comptable spécifique.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Récupère les détails d'une écriture comptable",
        responses={
            status.HTTP_200_OK: JournalEntrySerializer,
            status.HTTP_404_NOT_FOUND: "Écriture comptable non trouvée",
            status.HTTP_401_UNAUTHORIZED: "Authentification requise"
        }
    )
    def get(self, request, pk):
        """Récupère les détails d'une écriture comptable spécifique."""
        try:
            entry = JournalEntry.objects.get(pk=pk)
            serializer = JournalEntrySerializer(entry)
            return Response(serializer.data)
        except JournalEntry.DoesNotExist:
            return Response(
                {"error": "Journal entry not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @swagger_auto_schema(
        operation_description="Modifie une écriture comptable existante",
        request_body=JournalEntrySerializer,
        responses={
            status.HTTP_200_OK: JournalEntrySerializer,
            status.HTTP_400_BAD_REQUEST: "Données invalides",
            status.HTTP_404_NOT_FOUND: "Écriture comptable non trouvée",
            status.HTTP_401_UNAUTHORIZED: "Authentification requise"
        }
    )
    def put(self, request, pk):
        """Modifie une écriture comptable existante."""
        try:
            entry = JournalEntry.objects.get(pk=pk)
            serializer = JournalEntrySerializer(entry, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except JournalEntry.DoesNotExist:
            return Response(
                {"error": "Journal entry not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @swagger_auto_schema(
        operation_description="Supprime une écriture comptable",
        responses={
            status.HTTP_204_NO_CONTENT: "Suppression réussie",
            status.HTTP_404_NOT_FOUND: "Écriture comptable non trouvée",
            status.HTTP_401_UNAUTHORIZED: "Authentification requise"
        }
    )
    def delete(self, request, pk):
        """Supprime une écriture comptable."""
        try:
            entry = JournalEntry.objects.get(pk=pk)
            entry.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except JournalEntry.DoesNotExist:
            return Response(
                {"error": "Journal entry not found"}, 
                status=status.HTTP_404_NOT_FOUND
            )

class FileInputView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    @swagger_auto_schema(
        operation_description="Endpoint pour l'upload de fichiers comptables",
        manual_parameters=[
            openapi.Parameter(
                name="file",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_FILE,
                description="Pièce comptable à analyser (PDF, JPG, PNG)",
                required=True
            ),
            openapi.Parameter(
                name="intention",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_STRING,
                description="""Type de traitement souhaité:
                    - ecriture_simple: Génération d'une écriture comptable simple
                    - reconciliation: Reconciliation bancaire
                    - fin_exercice: Traitement de fin d'exercice
                    - liquidation: Opération de liquidation
                    - traitement_feuille_paie: Traitement d'une feuille de paie
                    - declaration_fiscale: Préparation d'une déclaration fiscale
                    - autre: Autre traitement (sera déduit du contexte)
                """,
                required=False
            ),
            openapi.Parameter(
                name="save_to_history",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_BOOLEAN,
                description="Enregistrer les écritures générées dans l'historique",
                required=False,
                default=False
            ),
            openapi.Parameter(
                name="detail",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_BOOLEAN,
                description="Inclure les détails d'interprétation",
                required=False,
                default=False
            ),
            openapi.Parameter(
                name="token_limit",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                description="Limite de tokens pour cette requête",
                required=False
            )
        ],
        responses={
            status.HTTP_200_OK: DocumentAnalysisResponseSerializer(),
            status.HTTP_400_BAD_REQUEST: openapi.Response(
                description="Requête invalide (pas de fichier)"
            ),
            status.HTTP_500_INTERNAL_SERVER_ERROR: openapi.Response(
                description="Erreur interne lors du traitement du fichier"
            ),
        }
    )
    def post(self, request, format=None):
        file = request.FILES.get('file')
        intention = request.POST.get('intention', 'ecriture_simple')
        include_details = request.query_params.get('detail', 'false').lower() == 'true'
        save_to_history = request.data.get('save_to_history', 'false').lower() == 'true'

        # Récupérer la limite de tokens si spécifiée
        token_limit = request.query_params.get('token_limit')
        if token_limit and token_limit.isdigit():
            token_counter = get_token_counter(int(token_limit))
        else:
            token_counter = get_token_counter()

        if not file:
            return error_response('No file provided')

        temp_file_path = None
        try:
            # Save the uploaded file to a temporary location
            temp_file_path = create_temp_file(file)

            try:
                # Process the temporary file
                dde_agent = DDEAgent()
                extracted_data = dde_agent.process(open(temp_file_path, 'rb'))

                # Clean up the temporary file
                cleanup_temp_file(temp_file_path)
                temp_file_path = None

                if 'error' in extracted_data:
                    return error_response(extracted_data['error'])

                # Rest of the processing
                aa_agent = AAgent()
                
                # Ajouter un log clair avant le traitement
                print(f"Sending extracted data to AA Agent for processing with intent: {intention}")
                
                try:
                    analysis_result = aa_agent.process(intention, {}, extracted_data)
                    
                    # Ajouter un log après le traitement
                    print(f"AA Agent processing result: {analysis_result}")
                    
                    if 'error' in analysis_result:
                        error_msg = analysis_result.get('error', {})
                        if isinstance(error_msg, dict):
                            error_msg = error_msg.get('message', str(error_msg))
                        return error_response(error_msg)

                    # Vérifier si proposals est vide ou non défini
                    if not analysis_result.get('proposals'):
                        return error_response(
                            "Aucune écriture comptable n'a pu être générée. Le document fourni ne contient peut-être pas assez d'informations."
                        )
                except Exception as e:
                    print(f"Exception during AA Agent processing: {str(e)}")
                    return error_response(
                        f"Erreur lors de l'analyse du document: {str(e)}",
                        status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                try:
                    # Vérification des propositions
                    ccc_agent = CCCAgent()
                    
                    # Ajouter un log clair avant la vérification
                    print(f"Sending proposals to CCC Agent for verification: {analysis_result.get('proposals')}")
                    
                    verification_results = ccc_agent.verify(analysis_result.get('proposals', []))
                    
                    # Ajouter un log après la vérification
                    print(f"CCC Agent verification results: {verification_results}")
                    
                    # Inclure les avertissements dans la réponse même si l'écriture est considérée comme cohérente
                    if verification_results.get("warnings"):
                        print(f"Warnings detected: {verification_results['warnings']}")
                        
                except Exception as e:
                    print(f"Exception during CCC Agent verification: {str(e)}")
                    verification_results = {
                        "is_coherent": False,
                        "is_compliant": False,
                        "errors": [f"Erreur lors de la vérification: {str(e)}"],
                        "warnings": []
                    }

                # S'il y a des erreurs bloquantes MAIS pas de déséquilibre forcé, retourner une erreur
                if verification_results.get("errors") and not verification_results.get("is_coherent") and not verification_results.get("has_forced_balance", False):
                    return error_response(
                        "L'écriture générée n'est pas valide: " + "; ".join(verification_results["errors"])
                    )

                # Préparation de la réponse avec les avertissements
                response_data = {
                    'entries': analysis_result.get('proposals', []),
                    'verification': verification_results
                }

                if include_details:
                    response_data['details'] = {
                        'ocr_text': extracted_data.get('full_text', ''),
                        'confidence': analysis_result.get('confidence', 0),
                        'missing_info': analysis_result.get('informations_manquantes', []),
                        'applied_rules': analysis_result.get('regles_appliquees', [])
                    }

                # Ajout de l'historisation
                if save_to_history and 'entries' in response_data:
                    history_agent = HistoryAgent()
                    for entry in response_data['entries']:
                        history_agent.add_entry(
                            entry,
                            source_data=extracted_data,  # Utiliser les données extraites comme source
                            source_type="document"  # Indiquer qu'il s'agit d'un document
                        )

                # Ajouter les en-têtes d'utilisation des tokens à la réponse
                response = Response(response_data, status=status.HTTP_200_OK)
                for header, value in token_counter.get_token_usage_header().items():
                    response[header] = value

                return response
                
            finally:
                # Ensure temp file is deleted even if an error occurs
                if temp_file_path:
                    cleanup_temp_file(temp_file_path)
                    
        except Exception as e:
            error_message = f"Erreur interne lors du traitement du fichier: {str(e)}"
            print(error_message)
            return error_response(error_message, status.HTTP_500_INTERNAL_SERVER_ERROR)


class BatchProcessingView(APIView):
    """
    Endpoint pour le traitement par lot de documents comptables.
    """
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Traitement par lot de documents comptables",
        manual_parameters=[
            openapi.Parameter(
                name="file",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_FILE,
                description="Fichier à traiter (répéter ce paramètre pour plusieurs fichiers)",
                required=True
            ),
            openapi.Parameter(
                name="intention",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_STRING,
                description="Type de traitement souhaité",
                required=False
            )
        ],
        responses={
            status.HTTP_202_ACCEPTED: openapi.Response(
                description="Traitement par lot initié",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'batch_id': openapi.Schema(type=openapi.TYPE_STRING),
                        'message': openapi.Schema(type=openapi.TYPE_STRING),
                        'status_endpoint': openapi.Schema(type=openapi.TYPE_STRING),
                    }
                )
            ),
            status.HTTP_400_BAD_REQUEST: openapi.Response(description="Requête invalide"),
            status.HTTP_500_INTERNAL_SERVER_ERROR: openapi.Response(description="Erreur interne"),
        }
    )
    def post(self, request):
        if not request.FILES.getlist('file'):
            return error_response('Aucun fichier fourni')
            
        intention = request.data.get('intention', 'ecriture_simple')
        
        try:
            # Création d'un ID de lot
            batch_id = str(uuid.uuid4())
            
            # Stockage temporaire des fichiers
            temp_dir = tempfile.mkdtemp()
            documents = []
            
            for file in request.FILES.getlist('file'):
                temp_path = os.path.join(temp_dir, file.name)
                with open(temp_path, 'wb') as temp_file:
                    for chunk in file.chunks():
                        temp_file.write(chunk)
                documents.append({
                    "file": temp_path,
                    "name": file.name
                })
                
            # Lancement du traitement asynchrone
            orchestrator = OrchestrationAgent()
            asyncio.ensure_future(orchestrator.process_batch(documents, intention))
            
            return Response({
                'batch_id': batch_id,
                'message': f'Traitement par lot initié pour {len(documents)} documents',
                'status_endpoint': f'/api/batch/{batch_id}/status'
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            return error_response(
                f"Erreur lors du traitement par lot: {str(e)}",
                status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BatchStatusView(APIView):
    """
    Endpoint pour vérifier le statut d'un traitement par lot.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Vérifier le statut d'un traitement par lot",
        responses={
            status.HTTP_200_OK: openapi.Response(
                description="Statut du traitement par lot",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'batch_id': openapi.Schema(type=openapi.TYPE_STRING),
                        'status': openapi.Schema(type=openapi.TYPE_STRING),
                        'progress': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'results': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_OBJECT)),
                    }
                )
            ),
            status.HTTP_404_NOT_FOUND: openapi.Response(description="Lot non trouvé"),
        }
    )
    def get(self, request, batch_id):
        orchestrator = OrchestrationAgent()
        batch_status = orchestrator.get_task_status(batch_id)

        if batch_status.get("status") == "not_found":
            return error_response(f"Traitement par lot non trouvé: {batch_id}", status.HTTP_404_NOT_FOUND)

        return Response(batch_status, status=status.HTTP_200_OK)
