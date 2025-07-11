"""
Views for token usage and system monitoring.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from agents.utils.token_manager import get_token_counter
from .utils import error_response
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from api.models.token_usage import TokenUsage

class TokenUsageView(APIView):
    """
    Endpoint pour consulter les statistiques d'utilisation des tokens.
    """
    permission_classes = [IsAuthenticated]
    
    @swagger_auto_schema(
        operation_description="Obtenir les statistiques d'utilisation des tokens",
        manual_parameters=[
            openapi.Parameter(
                name="period",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                required=False,
                description="Période d'analyse ('day', 'week', 'month', 'all')",
                default="all"
            ),
            openapi.Parameter(
                name="detailed",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_BOOLEAN,
                required=False,
                description="Inclure des statistiques détaillées par opération",
                default=False
            )
        ],
        responses={
            status.HTTP_200_OK: openapi.Response(
                description="Statistiques d'utilisation des tokens",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'total_tokens': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'input_tokens': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'output_tokens': openapi.Schema(type=openapi.TYPE_INTEGER),
                        'period': openapi.Schema(type=openapi.TYPE_STRING),
                        'detailed_stats': openapi.Schema(type=openapi.TYPE_OBJECT)
                    }
                )
            ),
            status.HTTP_400_BAD_REQUEST: "Paramètres invalides",
        }
    )
    def get(self, request):
        """
        Obtient les statistiques d'utilisation des tokens pour l'utilisateur actuel.
        Peut filtrer par période et inclure des statistiques détaillées.
        """
        try:
            # Récupérer les paramètres
            period = request.query_params.get('period', 'all')
            detailed = request.query_params.get('detailed', 'false').lower() == 'true'
            
            # Déterminer la date de début en fonction de la période
            now = timezone.now()
            if period == 'day':
                start_date = now.date()
                filter_kwargs = {'timestamp__date': start_date}
            elif period == 'week':
                start_date = now.date() - timedelta(days=now.weekday())
                filter_kwargs = {'timestamp__date__gte': start_date}
            elif period == 'month':
                start_date = now.date().replace(day=1)
                filter_kwargs = {'timestamp__date__gte': start_date}
            else:  # 'all' ou autre valeur non reconnue
                filter_kwargs = {}
            
            # Requête pour l'utilisateur actuel
            filter_kwargs['user'] = request.user
            
            # Obtenir les statistiques globales
            usage_stats = TokenUsage.objects.filter(**filter_kwargs).aggregate(
                total_input=Sum('input_tokens'),
                total_output=Sum('output_tokens'),
                count=Count('id')
            )
            
            # Traiter les résultats
            total_input = usage_stats['total_input'] or 0
            total_output = usage_stats['total_output'] or 0
            
            response_data = {
                'input_tokens': total_input,
                'output_tokens': total_output,
                'total_tokens': total_input + total_output,
                'operations_count': usage_stats['count'] or 0,
                'period': period
            }
            
            # Ajouter des statistiques détaillées si demandé
            if detailed:
                # Statistiques par opération
                operation_stats = list(TokenUsage.objects.filter(**filter_kwargs)
                    .values('operation_type')
                    .annotate(
                        count=Count('id'),
                        input_tokens=Sum('input_tokens'),
                        output_tokens=Sum('output_tokens')
                    )
                    .order_by('-count'))
                
                # Statistiques par modèle
                model_stats = list(TokenUsage.objects.filter(**filter_kwargs)
                    .values('model_name')
                    .annotate(
                        count=Count('id'),
                        input_tokens=Sum('input_tokens'),
                        output_tokens=Sum('output_tokens')
                    )
                    .order_by('-count'))
                
                # Ajouter le total pour chaque groupe
                for stat_list in [operation_stats, model_stats]:
                    for stat in stat_list:
                        stat['total_tokens'] = (stat['input_tokens'] or 0) + (stat['output_tokens'] or 0)
                
                response_data['detailed_stats'] = {
                    'by_operation': operation_stats,
                    'by_model': model_stats
                }
                
                # Ajouter une estimation de coût si possible
                try:
                    # Coût estimé basé sur le prix standard d'OpenAI (peut être ajusté)
                    price_per_1m_tokens = 10.00  # $10 par million de tokens
                    estimated_cost = (total_input + total_output) * price_per_1m_tokens / 1_000_000
                    response_data['estimated_cost_usd'] = round(estimated_cost, 4)
                except:
                    pass
            
            return Response(response_data)
            
        except Exception as e:
            return error_response(f"Erreur lors de la récupération des statistiques: {str(e)}")

    @swagger_auto_schema(
        operation_description="Exporter les données d'utilisation des tokens",
        manual_parameters=[
            openapi.Parameter(
                name="format",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                required=False,
                description="Format d'export ('csv', 'json')",
                default="json"
            ),
            openapi.Parameter(
                name="start_date",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                required=False,
                description="Date de début (format YYYY-MM-DD)"
            ),
            openapi.Parameter(
                name="end_date",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_STRING,
                required=False,
                description="Date de fin (format YYYY-MM-DD)"
            )
        ],
        responses={
            status.HTTP_200_OK: "Données d'utilisation des tokens",
            status.HTTP_400_BAD_REQUEST: "Paramètres invalides",
        }
    )
    def post(self, request):
        """
        Exporte les données d'utilisation des tokens dans le format spécifié.
        Pour les administrateurs uniquement.
        """
        # Vérifier si l'utilisateur est administrateur
        if not request.user.is_staff:
            return error_response("Permission refusée. Seuls les administrateurs peuvent exporter les données.", status.HTTP_403_FORBIDDEN)
            
        try:
            # Récupérer les paramètres
            export_format = request.query_params.get('format', 'json')
            
            # Filtres de date
            filter_kwargs = {}
            
            if 'start_date' in request.query_params:
                try:
                    start_date = timezone.datetime.strptime(request.query_params['start_date'], '%Y-%m-%d').date()
                    filter_kwargs['timestamp__date__gte'] = start_date
                except ValueError:
                    return error_response("Format de date de début invalide. Utilisez YYYY-MM-DD.", status.HTTP_400_BAD_REQUEST)
                    
            if 'end_date' in request.query_params:
                try:
                    end_date = timezone.datetime.strptime(request.query_params['end_date'], '%Y-%m-%d').date()
                    filter_kwargs['timestamp__date__lte'] = end_date
                except ValueError:
                    return error_response("Format de date de fin invalide. Utilisez YYYY-MM-DD.", status.HTTP_400_BAD_REQUEST)
            
            # Récupérer les données
            usage_data = list(TokenUsage.objects.filter(**filter_kwargs)
                .values(
                    'user__username', 'timestamp', 'operation_type', 
                    'model_name', 'input_tokens', 'output_tokens', 'operation_id'
                )
                .order_by('-timestamp'))
            
            # Ajouter le total de tokens pour chaque entrée
            for entry in usage_data:
                entry['total_tokens'] = entry['input_tokens'] + entry['output_tokens']
            
            # Retourner les données dans le format demandé
            if export_format.lower() == 'csv':
                import csv
                from django.http import HttpResponse
                
                response = HttpResponse(content_type='text/csv')
                response['Content-Disposition'] = 'attachment; filename="token_usage.csv"'
                
                writer = csv.writer(response)
                writer.writerow(['Username', 'Timestamp', 'Operation Type', 'Model', 
                                'Input Tokens', 'Output Tokens', 'Total Tokens', 'Operation ID'])
                
                for entry in usage_data:
                    writer.writerow([
                        entry['user__username'],
                        entry['timestamp'].strftime('%Y-%m-%d %H:%M:%S'),
                        entry['operation_type'],
                        entry['model_name'],
                        entry['input_tokens'],
                        entry['output_tokens'],
                        entry['total_tokens'],
                        entry['operation_id']
                    ])
                
                return response
            else:
                # Format par défaut: JSON
                # Convertir les timestamps pour la sérialisation JSON
                for entry in usage_data:
                    entry['timestamp'] = entry['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
                
                return Response({
                    'data': usage_data,
                    'count': len(usage_data),
                    'filters': filter_kwargs
                })
                
        except Exception as e:
            return error_response(f"Erreur lors de l'export des données: {str(e)}")
