# agents/utils/data_processing.py

def clean_text(text: str) -> str:
    """
    Nettoie un texte en supprimant les espaces superflus, la ponctuation, etc.
    """
    import re
    text = text.strip()
    text = re.sub(r'\s+', ' ', text)
    # Ajoutez d'autres étapes de nettoyage si nécessaire
    return text

def extract_numeric_value(text: str) -> float or None:
    """
    Tente d'extraire une valeur numérique d'une chaîne de caractères.
    """
    import re
    match = re.search(r'(\d+[,.]?\d*)', text)
    if match:
        return float(match.group(1).replace(',', '.'))
    return None

# Ajoutez d'autres fonctions de traitement de données utiles