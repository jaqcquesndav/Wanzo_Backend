# agents/utils/knowledge_embedding.py
import os
from pathlib import Path
from typing import List
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
# Importez d'autres loaders si nécessaire (pour Excel, images OCR'd, etc.)
from agents.vector_databases.chromadb_connector import ChromaDBConnector
import chromadb.utils.embedding_functions as embedding_functions
from openai import OpenAI

class KnowledgeEmbedder:
    def __init__(self, embedding_model_name=None, chunk_size=1000, chunk_overlap=100):
        # Read configuration from environment variables
        openai_api_key = os.environ.get("OPENAI_API_KEY")
        self.embedding_model_name = embedding_model_name or os.environ.get("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
        
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required for knowledge embedder")
        
        self.text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        # Use OpenAI embeddings API instead of local SentenceTransformer
        self.client = OpenAI(api_key=openai_api_key)
        self.openai_ef = embedding_functions.OpenAIEmbeddingFunction(
            api_key=openai_api_key,
            model_name=self.embedding_model_name
        )
        print(f"Knowledge embedder: OpenAI initialized with model: {self.embedding_model_name}")

    def load_and_chunk_documents(self, directory: str) -> List[str]:
        """
        Charge les documents du répertoire et les divise en chunks.
        Support unifié pour .md et .txt avec traitement markdown.
        """
        chunks = []
        for filename in os.listdir(directory):
            filepath = os.path.join(directory, filename)
            if filepath.endswith(".pdf"):
                loader = PyPDFLoader(filepath)
                documents = loader.load()
            elif filepath.endswith((".txt", ".md")):
                # Traitement unifié pour .txt et .md
                loader = TextLoader(filepath, encoding='utf-8')
                documents = loader.load()
            elif filepath.endswith(".docx"):
                loader = Docx2txtLoader(filepath)
                documents = loader.load()
            # Ajoutez d'autres conditions pour d'autres types de fichiers
            else:
                continue

            for doc in documents:
                doc_chunks = self.text_splitter.split_text(doc.page_content)
                chunks.extend(doc_chunks)
        return chunks

    def create_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Crée les embeddings pour une liste de textes en utilisant OpenAI API.
        """
        try:
            response = self.client.embeddings.create(
                input=texts,
                model=self.embedding_model_name  # text-embedding-3-small by default
            )
            return [data.embedding for data in response.data]
        except Exception as e:
            print(f"Error creating OpenAI embeddings: {e}")
            raise

    def index_embeddings(self, texts: List[str], embeddings: List[List[float]], ids: List[str], vector_db_connector: ChromaDBConnector, collection_name="comptable_knowledge"):
        """
        Indexe les embeddings dans la base de vecteurs.
        With OpenAI embedding function, we can skip pre-computed embeddings.
        """
        collection = vector_db_connector.get_or_create_collection(
            name=collection_name,
            embedding_function=self.openai_ef
        )
        # With OpenAI embedding function, ChromaDB generates embeddings automatically
        collection.add(
            ids=ids,
            documents=texts
            # No need to pass embeddings - they're generated automatically
        )

def process_knowledge_base(knowledge_base_path: str, vector_db_connector: ChromaDBConnector):
    """
    Processus principal pour charger, chunker, embedder et indexer la base de connaissances.
    """
    embedder = KnowledgeEmbedder()
    chunks = embedder.load_and_chunk_documents(knowledge_base_path)
    embeddings = embedder.create_embeddings(chunks)
    ids = [f"chunk_{i}" for i in range(len(chunks))]
    embedder.index_embeddings(chunks, embeddings, ids, vector_db_connector)
    print(f"Indexed {len(chunks)} chunks into the vector database.")

if __name__ == '__main__':
    # Exemple d'utilisation (à exécuter séparément ou dans un script de gestion Django)
    knowledge_base_path = Path(__file__).parent.parent / "data" / "knowledge_base"
    vector_db_connector = ChromaDBConnector(persist_directory=str(Path(__file__).parent.parent / "data" / "embeddings"))
    process_knowledge_base(str(knowledge_base_path), vector_db_connector)