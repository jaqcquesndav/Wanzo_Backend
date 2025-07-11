import os
import chromadb
from chromadb.config import Settings
from django.conf import settings

class ChromaDBConnector:
    """
    Classe pour interagir avec ChromaDB, une base de données vectorielle.
    """
    def __init__(self, persist_directory=None):
        if persist_directory is None:
            # Utiliser le chemin du projet par défaut
            persist_directory = os.path.join(
                settings.BASE_DIR, 'data', 'embeddings'
            )
        
        # S'assurer que le dossier existe
        os.makedirs(persist_directory, exist_ok=True)
        
        try:
            # Initialiser le client ChromaDB
            self.client = chromadb.PersistentClient(
                path=persist_directory,
                settings=Settings(
                    anonymized_telemetry=False,
                    allow_reset=True
                )
            )
            
            print(f"ChromaDB initialized with persistence directory: {persist_directory}")
        except Exception as e:
            print(f"Error initializing ChromaDB client: {e}")
            self.client = None
    
    def get_or_create_collection(self, name="default_collection", embedding_function=None, metadata=None):
        """
        Récupère ou crée une collection dans ChromaDB.
        """
        try:
            if not self.client:
                print("ChromaDB client not initialized")
                return None
                
            return self.client.get_or_create_collection(
                name=name,
                embedding_function=embedding_function,
                metadata=metadata or {"description": f"Collection {name} for comptable_ia_api"}
            )
        except Exception as e:
            print(f"Error getting or creating collection {name}: {e}")
            return None
    
    def delete_collection(self, name):
        """
        Supprime une collection.
        """
        try:
            if not self.client:
                return False
                
            self.client.delete_collection(name)
            return True
        except Exception as e:
            print(f"Error deleting collection {name}: {e}")
            return False
    
    def list_collections(self):
        """
        Liste toutes les collections disponibles.
        """
        try:
            if not self.client:
                return []
                
            return self.client.list_collections()
        except Exception as e:
            print(f"Error listing collections: {e}")
            return []
    
    def count_items(self, collection_name):
        """
        Compte le nombre d'éléments dans une collection.
        """
        try:
            if not self.client:
                return 0
                
            collection = self.client.get_collection(name=collection_name)
            return collection.count()
        except Exception as e:
            print(f"Error counting items in collection {collection_name}: {e}")
            return 0
    
    def clear_collection(self, collection_name):
        """
        Vide une collection sans la supprimer.
        """
        try:
            if not self.client:
                return False
                
            self.delete_collection(collection_name)
            self.get_or_create_collection(name=collection_name)
            return True
        except Exception as e:
            print(f"Error clearing collection {collection_name}: {e}")
            return False

    def add_texts(self, collection_name, texts, metadatas=None, ids=None):
        """
        Ajoute des textes à une collection existante.
        """
        try:
            if not self.client:
                return False
                
            collection = self.get_or_create_collection(name=collection_name)
            if not collection:
                return False
            
            # Si les IDs ne sont pas fournis, les générer
            if not ids:
                import uuid
                ids = [str(uuid.uuid4()) for _ in texts]
            
            # Si les métadonnées ne sont pas fournies, utiliser des dictionnaires vides
            if not metadatas:
                metadatas = [{} for _ in texts]
            
            # Ajouter les textes à la collection
            collection.add(
                documents=texts,
                metadatas=metadatas,
                ids=ids
            )
            
            return True
        except Exception as e:
            print(f"Error adding texts to collection {collection_name}: {e}")
            return False