# agents/logic/retriever_agent.py
#!/usr/bin/env python
# -*- coding: utf-8 -*-

from pathlib import Path
# Assurez-vous que le chemin d'importation est correct pour votre structure de projet
# Exemple : from agents.vector_databases.chromadb_connector import ChromaDBConnector
# Si ChromaDBConnector est ailleurs, adaptez le chemin.
# Pour cet exemple, je suppose qu'il est accessible comme indiqué.
try:
    # Mettez ici le chemin d'import correct pour votre connecteur ChromaDB
    from agents.vector_databases.chromadb_connector import ChromaDBConnector
except ImportError:
    # Fournir une implémentation factice ou lever une erreur plus informative si nécessaire
    print("AVERTISSEMENT: ChromaDBConnector non trouvé à l'emplacement attendu. Utilisation d'un substitut factice.")
    class ChromaDBConnector: # Classe factice pour permettre l'exécution
        def __init__(self, *args, **kwargs): pass
        def get_or_create_collection(self, *args, **kwargs): return None

from typing import List
import os
from openai import OpenAI
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
import chromadb.utils.embedding_functions as embedding_functions

class RetrieverAgent:
    """
    Agent responsable de la récupération d'informations pertinentes depuis une base de connaissances vectorielle.
    """
    def __init__(self, model_path: str = None):
        """
        Initialise le RetrieverAgent.

        Args:
            model_path (str, optional): Chemin vers un modèle SentenceTransformer local ou
                                        nom d'un modèle sur Hugging Face Hub.
                                        Par défaut, utilise 'all-mpnet-base-v2'.
        """
        print("Retriever Agent initialized")

        # Configuration de la base de données vectorielle (ChromaDB ici)
        # S'assure que le chemin vers le dossier de persistance est correct
        db_persist_path = str(Path(__file__).resolve().parent.parent / "data" / "embeddings")
        print(f"Vector DB persistence directory: {db_persist_path}")
        # Crée le dossier s'il n'existe pas
        os.makedirs(db_persist_path, exist_ok=True)
        # Initialize OpenAI embedding function for ChromaDB
        # Read configuration from environment variables
        openai_api_key = os.environ.get("OPENAI_API_KEY")
        openai_model = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        self.openai_ef = embedding_functions.OpenAIEmbeddingFunction(
            api_key=openai_api_key,
            model_name=openai_model
        )
        print(f"OpenAI embeddings initialized with model: {openai_model}")
        
        self.vector_db_connector = ChromaDBConnector(
            persist_directory=db_persist_path,
            embedding_function=self.openai_ef
        )
        self.collection = self.vector_db_connector.get_or_create_collection(
            name="comptable_knowledge",
            embedding_function=self.openai_ef
        )
        if self.collection is None:
             print("AVERTISSEMENT: Échec de l'initialisation de la collection ChromaDB.")
        
        print("OpenAI embeddings initialized successfully (text-embedding-3-small)")

        # Ajout du retriever LangChain sur la collection documentaire
        adha_embeddings_path = os.path.join(os.path.dirname(__file__), '../../data/adha_context_embeddings')
        os.makedirs(adha_embeddings_path, exist_ok=True)
        
        # Use OpenAI embeddings for LangChain (read from environment)
        openai_embeddings = OpenAIEmbeddings(
            model=os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small"),
            openai_api_key=openai_api_key
        )
        
        self.adha_vectorstore = Chroma(
            collection_name="adha_context",
            embedding_function=openai_embeddings,
            persist_directory=adha_embeddings_path
        )
        self.adha_retriever = self.adha_vectorstore.as_retriever(search_kwargs={"k": 3})

        self.client = OpenAI()  # Pour les requêtes au LLM

    def retrieve_adha_context(self, query: str, top_k: int = 3) -> List[str]:
        """Récupère les documents contextuels pertinents via LangChain/Chroma."""
        try:
            docs = self.adha_retriever.get_relevant_documents(query)
            return [doc.page_content for doc in docs]
        except Exception as e:
            print(f"Erreur retrieval RAG: {e}")
            return []

    def retrieve(self, query: str, top_k: int = 3) -> List[str]:
        """Récupère les règles comptables pertinentes."""
        try:
            # 1. Charger les règles SYSCOHADA de base
            rules_path = os.path.join(os.path.dirname(__file__), "../../data/knowledge_base/knoleg.txt")
            with open(rules_path, "r", encoding="utf-8") as f:
                all_rules = f.read().strip()

            # 2. Vérifier si le texte de la requête est dans les règles
            relevant_text = ""
            sections = all_rules.split('\n\n')
            for section in sections:
                if any(keyword.lower() in section.lower() for keyword in query.lower().split()):
                    relevant_text += section + "\n\n"

            # 3. Si des règles pertinentes sont trouvées, les retourner
            if relevant_text.strip():
                print(f"Found relevant rules for query: {query}")
                return [relevant_text]

            # 4. Sinon, consulter le LLM
            print(f"No specific rules found, consulting LLM for: {query}")
            return self._get_rules_from_llm(query, all_rules)

        except Exception as e:
            print(f"Error retrieving rules: {e}")
            return self._get_rules_from_llm(query, "Rules not accessible")

    def _get_rules_from_llm(self, query: str, context: str) -> List[str]:
        """Consulte le LLM pour obtenir des règles SYSCOHADA."""
        try:
            response = self.client.chat.completions.create(
                model=os.environ.get("OPENAI_CHAT_MODEL", "gpt-4o-2024-08-06"),
                messages=[
                    {
                        "role": "system",
                        "content": """Vous êtes un expert-comptable SYSCOHADA spécialisé.
                        Votre rôle est de fournir les règles comptables précises pour chaque situation.
                        Répondez toujours en citant les numéros de comptes et les règles spécifiques."""
                    },
                    {
                        "role": "user",
                        "content": f"""En vous basant sur le plan comptable SYSCOHADA :

                        QUESTION : {query}

                        CONTEXTE DES RÈGLES :
                        {context}

                        Fournissez les règles comptables précises et les comptes à utiliser pour cette situation.
                        """
                    }
                ],
                temperature=0.3,
                max_tokens=1000
            )

            llm_rules = response.choices[0].message.content
            print(f"LLM provided rules for query: {query}")
            return [llm_rules]

        except Exception as e:
            print(f"Error consulting LLM for rules: {e}")
            fallback_rules = """Règles par défaut SYSCOHADA:
            - Équilibre débit/crédit obligatoire
            - Utiliser les comptes appropriés selon la nature de l'opération
            - Documenter chaque écriture avec les pièces justificatives"""
            return [fallback_rules]