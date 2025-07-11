# agents/utils/knowledge_embedding.py
import os
from pathlib import Path
from typing import List
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
# Importez d'autres loaders si nécessaire (pour Excel, images OCR'd, etc.)
from agents.vector_databases.chromadb_connector import ChromaDBConnector  # Exemple de connecteur
# from agents.llm_connectors.openai_connector import OpenAIConnector # Si vous utilisez OpenAI embeddings
from sentence_transformers import SentenceTransformer  # Exemple pour des embeddings locaux

class KnowledgeEmbedder:
    def __init__(self, embedding_model_name="all-mpnet-base-v2", chunk_size=1000, chunk_overlap=100):
        self.embedding_model_name = embedding_model_name
        self.text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        self.embedding_model = SentenceTransformer(self.embedding_model_name) # Exemple local
        # Si vous utilisez OpenAI:
        # self.openai_connector = OpenAIConnector()

    def load_and_chunk_documents(self, directory: str) -> List[str]:
        """
        Charge les documents du répertoire et les divise en chunks.
        """
        chunks = []
        for filename in os.listdir(directory):
            filepath = os.path.join(directory, filename)
            if filepath.endswith(".pdf"):
                loader = PyPDFLoader(filepath)
                documents = loader.load()
            elif filepath.endswith(".txt"):
                loader = TextLoader(filepath)
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
        Crée les embeddings pour une liste de textes.
        """
        # Avec Sentence Transformers (local):
        embeddings = self.embedding_model.encode(texts).tolist()
        return embeddings

        # Avec OpenAI:
        # if self.openai_connector:
        #     response = self.openai_connector.client.embeddings.create(
        #         input=texts,
        #         model="text-embedding-ada-002" # Choisissez votre modèle d'embedding OpenAI
        #     )
        #     return [data.embedding for data in response.data]
        # else:
        #     raise ValueError("OpenAI connector not initialized.")

    def index_embeddings(self, texts: List[str], embeddings: List[List[float]], ids: List[str], vector_db_connector: ChromaDBConnector, collection_name="comptable_knowledge"):
        """
        Indexe les embeddings dans la base de vecteurs.
        """
        collection = vector_db_connector.get_or_create_collection(name=collection_name)
        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts
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