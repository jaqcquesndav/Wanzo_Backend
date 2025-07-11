"""
System-related views for platform management and statistics.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from agents.utils.token_manager import get_token_counter
from django.utils import timezone
from django.db.models import Sum
from datetime import timedelta

from api.models import TokenUsage

class TokenUsageView(APIView):
    """
    Endpoint for retrieving token usage statistics.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Get token usage statistics for the current user",
        manual_parameters=[
            openapi.Parameter('period', openapi.IN_QUERY, description="Period for statistics (today, week, month, all)", type=openapi.TYPE_STRING)
        ],
        responses={
            status.HTTP_200_OK: "Token usage statistics",
        }
    )
    def get(self, request):
        """Get token usage statistics for the current user."""
        # Create a token counter for stats
        token_counter = get_token_counter()
        
        # Get period from query parameters (defaults to "month")
        period = request.query_params.get('period', 'month')
        
        # Determine the time frame
        end_date = timezone.now()
        
        if period == 'today':
            start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == 'week':
            start_date = end_date - timedelta(days=7)
        elif period == 'month':
            start_date = end_date - timedelta(days=30)
        else:  # 'all' or any other value
            start_date = None
        
        # Query the database for usage statistics
        query = TokenUsage.objects.filter(user=request.user)
        
        if start_date:
            query = query.filter(timestamp__gte=start_date)
        
        # Calculate totals
        totals = query.aggregate(
            prompt_tokens=Sum('prompt_tokens'),
            completion_tokens=Sum('completion_tokens'),
            total_tokens=Sum('total_tokens')
        )
        
        # Get current session stats
        current_stats = token_counter.get_stats()
        
        # Get user company's token quota
        token_quota = 0
        if hasattr(request.user, 'companies'):
            company = request.user.companies.first()
            if company:
                token_quota = company.token_quota
        
        # Combine database stats with current session stats
        response_data = {
            'period': period,
            'database_stats': {
                'prompt_tokens': totals['prompt_tokens'] or 0,
                'completion_tokens': totals['completion_tokens'] or 0,
                'total_tokens': totals['total_tokens'] or 0
            },
            'current_session': current_stats['usage'],
            'token_quota': token_quota
        }
        
        return Response(response_data, status=status.HTTP_200_OK)


class DiagnosticParsingView(APIView):
    """
    Endpoint de diagnostic pour tester le parsing des réponses LLM.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Tester le parsing des réponses LLM",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'llm_output': openapi.Schema(type=openapi.TYPE_STRING, description='Texte de sortie du LLM à parser'),
            },
            required=['llm_output']
        ),
        responses={
            status.HTTP_200_OK: openapi.Response(
                description="Résultat du parsing",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'parsed_result': openapi.Schema(type=openapi.TYPE_OBJECT),
                        'verification_result': openapi.Schema(type=openapi.TYPE_OBJECT),
                    }
                )
            ),
            status.HTTP_400_BAD_REQUEST: openapi.Response(description="Requête invalide"),
        }
    )
    def post(self, request):
        llm_output = request.data.get('llm_output')
        if not llm_output:
            return error_response('Le texte de sortie LLM est requis')
            
        try:
            # Instancier les agents nécessaires
            aa_agent = AAgent()
            ccc_agent = CCCAgent()
            
            # Test du parsing avec chaque méthode disponible
            parsed_results = {
                "method1_regex_match": None,
                "method2_code_blocks": None,
                "method3_manual_extraction": None
            }
            
            # Méthode 1: Extraction de JSON avec regex
            try:
                json_pattern = r'(\{[\s\S]*?\}\}|\{[\s\S]*\})'
                json_matches = re.findall(json_pattern, llm_output, re.DOTALL)
                
                if json_matches:
                    for potential_json in json_matches:
                        try:
                            result = json.loads(potential_json)
                            if aa_agent._basic_json_validation(result):
                                parsed_results["method1_regex_match"] = result
                                break
                        except json.JSONDecodeError:
                            continue
            except Exception as e:
                parsed_results["method1_error"] = str(e)
                
            # Méthode 2: Recherche dans les blocs de code
            try:
                code_blocks = re.findall(r'```(?:json)?\s*([\s\S]*?)\s*```', llm_output)
                if code_blocks:
                    for block in code_blocks:
                        try:
                            result = json.loads(block)
                            if aa_agent._basic_json_validation(result):
                                parsed_results["method2_code_blocks"] = result
                                break
                        except json.JSONDecodeError:
                            continue
            except Exception as e:
                parsed_results["method2_error"] = str(e)
            
            # Méthode 3: Extraction manuelle
            try:
                manual_extraction = aa_agent._extract_and_reconstruct_json(llm_output)
                if manual_extraction:
                    parsed_results["method3_manual_extraction"] = manual_extraction
            except Exception as e:
                parsed_results["method3_error"] = str(e)
            
            # Vérification des résultats
            verification_result = ccc_agent.verify(parsed_results)
            
            return Response({
                'parsed_results': parsed_results,
                'verification_result': verification_result
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return error_response(
                f"Erreur lors du diagnostic de parsing: {str(e)}",
                status.HTTP_500_INTERNAL_SERVER_ERROR
            )
