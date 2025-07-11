"""
Views for debugging and development purposes.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import tempfile
from .utils import error_response

class DiagnosticParsingView(APIView):
    """
    Endpoint de diagnostic pour tester l'analyse de documents
    (réservé aux administrateurs).
    """
    permission_classes = [IsAdminUser]
    
    @swagger_auto_schema(
        operation_description="Tester l'analyse de document",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'text': openapi.Schema(type=openapi.TYPE_STRING, description='Texte à analyser'),
                'document_type': openapi.Schema(type=openapi.TYPE_STRING, description='Type de document')
            },
            required=['text']
        ),
        responses={
            status.HTTP_200_OK: openapi.Response(description="Analyse de diagnostic"),
            status.HTTP_400_BAD_REQUEST: openapi.Response(description="Requête invalide"),
            status.HTTP_401_UNAUTHORIZED: openapi.Response(description="Authentification requise"),
            status.HTTP_403_FORBIDDEN: openapi.Response(description="Permission refusée"),
            status.HTTP_500_INTERNAL_SERVER_ERROR: openapi.Response(description="Erreur interne"),
        }
    )
    def post(self, request):
        text = request.data.get('text')
        document_type = request.data.get('document_type', 'unknown')
        
        if not text:
            return error_response('Le texte est requis pour le diagnostic', status.HTTP_400_BAD_REQUEST)
        
        # Here we would call various parsing functions for diagnostic purposes
        
        # Return dummy results for now
        return Response({
            "diagnostic_result": "Diagnostic parsing complete",
            "text_length": len(text),
            "detected_document_type": document_type,
            "counts": {
                "lines": text.count('\n') + 1,
                "words": len(text.split()),
                "numbers": sum(c.isdigit() for c in text),
                "letters": sum(c.isalpha() for c in text)
            },
            "analysis": {
                "may_contain_date": any(x in text.lower() for x in ["date:", "du ", "le "]),
                "may_contain_amount": any(x in text.lower() for x in ["montant", "total", "somme", "€", "$"])
            }
        })
