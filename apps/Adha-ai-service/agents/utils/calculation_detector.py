"""
Advanced Calculation Detector for Adha AI Service
Détecte automatiquement les opérations de calcul et les traite sans LLM
pour optimiser les performances et la précision.
"""
import re
import math
from decimal import Decimal, getcontext
from typing import Dict, List, Any, Optional, Tuple
from agents.utils.calculation_helper import CalculationHelper

class CalculationDetector:
    """
    Détecteur intelligent qui identifie les demandes de calcul et les traite
    directement sans passer par le LLM pour optimiser les performances.
    """
    
    def __init__(self):
        self.calc_helper = CalculationHelper(precision=2)
        
        # Patterns pour détecter les calculs
        self.calculation_patterns = [
            # Opérations arithmétiques directes
            r'\d+(?:\.\d+)?\s*[\+\-\*\/]\s*\d+(?:\.\d+)?',
            
            # Mots-clés de calcul en français
            r'\b(?:calcul|calculer|additionner|addition|soustraire|soustraction)\b',
            r'\b(?:multiplier|multiplication|diviser|division|total|somme)\b',
            r'\b(?:différence|produit|quotient|résultat|moyenne)\b',
            
            # Termes comptables spécifiques
            r'\b(?:TVA|HT|TTC|taux|pourcentage|%)\b',
            r'\b(?:débit|crédit|solde|balance|équilibre)\b',
            r'\b(?:amortissement|provision|charge|produit)\b',
            
            # Formulations de questions de calcul
            r'(?:combien|quel\s+est|quelle\s+est).*(?:total|somme|montant)',
            r'(?:quel\s+est\s+le\s+)?(?:résultat|montant|total).*[\+\-\*\/]',
            
            # Calculs de TVA spécifiques
            r'(?:TVA\s+de\s+)?(\d+(?:\.\d+)?)\s*%\s*(?:de|sur)\s*(\d+(?:\.\d+)?)',
            r'(?:prix\s+)?(?:HT|TTC)\s*(?:de|à|=)\s*(\d+(?:\.\d+)?)',
        ]
        
        # Patterns pour extraire les nombres et opérations
        self.number_patterns = [
            r'(\d+(?:\.\d+)?)\s*(?:euros?|€|EUR)',
            r'(\d+(?:\.\d+)?)\s*(?:%|pour\s+cent|pourcent)',
            r'(\d+(?:[\.,]\d+)?)',  # Nombres avec virgule ou point
        ]
        
        # Opérations TVA courantes
        self.tva_rates = {
            'standard': Decimal('20'),
            'intermédiaire': Decimal('10'),
            'réduit': Decimal('5.5'),
            'super_réduit': Decimal('2.1')
        }
    
    def detect_calculation(self, prompt: str) -> bool:
        """
        Détecte si le prompt contient une demande de calcul.
        
        Args:
            prompt (str): Le prompt utilisateur à analyser
            
        Returns:
            bool: True si un calcul est détecté, False sinon
        """
        prompt_lower = prompt.lower()
        
        # Vérifier chaque pattern de calcul
        for pattern in self.calculation_patterns:
            if re.search(pattern, prompt_lower, re.IGNORECASE):
                return True
        
        return False
    
    def extract_and_calculate(self, prompt: str) -> Dict[str, Any]:
        """
        Extrait les calculs du prompt et les exécute.
        
        Args:
            prompt (str): Le prompt contenant les calculs
            
        Returns:
            Dict: Résultat du calcul avec détails
        """
        try:
            # 1. Détecter le type de calcul
            calc_type = self._identify_calculation_type(prompt)
            
            # 2. Exécuter le calcul selon le type
            if calc_type == 'tva':
                return self._calculate_tva(prompt)
            elif calc_type == 'arithmetic':
                return self._calculate_arithmetic(prompt)
            elif calc_type == 'accounting':
                return self._calculate_accounting(prompt)
            elif calc_type == 'percentage':
                return self._calculate_percentage(prompt)
            else:
                return self._calculate_generic(prompt)
                
        except Exception as e:
            return {
                'type': 'error',
                'message': f'Erreur lors du calcul: {str(e)}',
                'success': False
            }
    
    def _identify_calculation_type(self, prompt: str) -> str:
        """Identifie le type de calcul demandé."""
        prompt_lower = prompt.lower()
        
        if re.search(r'\btva\b|ht|ttc', prompt_lower):
            return 'tva'
        elif re.search(r'débit|crédit|balance|solde', prompt_lower):
            return 'accounting'
        elif re.search(r'%|pourcentage|taux', prompt_lower):
            return 'percentage'
        elif re.search(r'[\+\-\*\/]', prompt):
            return 'arithmetic'
        else:
            return 'generic'
    
    def _calculate_tva(self, prompt: str) -> Dict[str, Any]:
        """Calcule les montants TVA (HT, TTC, TVA)."""
        try:
            numbers = self._extract_numbers(prompt)
            
            # Extraire le taux de TVA
            tva_rate = Decimal('20')  # Taux par défaut
            tva_match = re.search(r'(\d+(?:\.\d+)?)\s*%', prompt)
            if tva_match:
                tva_rate = Decimal(tva_match.group(1))
            
            if len(numbers) >= 1:
                base_amount = numbers[0]
                
                # Déterminer si c'est HT ou TTC
                if re.search(r'\bht\b|hors.{0,5}taxe', prompt, re.IGNORECASE):
                    # Montant HT donné, calculer TTC et TVA
                    ht = base_amount
                    tva_amount = self.calc_helper.multiply(ht, tva_rate / 100)
                    ttc = self.calc_helper.add(ht, tva_amount)
                else:
                    # Montant TTC donné, calculer HT et TVA
                    ttc = base_amount
                    ht = self.calc_helper.divide(ttc, 1 + (tva_rate / 100))
                    tva_amount = self.calc_helper.subtract(ttc, ht)
                
                return {
                    'type': 'tva',
                    'success': True,
                    'result': {
                        'montant_ht': float(ht),
                        'montant_ttc': float(ttc),
                        'montant_tva': float(tva_amount),
                        'taux_tva': float(tva_rate)
                    },
                    'formatted_result': f"""
💰 **Calcul TVA**
- Montant HT: {ht:.2f} €
- TVA ({tva_rate}%): {tva_amount:.2f} €
- Montant TTC: {ttc:.2f} €
                    """.strip(),
                    'explanation': f"Calcul TVA avec un taux de {tva_rate}%"
                }
            
        except Exception as e:
            return {'type': 'tva', 'success': False, 'error': str(e)}
    
    def _calculate_arithmetic(self, prompt: str) -> Dict[str, Any]:
        """Effectue des calculs arithmétiques simples."""
        try:
            # Extraire l'expression arithmétique
            expr_match = re.search(r'(\d+(?:\.\d+)?)\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?)', prompt)
            
            if expr_match:
                num1 = Decimal(expr_match.group(1))
                operator = expr_match.group(2)
                num2 = Decimal(expr_match.group(3))
                
                if operator == '+':
                    result = self.calc_helper.add(num1, num2)
                    op_name = 'addition'
                elif operator == '-':
                    result = self.calc_helper.subtract(num1, num2)
                    op_name = 'soustraction'
                elif operator == '*':
                    result = self.calc_helper.multiply(num1, num2)
                    op_name = 'multiplication'
                elif operator == '/':
                    result = self.calc_helper.divide(num1, num2)
                    op_name = 'division'
                
                return {
                    'type': 'arithmetic',
                    'success': True,
                    'result': float(result),
                    'formatted_result': f"""
🔢 **Calcul Arithmétique**
{num1} {operator} {num2} = **{result}**
                    """.strip(),
                    'explanation': f"Résultat de la {op_name}: {num1} {operator} {num2}"
                }
                
        except Exception as e:
            return {'type': 'arithmetic', 'success': False, 'error': str(e)}
    
    def _calculate_accounting(self, prompt: str) -> Dict[str, Any]:
        """Calcule les soldes et équilibres comptables."""
        try:
            numbers = self._extract_numbers(prompt)
            
            if 'débit' in prompt.lower() and 'crédit' in prompt.lower():
                if len(numbers) >= 2:
                    debit = numbers[0]
                    credit = numbers[1]
                    solde = self.calc_helper.subtract(debit, credit)
                    
                    return {
                        'type': 'accounting',
                        'success': True,
                        'result': {
                            'debit': float(debit),
                            'credit': float(credit),
                            'solde': float(solde)
                        },
                        'formatted_result': f"""
📊 **Calcul Comptable**
- Débit: {debit:.2f} €
- Crédit: {credit:.2f} €
- **Solde: {solde:.2f} €** {'(Débiteur)' if solde > 0 else '(Créditeur)' if solde < 0 else '(Équilibré)'}
                        """.strip(),
                        'explanation': "Calcul du solde comptable (Débit - Crédit)"
                    }
            
        except Exception as e:
            return {'type': 'accounting', 'success': False, 'error': str(e)}
    
    def _calculate_percentage(self, prompt: str) -> Dict[str, Any]:
        """Calcule les pourcentages."""
        try:
            # Pattern pour "X% de Y"
            percent_match = re.search(r'(\d+(?:\.\d+)?)\s*%\s*(?:de|sur)\s*(\d+(?:\.\d+)?)', prompt)
            
            if percent_match:
                percentage = Decimal(percent_match.group(1))
                base_amount = Decimal(percent_match.group(2))
                result = self.calc_helper.multiply(base_amount, percentage / 100)
                
                return {
                    'type': 'percentage',
                    'success': True,
                    'result': float(result),
                    'formatted_result': f"""
📈 **Calcul de Pourcentage**
{percentage}% de {base_amount} = **{result:.2f}**
                    """.strip(),
                    'explanation': f"Calcul: {base_amount} × {percentage}% = {result}"
                }
                
        except Exception as e:
            return {'type': 'percentage', 'success': False, 'error': str(e)}
    
    def _calculate_generic(self, prompt: str) -> Dict[str, Any]:
        """Traite les calculs génériques."""
        try:
            numbers = self._extract_numbers(prompt)
            
            if len(numbers) >= 2:
                if 'total' in prompt.lower() or 'somme' in prompt.lower():
                    result = self.calc_helper.add(*numbers)
                    return {
                        'type': 'sum',
                        'success': True,
                        'result': float(result),
                        'formatted_result': f"""
➕ **Somme**
{' + '.join(map(str, numbers))} = **{result}**
                        """.strip(),
                        'explanation': f"Somme de {len(numbers)} nombres"
                    }
                elif 'moyenne' in prompt.lower():
                    total = self.calc_helper.add(*numbers)
                    moyenne = self.calc_helper.divide(total, len(numbers))
                    return {
                        'type': 'average',
                        'success': True,
                        'result': float(moyenne),
                        'formatted_result': f"""
📊 **Moyenne**
({' + '.join(map(str, numbers))}) ÷ {len(numbers)} = **{moyenne}**
                        """.strip(),
                        'explanation': f"Moyenne de {len(numbers)} nombres"
                    }
            
            return {'type': 'generic', 'success': False, 'error': 'Calcul non reconnu'}
            
        except Exception as e:
            return {'type': 'generic', 'success': False, 'error': str(e)}
    
    def _extract_numbers(self, text: str) -> List[Decimal]:
        """Extrait tous les nombres du texte."""
        numbers = []
        
        # Chercher tous les nombres dans le texte
        for pattern in self.number_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                try:
                    # Normaliser le nombre (remplacer virgule par point)
                    normalized = match.replace(',', '.')
                    numbers.append(Decimal(normalized))
                except:
                    continue
        
        return numbers
