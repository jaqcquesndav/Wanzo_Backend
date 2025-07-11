from decimal import Decimal, getcontext, ROUND_HALF_UP
import re

class CalculationHelper:
    """
    Utilitaire pour effectuer des calculs précis et sécurisés dans le contexte comptable.
    Utilise Decimal pour éviter les problèmes d'arrondi des nombres à virgule flottante.
    """
    
    def __init__(self, precision=2):
        """
        Initialise l'assistant de calcul avec une précision donnée.
        
        Args:
            precision (int): Le nombre de chiffres après la virgule (par défaut 2 pour les montants financiers)
        """
        # Configurer le contexte Decimal pour une précision suffisante
        getcontext().prec = 28  # Précision interne élevée
        self.precision = precision
        
    def parse_number(self, value):
        """
        Convertit une chaîne de caractères en Decimal de manière sécurisée.
        Gère différents formats (virgule/point, espaces, etc.)
        
        Args:
            value: La valeur à convertir (chaîne, nombre, etc.)
            
        Returns:
            Decimal: La valeur convertie en Decimal
        """
        if isinstance(value, (Decimal, int, float)):
            return Decimal(str(value))
        
        if not isinstance(value, str):
            return Decimal('0')
        
        # Nettoyer la chaîne: supprimer espaces et caractères non numériques sauf point/virgule
        clean_value = value.strip()
        
        # Gérer les formats avec des espaces comme séparateurs de milliers
        clean_value = re.sub(r'\s', '', clean_value)
        
        # Remplacer les virgules par des points (format français -> anglais)
        clean_value = clean_value.replace(',', '.')
        
        # Extraire le nombre avec une regex
        match = re.search(r'[-+]?\d*\.?\d+', clean_value)
        
        if match:
            try:
                return Decimal(match.group(0))
            except:
                return Decimal('0')
        else:
            return Decimal('0')
    
    def add(self, *args):
        """
        Additionne une liste de nombres avec précision.
        
        Args:
            *args: Liste de nombres à additionner
            
        Returns:
            Decimal: Le résultat de l'addition
        """
        result = Decimal('0')
        for arg in args:
            result += self.parse_number(arg)
        return self.round(result)
    
    def subtract(self, a, b):
        """
        Soustrait b de a avec précision.
        
        Args:
            a: Premier nombre
            b: Nombre à soustraire
            
        Returns:
            Decimal: Le résultat de la soustraction
        """
        return self.round(self.parse_number(a) - self.parse_number(b))
    
    def multiply(self, a, b):
        """
        Multiplie a par b avec précision.
        
        Args:
            a: Premier nombre
            b: Deuxième nombre
            
        Returns:
            Decimal: Le résultat de la multiplication
        """
        return self.round(self.parse_number(a) * self.parse_number(b))
    
    def divide(self, a, b, default=Decimal('0')):
        """
        Divise a par b avec précision. Retourne default si b est 0.
        
        Args:
            a: Numérateur
            b: Dénominateur
            default: Valeur par défaut si b est 0
            
        Returns:
            Decimal: Le résultat de la division
        """
        b_decimal = self.parse_number(b)
        if b_decimal == 0:
            return default
        return self.round(self.parse_number(a) / b_decimal)
    
    def round(self, value):
        """
        Arrondi un nombre à la précision configurée.
        
        Args:
            value: Nombre à arrondir
            
        Returns:
            Decimal: Le nombre arrondi
        """
        return Decimal(value).quantize(
            Decimal('0.1') ** self.precision, 
            rounding=ROUND_HALF_UP
        )
    
    def sum_list(self, items, key=None):
        """
        Somme les éléments d'une liste, avec possibilité d'extraire une clé pour les dictionnaires.
        
        Args:
            items: Liste d'éléments à sommer
            key: Clé à extraire pour les dictionnaires (optionnel)
            
        Returns:
            Decimal: La somme des éléments
        """
        total = Decimal('0')
        
        for item in items:
            if key and isinstance(item, dict):
                value = item.get(key, 0)
            else:
                value = item
            total += self.parse_number(value)
            
        return self.round(total)
        
    def format_decimal(self, value, thousands_sep=' '):
        """
        Formate un nombre Decimal en chaîne de caractères avec séparateur de milliers.
        
        Args:
            value: Valeur à formater
            thousands_sep: Séparateur de milliers (espace par défaut)
            
        Returns:
            str: Valeur formatée
        """
        decimal_value = self.parse_number(value)
        integral_part = str(int(decimal_value))
        
        # Formater la partie entière avec séparateur de milliers
        if len(integral_part) > 3:
            integral_formatted = ''
            for i, digit in enumerate(reversed(integral_part)):
                if i > 0 and i % 3 == 0:
                    integral_formatted = thousands_sep + integral_formatted
                integral_formatted = digit + integral_formatted
        else:
            integral_formatted = integral_part
        
        # Formater la partie décimale
        fractional_part = str(decimal_value - int(decimal_value))[2:]
        fractional_part = fractional_part.ljust(self.precision, '0')[:self.precision]
        
        # Assembler le résultat final
        if self.precision > 0:
            return f"{integral_formatted},{fractional_part}"
        else:
            return integral_formatted
