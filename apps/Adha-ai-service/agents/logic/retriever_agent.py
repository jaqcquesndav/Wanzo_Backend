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
from langchain.embeddings import SentenceTransformerEmbeddings

try:
    from sentence_transformers import SentenceTransformer  # type: ignore
except ImportError as e:
    # Cette erreur bloque l'exécution si sentence-transformers n'est pas là
    raise ImportError("Le module 'sentence-transformers' n'est pas installé. Veuillez l'installer avec 'pip install sentence-transformers'.")

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
        self.vector_db_connector = ChromaDBConnector(persist_directory=db_persist_path)
        self.collection = self.vector_db_connector.get_or_create_collection(name="comptable_knowledge")
        if self.collection is None:
             print("AVERTISSEMENT: Échec de l'initialisation de la collection ChromaDB.")

        # --- Initialisation CORRIGÉE du modèle d'embedding ---
        try:
            # Déterminer quel identifiant utiliser :
            # - Si un model_path a été explicitement fourni lors de la création de l'agent, on l'utilise.
            # - Sinon (cas par défaut), on utilise le nom standard 'all-mpnet-base-v2'.
            identifier_to_load = model_path if model_path is not None else 'all-mpnet-base-v2'

            print(f"Initializing SentenceTransformer with identifier: {identifier_to_load}") # Log utile

            # Charger le modèle en utilisant l'identifiant (nom ou chemin)
            # La bibliothèque gérera le cache ou le téléchargement si c'est un nom connu
            self.embedding_model = SentenceTransformer(identifier_to_load)
            print("SentenceTransformer model loaded successfully.")

        except ImportError as e:
             # Cette erreur ne devrait pas se produire si l'import initial a réussi, mais on la garde par sécurité
            raise ImportError("Erreur lors de l'importation de SentenceTransformer. Assurez-vous que 'sentence-transformers' est correctement installé.")
        except AttributeError as e:
             # Utile pour diagnostiquer les conflits de version (comme le NameError précédent)
             print(f"AttributeError during SentenceTransformer init: {e}")
             raise RuntimeError(f"Erreur critique : {e}. Cela peut être dû à une incompatibilité entre 'sentence-transformers' et 'transformers'/'accelerate'. Essayez 'pip install --upgrade sentence-transformers transformers accelerate'.")
        except Exception as e:
             # Capturer toute autre erreur pendant le chargement (ex: modèle non trouvé si chemin fourni, problème réseau...)
             print(f"Error during SentenceTransformer initialization: {type(e).__name__} - {repr(e)}")
             # Renvoyer l'exception pour indiquer clairement l'échec d'initialisation
             raise RuntimeError(f"Erreur lors de l'initialisation du modèle SentenceTransformer : {e}")
        # --- Fin de la section corrigée ---

        # Ajout du retriever LangChain sur la collection documentaire
        adha_embeddings_path = os.path.join(os.path.dirname(__file__), '../../data/adha_context_embeddings')
        os.makedirs(adha_embeddings_path, exist_ok=True)
        self.adha_vectorstore = Chroma(
            collection_name="adha_context",
            embedding_function=SentenceTransformerEmbeddings(model_name="all-mpnet-base-v2"),
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
                model="gpt-4o-2024-08-06",
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