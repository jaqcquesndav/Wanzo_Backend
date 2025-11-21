import requests
import tempfile
import os
from typing import List
from agents.utils.custom_loaders import PyPDFLoader
from agents.utils.text_splitter import RecursiveCharacterTextSplitter
from agents.vector_databases.chromadb_connector import ChromaDBConnector
import chromadb.utils.embedding_functions as embedding_functions
from django.conf import settings
import os

ADMIN_SERVICE_URL = os.environ.get('ADMIN_SERVICE_URL', 'http://admin-service:3000/api/adha-context/sources')

class AdhaContextIngestor:
    """
    Récupère et indexe les documents actifs (livres, pdf, excel, etc.) depuis admin-service dans la base vectorielle via LangChain.
    """
    def __init__(self):
        embeddings_path = os.path.join(settings.BASE_DIR, 'data', 'adha_context_embeddings')
        os.makedirs(embeddings_path, exist_ok=True)
        
        # Use OpenAI embeddings instead of SentenceTransformer
        openai_api_key = os.environ.get("OPENAI_API_KEY")
        openai_model = os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
        
        self.openai_ef = embedding_functions.OpenAIEmbeddingFunction(
            api_key=openai_api_key,
            model_name=openai_model
        )
        
        self.persist_directory = embeddings_path
        self.collection_name = "adha_context"
        
        # Use ChromaDB directly instead of LangChain wrapper
        self.db_connector = ChromaDBConnector(
            persist_directory=self.persist_directory,
            embedding_function=self.openai_ef
        )
        self.collection = self.db_connector.get_or_create_collection(
            name=self.collection_name,
            embedding_function=self.openai_ef
        )

    def fetch_active_sources(self) -> List[dict]:
        resp = requests.get(ADMIN_SERVICE_URL, params={"active": "true", "pageSize": 100})
        resp.raise_for_status()
        return resp.json().get('data', [])

    def download_pdf(self, url: str) -> str:
        # Télécharge le PDF et retourne le chemin local temporaire
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            r = requests.get(url, stream=True)
            for chunk in r.iter_content(chunk_size=8192):
                tmp.write(chunk)
            tmp.flush()
            return tmp.name

    def index_sources(self):
        sources = self.fetch_active_sources()
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        for src in sources:
            url = src.get('url')
            if not url:
                continue
            try:
                local_pdf = self.download_pdf(url)
                loader = PyPDFLoader(local_pdf)
                pages = loader.load()
                os.unlink(local_pdf)
                if not pages:
                    continue
                docs = splitter.split_documents(pages)
                
                # Prepare data for ChromaDB
                ids = []
                documents = []
                metadatas = []
                
                for i, doc in enumerate(docs):
                    ids.append(f"{src.get('id')}_{i}")
                    documents.append(doc.page_content)
                    
                    meta = {
                        'source_id': str(src.get('id')),
                        'titre': src.get('titre') or '',
                        'description': src.get('description') or '',
                        'type': src.get('type') or '',
                        'tags': str(src.get('tags') or ''),
                        'url': url,
                        'page': doc.metadata.get('page', 0)
                    }
                    metadatas.append(meta)
                
                # Add to ChromaDB (embeddings generated automatically)
                if documents:
                    self.collection.add(
                        ids=ids,
                        documents=documents,
                        metadatas=metadatas
                    )
            except Exception as e:
                print(f"Erreur indexation source {src.get('id')}: {e}")

    def refresh(self):
        # Supprime et réindexe tout
        try:
            self.db_connector.delete_collection(self.collection_name)
        except Exception as e:
            print(f"Collection deletion warning: {e}")
        
        # Recreate collection
        self.collection = self.db_connector.get_or_create_collection(
            name=self.collection_name,
            embedding_function=self.openai_ef
        )
        self.index_sources()

# Utilisation (exemple):
# ingestor = AdhaContextIngestor()
# ingestor.refresh()
