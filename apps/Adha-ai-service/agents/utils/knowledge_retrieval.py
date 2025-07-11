from agents.vector_databases.chromadb_connector import ChromaDBConnector

class KnowledgeRetriever:
    def __init__(self, collection_name="comptable_knowledge", persist_directory="chroma_db"):
        """
        Initialise le récupérateur de connaissances avec une base de vecteurs.
        """
        self.vector_db_connector = ChromaDBConnector(persist_directory=persist_directory)
        self.collection = self.vector_db_connector.get_or_create_collection(name=collection_name)
        if not self.collection:
            raise RuntimeError("Échec de l'initialisation de la collection de connaissances.")

    def retrieve(self, query_embedding, top_k=5):
        """
        Récupère les documents les plus pertinents en fonction de l'embedding de la requête.

        Args:
            query_embedding (list[float]): Embedding de la requête.
            top_k (int): Nombre maximum de résultats à retourner.

        Returns:
            list[str]: Liste des documents pertinents.
        """
        if not self.collection:
            print("Collection non initialisée.")
            return []

        try:
            results = self.collection.query(query_embeddings=[query_embedding], n_results=top_k)
            return results.get("documents", [[]])[0]  # Retourne les documents pertinents
        except Exception as e:
            print(f"Erreur lors de la récupération des connaissances: {e}")
            return []
