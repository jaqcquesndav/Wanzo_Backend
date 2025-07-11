"""
Views for natural language processing of accounting prompts.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from agents.logic.dde_agent import DDEAgent
from agents.logic.aa_agent import AAgent
from agents.logic.ccc_agent import CCCAgent
from agents.logic.jep_agent import JEPAgent
from agents.logic.history_agent import HistoryAgent
from agents.utils.token_manager import get_token_counter
from ..serializers import JournalEntrySerializer
from .utils import create_token_response, error_response

class PromptInputView(APIView):
    """
    Endpoint for natural language processing of accounting prompts.
    """
    
    @swagger_auto_schema(
        operation_description="Process a natural language accounting prompt",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'prompt': openapi.Schema(type=openapi.TYPE_STRING, description='Natural language accounting prompt'),
                'context': openapi.Schema(
                    type=openapi.TYPE_OBJECT, 
                    description='Optional contextual information',
                    properties={
                        'date': openapi.Schema(type=openapi.TYPE_STRING, description='Date for the operation'),
                        'montant': openapi.Schema(type=openapi.TYPE_NUMBER, description='Amount for the operation'),
                        'tiers': openapi.Schema(type=openapi.TYPE_STRING, description='Third party involved'),
                        'devise': openapi.Schema(type=openapi.TYPE_STRING, description='Currency')
                    }
                ),
                'save_to_history': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='Whether to save the result to history'),
                'token_limit': openapi.Schema(type=openapi.TYPE_INTEGER, description='Maximum tokens to use for processing')
            },
            required=['prompt']
        ),
        responses={
            status.HTTP_200_OK: openapi.Response(
                description="Successful processing of the prompt",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'response': openapi.Schema(type=openapi.TYPE_OBJECT, description='Processing result'),
                        'token_usage': openapi.Schema(
                            type=openapi.TYPE_OBJECT, 
                            properties={
                                'prompt_tokens': openapi.Schema(type=openapi.TYPE_INTEGER),
                                'completion_tokens': openapi.Schema(type=openapi.TYPE_INTEGER),
                                'total_tokens': openapi.Schema(type=openapi.TYPE_INTEGER)
                            }
                        )
                    }
                )
            ),
            status.HTTP_400_BAD_REQUEST: "Invalid input",
            status.HTTP_500_INTERNAL_SERVER_ERROR: "Processing error"
        }
    )
    def post(self, request, format=None):
        # Extract request parameters
        prompt = request.data.get('prompt', '')
        context = request.data.get('context', {})
        save_to_history = request.data.get('save_to_history', False)
        token_limit = request.data.get('token_limit')
        
        if not prompt:
            return error_response("Prompt text is required")
        
        # Initialize token counter if limit is specified
        if token_limit and isinstance(token_limit, int) and token_limit > 0:
            token_counter = get_token_counter(token_limit)
        else:
            token_counter = get_token_counter()
        
        try:
            # Process the natural language prompt
            print(f"Processing prompt: '{prompt}' with context: {context}")
            
            # Enrich prompt with context if provided
            enriched_prompt = prompt
            context_added = False
            
            if context:
                # Format the context data to append to the prompt
                context_parts = []
                if 'date' in context and context['date']:
                    context_parts.append(f"Date: {context['date']}")
                if 'montant' in context and context['montant']:
                    context_parts.append(f"Montant: {context['montant']}")
                if 'tiers' in context and context['tiers']:
                    context_parts.append(f"Partie concernée: {context['tiers']}")
                if 'devise' in context and context['devise']:
                    context_parts.append(f"Devise: {context['devise']}")
                
                if context_parts:
                    context_text = ", ".join(context_parts)
                    enriched_prompt = f"{prompt}\nContexte: {context_text}"
                    context_added = True
            
            # Step 1: Use DDE Agent to process the prompt
            dde_agent = DDEAgent(token_limit=token_limit)
            extracted_data = dde_agent.process_prompt(enriched_prompt)
            
            if 'error' in extracted_data:
                return error_response(f"Error extracting data from prompt: {extracted_data['error']}")
            
            # Step 2: Use AA Agent to analyze the data
            aa_agent = AAgent()
            intent = "ecriture_simple"  # Default intent
            
            # Process with AA Agent to get accounting entries
            analysis_result = aa_agent.process(intent, context, extracted_data)
            
            # Step 3: Verify accounting entries for consistency
            ccc_agent = CCCAgent()
            verification_results = ccc_agent.verify(analysis_result.get("proposals", []))
            
            # Step 4: Format the results
            jep_agent = JEPAgent()
            formatted_result = jep_agent.present(analysis_result, verification_results)
            
            # Step 5: Save to history if requested
            if save_to_history and request.user and request.user.is_authenticated:
                try:
                    history_agent = HistoryAgent(user_id=request.user.id)
                    
                    # For each proposal, save to history
                    for entry in analysis_result.get("proposals", []):
                        history_agent.add_entry(entry, source_data=prompt, source_type="prompt")
                        
                    print(f"Saved {len(analysis_result.get('proposals', []))} entries to history")
                except Exception as history_error:
                    print(f"Error saving to history: {history_error}")
                    # Continue processing even if history saving fails
            
            # Get token usage information
            token_usage = token_counter.get_stats().get("usage", {})
            
            # Format final response
            response = {
                "entries": analysis_result.get("proposals", []),
                "verification": verification_results,
                "input": {
                    "prompt": prompt,
                    "context_provided": context if context_added else None
                },
                "confidence": analysis_result.get("confidence", 0)
            }
            
            # Include debug details if requested
            include_details = request.query_params.get('detail', 'false').lower() == 'true'
            if include_details and "details" in analysis_result:
                response["details"] = analysis_result["details"]
            
            return create_token_response(response, token_counter)
            
        except Exception as e:
            error_message = f"Error processing prompt: {str(e)}"
            print(error_message)
            import traceback
            traceback.print_exc()
            return error_response(error_message, status.HTTP_500_INTERNAL_SERVER_ERROR)
