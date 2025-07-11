import json
from django.utils.deprecation import MiddlewareMixin
from api.utils import DecimalEncoder

class JSONResponseMiddleware(MiddlewareMixin):
    """
    Middleware qui convertit automatiquement les réponses avec des objets décimaux en JSON valide.
    Utilise un encodeur personnalisé pour gérer les types Decimal, datetime, etc.
    """
    
    def process_response(self, request, response):
        """
        Traite la réponse pour s'assurer que le contenu JSON est correctement sérialisé
        avec les types spéciaux comme Decimal.
        """
        # Ne traiter que les réponses de type JSON
        if 'application/json' in response.get('Content-Type', ''):
            try:
                # Vérifier si le contenu est du JSON et contient des décimaux mal sérialisés
                content = response.content.decode('utf-8')
                
                # Tenter de parser le JSON pour vérifier sa validité
                try:
                    json.loads(content)
                    # Si la décodification réussit sans erreur, pas besoin de traitement supplémentaire
                except json.JSONDecodeError:
                    # Si le JSON est invalide (probablement à cause de Decimal), le reconvertir
                    # Nous devons d'abord convertir le contenu en structure Python
                    # puis le re-sérialiser avec notre encodeur personnalisé
                    data = eval(content)  # Attention: utiliser eval uniquement car nous avons confiance dans la source
                    # Alternativement, nous pourrions implémenter un parser personnalisé
                    
                    # Re-sérialiser en JSON avec notre encodeur de décimaux
                    response.content = json.dumps(data, cls=DecimalEncoder).encode('utf-8')
                    
            except Exception as e:
                # En cas d'erreur, ne pas planter mais logger l'erreur
                print(f"JSONResponseMiddleware - Erreur de traitement: {str(e)}")
        
        return response
