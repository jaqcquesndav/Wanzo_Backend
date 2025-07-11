import requests
import tempfile
import os
from typing import List
from langchain.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma
from langchain.embeddings import SentenceTransformerEmbeddings
from django.conf import settings

ADMIN_SERVICE_URL = os.environ.get('ADMIN_SERVICE_URL', 'http://admin-service:3000/api/adha-context/sources')

class AdhaContextIngestor:
    """
    Récupère et indexe les documents actifs (livres, pdf, excel, etc.) depuis admin-service dans la base vectorielle via LangChain.
    """
    def __init__(self):
        embeddings_path = os.path.join(settings.BASE_DIR, 'data', 'adha_context_embeddings')
        os.makedirs(embeddings_path, exist_ok=True)
        self.embeddings = SentenceTransformerEmbeddings(model_name="all-mpnet-base-v2")
        self.persist_directory = embeddings_path
        self.collection_name = "adha_context"
        self.vectorstore = Chroma(
            collection_name=self.collection_name,
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory
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
                metadatas = []
                for doc in docs:
                    meta = dict(doc.metadata)
                    meta.update({
                        'id': src.get('id'),
                        'titre': src.get('titre'),
                        'description': src.get('description'),
                        'type': src.get('type'),
                        'tags': src.get('tags'),
                        'url': url
                    })
                    metadatas.append(meta)
                self.vectorstore.add_documents(docs, metadatas=metadatas)
            except Exception as e:
                print(f"Erreur indexation source {src.get('id')}: {e}")

    def refresh(self):
        # Supprime et réindexe tout
        self.vectorstore.delete_collection()
        self.vectorstore = Chroma(
            collection_name=self.collection_name,
            embedding_function=self.embeddings,
            persist_directory=self.persist_directory
        )
        self.index_sources()

# Utilisation (exemple):
# ingestor = AdhaContextIngestor()
# ingestor.refresh()
