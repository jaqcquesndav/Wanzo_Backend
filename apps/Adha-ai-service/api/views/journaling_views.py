"""
Views for journal entry management.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from ..serializers import JournalEntrySerializer
from .utils import error_response

class JournalEntryView(APIView):
    """
    API endpoint for handling journal entries.
    """
    
    @swagger_auto_schema(
        operation_description="Retrieve all journal entries",
        responses={
            status.HTTP_200_OK: JournalEntrySerializer(many=True),
            status.HTTP_500_INTERNAL_SERVER_ERROR: openapi.Response(
                description="Internal server error"
            ),
        }
    )
    def get(self, request, format=None):
        try:
            from ..models import JournalEntry
            entries = JournalEntry.objects.all()
            serializer = JournalEntrySerializer(entries, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            error_message = f"Erreur interne lors de la récupération des écritures comptables: {e}"
            print(error_message)
            return error_response(error_message, status.HTTP_500_INTERNAL_SERVER_ERROR)

    @swagger_auto_schema(
        operation_description="Create a new journal entry",
        request_body=JournalEntrySerializer,
        responses={
            status.HTTP_201_CREATED: JournalEntrySerializer(),
            status.HTTP_400_BAD_REQUEST: openapi.Response(
                description="Invalid data provided"
            ),
            status.HTTP_500_INTERNAL_SERVER_ERROR: openapi.Response(
                description="Internal server error"
            ),
        }
    )
    def post(self, request, format=None):
        serializer = JournalEntrySerializer(data=request.data)
        if serializer.is_valid():
            try:
                # Add the creating user if authenticated
                if request.user.is_authenticated:
                    serializer.save(created_by=request.user)
                else:
                    serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                error_message = f"Erreur interne lors de la création de l'écriture comptable: {e}"
                print(error_message)
                return error_response(error_message, status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ModifyEntryView(APIView):
    """
    API endpoint for modifying a specific journal entry.
    """

    @swagger_auto_schema(
        operation_description="Modify an existing journal entry",
        request_body=JournalEntrySerializer,
        responses={
            status.HTTP_200_OK: openapi.Response(
                description="Journal entry modified successfully",
                schema=JournalEntrySerializer
            ),
            status.HTTP_400_BAD_REQUEST: openapi.Response(
                description="Invalid data provided"
            ),
            status.HTTP_404_NOT_FOUND: openapi.Response(
                description="Journal entry not found"
            ),
            status.HTTP_500_INTERNAL_SERVER_ERROR: openapi.Response(
                description="Internal server error"
            ),
        }
    )
    def put(self, request, pk, format=None):
        try:
            # Get the JournalEntry model
            from ..models import JournalEntry
            entry = JournalEntry.objects.get(pk=pk)
        except JournalEntry.DoesNotExist:
            return error_response('Journal entry not found', status.HTTP_404_NOT_FOUND)
            
        serializer = JournalEntrySerializer(entry, data=request.data)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Exception as e:
                error_message = f"Erreur interne lors de la modification de l'écriture comptable: {e}"
                print(error_message)
                return error_response(error_message, status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
