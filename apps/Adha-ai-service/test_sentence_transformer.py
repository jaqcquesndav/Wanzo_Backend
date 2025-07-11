from sentence_transformers import SentenceTransformer
from pathlib import Path

try:
    # Utiliser un chemin local pour le modèle
    model_path = str(Path(__file__).parent / "models" / "all-mpnet-base-v2")
    model = SentenceTransformer(model_path)
    print("SentenceTransformer initialized successfully with local model.")
except AttributeError as e:
    print(f"Erreur critique : {e}. Cela peut être dû à une incompatibilité entre 'sentence-transformers' et 'transformers'.")
except Exception as e:
    print(f"Erreur lors de l'initialisation de SentenceTransformer : {e}")
