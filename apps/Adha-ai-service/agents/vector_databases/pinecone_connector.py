import os
import pinecone # type: ignore

class PineconeConnector:
    def __init__(self, api_key=None, environment=None, index_name="comptable-knowledge"):
        self.api_key = api_key or os.environ.get("PINECONE_API_KEY")
        self.environment = environment or os.environ.get("PINECONE_ENVIRONMENT")
        self.index_name = index_name
        if not self.api_key or not self.environment:
            raise ValueError("PINECONE_API_KEY and PINECONE_ENVIRONMENT environment variables must be set.")
        try:
            pinecone.init(api_key=self.api_key, environment=self.environment)
            if self.index_name not in pinecone.list_indexes():
                pinecone.create_index(self.index_name, dimension=128)  # Ajustez la dimension selon vos besoins
            self.index = pinecone.Index(self.index_name)
        except Exception as e:
            raise RuntimeError(f"Erreur lors de l'initialisation de Pinecone: {e}")

    def upsert_documents(self, vectors):
        """
        Upsert des vecteurs dans l'index Pinecone.
        'vectors' doit être une liste de tuples: (id, vector, metadata).
        """
        try:
            self.index.upsert(vectors=vectors)
        except Exception as e:
            print(f"Erreur lors de l'upsert vers Pinecone: {e}")

    def query(self, query_vector, top_k=5):
        """
        Effectue une requête de similarité sur l'index Pinecone.
        """
        try:
            results = self.index.query(vector=query_vector, top_k=top_k, include_values=True, include_metadata=True)
            return results.matches
        except Exception as e:
            print(f"Erreur lors de la requête à Pinecone: {e}")
            return None

# Exemple d'utilisation (à ne pas exécuter ici, mais dans vos agents ou utils)
if __name__ == '__main__':
    # Assurez-vous que PINECONE_API_KEY et PINECONE_ENVIRONMENT sont configurés
    connector = PineconeConnector()
    vectors_to_upsert = [
        ("vec1", [0.1, 0.2, 0.3], {"text": "Le plan comptable général est..."}),
        ("vec2", [0.4, 0.5, 0.6], {"text": "La TVA est une taxe..."}),
    ]
    connector.upsert_documents(vectors_to_upsert)
    query_vector = [0.15, 0.25, 0.35]
    results = connector.query(query_vector)
    if results:
        for res in results:
            print(f"Score: {res.score}, ID: {res.id}, Metadata: {res.metadata}")