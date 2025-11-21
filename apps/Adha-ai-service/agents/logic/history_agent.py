import uuid
import json
from datetime import datetime
import os
from typing import Dict, Any, List, Optional
import re

import tiktoken
from openai import OpenAI
from django.db.models import Q
from django.contrib.auth.models import User
from django.conf import settings
import chromadb.utils.embedding_functions as embedding_functions

from api.models import JournalEntry, ChatConversation, ChatMessage
from agents.vector_databases.chromadb_connector import ChromaDBConnector
from agents.logic.retriever_agent import RetrieverAgent
from agents.utils.llm_tool_system import LLMToolSystem
from agents.core.adha_identity import ADHAIdentity

class HistoryAgent:
    """
    Agent responsable de la gestion de l'historique des écritures et des conversations.
    Permet d'interroger l'historique comptable et de maintenir le contexte des conversations.
    """
    def __init__(self, user_id=None, company_id=None, institution_id=None, customer_type='sme'):
        self.client = OpenAI()
        self.user_id = user_id
        self.company_id = company_id
        self.institution_id = institution_id
        self.customer_type = customer_type
        self.conversation_storage = {}  # Stockage en mémoire (fallback)
        
        # Initialiser le système d'outils LLM
        self.tool_system = LLMToolSystem()
        
        # Initialisation de la base de données vectorielle pour l'historique
        try:
            # Utiliser le chemin défini dans settings
            embeddings_path = os.path.join(settings.BASE_DIR, 'data', 'embeddings')
            os.makedirs(embeddings_path, exist_ok=True)
            print(f"Using embeddings path: {embeddings_path}")
            
            # Initialize OpenAI embedding function (read from environment)
            openai_api_key = os.environ.get("OPENAI_API_KEY")
            openai_model = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
            
            if not openai_api_key:
                raise ValueError("OPENAI_API_KEY environment variable is required for history agent")
            
            self.openai_ef = embedding_functions.OpenAIEmbeddingFunction(
                api_key=openai_api_key,
                model_name=openai_model
            )
            print(f"History agent: OpenAI embeddings initialized with model: {openai_model}")
            
            self.vector_db = ChromaDBConnector(
                persist_directory=embeddings_path,
                embedding_function=self.openai_ef
            )
            # Collection spécifique pour les écritures comptables
            self.entries_collection = self.vector_db.get_or_create_collection(
                name="journal_entries",
                embedding_function=self.openai_ef
            )
            # Collection séparée pour l'historique des conversations
            self.chats_collection = self.vector_db.get_or_create_collection(
                name="chat_history",
                embedding_function=self.openai_ef
            )
            
            print("OpenAI embeddings initialized successfully for history agent")
        except Exception as e:
            print(f"Erreur lors de l'initialisation de la base vectorielle: {e}")
            self.vector_db = None
            self.entries_collection = None
            self.chats_collection = None
            self.openai_ef = None
    
    def add_entry(self, entry, source_data=None, source_type="manual"):
        """
        Ajoute une écriture comptable à l'historique.
        
        Args:
            entry: L'écriture comptable à ajouter
            source_data: Les données source qui ont permis de générer l'écriture (extrait OCR ou prompt)
            source_type: Le type de source ("document" ou "prompt")
        """
        try:
            # Indexer l'entrée dans la base vectorielle
            entry_text = f"{entry.get('description', '')} - {entry.get('date', '')} - {entry.get('piece_reference', '')}"
            
            # Enrichir le texte de l'entrée avec les données source pour une meilleure recherche sémantique
            if source_data:
                if isinstance(source_data, dict) and 'full_text' in source_data:
                    # Pour un document OCR, utiliser le texte extrait
                    entry_text += f" Source: {source_data.get('full_text', '')[:500]}"
                elif isinstance(source_data, str):
                    # Pour un prompt en langage naturel
                    entry_text += f" Source: {source_data[:500]}"
            
            # Extraire des détails pertinents des débits et crédits
            for debit in entry.get('debit', []):
                entry_text += f" Débit: {debit.get('compte', '')} {debit.get('montant', '')} {debit.get('libelle', '')}"
            for credit in entry.get('credit', []):
                entry_text += f" Crédit: {credit.get('compte', '')} {credit.get('montant', '')} {credit.get('libelle', '')}"
            
            # Générer un ID unique pour l'entrée
            entry_id = f"entry_{uuid.uuid4()}"
            
            # Vérifier si le module d'embedding est disponible
            if self.openai_ef and self.entries_collection:
                # Créer l'embedding avec OpenAI API
                # ChromaDB with OpenAI embedding function will handle this automatically
                # We just need to provide the text, no manual embedding needed
                embedding = None  # Will be generated automatically by ChromaDB
                
                # Préparer les métadonnées incluant les données source avec isolation stricte
                metadata = {
                    "date": entry.get("date", ""),
                    "description": entry.get("description", ""),
                    "piece_reference": entry.get("piece_reference", ""),
                    "type": "journal_entry",
                    "entry_data": json.dumps(entry),
                    "user_id": str(self.user_id) if self.user_id else "global",
                    "company_id": str(self.company_id) if self.company_id else None,
                    "institution_id": str(self.institution_id) if self.institution_id else None,
                    "customer_type": self.customer_type
                }
                
                # Ajouter les données source si disponibles
                if source_data:
                    if isinstance(source_data, dict):
                        # Pour les documents, stocker des extraits pertinents
                        metadata["source_extract"] = source_data.get("full_text", "")[:1000] if "full_text" in source_data else ""
                    else:
                        # Pour les prompts
                        metadata["source_prompt"] = source_data[:1000] if source_data else ""
                        
                    metadata["source_type"] = source_type
                
                # Stocker dans la base vectorielle
                # With OpenAI embedding function, ChromaDB generates embeddings automatically
                self.entries_collection.add(
                    ids=[entry_id],
                    documents=[entry_text],
                    metadatas=[metadata]
                )
            
            # Sauvegarder également en base de données relationnelle
            try:
                # Préparer les données source à sauvegarder
                source_data_to_save = {}
                if source_data:
                    if isinstance(source_data, dict):
                        # Pour les documents, extraire les champs pertinents
                        source_data_to_save = {
                            "document_type": source_data.get("document_type", "unknown"),
                            "excerpt": source_data.get("full_text", "")[:2000] if "full_text" in source_data else "",
                            "confidence": source_data.get("confidence", 0)
                        }
                    else:
                        # Pour les prompts
                        source_data_to_save = {"prompt_text": source_data}
                
                journal_entry = JournalEntry(
                    date=datetime.strptime(entry["date"], "%d/%m/%Y").date() if "date" in entry else datetime.now().date(),
                    piece_reference=entry.get("piece_reference", ""),
                    description=entry.get("description", ""),
                    debit_data=entry.get("debit", []),
                    credit_data=entry.get("credit", []),
                    source_data=source_data_to_save,
                    source_type=source_type,
                    created_by_id=self.user_id  # Associer l'utilisateur
                )
                journal_entry.save()
                print(f"Entry saved to database: {journal_entry.id}")
            except Exception as db_error:
                print(f"Error saving entry to database: {db_error}")
            
            return {"status": "success", "message": "Écriture ajoutée à l'historique", "entry_id": entry_id}
        
        except Exception as e:
            print(f"Erreur lors de l'ajout à l'historique: {e}")
            return {"status": "error", "message": f"Erreur: {str(e)}"}

    def _get_or_create_conversation(self, conversation_id=None):
        """
        Récupère ou crée une conversation pour le chat.
        """
        try:
            if conversation_id:
                try:
                    # Tenter de récupérer une conversation existante
                    conversation = ChatConversation.objects.get(
                        conversation_id=conversation_id, 
                        user_id=self.user_id
                    )
                    return conversation
                except ChatConversation.DoesNotExist:
                    pass
            
            # Créer une nouvelle conversation si aucune n'existe ou n'est spécifiée
            new_id = f"conv_{uuid.uuid4()}"
            user = User.objects.get(id=self.user_id)
            conversation = ChatConversation(conversation_id=new_id, user=user)
            conversation.save()
            return conversation
        except Exception as e:
            print(f"Erreur lors de la création de la conversation: {e}")
            # Créer un identifiant de conversation même en cas d'échec pour pouvoir continuer
            return {"conversation_id": f"error_conv_{uuid.uuid4()}", "error": str(e)}

    def _get_conversation_history(self, conversation_id):
        """
        Récupère l'historique des messages d'une conversation spécifique.
        """
        try:
            # Récupérer la conversation
            conversation = None
            try:
                conversation = ChatConversation.objects.get(conversation_id=conversation_id)
            except ChatConversation.DoesNotExist:
                print(f"Conversation {conversation_id} not found in database")
                return []
            except Exception as db_error:
                print(f"Database error retrieving conversation: {db_error}")
                # Fallback au stockage en mémoire si disponible
                if conversation_id in self.conversation_storage:
                    return self.conversation_storage[conversation_id]
                return []
                
            # Récupérer les messages de cette conversation
            messages = ChatMessage.objects.filter(conversation=conversation).order_by('timestamp')
            
            # Convertir en format attendu pour le contexte
            history = []
            for msg in messages:
                history.append({
                    "role": "user" if msg.is_user else "assistant",
                    "content": msg.content,
                    "is_user": msg.is_user,
                    "timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
                    "relevant_entries": msg.relevant_entries
                })
                
            print(f"Retrieved {len(history)} messages from database for conversation {conversation_id}")
            return history
            
        except Exception as e:
            print(f"Error retrieving conversation history: {e}")
            return []

    def _get_relevant_accounting_entries(self, query, max_entries=5):
        """
        Récupère les écritures comptables pertinentes par rapport à une requête,
        indépendamment de la conversation en cours.
        """
        try:
            # 1. D'abord, essayons de trouver des écritures via la recherche vectorielle
            relevant_entries = []
            
            if self.entries_collection and self.openai_ef:
                # With OpenAI embedding function, we can query directly with text
                # ChromaDB will generate embeddings automatically
                
                # Filtrage strict par isolation - CRITIQUE pour la sécurité
                where_clause = {
                    "$and": [
                        {"user_id": str(self.user_id)} if self.user_id else {"user_id": {"$ne": None}},
                    ]
                }
                
                # Ajouter filtrage par company_id ou institution_id selon le type d'utilisateur
                if self.customer_type == 'institution' and self.institution_id:
                    where_clause["$and"].append({"institution_id": str(self.institution_id)})
                elif self.company_id:
                    where_clause["$and"].append({"company_id": str(self.company_id)})
                
                # Rechercher dans la base vectorielle avec isolation stricte
                # With OpenAI embedding function, use query_texts instead of query_embeddings
                results = self.entries_collection.query(
                    query_texts=[query],
                    n_results=max_entries,
                    where=where_clause,
                    include=['metadatas', 'documents', 'distances']
                )
                
                # Récupérer les entrées pertinentes
                if results and results.get('ids') and len(results['ids'][0]) > 0:
                    for i, entry_id in enumerate(results['ids'][0]):
                        try:
                            metadata = results['metadatas'][0][i] if results.get('metadatas') else {}
                            
                            # Vérifier si l'entrée appartient à l'utilisateur actuel ou est globale
                            # Si pas d'utilisateur spécifié, on prend toutes les entrées
                            if not self.user_id or not metadata.get('user_id') or \
                               str(metadata.get('user_id')) == str(self.user_id) or \
                               metadata.get('user_id') == "global":
                                
                                # Extraire les données de l'écriture
                                if 'entry_data' in metadata:
                                    entry_data = json.loads(metadata['entry_data'])
                                    
                                    # Ajouter les données source à l'entrée pour enrichir le contexte
                                    if 'source_extract' in metadata and metadata['source_extract']:
                                        entry_data['source_extract'] = metadata['source_extract']
                                    if 'source_prompt' in metadata and metadata['source_prompt']:
                                        entry_data['source_prompt'] = metadata['source_prompt']
                                    if 'source_type' in metadata:
                                        entry_data['source_type'] = metadata['source_type']
                                        
                                    relevant_entries.append(entry_data)
                        except Exception as e:
                            print(f"Erreur lors de la récupération de l'entrée {entry_id}: {e}")
                           
            # 2. Si aucun résultat ou peu de résultats, compléter avec des requêtes sur la base relationnelle
            if len(relevant_entries) < max_entries:
                db_entries = self._fallback_entries_search(query, max_entries - len(relevant_entries))
                
                # Ajouter uniquement les entrées qui ne sont pas déjà présentes
                for entry in db_entries:
                    if not any(e.get('piece_reference') == entry.get('piece_reference') for e in relevant_entries):
                        relevant_entries.append(entry)
                        
            print(f"Found {len(relevant_entries)} relevant entries for query: {query}")
            return relevant_entries
            
        except Exception as e:
            print(f"Erreur lors de la recherche d'écritures comptables: {e}")
            return self._fallback_entries_search(query, max_entries)

    def _fallback_entries_search(self, query, max_entries=5):
        """
        Méthode de secours pour rechercher des écritures via la base de données relationnelle.
        Accessible indépendamment de la conversation en cours.
        """
        try:
            # Extraire des mots-clés potentiels de la requête
            keywords = self._extract_keywords(query)
            
            # Construire une requête pour la base de données
            db_query = Q()
            
            # Si des mots-clés ont été extraits, les utiliser pour filtrer
            if keywords:
                for keyword in keywords:
                    if len(keyword) > 2:  # Ignorer les mots très courts
                        db_query |= Q(description__icontains=keyword)
                        db_query |= Q(piece_reference__icontains=keyword)
                        db_query |= Q(debit_data__contains=[{"libelle": keyword}])
                        db_query |= Q(credit_data__contains=[{"libelle": keyword}])
                        # Pour les numéros de compte
                        if keyword.isdigit():
                            db_query |= Q(debit_data__contains=[{"compte": keyword}])
                            db_query |= Q(credit_data__contains=[{"compte": keyword}])
            
            # Si l'utilisateur est spécifié, filtrer par utilisateur ou entrées publiques
            if self.user_id:
                user_filter = Q(created_by_id=self.user_id) | Q(created_by__isnull=True)
                db_query = db_query & user_filter if db_query else user_filter
            
            # Exécuter la requête
            if db_query:
                db_entries = JournalEntry.objects.filter(db_query).order_by('-date')[:max_entries]
            else:
                # Si pas de mots-clés ou requête vide, prendre les entrées les plus récentes
                if self.user_id:
                    db_entries = JournalEntry.objects.filter(
                        Q(created_by_id=self.user_id) | Q(created_by__isnull=True)
                    ).order_by('-date')[:max_entries]
                else:
                    db_entries = JournalEntry.objects.all().order_by('-date')[:max_entries]
            
            # Convertir les entrées au format attendu
            formatted_entries = []
            for entry in db_entries:
                formatted_entries.append({
                    "id": entry.id,
                    "date": entry.date.strftime("%d/%m/%Y"),
                    "piece_reference": entry.piece_reference,
                    "description": entry.description,
                    "debit": entry.debit_data,
                    "credit": entry.credit_data,
                    "journal": "JO"  # Journal par défaut
                })
                
            return formatted_entries
            
        except Exception as e:
            print(f"Erreur lors de la recherche d'écritures dans la base de données: {e}")
            return []

    def chat(self, prompt, conversation_id=None, user_context=None):
        """
        Discute avec l'agent en utilisant l'historique des écritures comptables comme contexte.
        
        Args:
            prompt (str): La question ou l'instruction de l'utilisateur
            conversation_id (str, optional): L'identifiant de la conversation pour le suivi du contexte
            user_context (dict, optional): Contexte utilisateur pour personnaliser la réponse
            
        Returns:
            dict: La réponse de l'agent
        """
        debug_info = {"etape": "debut_chat", "prompt": prompt, "conversation_id": conversation_id}
        print(f"HistoryAgent.chat: prompt={prompt}, conversation_id={conversation_id}")
        
        try:
            # Format du nom d'utilisateur pour la personnalisation
            user_greeting = ""
            company_context = ""
            
            if user_context:
                user_name = user_context.get('name')
                company_name = user_context.get('company')
                is_new_conversation = user_context.get('is_new_conversation', False)
                
                if user_name:
                    user_greeting = f"Bonjour {user_name}, "
                    
                if company_name:
                    company_context = f"En tant que comptable de {company_name}, "
                    
                # Ajouter une salutation spéciale pour les nouvelles conversations
                if is_new_conversation:
                    user_greeting += "ravi de vous assister aujourd'hui! "
            
            # Récupérer les messages de conversation précédents pour le contexte
            conversation_history = []
            if conversation_id:
                try:
                    conversation_history = self._get_conversation_history(conversation_id)
                    debug_info["conversation_history_length"] = len(conversation_history)
                except Exception as history_error:
                    print(f"Erreur lors de la récupération de l'historique de conversation: {history_error}")
                    debug_info["conversation_history_error"] = str(history_error)
            
            # Trouver les écritures pertinentes depuis l'historique global (indépendamment de la conversation)
            relevant_entries = self._get_relevant_accounting_entries(prompt, max_entries=5)
            debug_info["relevant_entries_count"] = len(relevant_entries)
            
            # Préparer un prompt enrichi avec identité éthique ADHA, contexte conversation et écritures pertinentes
            base_identity = ADHAIdentity.get_system_prompt(mode="chat")
            
            system_prompt = f"""{base_identity}

## INSTRUCTIONS TECHNIQUES COMPTABLES

{company_context}Répondez précisément aux questions en utilisant les données des écritures comptables fournies si pertinent.

IMPORTANT - Outils de calcul disponibles:
Vous avez accès à des outils de calcul précis. Utilisez-les OBLIGATOIREMENT pour tous les calculs (TVA, arithmétique, soldes comptables, pourcentages, etc.).
Ne faites JAMAIS de calculs manuels - utilisez toujours les outils appropriés pour garantir la précision.

Règles importantes:
1. Soyez précis et factuel dans vos réponses en vous basant sur les données comptables.
2. Restez professionnel tout en étant cordial et naturel dans le dialogue en français.
3. Identifiez les écritures pertinentes pour répondre à la question.
4. UTILISEZ LES OUTILS DE CALCUL pour toute opération arithmétique ou comptable.
5. Expliquez toujours votre raisonnement de manière pédagogique.
6. Présentez les résultats de calculs de manière claire et formatée.

Pour toute question sur un compte, utilisez le format SYSCOHADA: Numéro + Nom du compte (ex: "512 - Banque").
"""
            
            # Construire le contexte de conversation pour l'API
            messages = [{"role": "system", "content": system_prompt}]
            
            # Limiter l'historique aux 10 derniers échanges pour éviter des contextes trop longs
            recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
            
            # Ajouter l'historique récent de conversation
            for message in recent_history:
                role = "user" if message.get("is_user", False) else "assistant"
                messages.append({"role": role, "content": message.get("content", "")})
            
            # Ajouter le contexte des écritures pertinentes (AVANT la demande actuelle)
            if relevant_entries:
                entries_context = "\n\nVoici les écritures comptables pertinentes de la base de données:\n"
                
                for i, entry in enumerate(relevant_entries[:5]):  # Limiter à 5 écritures pour le contexte
                    entries_context += f"\nÉcriture {i+1}:\n"
                    entries_context += f"Date: {entry.get('date', 'N/A')}\n"
                    entries_context += f"Description: {entry.get('description', 'N/A')}\n"
                    entries_context += f"Référence: {entry.get('piece_reference', 'N/A')}\n"
                    
                    debits = entry.get('debit', [])
                    entries_context += "Débit:\n"
                    for debit in debits:
                        entries_context += f"- {debit.get('compte', 'N/A')}: {debit.get('montant', 0)} ({debit.get('libelle', 'N/A')})\n"
                    
                    credits = entry.get('credit', [])
                    entries_context += "Crédit:\n"
                    for credit in credits:
                        entries_context += f"- {credit.get('compte', 'N/A')}: {credit.get('montant', 0)} ({credit.get('libelle', 'N/A')})\n"
                    
                    entries_context += "\n"
                
                # Ajouter le contexte des écritures en tant qu'assistant
                messages.append({
                    "role": "assistant", 
                    "content": "Pour répondre à votre question, j'ai consulté l'historique des écritures comptables. "
                               "Voici les écritures pertinentes que j'ai trouvées:"
                })
                messages.append({"role": "assistant", "content": entries_context})
            
            # --- Ajout RAG documentaire ---
            try:
                retriever_agent = RetrieverAgent()
                rag_docs = retriever_agent.retrieve_adha_context(prompt, top_k=3)
                if rag_docs:
                    rag_context = '\n\n'.join(rag_docs)
                    messages.append({
                        "role": "assistant",
                        "content": "Voici des extraits de documents pertinents issus de la base documentaire :"
                    })
                    messages.append({
                        "role": "assistant",
                        "content": rag_context
                    })
            except Exception as rag_e:
                print(f"Erreur RAG documentaire: {rag_e}")
        
            # Ajouter la demande actuelle
            messages.append({"role": "user", "content": prompt})
            
            debug_info["full_prompt"] = messages
            
            # Appeler le modèle de langage avec les outils de calcul
            try:
                response = self.client.chat.completions.create(
                    model="gpt-4o-2024-08-06",
                    messages=messages,
                    tools=self.tool_system.get_openai_function_definitions(),
                    tool_choice="auto",  # Le LLM décide quand utiliser les outils
                    temperature=0.7,
                    max_tokens=1500,
                    top_p=1.0,
                    frequency_penalty=0.0,
                    presence_penalty=0.0
                )
                
                response_message = response.choices[0].message
                
                # Traiter les appels d'outils si présents
                if response_message.tool_calls:
                    # Le LLM veut utiliser des outils de calcul
                    messages.append(response_message)
                    
                    # Exécuter chaque outil demandé
                    for tool_call in response_message.tool_calls:
                        function_name = tool_call.function.name
                        function_args = json.loads(tool_call.function.arguments)
                        
                        # Exécuter l'outil
                        tool_result = self.tool_system.execute_tool(function_name, function_args)
                        
                        # Ajouter le résultat du calcul au contexte
                        tool_message = {
                            "tool_call_id": tool_call.id,
                            "role": "tool",
                            "name": function_name,
                            "content": json.dumps(tool_result)
                        }
                        messages.append(tool_message)
                    
                    # Demander au LLM de formuler une réponse finale avec les résultats des calculs
                    final_response = self.client.chat.completions.create(
                        model="gpt-4o-2024-08-06",
                        messages=messages,
                        temperature=0.7,
                        max_tokens=1500
                    )
                    
                    ai_response = final_response.choices[0].message.content
                else:
                    # Pas d'outils utilisés, réponse directe
                    ai_response = response_message.content
                
                # Personnaliser la réponse avec le nom d'utilisateur si disponible
                if user_greeting and not any(greeting in ai_response.lower() for greeting in ["bonjour", "salut", "hello"]):
                    ai_response = f"{user_greeting}{ai_response}"
                
                debug_info["etape"] = "completé"
            except Exception as api_error:
                print(f"Erreur lors de l'appel à l'API OpenAI: {api_error}")
                debug_info["etape"] = "erreur_api"
                debug_info["api_error"] = str(api_error)
                return {"erreur": f"Erreur lors de l'appel à l'API: {str(api_error)}", "debug_info": debug_info}
            
            # Générer un ID de message pour le message courant
            message_id = str(uuid.uuid4())
            
            # Sauvegarder la conversation pour de futures interactions
            conversation = None
            if conversation_id:
                try:
                    # Récupérer ou créer la conversation
                    conversation = self._get_or_create_conversation(conversation_id)
                    if not isinstance(conversation, dict):  # Vérifier qu'on a bien un objet conversation et pas un dict d'erreur
                        # Sauvegarder le message de l'utilisateur
                        user_msg = ChatMessage(
                            message_id=str(uuid.uuid4()),
                            conversation=conversation,
                            is_user=True,
                            content=prompt,
                            relevant_entries=[]
                        )
                        user_msg.save()
                        
                        # Sauvegarder la réponse de l'IA avec les écritures pertinentes
                        ai_msg = ChatMessage(
                            message_id=message_id,
                            conversation=conversation,
                            is_user=False,
                            content=ai_response,
                            relevant_entries=[self._format_entry_for_response(entry) for entry in relevant_entries[:3]]
                        )
                        ai_msg.save()
                        
                        # Mise à jour de la date de dernière activité de la conversation
                        conversation.updated_at = datetime.now()
                        conversation.save()
                except Exception as save_error:
                    print(f"Erreur lors de la sauvegarde de la conversation: {save_error}")
                    debug_info["save_error"] = str(save_error)
            
            # Préparer la réponse
            result = {
                "response": ai_response,
                "conversation_id": conversation_id if conversation_id else (conversation.conversation_id if conversation else None),
                "message_id": message_id,
                "conversation_context": [{
                    "role": "user" if msg.get("is_user", False) else "assistant",
                    "content": self._truncate_text(msg.get("content", ""), 100)
                } for msg in recent_history],
                "relevant_entries": [self._format_entry_for_response(entry) for entry in relevant_entries[:3]],
                "debug_info": debug_info
            }
            
            return result
        except Exception as e:
            print(f"Erreur dans HistoryAgent.chat: {e}")
            debug_info["etape"] = "erreur"
            debug_info["error"] = str(e)
            return {"erreur": f"Erreur lors du traitement: {str(e)}", "debug_info": debug_info}

    def chat_stream(self, prompt, conversation_id=None, user_context=None):
        """
        Version streaming de chat avec support des outils de calcul.
        Le LLM peut appeler des outils pendant le streaming.
        """
        debug_info = {"etape": "debut_chat_stream", "prompt": prompt, "conversation_id": conversation_id}
        try:
            user_greeting = ""
            company_context = ""
            if user_context:
                user_name = user_context.get('name')
                company_name = user_context.get('company')
                is_new_conversation = user_context.get('is_new_conversation', False)
                if user_name:
                    user_greeting = f"Bonjour {user_name}, "
                if company_name:
                    company_context = f"En tant que comptable de {company_name}, "
                if is_new_conversation:
                    user_greeting += "ravi de vous assister aujourd'hui! "
            
            conversation_history = []
            if conversation_id:
                try:
                    conversation_history = self._get_conversation_history(conversation_id)
                except Exception as history_error:
                    debug_info["conversation_history_error"] = str(history_error)
            
            relevant_entries = self._get_relevant_accounting_entries(prompt, max_entries=5)
            
            base_identity = ADHAIdentity.get_system_prompt(mode="chat")
            
            system_prompt = f"""{base_identity}

## INSTRUCTIONS TECHNIQUES COMPTABLES

{company_context}Répondez précisément aux questions en utilisant les données des écritures comptables fournies si pertinent.

IMPORTANT - Outils de calcul disponibles:
Vous avez accès à des outils de calcul précis. Utilisez-les OBLIGATOIREMENT pour tous les calculs (TVA, arithmétique, soldes comptables, pourcentages, etc.).
Ne faites JAMAIS de calculs manuels - utilisez toujours les outils appropriés pour garantir la précision.

Règles importantes:
1. Soyez précis et factuel dans vos réponses en vous basant sur les données comptables.
2. Restez professionnel tout en étant cordial et naturel dans le dialogue en français.
3. Identifiez les écritures pertinentes pour répondre à la question.
4. UTILISEZ LES OUTILS DE CALCUL pour toute opération arithmétique ou comptable.
5. Expliquez toujours votre raisonnement de manière pédagogique.
6. Présentez les résultats de calculs de manière claire et formatée.

Pour toute question sur un compte, utilisez le format SYSCOHADA: Numéro + Nom du compte (ex: "512 - Banque").
"""
            
            messages = [{"role": "system", "content": system_prompt}]
            
            # Ajouter l'historique et contexte
            recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
            for message in recent_history:
                role = "user" if message.get("is_user", False) else "assistant"
                messages.append({"role": role, "content": message.get("content", "")})
            
            # Ajouter le contexte des écritures pertinentes
            if relevant_entries:
                entries_context = "\\n\\nVoici les écritures comptables pertinentes de la base de données:\\n"
                for i, entry in enumerate(relevant_entries[:5]):
                    entries_context += f"\\nÉcriture {i+1}:\\n"
                    entries_context += f"Date: {entry.get('date', 'N/A')}\\n"
                    entries_context += f"Description: {entry.get('description', 'N/A')}\\n"
                    entries_context += f"Référence: {entry.get('piece_reference', 'N/A')}\\n"
                    
                    debits = entry.get('debit', [])
                    entries_context += "Débit:\\n"
                    for debit in debits:
                        entries_context += f"- {debit.get('compte', 'N/A')}: {debit.get('montant', 0)} ({debit.get('libelle', 'N/A')})\\n"
                    
                    credits = entry.get('credit', [])
                    entries_context += "Crédit:\\n"
                    for credit in credits:
                        entries_context += f"- {credit.get('compte', 'N/A')}: {credit.get('montant', 0)} ({credit.get('libelle', 'N/A')})\\n"
                    
                    entries_context += "\\n"
                
                messages.append({"role": "assistant", "content": entries_context})
            
            # Ajouter la demande actuelle
            messages.append({"role": "user", "content": prompt})
            
            # Streaming avec support des outils
            stream = self.client.chat.completions.create(
                model="gpt-4o-2024-08-06",
                messages=messages,
                tools=self.tool_system.get_openai_function_definitions(),
                tool_choice="auto",
                temperature=0.7,
                max_tokens=1500,
                stream=True
            )
            
            # Variables pour gérer les appels d'outils en streaming
            current_tool_calls = {}
            accumulated_content = ""
            
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    # Contenu de réponse normale
                    content = chunk.choices[0].delta.content
                    accumulated_content += content
                    yield content
                
                elif chunk.choices[0].delta.tool_calls:
                    # Le LLM veut utiliser un outil
                    for tool_call_delta in chunk.choices[0].delta.tool_calls:
                        if tool_call_delta.id:
                            # Début d'un nouvel appel d'outil
                            current_tool_calls[tool_call_delta.id] = {
                                'function': {
                                    'name': tool_call_delta.function.name if tool_call_delta.function.name else '',
                                    'arguments': tool_call_delta.function.arguments if tool_call_delta.function.arguments else ''
                                }
                            }
                        else:
                            # Continuation des arguments de l'outil
                            for call_id, call_data in current_tool_calls.items():
                                if tool_call_delta.function.arguments:
                                    call_data['function']['arguments'] += tool_call_delta.function.arguments
                
                elif chunk.choices[0].finish_reason == "tool_calls":
                    # Le LLM a terminé les appels d'outils, les exécuter
                    yield "\\n\\n🔧 *Exécution des calculs...*\\n\\n"
                    
                    tool_results = []
                    for call_id, call_data in current_tool_calls.items():
                        function_name = call_data['function']['name']
                        function_args = json.loads(call_data['function']['arguments'])
                        
                        # Exécuter l'outil
                        tool_result = self.tool_system.execute_tool(function_name, function_args)
                        tool_results.append(tool_result)
                        
                        # Streamer le résultat du calcul
                        if tool_result.get('success'):
                            yield f"✅ **{function_name}**: {tool_result.get('formatted_result', 'Calcul effectué')}\\n\\n"
                        else:
                            yield f"❌ **Erreur de calcul**: {tool_result.get('error', 'Erreur inconnue')}\\n\\n"
                    
                    # Maintenant demander au LLM de formuler une réponse finale
                    yield "📝 *Formulation de la réponse...*\\n\\n"
                    
                    # Ajouter les résultats des outils au contexte
                    for i, (call_id, call_data) in enumerate(current_tool_calls.items()):
                        messages.append({
                            "tool_call_id": call_id,
                            "role": "tool", 
                            "name": call_data['function']['name'],
                            "content": json.dumps(tool_results[i])
                        })
                    
                    # Demander la réponse finale en streaming
                    final_stream = self.client.chat.completions.create(
                        model="gpt-4o-2024-08-06",
                        messages=messages,
                        temperature=0.7,
                        max_tokens=1000,
                        stream=True
                    )
                    
                    for final_chunk in final_stream:
                        if final_chunk.choices[0].delta.content:
                            yield final_chunk.choices[0].delta.content
                    
                    break
                
        except Exception as e:
            yield f"\\n\\n❌ Erreur lors du streaming: {str(e)}"
            # Appel OpenAI en mode stream
            try:
                response = self.client.chat.completions.create(
                    model="gpt-4o-2024-08-06",
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1000,
                    top_p=1.0,
                    frequency_penalty=0.0,
                    presence_penalty=0.0,
                    stream=True
                )
                first_chunk = True
                for chunk in response:
                    content = chunk.choices[0].delta.content if chunk.choices[0].delta else ""
                    if content:
                        # Ajouter le user_greeting au tout début
                        if first_chunk and user_greeting:
                            yield user_greeting + content
                            first_chunk = False
                        else:
                            yield content
            except Exception as api_error:
                yield f"[ERREUR LLM: {str(api_error)}]"
        except Exception as e:
            yield f"[ERREUR AGENT: {str(e)}]"

    def get_account_summary(self, account, start_date=None, end_date=None):
        """
        Génère un résumé des mouvements d'un compte spécifique.
        """
        try:
            # Filtrer les écritures par compte
            query = Q()
            
            # Ajouter le compte au débit
            query |= Q(debit_data__contains=[{"compte": account}])
            
            # Ajouter le compte au crédit
            query |= Q(credit_data__contains=[{"compte": account}])
            
            entries = JournalEntry.objects.filter(query)
            
            # Filtre par date si spécifié
            if start_date:
                entries = entries.filter(date__gte=start_date)
            if end_date:
                entries = entries.filter(date__lte=end_date)
            
            # Filtrer par utilisateur si spécifié
            if self.user_id:
                entries = entries.filter(Q(created_by_id=self.user_id) | Q(created_by__isnull=True))
            
            # Calculer le total des débits et crédits pour ce compte
            total_debit = 0
            total_credit = 0
            movements = []
            
            for entry in entries:
                # Chercher dans les débits
                debit_amount = 0
                for debit in entry.debit_data:
                    if debit.get("compte") == account:
                        debit_amount += float(debit.get("montant", 0))
                
                # Chercher dans les crédits
                credit_amount = 0
                for credit in entry.credit_data:
                    if credit.get("compte") == account:
                        credit_amount += float(credit.get("montant", 0))
                
                # Ajouter au total
                total_debit += debit_amount
                total_credit += credit_amount
                
                # Ajouter aux mouvements si concerné
                if debit_amount > 0 or credit_amount > 0:
                    movements.append({
                        "date": entry.date.strftime("%d/%m/%Y"),
                        "description": entry.description,
                        "debit": debit_amount,
                        "credit": credit_amount,
                        "entry_id": f"entry_{entry.id}"
                    })
            
            return {
                "account": account,
                "total_debit": total_debit,
                "total_credit": total_credit,
                "balance": total_debit - total_credit,
                "movements": movements,
                "entry_count": len(movements)
            }
            
        except Exception as e:
            print(f"Erreur lors de la génération du résumé de compte: {e}")
            return {
                "account": account,
                "error": str(e),
                "entry_count": 0
            }
    
    def _truncate_text(self, text, max_length=100):
        """
        Tronque un texte à la longueur spécifiée.
        """
        if not text:
            return ""
        if len(text) <= max_length:
            return text
        return text[:max_length] + "..."

    def _extract_keywords(self, text: str) -> List[str]:
        """
        Extract potential accounting-related keywords from text.
        
        Args:
            text (str): The text to analyze
            
        Returns:
            List[str]: Extracted keywords
        """
        # Basic keyword extraction - in production use NLP or LLM
        accounting_terms = [
            "facture", "paiement", "achat", "vente", "client", "fournisseur",
            "banque", "caisse", "dette", "créance", "TVA", "impôt",
            "salaire", "immobilisation", "amortissement", "stock"
        ]
        
        # Pattern pour extraire des comptes SYSCOHADA
        account_pattern = r'\b\d{3,6}\b'  # Format: 3 à 6 chiffres
        
        # Extract numbers that might be dates, amounts, or reference numbers
        amount_pattern = r'\b\d+(?:[.,]\d+)?\b'
        date_pattern = r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b'
        ref_pattern = r'\b[A-Z0-9]{2,}-\d+\b|\b[A-Z0-9]+\d+[A-Z0-9]*\b'
        
        # Combine extracted information
        keywords = []
        
        # Add accounting terms found in the text
        for term in accounting_terms:
            if re.search(r'\b' + re.escape(term) + r'\b', text.lower()):
                keywords.append(term)
        
        # Add account numbers
        accounts = re.findall(account_pattern, text)
        if accounts:
            keywords.extend(accounts)
        
        # Add amounts, dates and references
        amounts = re.findall(amount_pattern, text)
        dates = re.findall(date_pattern, text)
        refs = re.findall(ref_pattern, text)
        
        keywords.extend(amounts + dates + refs)
        
        return list(set(keywords))  # Remove duplicates

    def _format_entry_for_response(self, entry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format a journal entry for the API response.
        
        Args:
            entry (Dict[str, Any]): The journal entry to format
            
        Returns:
            Dict[str, Any]: The formatted entry
        """
        try:
            formatted = {
                "id": entry.get("id"),
                "date": entry.get("date"),
                "description": entry.get("description"),
                "piece_reference": entry.get("piece_reference"),
                "debit_total": sum(item.get("montant", 0) for item in entry.get("debit", [])),
                "credit_total": sum(item.get("montant", 0) for item in entry.get("credit", [])),
                "debit": [{
                    "compte": item.get("compte", ""),
                    "montant": item.get("montant", 0),
                    "libelle": item.get("libelle", "")
                } for item in entry.get("debit", [])],
                "credit": [{
                    "compte": item.get("compte", ""),
                    "montant": item.get("montant", 0),
                    "libelle": item.get("libelle", "")
                } for item in entry.get("credit", [])]
            }
            return formatted
        except Exception as e:
            print(f"Error formatting entry: {e}")
            return entry  # Return original if formatting fails

    def search_entries(self, search_query, user_only=True):
        """
        Recherche des écritures comptables à partir d'une requête en langage naturel.
        Cette méthode peut être appelée en dehors d'une conversation pour obtenir l'historique.
        
        Args:
            search_query (str): Requête de recherche
            user_only (bool): Si True, limite la recherche aux entrées de l'utilisateur actuel
            
        Returns:
            List[Dict]: Liste des écritures comptables pertinentes
        """
        # Temporairement sauvegarder l'ID utilisateur actuel
        original_user_id = self.user_id
        
        try:
            # Si user_only=False et qu'un utilisateur est défini, on recherche toutes les entrées
            if not user_only:
                temp_user_id = self.user_id
                self.user_id = None
            
            # Utiliser la méthode existante pour trouver des écritures
            relevant_entries = self._get_relevant_accounting_entries(search_query, max_entries=10)
            
            # Restaurer l'ID utilisateur si modifié
            if not user_only:
                self.user_id = temp_user_id
                
            # Formatter les entrées trouvées
            formatted_entries = [self._format_entry_for_response(entry) for entry in relevant_entries]
            
            return {
                "query": search_query,
                "entries": formatted_entries,
                "count": len(formatted_entries)
            }
            
        except Exception as e:
            print(f"Erreur lors de la recherche d'écritures: {e}")
            return {
                "query": search_query,
                "entries": [],
                "count": 0,
                "error": str(e)
            }
        finally:
            # Restaurer l'ID utilisateur original
            self.user_id = original_user_id

    def get_user_entries(self, limit=20):
        """
        Récupère les écritures comptables de l'utilisateur actuel.
        Cette méthode peut être utilisée pour afficher l'historique complet.
        
        Args:
            limit (int): Nombre maximal d'entrées à récupérer
            
        Returns:
            List[Dict]: Liste des écritures comptables de l'utilisateur
        """
        try:
            if not self.user_id:
                return {"error": "Aucun utilisateur spécifié", "entries": [], "count": 0}
            
            # Récupérer les entrées de l'utilisateur
            entries = JournalEntry.objects.filter(
                Q(created_by_id=self.user_id) | Q(created_by__isnull=True)
            ).order_by('-date', '-created_at')[:limit]
            
            # Formatter les entrées
            formatted_entries = []
            for entry in entries:
                formatted_entries.append({
                    "id": entry.id,
                    "date": entry.date.strftime("%d/%m/%Y"),
                    "piece_reference": entry.piece_reference,
                    "description": entry.description,
                    "debit_total": sum(item.get("montant", 0) for item in entry.debit_data),
                    "credit_total": sum(item.get("montant", 0) for item in entry.credit_data),
                    "debit": entry.debit_data,
                    "credit": entry.credit_data
                })
            
            return {
                "entries": formatted_entries,
                "count": len(formatted_entries)
            }
            
        except Exception as e:
            print(f"Erreur lors de la récupération des écritures utilisateur: {e}")
            return {"error": str(e), "entries": [], "count": 0}
